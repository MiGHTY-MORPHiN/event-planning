import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../planner/PlannerViewEvent.css";
import { getAuth } from "firebase/auth";

// RSVP summary bar (read-only)
function GuestRSVPSummary({ guests }) {
	const totalGuests = guests.length;
	const confirmedGuests = guests.filter(g => g.rsvpStatus === 'accept').length;
	const pendingGuests = guests.filter(g => g.rsvpStatus === 'pending').length;
	const declinedGuests = guests.filter(g => g.rsvpStatus === 'declined').length;

	return (
		<section className="rsvp-summary">
			<h4>RSVP Status</h4>
			<section className="rsvp-stats">
				<section className="rsvp-stat confirmed">
					<span className="rsvp-number">{confirmedGuests}</span>
					<span className="rsvp-label">Confirmed</span>
				</section>
				<section className="rsvp-stat pending">
					<span className="rsvp-number">{pendingGuests}</span>
					<span className="rsvp-label">Pending</span>
				</section>
				<section className="rsvp-stat declined">
					<span className="rsvp-number">{declinedGuests}</span>
					<span className="rsvp-label">Declined</span>
				</section>
			</section>
			<section className="rsvp-progress">
				<section
					className="rsvp-progress-bar"
					style={{ width: `${totalGuests > 0 ? (confirmedGuests / totalGuests) * 100 : 0}%` }}
				></section>
			</section>
			<p className="rsvp-percentage">
				{totalGuests > 0 ? Math.round((confirmedGuests / totalGuests) * 100) : 0}% confirmed
			</p>
		</section>
	);
}

// Vendor item (read-only)
function VendorItem({ vendor }) {
	return (
		<section className="vendor-item">
			<section className="vendor-info">
				<h4>{vendor.businessName}</h4>
				<p>{vendor.category}</p>
			</section>
			<section className="vendor-cost">
				<h4>Current total cost: </h4>
				<p>{vendor.cost}</p>
			</section>
		</section>
	);
}

// Task item (read-only)
function TaskItem({ taskName, taskStatus }) {
	const isCompleted = taskStatus === true;
	return (
		<section className="task-item">
			<section className="task-checkbox">
				<input type="checkbox" checked={isCompleted} readOnly />
			</section>
			<section className="task-content">
				<h4 className={isCompleted ? "completed" : ""}>{taskName}</h4>
			</section>
		</section>
	);
}

