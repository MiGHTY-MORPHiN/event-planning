import React, { useState, useEffect } from "react";
import {
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  DollarSign,
  Users,
  MessageCircle,
  Eye,
  Upload,
  AlertCircle,
} from "lucide-react";
import { auth } from "../../firebase";
import { getAuth } from "firebase/auth";
import "./vendorBooking.css";
import ChatComponent from "../planner/ChatComponent.jsx";

// ---------- Format Date ----------
function formatDate(date) {
  if (!date) return "";

  if (
    typeof date === "object" &&
    typeof date._seconds === "number" &&
    typeof date._nanoseconds === "number"
  ) {
    const jsDate = new Date(date._seconds * 1000 + date._nanoseconds / 1e6);
    return jsDate.toLocaleString();
  }

  if (date instanceof Date) return date.toLocaleString();
  if (typeof date === "string") return new Date(date).toLocaleString();

  return String(date);
}

// ---------- Format Budget ----------
const formatBudget = (budget) => {
  if (budget === undefined || budget === null || budget === 0) return "Not confirmed";
  const amount = Number(budget);
  if (isNaN(amount)) return "Not confirmed";
  return `R ${amount.toLocaleString("en-ZA")}`;
};

const VendorBooking = ({ setActivePage }) => {
  const [filter, setFilter] = useState("all");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUpdating, setIsUpdating] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatEventId, setChatEventId] = useState(null);
  const [chatPlannerId, setChatPlannerId] = useState(null);
  const [chatEventName, setChatEventName] = useState(null);
  const [chatVendorName, setChatVendorName] = useState(null);

  let vendorId = auth.currentUser?.uid;

  //-------- Fetch Bookings--------
  useEffect(() => {
   const fetchBookings = async () => {
  const auth = getAuth();
  let user = auth.currentUser;
  while (!user) {
    await new Promise((res) => setTimeout(res, 50));
    user = auth.currentUser;
  }
  vendorId = user.uid;

  if (!user) {
    setError("User not authenticated");
    setLoading(false);
    return;
  }

      try {
              const token = await user.getIdToken();
        const res = await fetch(
          "https://us-central1-planit-sdp.cloudfunctions.net/api/vendor/bookings/services",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) {
          const contentType = res.headers.get("content-type");
          const errorText = contentType?.includes("application/json")
            ? (await res.json()).message
            : await res.text();
          throw new Error(`Failed to fetch bookings: ${errorText}`);
        }
        const data = await res.json();
        const formattedBookings = (data.bookings || []).map((booking) => ({
          ...booking,
          overallStatus: getOverallBookingStatus(booking.vendorServices),
          contractUploaded: false, // placeholder
        }));

    setBookings(formattedBookings);
  } catch (err) {
    console.error(err);
    setError(err.message);
  } finally {
    setLoading(false);
  }
};


    fetchBookings();
  }, []);
  const getOverallBookingStatus = (vendorServices) => {
		if (!vendorServices || vendorServices.length === 0) return "pending";
		const statuses = vendorServices.map((s) => s.status || "pending");
		if (statuses.every((s) => s === "accepted")) return "accepted";
		if (statuses.some((s) => s === "rejected")) return "rejected";
		return "pending";
	};

  // ---------- Update Vendor Status ----------
  const updateVendorStatus = async (eventId, vendorId, newStatus) => {
    if (!auth.currentUser) {
      alert("User not authenticated");
      return;
    }

    if (isUpdating) {
      alert("Another update is in progress");
      return;
    }

    setIsUpdating(`${eventId}-${vendorId}`);

    try {
      const auth = getAuth();
            let user = auth.currentUser;
            while (!user) {
                await new Promise((res) => setTimeout(res, 50)); // wait 50ms
              user = auth.currentUser;
            }
            const token = await user.getIdToken();

      const res = await fetch(
        `https://us-central1-planit-sdp.cloudfunctions.net/api/event/${eventId}/vendor/${vendorId}/status`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const contentType = res.headers.get("content-type");
      const data = contentType?.includes("application/json")
        ? await res.json()
        : { message: await res.text() };

      if (!res.ok) throw new Error(data.message || `Failed (HTTP ${res.status})`);

      // Update state and persist to localStorage
      setBookings((prev) => {
        const updated = prev.map((booking) =>
          booking.eventId === eventId
            ? {
                ...booking,
                vendorServices: booking.vendorServices.map((service) => ({
                  ...service,
                  status: newStatus,
                })),
                overallStatus: getOverallBookingStatus(
                  booking.vendorServices.map((service) => ({ ...service, status: newStatus }))
                ),
              }
            : booking
        );

        const persisted = loadPersistedStatuses();
        persisted[eventId] = newStatus;
        savePersistedStatuses(persisted);

        return updated;
      });
    } catch (err) {
      console.error(err);
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setIsUpdating(null);
    }
  };

  // ---------- Event & Chat Handlers ----------
  const handleViewEvent = (booking) => {
    setSelectedEvent(booking);
    setShowEventModal(true);
  };

  const handleOpenChat = (booking) => {
    setChatEventId(booking.eventId);
    setChatPlannerId(booking.eventPlanner);
    setChatEventName(booking.eventName);
    setChatVendorName(booking.vendorServices[0]?.vendorName);
    setShowChat(true);
  };

  const onCloseChat = () => {
    setChatEventId(null);
    setChatPlannerId(null);
    setChatEventName(null);
    setChatVendorName(null);
    setShowChat(false);
  };

  const handleUploadContract = (eventId) => {
    setActivePage("contracts");
  };

  const handleAcceptBooking = async (booking) => {
    if (!booking.contractUploaded) {
      if (window.confirm("You need to upload a contract before accepting this booking. Go to contracts page?")) {
        handleUploadContract(booking.eventId);
      }
      return;
    }

    await updateVendorStatus(booking.eventId, vendorId, "accepted");
  };

  // ---------- Filtering ----------
  const filteredBookings =
    filter === "all"
      ? bookings
      : bookings.filter((b) => b.overallStatus === filter);

  if (loading)
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading your bookings...</p>
      </div>
    );

  if (error) return <p className="error">{error}</p>;
  if (!bookings.length) return <p className="no-bookings">No bookings found.</p>;

  return (
    <section className="booking-page">
      {showChat && (
        <ChatComponent
          eventId={chatEventId}
          plannerId={chatPlannerId}
          vendorId={vendorId}
          currentUser={{ id: vendorId, name: chatVendorName, type: "vendor" }}
          otherUser={{ id: chatPlannerId, name: chatEventName, type: "planner" }}
          closeChat={onCloseChat}
        />
      )}

      <header>
        <h1>Booking Management</h1>
        <p>View, manage, and update your event bookings in one place.</p>
      </header>

      <div className="filters">
        <Filter size={20} />
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Bookings</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="booking-list">
        {filteredBookings.map((booking) => (
          <div key={booking.eventId} className={`booking-card ${booking.overallStatus}`}>
            <div className="booking-header">
              <h2>{booking.eventName || "Unnamed Event"}</h2>
              <span className={`status-badge status-${booking.overallStatus}`}>
                {booking.overallStatus.charAt(0).toUpperCase() + booking.overallStatus.slice(1)}
              </span>
            </div>

            <div className="booking-details">
              <div className="detail-row">
                <Calendar size={16} />
                <span>{formatDate(booking.date)}</span>
              </div>
              <div className="detail-row">
                <Clock size={16} />
                <span>{formatDate(booking.date)}</span>
              </div>
              <div className="detail-row">
                <MapPin size={16} />
                <span>{booking.location || "TBD"}</span>
              </div>
              <div className="detail-row">
                <Users size={16} />
                <span>{booking.expectedGuestCount || "N/A"} guests</span>
              </div>
              <div className="detail-row">
                <DollarSign size={16} />
                <span>Budget: {formatBudget(booking.budget)}</span>
              </div>
            </div>

            <div className="services-section">
              <h4>Your Services:</h4>
              <div className="services-list">
                {booking.vendorServices.map((service) => (
                  <div key={service.serviceId} className="service-item">
                    <span className="service-name">{service.serviceName}</span>
                    <span className={`service-status status-${service.status || "pending"}`}>
                      {(service.status || "pending").charAt(0).toUpperCase() +
                        (service.status || "pending").slice(1)}
                    </span>
                    {service.lastUpdated && (
                      <span className="service-updated">Last updated: {formatDate(service.lastUpdated)}</span>
                    )}
                    <div className="service-actions">
                      <button
                        className="approve-btn small"
                        onClick={() => updateVendorStatus(booking.eventId, vendorId, "accepted")}
                        disabled={service.status === "accepted" || isUpdating === `${booking.eventId}-${vendorId}`}
                        title="Accept this service"
                      >
                        {isUpdating === `${booking.eventId}-${vendorId}` ? "..." : <CheckCircle size={14} />}
                      </button>
                      <button
                        className="reject-btn small"
                        onClick={() => updateVendorStatus(booking.eventId, vendorId, "rejected")}
                        disabled={service.status === "rejected" || isUpdating === `${booking.eventId}-${vendorId}`}
                        title="Reject this service"
                      >
                        {isUpdating === `${booking.eventId}-${vendorId}` ? "..." : <XCircle size={14} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="booking-actions">
              <button className="view-details-btn" onClick={() => handleViewEvent(booking)}>
                <Eye size={16} /> View Details
              </button>

              <button className="chat-btn" onClick={() => handleOpenChat(booking)}>
                <MessageCircle size={16} /> Chat
              </button>

              <button className="upload-contract-btn" onClick={() => handleUploadContract(booking.eventId)}>
                <Upload size={16} /> {booking.contractUploaded ? "View Contract" : "Upload Contract"}
              </button>

              <button
                className={`accept-booking-btn ${!booking.contractUploaded ? "disabled" : ""}`}
                onClick={() => handleAcceptBooking(booking)}
                disabled={!booking.contractUploaded || booking.overallStatus === "accepted"}
              >
                {!booking.contractUploaded ? (
                  <>
                    <AlertCircle size={16} /> Contract Required
                  </>
                ) : booking.overallStatus === "accepted" ? (
                  <>
                    <CheckCircle size={16} /> Accepted
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} /> Accept Booking
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default VendorBooking;
