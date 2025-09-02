
import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import './PlannerDashboard.css';
import { 
  Calendar, 
  Users, 
  Plus,
  BarChart3, 
  MapPin, 
  FileText,
  Store,
  CalendarDays, 
  Building 
} from "lucide-react";

export default function PlannerDashboard() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);

  const upcomingEvents = [
    { id: 1, title: "Annual Tech Conference", date: "Sep 25, 2025", time: "10:00 AM", attendees: 120, status: "Confirmed" },
    { id: 2, title: "Marketing Workshop", date: "Sep 28, 2025", time: "2:00 PM", attendees: 85, status: "Pending" },
    { id: 3, title: "Community Meetup", date: "Oct 2, 2025", time: "6:00 PM", attendees: 50, status: "Pending" }
  ];

  const pendingVendors = [
    { id: 1, name: "ABC Catering", event: "Annual Tech Conference", contact: "abc@catering.com", status: "Confirmed" },
    { id: 2, name: "SoundWorks", event: "Marketing Workshop", contact: "contact@soundworks.co.za", status: "Pending" },
    { id: 3, name: "VenueCo", event: "Community Meetup", contact: "info@venueco.com", status: "Confirmed" }
  ];

  return (
    <section className='page-container'>

      {/* Header Section */}
      <section className="dashboard-intro">
        <section>
          <h1 className="dashboard-title">Planner Dashboard</h1>
          <p className="dashboard-subtitle">Welcome back, here's what's happening with your events.</p>
        </section>


export default function PlannerDashboard({setActivePage}){

    const navigate = useNavigate();

    const upcomingEvents = [
    { id: 1, title: "Annual Tech Conference", date: "Sep 25, 2025", time: "10:00 AM", attendees: 120, status: "Confirmed" },
    { id: 2, title: "Marketing Workshop", date: "Sep 28, 2025", time: "2:00 PM", attendees: 85, status: "Pending" },
    { id: 3, title: "Community Meetup", date: "Oct 2, 2025", time: "6:00 PM", attendees: 50, status: "Pending" }
    ];

    const pendingVendors = [
    { id: 1, name: "ABC Catering", event: "Annual Tech Conference", contact: "abc@catering.com", status: "Confirmed" },
    { id: 2, name: "SoundWorks", event: "Marketing Workshop", contact: "contact@soundworks.co.za", status: "Pending" },
    { id: 3, name: "VenueCo", event: "Community Meetup", contact: "info@venueco.com", status: "Confirmed" }
    ];


    return(
        <section className = 'page-container'>

                {/* Header Section */}
                <section className = "dashboard-intro">
                    <section>
                        <h1 className="dashboard-title">Planner Dashboard</h1>
                        <p className="dashboard-subtitle">Welcome back, here's what's happening with your events.</p>
                    </section>

                   <section className='actions'>
          <button 
            className='page-button' 
            onClick={() => navigate("/planner/new-event")}
          >
            <Plus size={16}/> New Event
          </button>
        </section>

                </section>

            <section className="summary-cards-section">
                {/* Upcoming Events */}
                <section className="summary-card blue">
                    <section className="summary-card-header">
                    <Calendar size={40} />
                    <section className="summary-change positive">+2 Upcoming</section>
                    </section>
                    <section className="summary-card-body">
                    <h3 className="summary-label">Upcoming Events</h3>
                    <p className="summary-value">8</p>
                    <p className="summary-subtext">Next 30 days</p>
                    </section>
                </section>


        {/* Average Attendance */}
        <section className="summary-card green">
          <section className="summary-card-header">
            <Users size={40} />
            <section className="summary-change positive">+5%</section>
          </section>
          <section className="summary-card-body">
            <h3 className="summary-label">Avg Attendance</h3>
            <p className="summary-value">320</p>
            <p className="summary-subtext">Per Event</p>
          </section>
        </section>

        {/* New Guests */}
        <section className="summary-card purple">
          <section className="summary-card-header">
            <Users size={40} />
            <section className="summary-change positive">+12%</section>
          </section>
          <section className="summary-card-body">
            <h3 className="summary-label">New Guests</h3>
            <p className="summary-value">450</p>
            <p className="summary-subtext">This month</p>
          </section>
        </section>

        {/* Pending Vendor Confirmations */}
        <section className="summary-card orange">
          <section className="summary-card-header">
            <Users size={40} />
            <section className="summary-change negative">-3 Pending</section>
          </section>
          <section className="summary-card-body">
            <h3 className="summary-label">Pending Vendors</h3>
            <p className="summary-value">4</p>
            <p className="summary-subtext">Awaiting confirmation</p>
          </section>
        </section>
      </section>

      {/* Main Content */}
      <section className='main-content'>
        <section className='main-content-info'>
          {/* Upcoming Events */}
          <section className="dashboard-card">
            <section className="card-header">
              <h3>Upcoming Events</h3>
              <button 
                className="view-all-link" 
                onClick={() => navigate("/planner/events")}
              >
                View All
              </button>
            </section>
            <section className="upcoming-events">
              {upcomingEvents.map(event => (
                <section key={event.id} className="upcoming-event event-item">
                  <section className="event-header">
                    <h4>{event.title}</h4>
                  </section>
                  <section className="event-footer">
                    <section>{event.date} | {event.time}</section>
                    <section>{event.attendees} attending</section>
                  </section>
                </section>
              ))}
            </section>
          </section>

          {/* Pending Vendors */}
          <section className="dashboard-card">
            <section className="card-header">
              <h3>Vendors</h3>
              <button 
                className="view-all-link" 
                onClick={() => navigate("/planner/vendor")}
              >
                View All
              </button>
            </section>
            <section className="upcoming-events">
              {pendingVendors.map(vendor => (
                <section key={vendor.id} className="upcoming-event event-item">
                  <section className="vendor-header">
                    <h4>{vendor.name}</h4>
                    <span className={`status-badge ${vendor.status.toLowerCase()}`}>
                      {vendor.status}
                    </span>
                  </section>
                  <section className="vendor-footer">
                    <section>{vendor.event}</section>
                    <section>{vendor.contact}</section>
                  </section>
                </section>
              ))}
            </section>
          </section>
        </section>

        {/* Quick Actions */}
        <section className='dashboard-card'>
          <section className='card-header'>
            <h2>Quick Actions</h2>
          </section>
          <section className='actions-grid'>
            <button onClick={() => navigate("/planner/vendor")} className='action-button'>
              <Store/>Browse Vendors
            </button>
            <button onClick={() => navigate("/planner/guest-management")} className='action-button'>
              <Users/>Manage Guests
            </button>
            <button onClick={() => navigate("/planner/events")} className='action-button'>
              <CalendarDays/>All Events
            </button>
            <button onClick={() => navigate("/planner/vendor")} className='action-button'>
              <Building/>All Vendors
            </button>
          </section>
        </section>
      </section>
    </section>
  );
}
