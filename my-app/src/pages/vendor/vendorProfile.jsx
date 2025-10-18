import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth } from 'firebase/auth';
import VendorProfileHTML from "./VendorProfileHTML";
import "./vendorProfile.css"

// Cache for API responses with TTL
const API_CACHE = {
  vendor: { data: null, timestamp: 0, ttl: 300000 }, // 5 minutes
  services: { data: null, timestamp: 0, ttl: 300000 }, // 5 minutes
  analytics: { data: null, timestamp: 0, ttl: 300000 }, // 5 minutes
  bookings: { data: null, timestamp: 0, ttl: 120000 }, // 2 minutes
  reviews: { data: null, timestamp: 0, ttl: 300000 }, // 5 minutes
};

// Global notification system that can be used across components
export const NotificationSystem = {
  listeners: new Set(),
  
  showNotification: function(title, message, type = "info", duration = 5000) {
    const notification = {
      id: Date.now() + Math.random(),
      title,
      message,
      type,
      timestamp: new Date(),
      duration,
      visible: true
    };

    this.listeners.forEach(listener => {
      listener(notification);
    });
  },

  subscribe: function(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
};

// Request browser notification permission and override with custom ones
const setupBrowserNotifications = () => {
  if ("Notification" in window) {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        // Override the native Notification with our custom system
        const originalNotification = window.Notification;
        
        window.Notification = function(title, options = {}) {
          // Use our custom notification system instead
          NotificationSystem.showNotification(
            title,
            options.body || "",
            "info",
            options.requireInteraction ? 10000 : 5000
          );
          
          // Return a mock notification object to maintain compatibility
          return {
            close: () => {},
            onclick: null,
            onclose: null,
            onerror: null,
            onshow: null
          };
        };
        
        // Copy static properties
        window.Notification.permission = originalNotification.permission;
        window.Notification.requestPermission = originalNotification.requestPermission;
        window.Notification.maxActions = originalNotification.maxActions;
      }
    });
  }
};

