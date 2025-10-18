import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { isAfter, isBefore } from "date-fns";
import "./PlannerAllEvents.css";

function toJSDate(date) {
  if (!date) return null;
  if (typeof date === "object" && typeof date._seconds === "number" && typeof date._nanoseconds === "number") {
    return new Date(date._seconds * 1000 + date._nanoseconds / 1e6);
  }
  if (date instanceof Date) return date;
  if (typeof date === "string") return new Date(date);
  return null;
}

function formatDate(date) {
  const jsDate = toJSDate(date);
  return jsDate ? jsDate.toLocaleString() : "";
}

function EventCard({ event, onSelectEvent }) {
  const getStatusColor = (status) => {
    switch (status) {
      case "upcoming":
        return "#10b981";
      case "in-progress":
        return "#f59e0b";
      case "completed":
        return "#6b7280";
      default:
        return "#6366f1";
    }
  };

  return (
    <section className="event-card">
      <section className="event-header">
        <h3>{event.name}</h3>
        <section
          className="event-status"
          style={{ backgroundColor: getStatusColor(event.status) }}
        >
          {event.status}
        </section>
      </section>
      <section className="event-details">
        <p className="event-date">{formatDate(event.date)}</p>
        <p className="event-location">{event.location}</p>
        <p className="event-attendees">{(event.guestList?.length ?? 0)} attendees</p>
        <p className="event-budget">R{(event.budget ?? 0).toLocaleString()}</p>
      </section>
      <section className="event-description">
        <p>{event.description}</p>
      </section>
      <section className="event-buttons">
        <button
          data-testid="select-event-button"
          className="select-btn"
          onClick={() => onSelectEvent(event)}
        >
          Select Event
        </button>
      </section>
    </section>
  );
}

export default function PlannerAllEvents({ setActivePage, onSelectEvent }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("date");
  const [events, setEvents] = useState([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [guests, setGuests] = useState({});
  const navigate = useNavigate();
  const auth = getAuth();

  const fetchPlannerEvents = async () => {
    let user = auth.currentUser;
    let retries = 0;
    while (!user && retries < 50) {
      await new Promise((res) => setTimeout(res, 50));
      user = auth.currentUser;
      retries++;
    }
    if (!user) {
      console.warn("User not logged in");
      return [];
    }
    const token = await user.getIdToken(true);
    const res = await fetch(
      "https://us-central1-planit-sdp.cloudfunctions.net/api/planner/me/events",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.events || [];
  };

  const fetchGuests = async (eventId) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");
      const token = await user.getIdToken(true);
      const res = await fetch(
        `https://us-central1-planit-sdp.cloudfunctions.net/api/planner/${eventId}/guests`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch guests");
      const data = await res.json();
      return data.guests || [];
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  useEffect(() => {
    async function loadEvents() {
      const loadedEvents = await fetchPlannerEvents();
      setEvents(loadedEvents);
      setEventsLoaded(true);
    }
    loadEvents();
  }, []);

  useEffect(() => {
    if (!eventsLoaded || events.length === 0) return;

    const loadAllGuests = async () => {
      const guestsByEvent = {};
      await Promise.all(
        events.map(async (event) => {
          if (!event.id) return;
          const eventGuests = await fetchGuests(event.id);
          guestsByEvent[event.id] = eventGuests;
        })
      );
      setGuests(guestsByEvent);
      setEvents((prev) =>
        prev.map((e) => ({
          ...e,
          guestList: guestsByEvent[e.id] || [],
        }))
      );
    };
    loadAllGuests();
  }, [eventsLoaded]);

  const filteredEvents = events
    .filter(
      (event) =>
        (event.name.toLowerCase().includes(search.toLowerCase()) ||
          event.location.toLowerCase().includes(search.toLowerCase())) &&
        (statusFilter === "All" || event.status === statusFilter)
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "date":
          return toJSDate(a.date) - toJSDate(b.date);
        case "name":
          return a.name.localeCompare(b.name);
        case "budget":
          return (b.budget ?? 0) - (a.budget ?? 0);
        case "attendees":
          return (b.guestList?.length ?? 0) - (a.guestList?.length ?? 0);
        default:
          return 0;
      }
    });

  return (
    <section data-testid="planner-all-events" className="events-list">
      <section className="events-header">
        <h2>My Events</h2>
        <p className="events-subtitle">Manage and track all your events</p>
        <button
          className="create-event-btn"
          onClick={() => navigate("/planner/new-event")}
        >
          + New Event
        </button>
      </section>

      <section className="events-controls">
        <section className="search-sort">
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-bar"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="date">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="budget">Sort by Budget</option>
            <option value="attendees">Sort by Attendees</option>
          </select>
        </section>

        <section className="status-filters">
          {["All", "upcoming", "in-progress", "completed"].map((status) => (
            <button
              key={status}
              className={`status-filter-btn ${statusFilter === status ? "active" : ""}`}
              onClick={() => setStatusFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </section>
      </section>

      <section className="events-grid">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onSelectEvent={onSelectEvent}
            />
          ))
        ) : (
          <section className="no-events">
            <p>No events found matching your criteria</p>
          </section>
        )}
      </section>
    </section>
  );
}