export default function AdminViewEvent({ event, setActivePage }) {
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState("details");
	const [guests, setGuests] = useState([]);
	const [vendors, setVendors] = useState([]);
	const [services, setServices] = useState([]);

	const eventId = event?.id;

	// Fetch guests
	useEffect(() => {
		async function fetchGuests() {
			if (!eventId) return;
			const auth = getAuth();
			const user = auth.currentUser;
			if (!user) return;
			const token = await user.getIdToken(true);
			const res = await fetch(`https://us-central1-planit-sdp.cloudfunctions.net/api/planner/${eventId}/guests`, {
				headers: {
					"Authorization": `Bearer ${token}`,
					"Content-Type": "application/json"
				}
			});
			if (!res.ok) return;
			const data = await res.json();
			setGuests(data.guests || []);
		}
		fetchGuests();
	}, [eventId]);

	// Fetch vendors
	useEffect(() => {
		async function fetchVendors() {
			if (!eventId) return;
			const auth = getAuth();
			const user = auth.currentUser;
			if (!user) return;
			const token = await user.getIdToken(true);
			const res = await fetch(`https://us-central1-planit-sdp.cloudfunctions.net/api/planner/${eventId}/vendors`, {
				headers: {
					"Authorization": `Bearer ${token}`,
					"Content-Type": "application/json"
				}
			});
			if (!res.ok) return;
			const data = await res.json();
			setVendors(data.vendors || []);
		}
		fetchVendors();
	}, [eventId]);

	// Fetch services
	useEffect(() => {
		async function fetchServices() {
			if (!eventId) return;
			const auth = getAuth();
			const user = auth.currentUser;
			if (!user) return;
			const token = await user.getIdToken(true);
			const res = await fetch(`https://us-central1-planit-sdp.cloudfunctions.net/api/planner/${eventId}/services`, {
				headers: {
					"Authorization": `Bearer ${token}`
				}
			});
			if (!res.ok) return;
			const data = await res.json();
			setServices(data.services || []);
		}
		fetchServices();
	}, [eventId]);

	if (!event) return <p>Loading event...</p>;

	function formatDate(date) {
		if (!date) return "";
		if (typeof date === 'object' && typeof date._seconds === 'number' && typeof date._nanoseconds === 'number') {
			const jsDate = new Date(date._seconds * 1000 + date._nanoseconds / 1e6);
			return jsDate.toLocaleString();
		}
		if (date instanceof Date) {
			return date.toLocaleString();
		}
		if (typeof date === "string") {
			return new Date(date).toLocaleString();
		}
		return String(date);
	}

	return (
		<section className="event-view-edit">
			<section className="event-header">
				<button onClick={() => setActivePage ? setActivePage("event-management") : navigate(-1)} className="back-btn">
					← Back
				</button>
				<h2>{event.name || event.title}</h2>
			</section>

			<section className="event-tabs">
				<button onClick={() => setActiveTab("details")} className={`tab-btn ${activeTab === "details" ? "active" : ""}`}>Details</button>
				<button onClick={() => setActiveTab("guests")} className={`tab-btn ${activeTab === "guests" ? "active" : ""}`}>Guests</button>
				<button onClick={() => setActiveTab("vendors")} className={`tab-btn ${activeTab === "vendors" ? "active" : ""}`}>Vendors</button>
				<button onClick={() => setActiveTab("tasks")} className={`tab-btn ${activeTab === "tasks" ? "active" : ""}`}>Tasks</button>
			</section>

			<section className="event-content">
				{activeTab === "details" && (
					<section className="event-details">
						<p><b>Date:</b> {formatDate(event.date)}</p>
						<p><b>Location:</b> {event.location}</p>
						<p><b>Description:</b> {event.description}</p>
						<p><b>Expected Guests:</b> {event.expectedGuestCount}</p>
						<p><b>Budget:</b> {event.budget ? `R${event.budget}` : "N/A"}</p>
						<p><b>Status:</b> {event.status}</p>
					</section>
				)}

				{activeTab === "guests" && (
					<section className="guests-list">
						<GuestRSVPSummary guests={guests} />
						{guests.length > 0 ? guests.map((guest) => (
							<section key={guest.id} className="guest-item">
								<h4>{guest.firstname} {guest.lastname}</h4>
								<p>{guest.email}</p>
								<p>Plus Ones: {guest.plusOne}</p>
								<span className={`rsvp-badge ${guest.rsvpStatus}`}>
									{guest.rsvpStatus}
								</span>
							</section>
						)) : <p>No guests yet.</p>}
					</section>
				)}

				{activeTab === "vendors" && (
					<section className="vendors-list">
						{vendors.length > 0 ? vendors.map((vendor) => (
							<VendorItem key={vendor.id} vendor={vendor} />
						)) : <p>No vendors yet.</p>}
						{services.length > 0 && (
							<section className="services-list">
								<h4>Services</h4>
								{services.map((service) => (
									<section key={service.id} className="service-item">
										<p>{service.serviceName} - {service.vendorName} (R{service.estimatedCost})</p>
									</section>
								))}
							</section>
						)}
					</section>
				)}

				{activeTab === "tasks" && (
					<section className="tasks-list">
						{event.tasks && Object.keys(event.tasks).length > 0 ? (
							Object.entries(event.tasks).map(([taskName, completed], i) => (
								<TaskItem
									key={`${taskName}-${i}`}
									taskName={taskName}
									taskStatus={completed}
								/>
							))
						) : <p>No tasks yet.</p>}
					</section>
				)}
			</section>
		</section>
	);
}