const VendorProfile = () => {
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imageVersion, setImageVersion] = useState(Date.now());
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [vendorBookings, setVendorBookings] = useState([]);
  const [vendorReviews, setVendorReviews] = useState([]);
  const [popupNotifications, setPopupNotifications] = useState([]);
  const [formData, setFormData] = useState({
    serviceName: "",
    cost: "",
    chargeByHour: "",
    chargePerPerson: "",
    chargePerSquareMeter: "",
    extraNotes: "",
  });
  const [formErrors, setFormErrors] = useState({});

  const navProfileEdit = useCallback(() => navigate("/vendor/vendor-edit-profile"), [navigate]);

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

  // Popup Notification System
  const showPopupNotification = useCallback((title, message, type = "info", duration = 5000) => {
    const notification = {
      id: Date.now() + Math.random(),
      title,
      message,
      type,
      timestamp: new Date(),
      duration,
      visible: true
    };

    setPopupNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep max 5 notifications

    // Auto remove after duration
    setTimeout(() => {
      setPopupNotifications(prev => 
        prev.map(n => 
          n.id === notification.id ? { ...n, visible: false } : n
        )
      );
      
      // Remove from state after fade out
      setTimeout(() => {
        setPopupNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 500);
    }, duration);
  }, []);

  const removePopupNotification = useCallback((id) => {
    setPopupNotifications(prev => 
      prev.map(n => 
        n.id === id ? { ...n, visible: false } : n
      )
    );
    
    // Remove from state after fade out
    setTimeout(() => {
      setPopupNotifications(prev => prev.filter(n => n.id !== id));
    }, 500);
  }, []);

  // Subscribe to global notification system
  useEffect(() => {
    const unsubscribe = NotificationSystem.subscribe((notification) => {
      showPopupNotification(
        notification.title,
        notification.message,
        notification.type,
        notification.duration
      );
    });

    return unsubscribe;
  }, [showPopupNotification]);

  // Validation function
  const validateForm = () => {
    const errors = {};

    // Service Name Validation - Must contain at least one letter
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

    // Validate optional numeric fields
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

  const fetchVendor = useCallback(async () => {
    const auth = getAuth();
    if (!auth.currentUser) {
      setError("User not authenticated");
      setLoading(false);
      return;
    }
    try {
      const auth = getAuth();
      let user = auth.currentUser;
      while (!user) {
        await new Promise((res) => setTimeout(res, 50)); // wait 50ms
        user = auth.currentUser;
      }
      const token = await user.getIdToken();
      
      const result = await fetchWithCache(
        'vendor',
        "https://us-central1-planit-sdp.cloudfunctions.net/api/vendor/me",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      setVendor(result.data);
      if (!result.fromCache) {
        setImageVersion(Date.now());
        showPopupNotification(
          "Profile Loaded", 
          "Your vendor profile has been successfully loaded", 
          "success"
        );
      }
    } catch (err) {
      setError(err.message);
      showPopupNotification(
        "Profile Error", 
        "Failed to load your vendor profile", 
        "error"
      );
      console.error("Failed to fetch vendor profile:", err);
    }
  }, [fetchWithCache, showPopupNotification]);

  const fetchServices = useCallback(async () => {
    const auth = getAuth();
    if (!auth.currentUser) {
      setError("User not authenticated");
      return;
    }
    try {
      const token = await auth.currentUser.getIdToken();
      const vendorId = auth.currentUser.uid;
      
      const result = await fetchWithCache(
        'services',
        `https://us-central1-planit-sdp.cloudfunctions.net/api/vendors/${vendorId}/services`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      const servicesData = Array.isArray(result.data) ? result.data : [];
      setServices(servicesData);
      
      if (!result.fromCache && servicesData.length > 0) {
        showPopupNotification(
          "Services Updated", 
          `${servicesData.length} services loaded successfully`, 
          "success"
        );
      }
    } catch (err) {
      setError(err.message);
      showPopupNotification(
        "Services Error", 
        "Failed to load your services", 
        "error"
      );
      console.error("Failed to fetch services:", err);
    }
  }, [fetchWithCache, showPopupNotification]);

  const fetchAnalytics = useCallback(async () => {
    const auth = getAuth();
    if (!auth.currentUser) {
      setError("User not authenticated");
      return;
    }
    try {
      const token = await auth.currentUser.getIdToken();
      const vendorId = auth.currentUser.uid;
      
      const result = await fetchWithCache(
        'analytics',
        `https://us-central1-planit-sdp.cloudfunctions.net/api/analytics/${vendorId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      setAnalytics(result.data);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    }
  }, [fetchWithCache]);

  const fetchVendorBookings = useCallback(async () => {
    const auth = getAuth();
    if (!auth.currentUser) {
      return;
    }
    try {
      const token = await auth.currentUser.getIdToken();
      
      const result = await fetchWithCache(
        'bookings',
        `https://us-central1-planit-sdp.cloudfunctions.net/api/vendor/bookings`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      setVendorBookings(result.data.bookings || []);
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
    }
  }, [fetchWithCache]);

  const fetchVendorReviews = useCallback(async () => {
    const auth = getAuth();
    if (!auth.currentUser) {
      return;
    }
    try {
      const token = await auth.currentUser.getIdToken();
      const vendorId = auth.currentUser.uid;
      
      const result = await fetchWithCache(
        'reviews',
        `https://us-central1-planit-sdp.cloudfunctions.net/api/vendors/${vendorId}/reviews`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      setVendorReviews(result.data.reviews || []);
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    }
  }, [fetchWithCache]);

  const handleSaveService = useCallback(async () => {
    if (!validateForm()) {
      showPopupNotification(
        "Validation Error", 
        "Please fix the errors in the form", 
        "warning"
      );
      return;
    }

    const auth = getAuth();
    if (!auth.currentUser) {
      setError("User not authenticated");
      return;
    }

    try {
      const token = await auth.currentUser.getIdToken();
      const vendorId = auth.currentUser.uid;
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
        if (editingService) {
          setServices((prev) =>
            prev.map((s) => (s.id === editingService.id ? { ...s, ...formData } : s))
          );
          showPopupNotification(
            "Service Updated", 
            `${formData.serviceName} has been updated successfully`, 
            "success"
          );
        } else {
          setServices((prev) => [...prev, { id: data.serviceId, ...formData }]);
          showPopupNotification(
            "Service Added", 
            `${formData.serviceName} has been added successfully`, 
            "success"
          );
        }

        // Clear cache for services to force refresh next time
        API_CACHE.services.data = null;

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
        const errorMsg = `Failed to save service: ${errorData.error || response.statusText}`;
        setError(errorMsg);
        showPopupNotification(
          "Save Failed", 
          errorMsg, 
          "error"
        );
      }
    } catch (error) {
      const errorMsg = "Error saving service";
      setError(errorMsg);
      showPopupNotification(
        "Save Error", 
        errorMsg, 
        "error"
      );
      console.error("Error saving service:", error);
    }
  }, [editingService, formData, showPopupNotification]);

  const handleEditService = useCallback((service) => {
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
    const auth = getAuth();
    if (!auth.currentUser) {
      setError("User not authenticated");
      console.error("Delete failed: User not authenticated");
      return;
    }
    if (!serviceId) {
      setError("Cannot delete service: Missing service ID");
      console.error("Delete failed: serviceId not provided");
      return;
    }
    if (!confirm("Are you sure you want to delete this service?")) {
      return;
    }

    setDeleting(serviceId);
    try {
      const token = await auth.currentUser.getIdToken();
      const vendorId = auth.currentUser.uid;
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
        const errorData = await response.json();
        console.error("Delete API error:", errorData);
        let errorMessage = errorData.error || `Failed to delete service (Status: ${response.status})`;
        if (errorData.details && errorData.details.includes("not defined")) {
          errorMessage = "Server error: Firestore configuration issue. Contact support.";
        } else if (errorData.error.includes("Permission denied")) {
          errorMessage = "Permission denied: You are not authorized to delete this service.";
        }
        throw new Error(errorMessage);
      }

      setServices((prev) => prev.filter((s) => s.id !== serviceId));
      setError("");
      
      // Clear cache for services to force refresh next time
      API_CACHE.services.data = null;
      
      showPopupNotification(
        "Service Deleted", 
        "Service has been deleted successfully", 
        "success"
      );
      
      await fetchServices();
    } catch (error) {
      const errorMsg = `Failed to delete service: ${error.message}`;
      setError(errorMsg);
      showPopupNotification(
        "Delete Failed", 
        errorMsg, 
        "error"
      );
      console.error("Error deleting service:", error);
    } finally {
      setDeleting(null);
    }
  }, [fetchServices, showPopupNotification]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, [formErrors]);

  // Calculate real statistics from APIs
  const calculateStats = useCallback(() => {
    const totalBookings = vendorBookings.length;
    
    // Calculate confirmed bookings (accepted or confirmed status)
    const confirmedBookings = vendorBookings.filter(booking => 
      booking.status === 'confirmed' || booking.status === 'accepted'
    ).length;

    // Get total reviews count from analytics or vendorReviews
    let totalReviews = 0;
    if (analytics?.reviews?.length > 0) {
      totalReviews = analytics.reviews.length;
    } else if (vendorReviews.length > 0) {
      totalReviews = vendorReviews.length;
    }

    // Calculate average rating from analytics or reviews
    let avgRating = 0;
    if (analytics?.reviews?.length > 0) {
      const totalRating = analytics.reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
      avgRating = totalRating / analytics.reviews.length;
    } else if (vendorReviews.length > 0) {
      const totalRating = vendorReviews.reduce((sum, review) => sum + (review.rating || 0), 0);
      avgRating = totalRating / vendorReviews.length;
    }

    return {
      totalBookings,
      confirmedBookings,
      totalReviews,
      avgRating: avgRating.toFixed(1),
      totalServices: services.length
    };
  }, [vendorBookings, vendorReviews, analytics, services]);

  // Setup browser notification override on component mount
  useEffect(() => {
    setupBrowserNotifications();
  }, []);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }
      await Promise.all([
        fetchVendor(), 
        fetchServices(), 
        fetchAnalytics(), 
        fetchVendorBookings(), 
        fetchVendorReviews()
      ]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchVendor, fetchServices, fetchAnalytics, fetchVendorBookings, fetchVendorReviews]);

  useEffect(() => {
    const auth = getAuth();
    const handleFocus = () => {
      if (auth.currentUser) {
        Promise.all([
          fetchVendor(), 
          fetchServices(), 
          fetchAnalytics(), 
          fetchVendorBookings(), 
          fetchVendorReviews()
        ]);
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchVendor, fetchServices, fetchAnalytics, fetchVendorBookings, fetchVendorReviews]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading your profile and services...</p>
      </div>
    );
  }

  if (error && !showServiceForm) {
    return <div className="error">{error}</div>;
  }

  if (!vendor) {
    return <p id="no-profile-found">No vendor profile found.</p>;
  }

  const stats = calculateStats();

  return (
    <VendorProfileHTML
      // State props
      vendor={vendor}
      services={services}
      loading={loading}
      error={error}
      imageVersion={imageVersion}
      showServiceForm={showServiceForm}
      editingService={editingService}
      deleting={deleting}
      formData={formData}
      formErrors={formErrors}
      stats={stats}
      popupNotifications={popupNotifications}
      
      // Function props
      navProfileEdit={navProfileEdit}
      setShowServiceForm={setShowServiceForm}
      setEditingService={setEditingService}
      setFormData={setFormData}
      setFormErrors={setFormErrors}
      setError={setError}
      handleChange={handleChange}
      handleSaveService={handleSaveService}
      handleEditService={handleEditService}
      handleDeleteService={handleDeleteService}
      removePopupNotification={removePopupNotification}
      showPopupNotification={showPopupNotification}
    />
  );
};

export default VendorProfile;
