import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { isAfter, isBefore } from "date-fns";
import './PlannerDashboard.css';
import { getAuth, onAuthStateChanged } from "firebase/auth"; 
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

function PlannerDashboard({ onSelectEvent }) {
  const plannerId = "";
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);
  const [events, setEvents] = useState([]);
  const [authUser, setAuthUser] = useState(undefined); // undefined = loading, null = not logged in, object = user
  const today = new Date();
  const future = new Date();
  future.setDate(today.getDate() + 30);

  function EventCard({event, onSelectEvent}){
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'upcoming': return '#10b981';
            case 'in-progress': return '#f59e0b';
            case 'completed': return '#6b7280';
            default: return '#6366f1';
        }
    };

    return(
        <section className="event-card">
            <section className="event-header">
                <h3>{event.name}</h3>
                <section 
                    className="event-status" 
                    style={{backgroundColor: getStatusColor(event.status)}}
                >
                    {event.status}
                </section>
            </section>
            <section className="event-details">
                <p className="event-date"> {formatDate(event.date)}</p>
                <p className="event-location"> {event.location}</p>
                <p className="event-attendees"> {event.expectedGuestCount} attendees</p>
                <p className="event-budget"> R{event.budget.toLocaleString()}</p>
            </section>
            <section className="event-description">
                <p>{event.description}</p>
            </section>
            <section className="event-buttons">
                <button 
                    className="select-btn"
                    onClick={() => onSelectEvent(event)}
                >
                    Select Event
                </button>
                <button className="quick-view-btn">Quick View</button>
            </section>
        </section>
    );
}
  const fetchPlannerEvents = async (user) => {
    if (!user) {
      console.warn("User not logged in");
      return [];
    }
    const token = await user.getIdToken(true);
    const res = await fetch(`https://us-central1-planit-sdp.cloudfunctions.net/api/planner/me/events`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.events || [];
  };

  

  // Listen for auth state changes and set user
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Fetch events only when authUser is loaded and not null
  useEffect(() => {
    if (authUser === undefined) return; // still loading
    if (!authUser) {
      setEvents([]);
      return;
    }
    async function loadEvents() {
      const events = await fetchPlannerEvents(authUser);
      setEvents(events);
    }
    loadEvents();
  }, [authUser]);
  
      function toDate(d) {
        return d instanceof Date ? d : new Date(d);
      }


      const Upcoming = events
      .filter(event => {
        const eventDate = toDate(event.date);
        return isAfter(eventDate, today) && isBefore(eventDate, future);
      })
      .sort((a, b) => toDate(a.date) - toDate(b.date));

      const pastEvents = events
      .filter(event => {
        const eventDate = toDate(event.date);
        return isBefore(eventDate, today);
      })
      .sort((a, b) => toDate(b.date) - toDate(a.date));

      const allUpcoming = events
      .filter(event => {
        const eventDate = toDate(event.date);
        return isAfter(eventDate, today);
      })
      .sort((a, b) => toDate(a.date) - toDate(b.date));

      const pastAve = pastEvents.length > 0 ? Math.round(pastEvents.reduce((sum, event) => sum + (event.expectedGuestCount || 0), 0) / pastEvents.length) : 0;
      const aveGuestCount = events.length > 0 ? Math.round(events.reduce((sum, event) => sum + (event.expectedGuestCount || 0), 0) / events.length) : 0;
      const percentageChange = aveGuestCount === 0 ? 0 : Math.round(((aveGuestCount - pastAve) / pastAve) * 100);

  const pendingVendors = [
    { id: 1, name: "ABC Catering", event: "Annual Tech Conference", contact: "abc@catering.com", status: "Confirmed" },
    { id: 2, name: "SoundWorks", event: "Marketing Workshop", contact: "contact@soundworks.co.za", status: "Pending" },
    { id: 3, name: "VenueCo", event: "Community Meetup", contact: "info@venueco.com", status: "Confirmed" }
  ];

  const totalUpcomingGuests = Upcoming.reduce((sum, event) => sum + (event.expectedGuestCount || 0), 0);

  const totalPastGuests = pastEvents.reduce((sum, event) => sum + (event.expectedGuestCount || 0), 0);

  const guestDiff = totalUpcomingGuests - totalPastGuests;
  const percentageNewGuests = totalPastGuests === 0 ? 0 : Math.round((guestDiff / totalPastGuests) * 100);

  return (
    <section className='page-container'>

      {/* Header Section */}
      <section className="dashboard-intro">
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

      {/* Summary Cards */}
      <section className="summary-cards-section">
        {/* Upcoming Events */}
        <section className="summary-card blue">
          <section className="summary-card-header">
            <Calendar size={40} />
            <section className="summary-change positive">+{allUpcoming.length === Upcoming.length ? 0 : allUpcoming.length - Upcoming.length}</section>
          </section>
          <section className="summary-card-body">
            <h3 className="summary-label">Upcoming Events</h3>
            <p className="summary-value"> {Upcoming.length}</p>
            <p className="summary-subtext">Next 30 days</p>
          </section>
        </section>

        {/* Average Attendance */}
        <section className="summary-card green">
          <section className="summary-card-header">
            <Users size={40} />
            <section className="summary-change positive">+{percentageChange}%</section>
          </section>
          <section className="summary-card-body">
            <h3 className="summary-label">Avg Attendance</h3>
            <p className="summary-value">{aveGuestCount}</p>
            <p className="summary-subtext">Per Event</p>
          </section>
        </section>

        {/* New Guests */}
        <section className="summary-card purple">
          <section className="summary-card-header">
            <Users size={40} />
            <section className="summary-change positive">+{percentageNewGuests}%</section>
          </section>
          <section className="summary-card-body">
            <h3 className="summary-label">New Guests</h3>
            <p className="summary-value">{guestDiff}</p>
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
            <section className="events-grid">
                {Upcoming.length > 0 ? (
                    Upcoming.map((event) => (
                        <EventCard 
                            key={event.id} 
                            event={event} 
                            onSelectEvent={onSelectEvent}
                        />
                    ))
                ) : (
                    <section className="no-events">
                        <p>You have no upcoming events</p>
                    </section>
                )}
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
export default PlannerDashboard;
