import React from "react";
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

const VendorDashboardHTML = ({
  // State props
  services,
  showServiceForm,
  editingService,
  vendorId,
  deleting,
  analytics,
  vendorBookings,
  formData,
  formErrors,
  loading,
  error,
  dataLoaded,
  notifications,
  unreadCount,
  bookingStats,
  recentBookings,
  recentReviews,
  
  // Function props
  setActivePage,
  setShowServiceForm,
  setEditingService,
  setFormData,
  setFormErrors,
  setError,
  handleChange,
  handleSaveService,
  handleEdit,
  handleDeleteService,
  markAsRead,
  markAllAsRead,
  formatCount,
  renderRatingDistribution,
  convertFirebaseTimestamp
}) => {
  return (
    <div className="vendor-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dashboard Overview</h1>
          <p className="dashboard-subtitle">Welcome back! Here's what's happening with your business.</p>
        </div>
        <div className="dashboard-actions">
          <button className="btn-primary" onClick={() => setActivePage("bookings")}>
            <Eye size={16} />
            View Bookings
          </button>
        </div>
      </div>


      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card blue">
          <div className="summary-card-header">
            <div className="summary-icon blue">
              <Calendar size={24} />
            </div>
            <span className="summary-change">
              {bookingStats.total > 0 ? `${bookingStats.confirmed} confirmed` : "No bookings"}
            </span>
          </div>
          <div>
            <h3 className="summary-label">Total Bookings</h3>
            <p className="summary-value">{formatCount(bookingStats.total)}</p>
            <p className="summary-subtext">
              {formatCount(bookingStats.confirmed)} confirmed, {formatCount(bookingStats.pending)} pending
            </p>
          </div>
        </div>

        <div className="summary-card green">
          <div className="summary-card-header">
            <div className="summary-icon green">
              <DollarSign size={24} />
            </div>
            <span className="summary-change">
              {analytics?.totalRevenue > 0 ? "+15%" : "No data"}
            </span>
          </div>
          <div>
            <h3 className="summary-label">Total Revenue</h3>
            <p className="summary-value">
              R{(analytics?.totalRevenue || 0).toLocaleString()}
            </p>
            <p className="summary-subtext">All time</p>
          </div>
        </div>

        <div className="summary-card yellow">
          <div className="summary-card-header">
            <div className="summary-icon yellow">
              <Star size={24} />
            </div>
            <span className="summary-change">
              {analytics?.avgRating > 0 ? `${(analytics.avgRating - 4.5).toFixed(1)}` : "No reviews"}
            </span>
          </div>
          <div>
            <h3 className="summary-label">Avg Rating</h3>
            <p className="summary-value">
              {analytics?.avgRating ? analytics.avgRating.toFixed(1) : "0.0"}
            </p>
            <p className="summary-subtext">
              {formatCount(analytics?.totalReviews || 0)} reviews
            </p>
          </div>
        </div>
      </div>

     

      {/* Main Grid */}
      <div className="dashboard-grid">
        {/* Recent Bookings */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Recent Bookings</h3>
            <button onClick={() => setActivePage("bookings")} className="view-all-link">
              View All ({formatCount(vendorBookings.length)})
            </button>
          </div>
          <div className="card-content">
            {recentBookings.length > 0 ? (
              recentBookings.map((booking) => (
                <div key={booking.id} className="booking-item">
                  <div className="booking-header">
                    <h4>{booking.event}</h4>
                    <span className={`status-badge ${booking.status} ${booking.status === 'confirmed' || booking.status === 'accepted' ? 'highlight-accepted' : booking.status === 'rejected' || booking.status === 'declined' ? 'highlight-rejected' : booking.status === 'pending' ? 'highlight-pending' : ''}`}>
                      {booking.status}
                    </span>
                  </div>
                  <div className="booking-footer">
                    <span>{booking.date}</span>
                    <span className="amount">{booking.amount}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-bookings">No recent bookings</p>
            )}
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Recent Reviews</h3>
            <button onClick={() => setActivePage("reviews")} className="view-all-link">
              View All ({formatCount(analytics?.totalReviews || 0)})
            </button>
          </div>
          <div className="card-content">
            {recentReviews.length > 0 ? (
              recentReviews.map((review) => (
                <div key={review.id} className="review-item">
                  <div className="review-header">
                    <div className="review-user">
                      <h4>{review.name}</h4>
                      <div className="rating">
                        {[1, 2, 3, 4, 5].map((i) => {
                          if (i <= Math.floor(review.rating)) {
                            return <Star key={i} size={14} fill="#fbbf24" color="#fbbf24" />;
                          } else if (i - review.rating <= 0.5) {
                            return <StarHalf key={i} size={14} fill="#fbbf24" color="#fbbf24" />;
                          } else {
                            return <Star key={i} size={14} color="#d1d5db" />;
                          }
                        })}
                      </div>
                    </div>
                    <span className="review-date">{review.date}</span>
                  </div>
                  <p className="review-comment">{review.comment}</p>
                </div>
              ))
            ) : (
              <p className="no-reviews">No reviews yet</p>
            )}
          </div>
        </div>

        {/* Analytics Sidebar */}
        <div className="dashboard-sidebar">
          {/* Booking Statistics */}
          <div className="dashboard-card booking-stats-card">
            <div className="card-header">
              <h3>Booking Statistics</h3>
            </div>
            <div className="card-content">
              <div className="booking-stats">
                <div className="stat-item">
                  <span className="stat-label">Total Bookings:</span>
                  <span className="stat-value">{formatCount(bookingStats.total)}</span>
                </div>
                <div className="stat-item confirmed">
                  <span className="stat-label">Confirmed:</span>
                  <span className="stat-value">{formatCount(bookingStats.confirmed)}</span>
                </div>
                <div className="stat-item pending">
                  <span className="stat-label">Pending:</span>
                  <span className="stat-value">{formatCount(bookingStats.pending)}</span>
                </div>
                <div className="stat-item rejected">
                  <span className="stat-label">Rejected:</span>
                  <span className="stat-value">{formatCount(bookingStats.rejected)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Rating Distribution</h3>
            </div>
            <div className="card-content">
              {renderRatingDistribution()}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="dashboard-card performance-metrics-card">
            <div className="card-header">
              <h3>Performance Metrics</h3>
            </div>
            <div className="card-content">
              <div className="performance-metrics">
                <div className="metric-item">
                  <span className="metric-label">Completion Rate: </span>
                  <div className="metric-bar">
                    <div 
                      className="metric-fill" 
                      style={{ width: `${analytics?.performanceMetrics?.completionRate || 0}%` }}
                    ></div>
                  </div>
                  <span className="metric-value">{analytics?.performanceMetrics?.completionRate || 0}%</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Repeat Customers: </span>
                  <div className="metric-value-large">{formatCount(analytics?.performanceMetrics?.repeatCustomers || 0)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="dashboard-card">
        <div className="card-header">
          <h3>My Services</h3>
          <button className="btn-primary" onClick={() => setShowServiceForm(true)}>
            <Edit size={16} />
            Add Service
          </button>
        </div>
        <div className="card-content">
          {services.length > 0 ? (
            services.map((service) => (
              <div key={service.id} className="service-item">
                <div>
                  <h4>{service.serviceName}</h4>
                  <p>Cost: R{service.cost}</p>
                  {service.chargeByHour && <p>Charge by hour: R{service.chargeByHour}/hour</p>}
                  {service.chargePerPerson && <p>Charge per person: R{service.chargePerPerson}/person</p>}
                  {service.chargePerSquareMeter && <p>Charge per square meter: R{service.chargePerSquareMeter}/m²</p>}
                  {service.extraNotes && <p className="service-notes">Notes: {service.extraNotes}</p>}
                </div>
                <div className="service-actions">
                  <button onClick={() => handleEdit(service)} className="btn-edit">
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => handleDeleteService(service.id)} 
                    className="btn-delete"
                    disabled={deleting === service.id}
                  >
                    {deleting === service.id ? "..." : <Trash2 size={16} />}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="no-services">No services added yet.</p>
          )}
        </div>
      </div>

      {/* Service Form Modal */}
      {showServiceForm && (
        <div className="modal" onClick={() => setShowServiceForm(false)}>
          <div className="modal-content service-form" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingService ? "Edit Service" : "Add New Service"}</h3>
              <button 
                onClick={() => {
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
                }} 
                className="close-btn"
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {error && <div className="error-message">{error}</div>}
              
              <div className="form-columns">
                {/* Left Column */}
                <div className="form-column">
                  <div className="form-field">
                    <label className="form-label">Service Name *</label>
                    <input
                      type="text"
                      name="serviceName"
                      placeholder="e.g., Catering, Photography"
                      value={formData.serviceName}
                      onChange={handleChange}
                      className={formErrors.serviceName ? 'error' : ''}
                      maxLength={100}
                    />
                    {formErrors.serviceName && <span className="field-error">{formErrors.serviceName}</span>}
                  </div>
                  
                  <div className="form-field">
                    <label className="form-label">Base Cost (R) *</label>
                    <input
                      type="number"
                      name="cost"
                      placeholder="e.g., 10000"
                      value={formData.cost}
                      onChange={handleChange}
                      className={formErrors.cost ? 'error' : ''}
                      min="0"
                      max="1000000"
                      step="0.01"
                    />
                    {formErrors.cost && <span className="field-error">{formErrors.cost}</span>}
                  </div>
                  
                  <div className="form-field">
                    <label className="form-label">Per Hour (R)</label>
                    <input
                      type="number"
                      name="chargeByHour"
                      placeholder="e.g., 1000"
                      value={formData.chargeByHour}
                      onChange={handleChange}
                      className={formErrors.chargeByHour ? 'error' : ''}
                      min="0"
                      max="1000000"
                      step="0.01"
                    />
                    {formErrors.chargeByHour && <span className="field-error">{formErrors.chargeByHour}</span>}
                  </div>
                </div>
                
                {/* Right Column */}
                <div className="form-column">
                  <div className="form-field">
                    <label className="form-label">Per Person (R)</label>
                    <input
                      type="number"
                      name="chargePerPerson"
                      placeholder="e.g., 100"
                      value={formData.chargePerPerson}
                      onChange={handleChange}
                      className={formErrors.chargePerPerson ? 'error' : ''}
                      min="0"
                      max="1000000"
                      step="0.01"
                    />
                    {formErrors.chargePerPerson && <span className="field-error">{formErrors.chargePerPerson}</span>}
                  </div>
                  
                  <div className="form-field">
                    <label className="form-label">Per Square Meter (R)</label>
                    <input
                      type="number"
                      name="chargePerSquareMeter"
                      placeholder="e.g., 250"
                      value={formData.chargePerSquareMeter}
                      onChange={handleChange}
                      className={formErrors.chargePerSquareMeter ? 'error' : ''}
                      min="0"
                      max="1000000"
                      step="0.01"
                    />
                    {formErrors.chargePerSquareMeter && <span className="field-error">{formErrors.chargePerSquareMeter}</span>}
                  </div>
                  
                  <div className="form-field">
                    <label className="form-label">Notes</label>
                    <textarea
                      name="extraNotes"
                      placeholder="e.g., We provide decor services"
                      value={formData.extraNotes}
                      onChange={handleChange}
                      className={formErrors.extraNotes ? 'error' : ''}
                      rows="3"
                      maxLength={500}
                    />
                    {formErrors.extraNotes && <span className="field-error">{formErrors.extraNotes}</span>}
                    <div className="character-count">
                      {formData.extraNotes.length}/500
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={handleSaveService}>
                {editingService ? "Update Service" : "Add Service"}
              </button>
              <button className="btn-secondary" onClick={() => {
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
              }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDashboardHTML;