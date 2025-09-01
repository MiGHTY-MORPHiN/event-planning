import React, { useState } from "react";    
import { FaArrowLeft, FaBuilding } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./VendorDashboard.css";
 

import {
  Calendar,
  Star,
  FileText,
  DollarSign,
  Eye,
  Plus,
  MapPin,
  CheckCircle,
  AlertCircle,
  Edit
} from "lucide-react";

const VendorDashboard = ({ setActivePage }) => {
  const recentBookings = [
    { id: 1, event: "Corporate Lunch", date: "Aug 20", status: "confirmed", amount: "R15,000" },
    { id: 2, event: "Wedding Reception", date: "Aug 25", status: "pending", amount: "R45,000" },
    { id: 3, event: "Birthday Party", date: "Aug 30", status: "confirmed", amount: "R8,500" }
  ];

  const recentReviews = [
    { id: 1, name: "Sarah M.", rating: 5, comment: "Exceptional service and delicious food!", date: "2 days ago" },
    { id: 2, name: "John D.", rating: 4, comment: "Great presentation and timely delivery.", date: "1 week ago" }
  ];

  const pendingContracts = [
    { id: 1, client: "ABC Corp", event: "Annual Gala", value: "R75,000", status: "review" },
    { id: 2, client: "Smith Wedding", event: "Reception", value: "R45,000", status: "pending" }
  ];

  return (
    <div className="vendor-dashboard">
     
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dashboard Overview</h1>
          <p className="dashboard-subtitle">Welcome back! Here's what's happening with your business.</p>
        </div>
        <div className="dashboard-actions">
          <button className="btn-primary">
            <Plus size={16} />
            New Booking
          </button>
          <button className="btn-secondary">
            <Eye size={16} />
            Analytics
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
            <span className="summary-change">+12%</span>
          </div>
          <span style={{width:'30px'}}></span>
          <div>
            <h3 className="summary-label">Total Bookings</h3>
            <p className="summary-value">28</p>
            <p className="summary-subtext">This month</p>
          </div>
        </div>

        <div className="summary-card green">
          <div className="summary-card-header">
            <div className="summary-icon green">
              <DollarSign size={24} />
            </div>
            <span className="summary-change">+15%</span>
          </div>
          <span style={{width:'30px'}}></span>
          <div>
          <h3 className="summary-label">Revenue (MTD)</h3>
          <p className="summary-value">R85k</p>
          
          <p className="summary-subtext">Monthly target: R100k</p>
          </div>
        </div>

        <div className="summary-card yellow">
          <div className="summary-card-header">
            <div className="summary-icon yellow">
              <Star size={24} />
            </div>
            <span className="summary-change">+0.2</span>
          </div>
          <span style={{width:'50px'}}></span>
          <div>
          <h3 className="summary-label">Avg Rating</h3>
          <p className="summary-value">4.8</p>
          
          <p className="summary-subtext">120 reviews</p>
          </div>
        </div>

        <div className="summary-card purple">
          <div className="summary-card-header">
            <div className="summary-icon purple">
              <FileText size={24} />
            </div>
            <span className="summary-change">+2</span>
          </div>
          <span style={{width:'30px'}}></span>
          <div>
            <h3 className="summary-label">Active Contracts</h3>
            <p className="summary-value">6</p>
            <p className="summary-subtext">Worth R180k</p>
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
              View All
            </button>
          </div>
          <div className="card-content">
            {recentBookings.map((booking) => (
              <div key={booking.id} className="booking-item">
                <div className="booking-header">
                  <h4>{booking.event}</h4>
                  <span className={`status-badge ${booking.status}`}>
                    {booking.status}
                  </span>
                </div>
                <div className="booking-footer">
                  <span>{booking.date}</span>
                  <span className="amount">{booking.amount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Recent Reviews</h3>
            <button onClick={() => setActivePage("reviews")} className="view-all-link">
              View All
            </button>
          </div>
          <div className="card-content">
            {recentReviews.map((review) => (
              <div key={review.id} className="review-item">
                <div className="review-header">
                  <div className="review-user">
                    <h4>{review.name}</h4>
                    <div className="rating">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={i < review.rating ? 'star filled' : 'star'}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="review-date">{review.date}</span>
                </div>
                <p className="review-comment">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="dashboard-sidebar">
          {/* Pending Contracts */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Pending Contracts</h3>
              <button onClick={() => setActivePage("contracts")} className="view-all-link">
                View All
              </button>
            </div>
            <div className="card-content">
              {pendingContracts.map((contract) => (
                <div key={contract.id} className="contract-item">
                  <div>
                    <h4>{contract.client}</h4>
                    <p>{contract.event}</p>
                  </div>
                  <div className="contract-details">
                    <p className="contract-value">{contract.value}</p>
                    <span className={`status-badge ${contract.status}`}>
                      {contract.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Venue Status */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Venue Status</h3>
              <button onClick={() => setActivePage("floorplan")} className="view-all-link">
                View Plan
              </button>
            </div>
            <div className="card-content">
              <div className="venue-item">
                <CheckCircle className="venue-icon available" size={20} />
                <div>
                  <p className="venue-name">Main Hall</p>
                  <p className="venue-details">Available - 200 capacity</p>
                </div>
              </div>
              <div className="venue-item">
                <AlertCircle className="venue-icon booked" size={20} />
                <div>
                  <p className="venue-name">Garden Area</p>
                  <p className="venue-details">Booked Aug 25</p>
                </div>
              </div>
              <div className="venue-item">
                <CheckCircle className="venue-icon available" size={20} />
                <div>
                  <p className="venue-name">VIP Lounge</p>
                  <p className="venue-details">Available - 50 capacity</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="quick-actions">
  <div className="dashboard-card">
    <div className="card-header">
      <h3>Quick Actions</h3>
    </div>
    <div className="actions-grid">
      <button
        data-testid="quick-action-update-profile"
        onClick={() => setActivePage("profile")}
        className="action-card blue"
      >
        <Edit size={24} />
        <p>Update Profile</p>
      </button>

      <button
        data-testid="quick-action-new-booking"
        onClick={() => setActivePage("bookings")}
        className="action-card green"
      >
        <Plus size={24} />
        <p>New Booking</p>
      </button>

      <button
        data-testid="quick-action-review-contracts"
        onClick={() => setActivePage("contracts")}
        className="action-card purple"
      >
        <FileText size={24} />
        <p>Review Contracts</p>
      </button>

      <button
        data-testid="quick-action-manage-venues"
        onClick={() => setActivePage("floorplan")}
        className="action-card orange"
      >
        <MapPin size={24} />
        <p>Manage Venues</p>
      </button>
    </div>
  </div>
</div>
</div>
  );
};

export default VendorDashboard;