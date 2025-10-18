import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Calendar,
  Star,
  StarHalf,
  DollarSign,
  Eye,
  Edit,
  X,
  Trash2,
} from "lucide-react";
import { auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import "./VendorDashboard.css";
import VendorDashboardHTML from "./VendorDashboardHTML";

// Cache for API responses with 5-minute TTL
const API_CACHE = {
  analytics: { data: null, timestamp: 0, ttl: 300000 }, // 5 minutes
  bookings: { data: null, timestamp: 0, ttl: 120000 },  // 2 minutes
  services: { data: null, timestamp: 0, ttl: 300000 },  // 5 minutes
  vendorReport: { data: null, timestamp: 0, ttl: 300000 } // 5 minutes
};

const VendorDashboard = ({ setActivePage }) => {
  const [services, setServices] = useState([]);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [vendorId, setVendorId] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [vendorBookings, setVendorBookings] = useState([]);
  const [formData, setFormData] = useState({
    serviceName: "",
    cost: "",
    chargeByHour: "",
    chargePerPerson: "",
    chargePerSquareMeter: "",
    extraNotes: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dataLoaded, setDataLoaded] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Refs to track initial load and prevent duplicate calls
  const initialLoadRef = useRef(false);
  const abortControllerRef = useRef(null);

  // Format large numbers to K/M notation
  const formatCount = useCallback((count) => {
    if (!count || count === 0) return "0";
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M+`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K+`;
    }
    return count.toString();
  }, []);

  // Enhanced caching function with stale-while-revalidate pattern
  const fetchWithCache = useCallback(async (cacheKey, url, options = {}) => {
    const now = Date.now();
    const cache = API_CACHE[cacheKey];
    
    // Return cached data if it's still fresh (within TTL)
    if (cache.data && (now - cache.timestamp) < cache.ttl) {
      return { data: cache.data, fromCache: true };
    }
    
    // If data is stale but exists, return it immediately but refresh in background
    if (cache.data && (now - cache.timestamp) < cache.ttl * 2) {
      // Refresh in background
      fetch(url, options)
        .then(response => {
          if (response.ok) return response.json();
          throw new Error(`Failed to fetch ${cacheKey}`);
        })
        .then(data => {
          API_CACHE[cacheKey] = { data, timestamp: Date.now(), ttl: cache.ttl };
        })
        .catch(error => {
          console.warn(`Background refresh failed for ${cacheKey}:`, error);
        });
      
      return { data: cache.data, fromCache: true };
    }
    
    // Fetch fresh data
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${cacheKey}: ${response.statusText}`);
      }
      const data = await response.json();
      
      // Update cache
      API_CACHE[cacheKey] = { data, timestamp: Date.now(), ttl: cache.ttl };
      
      return { data, fromCache: false };
    } catch (error) {
      // If we have any cached data, return it as fallback
      if (cache.data) {
        return { data: cache.data, fromCache: true };
      }
      
      throw error;
    }
  }, []);

  // Validation function
  const validateForm = () => {
    const errors = {};

    if (!formData.serviceName.trim()) {
      errors.serviceName = "Service name is required";
    } else if (formData.serviceName.length > 100) {
      errors.serviceName = "Service name must be less than 100 characters";
    } else if (!/[a-zA-Z]/.test(formData.serviceName)) {
      errors.serviceName = "Service name must contain at least one letter";
    } else if (/^\d+$/.test(formData.serviceName.trim())) {
      errors.serviceName = "Service name cannot be only numbers";
    }

    if (!formData.cost) {
      errors.cost = "Base cost is required";
    } else if (isNaN(formData.cost) || parseFloat(formData.cost) < 0) {
      errors.cost = "Base cost must be a valid positive number";
    } else if (parseFloat(formData.cost) > 1000000) {
      errors.cost = "Base cost is too high";
    }

    const numericFields = [
      { field: "chargeByHour", name: "Charge by hour" },
      { field: "chargePerPerson", name: "Charge per person" },
      { field: "chargePerSquareMeter", name: "Charge per square meter" }
    ];

    numericFields.forEach(({ field, name }) => {
      if (formData[field] && (isNaN(formData[field]) || parseFloat(formData[field]) < 0)) {
        errors[field] = `${name} must be a valid positive number`;
      } else if (formData[field] && parseFloat(formData[field]) > 1000000) {
        errors[field] = `${name} is too high`;
      }
    });

    if (formData.extraNotes.length > 500) {
      errors.extraNotes = "Extra notes must be less than 500 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Optimized timestamp conversion with memoization
  const convertFirebaseTimestamp = useCallback((timestamp) => {
    if (!timestamp) return "Recently";
    
    try {
      let date;
      
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } else if (timestamp._seconds && timestamp._nanoseconds) {
        date = new Date(timestamp._seconds * 1000 + timestamp._nanoseconds / 1000000);
      } else if (timestamp.seconds && timestamp.nanoseconds) {
        date = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
      } else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      } else if (typeof timestamp === 'number') {
        date = timestamp > 1000000000000 ? new Date(timestamp) : new Date(timestamp * 1000);
      } else {
        return "Recently";
      }
      
      if (isNaN(date.getTime())) {
        return "Recently";
      }
      
      const now = new Date();
      const diffInMs = now - date;
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      
      if (diffInMinutes < 1) return "Just now";
      if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
      if (diffInHours < 24) return `${diffInHours} hr ago`;
      if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
      if (diffInDays < 30) {
        const weeks = Math.floor(diffInDays / 7);
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return "Recently";
    }
  }, []);

  // Optimized date formatting
  const formatEventDate = useCallback((dateString) => {
    if (!dateString) return "Date not set";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Date not set";
      }
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return "Date not set";
    }
  }, []);

  // Get vendor ID from auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setVendorId(user.uid);
      } else {
        setError("User not authenticated");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Parallel data fetching with caching
  const fetchVendorBookings = useCallback(async () => {
    if (!vendorId) return [];

    try {
      const token = await auth.currentUser.getIdToken();
      const result = await fetchWithCache(
        'bookings',
        `https://us-central1-planit-sdp.cloudfunctions.net/api/vendor/bookings`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      return result.data.bookings || [];
    } catch (error) {
      console.error("Failed to fetch vendor bookings:", error);
      return [];
    }
  }, [vendorId, fetchWithCache]);

  const fetchAnalytics = useCallback(async () => {
    if (!vendorId) return null;

    try {
      const token = await auth.currentUser.getIdToken();
      const result = await fetchWithCache(
        'analytics',
        `https://us-central1-planit-sdp.cloudfunctions.net/api/analytics/${vendorId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      return result.data;
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      return null;
    }
  }, [vendorId, fetchWithCache]);

  const fetchServices = useCallback(async () => {
    if (!vendorId) return [];

    try {
      const token = await auth.currentUser.getIdToken();
      const result = await fetchWithCache(
        'services',
        `https://us-central1-planit-sdp.cloudfunctions.net/api/vendors/${vendorId}/services`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      const servicesData = Array.isArray(result.data) ? result.data : result.data.services || [];
      return servicesData.filter((s) => s.id && typeof s.id === "string");
    } catch (error) {
      console.error("Failed to fetch services:", error);
      return [];
    }
  }, [vendorId, fetchWithCache]);

  const fetchVendorReport = useCallback(async () => {
    if (!vendorId) return null;

    try {
      const token = await auth.currentUser.getIdToken();
      const result = await fetchWithCache(
        'vendorReport',
        `https://us-central1-planit-sdp.cloudfunctions.net/api/vendor/my-report`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      return result.data;
    } catch (error) {
      console.error("Failed to fetch vendor report:", error);
      return null;
    }
  }, [vendorId, fetchWithCache]);

  // Calculate analytics data
  const calculateAnalyticsData = useCallback((analyticsData, bookings, reportData) => {
    if (!analyticsData) return null;

    const reviews = analyticsData.reviews || [];
    const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
    const avgRating = reviews.length > 0 ? totalRating / reviews.length : 0;
    
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      const rating = Math.floor(review.rating || 0);
      if (rating >= 1 && rating <= 5) {
        ratingDistribution[rating]++;
      }
    });

    const totalRevenue = bookings.reduce((sum, booking) => {
      return sum + (parseFloat(booking.budget) || 0);
    }, 0);

    // Use report data if available, otherwise use calculated data
    const finalRevenue = reportData?.totalRevenue || analyticsData.totalRevenue || totalRevenue || 0;
    const finalAvgRating = reportData?.avgRating || avgRating;
    const finalTotalReviews = reportData?.totalReviews || reviews.length;

    return {
      totalBookings: bookings.length,
      totalRevenue: finalRevenue,
      avgRating: finalAvgRating,
      totalReviews: finalTotalReviews,
      ratingDistribution,
      reviews: reviews.slice(0, 3), // Only keep 3 reviews for display
      performanceMetrics: {
        responseRate: analyticsData.responseRate || 0,
        completionRate: analyticsData.completionRate || 0,
        repeatCustomers: analyticsData.repeatCustomers || 0,
      },
    };
  }, []);

  // Main data loading effect - optimized with parallel requests and caching
  useEffect(() => {
    if (!vendorId || initialLoadRef.current) return;

    const loadData = async () => {
      // Cancel any previous requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setLoading(true);
      initialLoadRef.current = true;

      try {
        // Execute all API calls in parallel
        const [bookingsData, analyticsData, servicesData, reportData] = await Promise.allSettled([
          fetchVendorBookings(),
          fetchAnalytics(),
          fetchServices(),
          fetchVendorReport()
        ]);

        // Process results
        const bookings = bookingsData.status === 'fulfilled' ? bookingsData.value : [];
        const analyticsRaw = analyticsData.status === 'fulfilled' ? analyticsData.value : null;
        const services = servicesData.status === 'fulfilled' ? servicesData.value : [];
        const report = reportData.status === 'fulfilled' ? reportData.value : null;

        // Set states
        setVendorBookings(bookings);
        setServices(services);
        
        // Calculate and set analytics
        const processedAnalytics = calculateAnalyticsData(analyticsRaw, bookings, report);
        setAnalytics(processedAnalytics);

        setDataLoaded(true);
        
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error loading dashboard data:', error);
          setError("Failed to load dashboard data");
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [vendorId, fetchVendorBookings, fetchAnalytics, fetchServices, fetchVendorReport, calculateAnalyticsData]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, [formErrors]);

  const handleSaveService = useCallback(async () => {
    if (!validateForm()) return;

    if (!vendorId) {
      setError("User not authenticated");
      return;
    }

    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch(
        `https://us-central1-planit-sdp.cloudfunctions.net/api/vendors/${vendorId}/services`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(
            editingService ? { ...formData, serviceId: editingService.id } : formData
          ),
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        // Update services state
        if (editingService) {
          setServices((prev) =>
            prev.map((s) => (s.id === editingService.id ? { ...s, ...formData } : s))
          );
        } else {
          setServices((prev) => [...prev, { id: data.serviceId, ...formData }]);
        }

        // Clear cache for services to force refresh next time
        API_CACHE.services.data = null;

        // Reset form
        setShowServiceForm(false);
        setEditingService(null);
        setFormData({
          serviceName: "",
          cost: "",
          chargeByHour: "",
          chargePerPerson: "",
          chargePerSquareMeter: "",
          extraNotes: "",
        });
        setFormErrors({});
        setError("");
      } else {
        const errorData = await response.json();
        setError(`Failed to save service: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      setError("Error saving service");
      console.error("Error saving service:", error);
    }
  }, [vendorId, editingService, formData]);

  const handleEdit = useCallback((service) => {
    if (!service.id) {
      setError("Cannot edit service: Missing service ID");
      return;
    }
    setEditingService(service);
    setFormData({
      serviceName: service.serviceName || "",
      cost: service.cost || "",
      chargeByHour: service.chargeByHour || "",
      chargePerPerson: service.chargePerPerson || "",
      chargePerSquareMeter: service.chargePerSquareMeter || "",
      extraNotes: service.extraNotes || "",
    });
    setFormErrors({});
    setShowServiceForm(true);
    setError("");
  }, []);

  const handleDeleteService = useCallback(async (serviceId) => {
    if (!vendorId || !auth.currentUser || !serviceId) return;
    
    if (!confirm("Are you sure you want to delete this service?")) return;

    setDeleting(serviceId);
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch(
        `https://us-central1-planit-sdp.cloudfunctions.net/api/vendors/${vendorId}/services/${serviceId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete service");
      }

      setServices((prev) => prev.filter((s) => s.id !== serviceId));
      
      // Clear cache for services
      API_CACHE.services.data = null;
      
    } catch (error) {
      setError(`Failed to delete service: ${error.message}`);
    } finally {
      setDeleting(null);
    }
  }, [vendorId]);

  // Add this function to handle marking notifications as read
  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  }, []);

  // Calculate booking statistics
  const bookingStats = React.useMemo(() => {
    const total = vendorBookings.length;
    const confirmed = vendorBookings.filter(booking => 
      booking.status === 'confirmed' || booking.status === 'accepted'
    ).length;
    const pending = vendorBookings.filter(booking => 
      booking.status === 'pending'
    ).length;
    const rejected = vendorBookings.filter(booking => 
      booking.status === 'rejected' || booking.status === 'declined'
    ).length;

    return { total, confirmed, pending, rejected };
  }, [vendorBookings]);

  // Memoized recent bookings
  const recentBookings = React.useMemo(() => {
    if (!dataLoaded || vendorBookings.length === 0) return [];
    
    return vendorBookings.slice(0, 3).map((booking) => ({
      id: booking.eventId || booking.id,
      event: booking.eventName || "Unnamed Event",
      date: formatEventDate(booking.date),
      status: booking.status || "pending",
      amount: booking.budget ? `R${Number(booking.budget).toLocaleString()}` : "R0",
    }));
  }, [dataLoaded, vendorBookings, formatEventDate]);

  // Memoized recent reviews
  const recentReviews = React.useMemo(() => {
    if (!dataLoaded || !analytics?.reviews?.length) return [];
    
    return analytics.reviews.map((review) => ({
      id: review.id,
      name: review.reviewerName || "Anonymous",
      rating: review.rating || 0,
      comment: review.review || "No comment provided",
      date: convertFirebaseTimestamp(review.timeOfReview || review.createdAt),
    }));
  }, [dataLoaded, analytics, convertFirebaseTimestamp]);

  // Memoized rating distribution
  const renderRatingDistribution = React.useCallback(() => {
    if (!analytics?.ratingDistribution || analytics.totalReviews === 0) {
      return (
        <div className="no-distribution-data">
          <p>No rating distribution data</p>
          <small>Distribution will appear as customers leave reviews</small>
        </div>
      );
    }

    const maxCount = Math.max(...Object.values(analytics.ratingDistribution));

    return (
      <div className="rating-distribution">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = analytics.ratingDistribution[rating] || 0;
          const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
          
          return (
            <div key={rating} className="distribution-item">
              <div className="distribution-stars">
                <span className="distribution-rating">{rating}</span>
                <Star size={16} fill="#fbbf24" color="#fbbf24" />
              </div>
              <div className="distribution-progress">
                <div 
                  className="distribution-progress-bar"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <span className="distribution-count">{formatCount(count)}</span>
            </div>
          );
        })}
      </div>
    );
  }, [analytics, formatCount]);

  // Loading spinner component
  const LoadingSpinner = React.memo(() => (
    <div className="loading-spinner">
      <div className="spinner"></div>
    </div>
  ));

  // Show loading until all data is loaded
  if (!dataLoaded || loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (error) return <div className="error">{error}</div>;

  // Pass all necessary props to the HTML component
  return (
    <VendorDashboardHTML
      // State props
      services={services}
      showServiceForm={showServiceForm}
      editingService={editingService}
      vendorId={vendorId}
      deleting={deleting}
      analytics={analytics}
      vendorBookings={vendorBookings}
      formData={formData}
      formErrors={formErrors}
      loading={loading}
      error={error}
      dataLoaded={dataLoaded}
      notifications={notifications}
      unreadCount={unreadCount}
      bookingStats={bookingStats}
      recentBookings={recentBookings}
      recentReviews={recentReviews}
      
      // Function props
      setActivePage={setActivePage}
      setShowServiceForm={setShowServiceForm}
      setEditingService={setEditingService}
      setFormData={setFormData}
      setFormErrors={setFormErrors}
      setError={setError}
      handleChange={handleChange}
      handleSaveService={handleSaveService}
      handleEdit={handleEdit}
      handleDeleteService={handleDeleteService}
      markAsRead={markAsRead}
      markAllAsRead={markAllAsRead}
      formatCount={formatCount}
      renderRatingDistribution={renderRatingDistribution}
      convertFirebaseTimestamp={convertFirebaseTimestamp}
    />
  );
};

export default VendorDashboard;