import React from "react";
import { Edit, Plus, X, Trash2, Phone, Mail, MapPin, Calendar, Award, Users, Star, CheckCircle, X as CloseIcon } from "lucide-react";

function VendorProfileHTML({
  // State props
  vendor,
  services,
  loading,
  error,
  imageVersion,
  showServiceForm,
  editingService,
  deleting,
  formData,
  formErrors,
  stats,
  popupNotifications,
  
  // Function props
  navProfileEdit,
  setShowServiceForm,
  setEditingService,
  setFormData,
  setFormErrors,
  setError,
  handleChange,
  handleSaveService,
  handleEditService,
  handleDeleteService,
  removePopupNotification
}) {
  return (
    <div className="vendor-profile" data-testid="vendor-profile">
      {/* Popup Notifications Container */}
      <div className="popup-notifications-container">
        {popupNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`popup-notification ${notification.type} ${notification.visible ? 'visible' : 'hidden'}`}
          >
            <div className="notification-content">
              <div className="notification-icon">
                {notification.type === 'success' && <CheckCircle size={20} />}
                {notification.type === 'error' && <X size={20} />}
                {notification.type === 'warning' && <CheckCircle size={20} />}
                {notification.type === 'info' && <CheckCircle size={20} />}
              </div>
              <div className="notification-text">
                <div className="notification-title">{notification.title}</div>
                <div className="notification-message">{notification.message}</div>
              </div>
              <button
                className="notification-close"
                onClick={() => removePopupNotification(notification.id)}
              >
                <CloseIcon size={16} />
              </button>
            </div>
            <div 
              className="notification-progress" 
              style={{ animationDuration: `${notification.duration}ms` }}
            ></div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="profile-header">
        <div>
          <h1 className="profile-title">Vendor Profile</h1>
          <p className="profile-subtitle">Manage your business profile and services</p>
        </div>
        <div className="profile-actions">
          <button className="btn-primary" onClick={navProfileEdit}>
            <Edit size={16} />
            Edit Profile
          </button>
        </div>
      </div>

      {/* Summary Cards with Real Data */}
      <div className="summary-grid">
        <div className="summary-card blue">
          <div className="summary-card-header">
            <div className="summary-icon blue">
              <Calendar size={24} />
            </div>
            <span className="summary-change">
              {stats.totalBookings > 0 ? `${stats.confirmedBookings} confirmed` : "No bookings"}
            </span>
          </div>
          <div>
            <h3 className="summary-label">Total Bookings</h3>
            <p className="summary-value">{stats.totalBookings}</p>
            <p className="summary-subtext">
              {stats.confirmedBookings} confirmed, {stats.totalBookings - stats.confirmedBookings} pending
            </p>
          </div>
        </div>

        <div className="summary-card green">
          <div className="summary-card-header">
            <div className="summary-icon green">
              <Award size={24} />
            </div>
            <span className="summary-change">{stats.totalServices} active</span>
          </div>
          <div>
            <h3 className="summary-label">Services</h3>
            <p className="summary-value">{stats.totalServices}</p>
            <p className="summary-subtext">Total services offered</p>
          </div>
        </div>

        <div className="summary-card yellow">
          <div className="summary-card-header">
            <div className="summary-icon yellow">
              <Users size={24} />
            </div>
            <span className="summary-change">Reviews</span>
          </div>
          <div>
            <h3 className="summary-label">Reviews</h3>
            <p className="summary-value">{stats.totalReviews}</p>
            <p className="summary-subtext">Customer reviews</p>
          </div>
        </div>

        <div className="summary-card purple">
          <div className="summary-card-header">
            <div className="summary-icon purple">
              <Star size={24} />
            </div>
            <span className="summary-change">Rating</span>
          </div>
          <div>
            <h3 className="summary-label">Avg Rating</h3>
            <p className="summary-value">{stats.avgRating}★</p>
            <p className="summary-subtext">Overall rating</p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="profile-grid">
        {/* Business Information */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Business Information</h3>
          </div>
          <div className="card-content">
            <div className="business-info">
              <div className="business-name-section">
                <h2 data-testid="vendor-name">{vendor.businessName || "Unnamed Business"}</h2>
                <span className="category-badge" data-testid="vendor-category">{vendor.category || "Uncategorized"}</span>
              </div>
              
              <div className="profile-image-container">
                <div className="profile-image-wrapper">
                  <img
                    src={
                      vendor.profilePic
                        ? `${vendor.profilePic}?v=${imageVersion}`
                        : "/default-avatar.png"
                    }
                    alt="Vendor Profile"
                    className="profile-image-large"
                  />
                  <div className="profile-image-hover"></div>
                </div>
                <div className="verified-badge">
                  <CheckCircle size={16} />
                  <span>Verified Vendor</span>
                </div>
              </div>
            </div>

            {/* Description with Border and Padding */}
            <div className="description-section">
              <h4>Description</h4>
              <div className="description-content">
                <p data-testid="vendor-description">{vendor.description || "No description provided."}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Contact Information</h3>
          </div>
          <div className="card-content">
            <div className="contact-item">
              <MapPin className="contact-icon" size={20} />
              <div className="contact-details">
                <span className="contact-label">Address</span>
                <span className="contact-value">{vendor.address || "No address provided"}</span>
              </div>
            </div>
            
            <div className="contact-item">
              <Phone className="contact-icon" size={20} />
              <div className="contact-details">
                <span className="contact-label">Phone</span>
                <span className="contact-value">{vendor.phone || "No phone provided"}</span>
              </div>
            </div>
            
            <div className="contact-item">
              <Mail className="contact-icon" size={20} />
              <div className="contact-details">
                <span className="contact-label">Email</span>
                <span className="contact-value">{vendor.email || "No email provided"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="dashboard-card">
        <div className="card-header">
          <h3>Services</h3>
          <button onClick={() => setShowServiceForm(true)} className="btn-primary">
            <Plus size={16} /> Add Service
          </button>
        </div>
        <div className="card-content">
          {services.length === 0 && <p data-testid="no-services">No services added yet.</p>}
          {services.map((service, index) => (
            <div key={service.id || `temp-${index}`} className="service-item" data-testid="service-item">
              <div>
                <h4 data-testid="service-name">{service.serviceName || "Unnamed Service"}</h4>
                <p data-testid="service-cost">Cost: R{service.cost || "N/A"}</p>
                {service.chargeByHour && <p data-testid="service-hour">Per Hour: R{service.chargeByHour}</p>}
                {service.chargePerPerson && <p data-testid="service-person">Per Person: R{service.chargePerPerson}</p>}
                {service.chargePerSquareMeter && <p data-testid="service-meter">Per m²: R{service.chargePerSquareMeter}</p>}
                {service.extraNotes && <p className="service-notes" data-testid="service-notes">Notes: {service.extraNotes}</p>}
                {!service.id && (
                  <p className="error-text">Warning: This service is missing an ID and cannot be edited or deleted.</p>
                )}
              </div>
              <div className="service-actions">
                <button
                  className="btn-secondary"
                  onClick={() => handleEditService(service)}
                  disabled={!service.id}
                  title={service.id ? "Edit service" : "Cannot edit: Missing service ID"}
                >
                  <Edit size={16} /> Edit
                </button>
                <button
                  className="btn-delete"
                  onClick={() => handleDeleteService(service.id)}
                  disabled={deleting === service.id || !service.id}
                  title={service.id ? "Delete service" : "Cannot delete: Missing service ID"}
                >
                  <Trash2 size={16} /> {deleting === service.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit Service Modal */}
      {showServiceForm && (
        <div className="modal" onClick={() => setShowServiceForm(false)}>
          <div className="modal-content service-form" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingService ? "Edit Service" : "Add New Service"}</h3>
              <button onClick={() => {
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
              }} className="close-btn">
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

export default VendorProfileHTML;