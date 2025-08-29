// src/vendor/VendorProfile.jsx

import {useNavigate} from "react-router-dom";

import {
  Users,
  Star,
  TrendingUp,
  Award,
  MapPin,
  Phone,
  Mail,
  Edit,
  Calendar,
  Image
} from "lucide-react";
import "./vendorProfile.css";

const VendorProfile = () => {

  const navigate = useNavigate();

  const navProfileEdit=()=>{
    navigate('/vendor/vendor-edit-profile');
  }

  return (
    <div className="vendor-profile">
      {/* Header Section */}
      <div className="profile-header">
        <div>
          <h1 className="profile-title">Vendor Profile</h1>
          <p className="profile-subtitle">Manage your business profile and services</p>
        </div>
        <button className="edit-profile-btn" onClick={navProfileEdit}>
          <Edit size={16} />
          Edit Profile
        </button>
      </div>

      {/* Small Summary Cards in Square Layout (2x2) */}
      <div className="profile-summary-cards">
        <div className="profile-summary-card">
          <p className="summary-label">Bookings</p>
          <p className="summary-value">28</p>
        </div>
        <div className="profile-summary-card">
          <p className="summary-label">Active Services</p>
          <p className="summary-value">6</p>
        </div>
        <div className="profile-summary-card">
          <p className="summary-label">Total Reviews</p>
          <p className="summary-value">120</p>
        </div>
        <div className="profile-summary-card">
          <p className="summary-label">Avg. Rating</p>
          <p className="summary-value">4.8</p>
        </div>
      </div>

      {/* Profile Cards Grid */}
      <div className="profile-cards-grid">
        {/* Business Information Card */}
        <div className="profile-card">
          <div className="profile-card-header">
            <h2>Business Information</h2>
          </div>

          <div className="business-topline">
            <h3 className="business-name">Premium Catering</h3>
            <span className="business-badge">
              Catering
            </span>
          </div>

          <div className="business-description">
            <p>We specialize in high-quality catering for corporate events and weddings with international cuisine and elegant presentation.</p>
          </div>

          <div className="business-contact">
            <div className="contact-item">
              <MapPin size={16} />
              <span>123 Event Street, Johannesburg</span>
            </div>
            <div className="contact-item">
              <Phone size={16} />
              <span>+27 71 234 5678</span>
            </div>
            <div className="contact-item">
              <Mail size={16} />
              <span>info@premiumcatering.co.za</span>
            </div>
          </div>
        </div>

        {/* Performance Card */}
        <div className="profile-card">
          <div className="profile-card-header">
            <h2>Performance</h2>
          </div>

          <div className="performance-stats">
            <div className="stat-pill">
              <Star size={16} />
              <span>Rating: 4.8</span>
            </div>
            <div className="stat-pill">
              <Users size={16} />
              <span>Reviews: 120</span>
            </div>
            <div className="stat-pill">
              <TrendingUp size={16} />
              <span>Growth: +15%</span>
            </div>
            <div className="stat-pill">
              <Award size={16} />
              <span>Top Rated</span>
            </div>
          </div>
        </div>

        {/* Services & Pricing Card */}
        <div className="profile-card">
          <div className="profile-card-header">
            <h2>Services & Pricing</h2>
          </div>
          
          <div className="services-list">
            <div className="service-item">
              <p className="service-name">Corporate Catering</p>
              <p className="service-price">R500–R600 pp</p>
            </div>
            <div className="service-item">
              <p className="service-name">Wedding Catering</p>
              <p className="service-price">R600–R800 pp</p>
            </div>
            <div className="service-item">
              <p className="service-name">Private Events</p>
              <p className="service-price">R400–R550 pp</p>
            </div>
          </div>
        </div>

        {/* Catalogue Card */}
        <div className="profile-card">
          <div className="profile-card-header">
            <h2>Catalogue</h2>
          </div>
          
          <div className="catalogue-content">
            {/* Upload Area */}
            <div className="upload-area">
              <Image size={24} />
              <p>Drag & drop images or click to browse</p>
              <input type="file" multiple accept="image/*" className="file-input" id="catalogue-upload" />
              <label htmlFor="catalogue-upload" className="upload-btn">
                Choose Files
              </label>
            </div>
            
            {/* Sample uploaded images */}
            <div className="image-grid">
              <div className="image-placeholder">
                <Image size={16} />
              </div>
              <div className="image-placeholder">
                <Image size={16} />
              </div>
              <div className="image-placeholder more">
                +3 more
              </div>
            </div>
            
            <button className="manage-gallery-btn">
              Manage Gallery
            </button>
          </div>
        </div>

        {/* Recent Activity Card */}
        <div className="profile-card">
          <div className="profile-card-header">
            <h2>Recent Activity</h2>
          </div>
          
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-dot green"></div>
              <div className="activity-content">
                <p className="activity-title">New booking received</p>
                <p className="activity-detail">Wedding - Aug 25</p>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-dot blue"></div>
              <div className="activity-content">
                <p className="activity-title">Review submitted</p>
                <p className="activity-detail">5 stars - Sarah M.</p>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-dot orange"></div>
              <div className="activity-content">
                <p className="activity-title">Service updated</p>
                <p className="activity-detail">Corporate pricing</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Settings Card */}
        <div className="profile-card">
          <div className="profile-card-header">
            <h2>Quick Settings</h2>
          </div>
          
          <div className="settings-list">
            <button className="setting-item">
              <Edit size={16} />
              <span>Edit Business Info</span>
            </button>
            <button className="setting-item">
              <Star size={16} />
              <span>Manage Reviews</span>
            </button>
            <button className="setting-item">
              <Calendar size={16} />
              <span>Update Availability</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorProfile;