// src/vendor/VendorReviews.jsx
import React, { useState, useEffect, useCallback } from "react";
import { auth } from "../../firebase";
import { Star, StarHalf, ChevronDown, TrendingUp, TrendingDown, BarChart3, Calendar } from "lucide-react";
import { getAuth } from "firebase/auth";
import "./vendorReviews.css";

// Updated StarRating component with filled stars
const StarRating = ({ rating, size = 16 }) => (
  <div className="star-rating">
    {[1, 2, 3, 4, 5].map((i) => {
      if (i <= Math.floor(rating)) 
        return <Star key={i} size={size} color="#fbbf24" fill="#fbbf24" />;
      else if (i - rating <= 0.5) 
        return <StarHalf key={i} size={size} color="#fbbf24" fill="#fbbf24" />;
      else 
        return <Star key={i} size={size} color="#9d9fa4ff" fill="#f9fafbff" />;
    })}
  </div>
);

const VendorReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [vendorId, setVendorId] = useState(null);
  const [sortOption, setSortOption] = useState("newest");
  const [viewMode, setViewMode] = useState("distribution"); // 'distribution' or 'monthly'

  // Convert Firebase timestamps (same as VendorDashboard)
  const convertFirebaseTimestamp = useCallback((timestamp) => {
    if (!timestamp) return "Recently";
    try {
      let date;
      if (timestamp.toDate && typeof timestamp.toDate === "function") date = timestamp.toDate();
      else if (timestamp._seconds && timestamp._nanoseconds)
        date = new Date(timestamp._seconds * 1000 + timestamp._nanoseconds / 1000000);
      else if (timestamp.seconds && timestamp.nanoseconds)
        date = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
      else if (typeof timestamp === "string") date = new Date(timestamp);
      else if (typeof timestamp === "number") date = timestamp > 1e12 ? new Date(timestamp) : new Date(timestamp * 1000);
      else return "Recently";

      if (isNaN(date.getTime())) return "Recently";

      const now = new Date();
      const diffInMs = now - date;
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInMinutes < 1) return "Just now";
      if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
      if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
      if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
      if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} week${Math.floor(diffInDays / 7) > 1 ? "s" : ""} ago`;
      return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return "Recently";
    }
  }, []);

  // Get actual date for sorting
  const getReviewDate = useCallback((review) => {
    const timestamp = review.timeOfReview || review.createdAt || review.date;
    if (!timestamp) return new Date(0);
    
    try {
      if (timestamp.toDate && typeof timestamp.toDate === "function") return timestamp.toDate();
      else if (timestamp._seconds && timestamp._nanoseconds)
        return new Date(timestamp._seconds * 1000 + timestamp._nanoseconds / 1000000);
      else if (timestamp.seconds && timestamp.nanoseconds)
        return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
      else if (typeof timestamp === "string") return new Date(timestamp);
      else if (typeof timestamp === "number") return timestamp > 1e12 ? new Date(timestamp) : new Date(timestamp * 1000);
      else return new Date(0);
    } catch {
      return new Date(0);
    }
  }, []);

  // Get vendor ID
  useEffect(() => {
    if (auth.currentUser) setVendorId(auth.currentUser.uid);
  }, []);

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      if (!vendorId) return;
      setLoading(true);
      try {
        const auth = getAuth();
        let user = auth.currentUser;
        while (!user) await new Promise((res) => setTimeout(res, 50)) && (user = auth.currentUser);
        const token = await user.getIdToken();

        const res = await fetch(`https://us-central1-planit-sdp.cloudfunctions.net/api/analytics/${vendorId}`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error("Failed to fetch reviews");

        const data = await res.json();
        setReviews(data.reviews || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [vendorId]);

  // Calculate analytics
  const calculateAnalytics = useCallback(() => {
    if (!reviews.length) return null;

    const overallRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length;
    const totalReviews = reviews.length;

    // Calculate this month's average
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthReviews = reviews.filter(review => {
      const reviewDate = getReviewDate(review);
      return reviewDate >= thisMonthStart;
    });
    const thisMonthRating = thisMonthReviews.length > 0 
      ? thisMonthReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / thisMonthReviews.length 
      : 0;

    // Calculate last month's average for comparison
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const lastMonthReviews = reviews.filter(review => {
      const reviewDate = getReviewDate(review);
      return reviewDate >= lastMonthStart && reviewDate <= lastMonthEnd;
    });
    const lastMonthRating = lastMonthReviews.length > 0 
      ? lastMonthReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / lastMonthReviews.length 
      : 0;

    // Calculate rating change
    const ratingChange = lastMonthRating > 0 ? thisMonthRating - lastMonthRating : 0;
    const ratingChangePercent = lastMonthRating > 0 ? (ratingChange / lastMonthRating) * 100 : 0;

    // Rating distribution
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      const rating = Math.floor(r.rating || 0);
      if (rating >= 1 && rating <= 5) ratingDistribution[rating]++;
    });

    // Calculate monthly data for the chart
    const monthlyData = calculateMonthlyData(reviews, getReviewDate);

    return {
      overallRating,
      totalReviews,
      thisMonthRating,
      lastMonthRating,
      ratingChange,
      ratingChangePercent,
      ratingDistribution,
      thisMonthCount: thisMonthReviews.length,
      lastMonthCount: lastMonthReviews.length,
      monthlyData
    };
  }, [reviews, getReviewDate]);

  // Calculate monthly review data
  const calculateMonthlyData = useCallback((reviews, getReviewDate) => {
    const monthlyData = {};
    
    reviews.forEach(review => {
      const reviewDate = getReviewDate(review);
      const monthYear = `${reviewDate.getFullYear()}-${reviewDate.getMonth() + 1}`;
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = {
          count: 0,
          totalRating: 0,
          averageRating: 0
        };
      }
      
      monthlyData[monthYear].count++;
      monthlyData[monthYear].totalRating += review.rating || 0;
      monthlyData[monthYear].averageRating = monthlyData[monthYear].totalRating / monthlyData[monthYear].count;
    });

    // Convert to array and sort by date
    return Object.entries(monthlyData)
      .map(([monthYear, data]) => ({
        monthYear,
        ...data,
        date: new Date(monthYear + '-01')
      }))
      .sort((a, b) => a.date - b.date)
      .slice(-6); // Last 6 months
  }, []);

  // Sort reviews when sortOption or reviews change
  useEffect(() => {
    if (!reviews.length) {
      setFilteredReviews([]);
      return;
    }

    const sortedReviews = [...reviews].sort((a, b) => {
      const dateA = getReviewDate(a);
      const dateB = getReviewDate(b);
      
      switch (sortOption) {
        case "oldest":
          return dateB - dateA; 
        case "newest":
          return dateA - dateB; 
        case "most-critical":
          return a.rating - b.rating;
        case "most-praiseworthy":
          return b.rating - a.rating; 
        default:
          return dateB - dateA;
      }
    });
    
    setFilteredReviews(sortedReviews);
  }, [reviews, sortOption, getReviewDate]);

  // Handle reply creation/edit
  const handleReply = async (reviewId, replyText) => {
    if (!replyText?.trim()) return alert("Reply text is required");
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(
        `https://us-central1-planit-sdp.cloudfunctions.net/api/analytics/${vendorId}/reviews/${reviewId}/reply`,
        { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ reply: replyText }) }
      );
      if (!res.ok) throw new Error("Failed to update reply");

      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, reply: replyText, replyInput: "", editingReply: false } : r))
      );
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // Delete reply
  const handleDeleteReply = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this reply?")) return;
    try {
      const token = await auth.currentUser.getIdToken();
      await fetch(`https://us-central1-planit-sdp.cloudfunctions.net/api/analytics/${vendorId}/reviews/${reviewId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reply: "_blank_" }),
      });
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, reply: "_blank_", editingReply: false, replyInput: "" } : r))
      );
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // Render monthly chart
  const renderMonthlyChart = useCallback((monthlyData) => {
    if (!monthlyData || monthlyData.length === 0) {
      return (
        <div className="no-monthly-data">
          <p>No monthly data available</p>
          <small>Data will appear as reviews are received over time</small>
        </div>
      );
    }

    const maxCount = Math.max(...monthlyData.map(m => m.count));
    const maxRating = 5; // Maximum possible rating

    return (
      <div className="monthly-chart">
        <div className="chart-bars">
          {monthlyData.map((month, index) => {
            const monthName = new Date(month.date).toLocaleDateString('en-US', { month: 'short' });
            const countPercentage = (month.count / maxCount) * 100;
            const ratingPercentage = (month.averageRating / maxRating) * 100;

            return (
              <div key={index} className="chart-bar-container">
                <div className="chart-bar-group">
                  <div className="chart-bar-label">{monthName}</div>
                  <div className="chart-bars-wrapper">
                    <div className="chart-bar-count" style={{ height: `${countPercentage}%` }}>
                      <span className="chart-bar-value">{month.count}</span>
                    </div>
                    <div className="chart-bar-rating" style={{ height: `${ratingPercentage}%` }}>
                      <span className="chart-bar-value">{month.averageRating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="chart-legend">
          <div className="legend-item">
            <div className="legend-color count"></div>
            <span>Reviews Count</span>
          </div>
          <div className="legend-item">
            <div className="legend-color rating"></div>
            <span>Avg Rating</span>
          </div>
        </div>
      </div>
    );
  }, []);

  // Render distribution view
  const renderDistributionView = useCallback((analytics) => {
    return (
      <>
        <div className="rating-distribution">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = analytics.ratingDistribution[rating];
            const percentage = (count / analytics.totalReviews) * 100;
            return (
              <div key={rating} className="distribution-item">
                <div className="distribution-stars">
                  <span className="distribution-rating">{rating}</span>
                  <Star size={16} color="#fbbf24" fill="#fbbf24" />
                </div>
                <div className="distribution-progress">
                  <div className="distribution-progress-bar" style={{ width: `${percentage}%` }}></div>
                </div>
                <span className="distribution-count">{count}</span>
              </div>
            );
          })}
        </div>
        <div className="distribution-summary">
          <p>Total Reviews: <strong>{analytics.totalReviews}</strong></p>
          <p>This Month: <strong>{analytics.thisMonthCount}</strong></p>
        </div>
      </>
    );
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner"></div><p>Loading your reviews...</p></div>;
  if (error) return <p className="error">{error}</p>;
  if (!reviews.length) return <p>No reviews found.</p>;

  const analytics = calculateAnalytics();

  return (
    <section className="vendor-reviews-page">
      <div className="review-page-title">
        <h2>Vendor Reviews</h2>
        <p>Review, analyze, and respond to reviews about your services.</p>
      </div>

      {/* Sorting Dropdown */}
      <div className="reviews-sort-controls">
        <div className="sort-dropdown">
          <label htmlFor="sort-select">Sort by:</label>
          <div className="select-wrapper">
            <select 
              id="sort-select"
              value={sortOption} 
              onChange={(e) => setSortOption(e.target.value)}
              className="sort-select"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="most-critical">Most Critical</option>
              <option value="most-praiseworthy">Most Praiseworthy</option>
            </select>
            <ChevronDown size={16} className="select-chevron" />
          </div>
        </div>
      </div>

      {/* Top Section - Two Tiles */}
      <div className="reviews-top-section">
        {/* Left Tile - Toggle between Distribution and Monthly Chart */}
        <div className="distribution-tile">
          <div className="tile-header">
            <h3>Review Analytics</h3>
            <div className="view-toggle">
              <button 
                className={`toggle-btn ${viewMode === 'distribution' ? 'active' : ''}`}
                onClick={() => setViewMode('distribution')}
              >
                <BarChart3 size={16} />
                Distribution
              </button>
              <button 
                className={`toggle-btn ${viewMode === 'monthly' ? 'active' : ''}`}
                onClick={() => setViewMode('monthly')}
              >
                <Calendar size={16} />
                Monthly
              </button>
            </div>
          </div>
          
          <div className="tile-content">
            {viewMode === 'distribution' ? (
              renderDistributionView(analytics)
            ) : (
              renderMonthlyChart(analytics.monthlyData)
            )}
          </div>
        </div>

        {/* Right Tile - Average Rating */}
        <div className="rating-tile">
          <h3>Average Rating</h3>
          <div className="rating-circle">
            <div className="rating-circle-main">
              <div className="rating-circle-container">
                <h1>{analytics.overallRating.toFixed(1)}</h1>
                <div className="star-rating-small">
                  <StarRating rating={analytics.overallRating} size={14} />
                </div>
                <p className="total-reviews">{analytics.totalReviews} total</p>
              </div>
            </div>
          </div>
          
          <div className="rating-breakdown">
            <div className="breakdown-item">
              <span className="breakdown-label">This Month</span>
              <div className="breakdown-value">
                <span className="rating-number">{analytics.thisMonthRating.toFixed(1)}</span>
                <StarRating rating={analytics.thisMonthRating} size={12} />
              </div>
            </div>
            
            <div className="breakdown-item">
              <span className="breakdown-label">Last Month</span>
              <div className="breakdown-value">
                <span className="rating-number">{analytics.lastMonthRating.toFixed(1)}</span>
                <StarRating rating={analytics.lastMonthRating} size={12} />
              </div>
            </div>
            
            <div className={`breakdown-item trend ${analytics.ratingChange > 0 ? 'positive' : analytics.ratingChange < 0 ? 'negative' : ''}`}>
              <span className="breakdown-label">Monthly Trend</span>
              <div className={`breakdown-value ${analytics.ratingChange >= 0 ? 'positive' : 'negative'}`}>
                {analytics.ratingChange !== 0 ? (
                  <>
                    {analytics.ratingChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    <span className="trend-value">
                      {Math.abs(analytics.ratingChange).toFixed(1)} 
                      {analytics.ratingChangePercent !== 0 && ` (${Math.abs(analytics.ratingChangePercent).toFixed(1)}%)`}
                    </span>
                  </>
                ) : (
                  <span className="trend-value stable">No change</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Scrollable Review List */}
      <div className="reviews-bottom-section">
        <div className="review-list-scroll-container">
          <div className="review-list">
            {filteredReviews.map((review) => {
              const isBlank = review.reply === "_blank_";
              const reviewDate = review.timeOfReview || review.createdAt || review.date;

              return (
                <div key={review.id} className="review-card">
                  <div className="review-header">
                    <p className="review-time">{convertFirebaseTimestamp(reviewDate)}</p>
                    <StarRating rating={review.rating} />
                  </div>

                  <p className="review-comment">{review.review}</p>

                  {/* Display existing reply */}
                  {review.reply && !review.editingReply && !isBlank && (
                    <div className="review-replies">
                      <div className="reply">
                        <span className="reply-author">Your Reply:</span>
                        <p className="reply-text">{review.reply}</p>
                        <div className="review-reply-actions">
                          <button onClick={() => setReviews((prev) => prev.map((r) => r.id === review.id ? { ...r, editingReply: true, replyInput: r.reply } : r))}>Edit</button>
                          <button onClick={() => handleDeleteReply(review.id)}>Delete</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reply form */}
                  {(review.editingReply || !review.reply || isBlank) && (
                    <div className="reply-form">
                      <input
                        type="text"
                        placeholder="Write a reply..."
                        value={review.replyInput || ""}
                        onChange={(e) =>
                          setReviews((prev) =>
                            prev.map((r) =>
                              r.id === review.id
                                ? { ...r, replyInput: e.target.value, editingReply: true, reply: r.reply === "_blank_" ? null : r.reply }
                                : r
                            )
                          )
                        }
                      />
                      <div className="review-reply-actions">
                        <button onClick={() => handleReply(review.id, review.replyInput)} disabled={!review.replyInput?.trim()}>Send</button>
                        <button onClick={() => setReviews((prev) => prev.map((r) => r.id === review.id ? { ...r, editingReply: false, replyInput: "" } : r))}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default VendorReviews;