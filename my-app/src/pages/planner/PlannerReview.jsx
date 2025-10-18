import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import "./PlannerReview.css";
import PlannerReviewVendor from "./PlannerReviewVendor.jsx";
import BASE_URL from "../../apiConfig";

export default function PlannerReviewsPage() {
	const [loading, setLoading] = useState(true);
	const [events, setEvents] = useState([]);
	const [vendorsByEvent, setVendorsByEvent] = useState({});
	const [selectedVendor, setSelectedVendor] = useState(null);
	const [showReviewModal, setShowReviewModal] = useState(false);
	const [filter, setFilter] = useState("all"); // all, past, upcoming

	useEffect(() => {
		fetchEventsAndVendors();
	}, []);

	const fetchEventsAndVendors = async () => {
		setLoading(true);
		try {
			const auth = getAuth();
			const token = await auth.currentUser.getIdToken();

			// Fetch all planner's events
			const eventsResponse = await fetch(
				`${BASE_URL}/planner/me/events`,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			if (!eventsResponse.ok) {
				throw new Error("Failed to fetch events");
			}

			const eventsData = await eventsResponse.json();
			const formattedEvents = (eventsData.events || []).map((event) => {
				const eventDate = event.date?._seconds
					? new Date(event.date._seconds * 1000)
					: event.date
					? new Date(event.date)
					: null;

				return {
					...event,
					date: eventDate,
					isPast: eventDate ? eventDate < new Date() : false,
				};
			});

			setEvents(formattedEvents);

			// Fetch vendors and services for each event
			const vendorsMap = {};
			for (const event of formattedEvents) {
				try {
					// Get services for this event
					const servicesResponse = await fetch(
						`${BASE_URL}/planner/${event.id}/services`,
						{
							headers: { Authorization: `Bearer ${token}` },
						}
					);

					if (servicesResponse.ok) {
						const servicesData = await servicesResponse.json();
						const services = servicesData.services || [];

						// Group services by vendor
						const vendorServicesMap = {};
						services.forEach((service) => {
							if (!vendorServicesMap[service.vendorId]) {
								vendorServicesMap[service.vendorId] = {
									vendorId: service.vendorId,
									vendorName: service.vendorName,
									services: [],
								};
							}
							vendorServicesMap[service.vendorId].services.push(
								service
							);
						});

						vendorsMap[event.id] = Object.values(vendorServicesMap);
					}
				} catch (err) {
					console.error(
						`Error fetching vendors for event ${event.id}:`,
						err
					);
					vendorsMap[event.id] = [];
				}
			}

			setVendorsByEvent(vendorsMap);
		} catch (err) {
			console.error("Error fetching events and vendors:", err);
			alert("Failed to load events and vendors");
		} finally {
			setLoading(false);
		}
	};

	const handleReviewVendor = (vendor, event) => {
		setSelectedVendor({
			...vendor,
			eventId: event.id,
			eventName: event.name,
			eventDate: event.date,
		});
		setShowReviewModal(true);
	};

	const handleReviewSubmitted = () => {
		setShowReviewModal(false);
		setSelectedVendor(null);
		alert("Thank you for your review!");
	};

	const filteredEvents = events.filter((event) => {
		if (filter === "past") return event.isPast;
		if (filter === "upcoming") return !event.isPast;
		return true;
	});

	const formatDate = (date) => {
		if (!date) return "Date not set";
		return date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	if (loading) {
		return (
			<section className="reviews-page-loading">
				<section className="spinner"></section>
				<p>Loading your events and vendors...</p>
			</section>
		);
	}

	return (
		<section className="planner-reviews-page">
			<header className="reviews-page-header">
				<h1>Review Vendors</h1>
				<p>Share your experience with vendors from your events</p>
			</header>

			<section className="reviews-filter">
				<button
					className={`filter-btn ${filter === "all" ? "active" : ""}`}
					onClick={() => setFilter("all")}
				>
					All Events
				</button>
				<button
					className={`filter-btn ${
						filter === "past" ? "active" : ""
					}`}
					onClick={() => setFilter("past")}
				>
					Past Events
				</button>
				<button
					className={`filter-btn ${
						filter === "upcoming" ? "active" : ""
					}`}
					onClick={() => setFilter("upcoming")}
				>
					Upcoming Events
				</button>
			</section>

			<section className="events-list">
				{filteredEvents.length === 0 ? (
					<section className="no-events">
						<svg
							width="64"
							height="64"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
						>
							<rect
								x="3"
								y="4"
								width="18"
								height="18"
								rx="2"
								ry="2"
							/>
							<line x1="16" y1="2" x2="16" y2="6" />
							<line x1="8" y1="2" x2="8" y2="6" />
							<line x1="3" y1="10" x2="21" y2="10" />
						</svg>
						<h3>No events found</h3>
						<p>
							{filter === "past"
								? "You don't have any past events yet"
								: filter === "upcoming"
								? "You don't have any upcoming events"
								: "You haven't created any events yet"}
						</p>
					</section>
				) : (
					filteredEvents.map((event) => {
						const eventVendors = vendorsByEvent[event.id] || [];

						return (
							<section key={event.id} className="event-card">
								<section className="event-card-header">
									<section className="event-info">
										<h2>{event.name}</h2>
										<p className="event-date">
											<svg
												width="16"
												height="16"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="2"
											>
												<rect
													x="3"
													y="4"
													width="18"
													height="18"
													rx="2"
													ry="2"
												/>
												<line
													x1="16"
													y1="2"
													x2="16"
													y2="6"
												/>
												<line
													x1="8"
													y1="2"
													x2="8"
													y2="6"
												/>
												<line
													x1="3"
													y1="10"
													x2="21"
													y2="10"
												/>
											</svg>
											{formatDate(event.date)}
										</p>
										<p className="event-location">
											<svg
												width="16"
												height="16"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="2"
											>
												<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
												<circle cx="12" cy="10" r="3" />
											</svg>
											{event.location ||
												"Location not set"}
										</p>
									</section>
									<span
										className={`event-status ${
											event.isPast ? "past" : "upcoming"
										}`}
									>
										{event.isPast
											? "Past Event"
											: "Upcoming Event"}
									</span>
								</section>

								<section className="vendors-section">
									{eventVendors.length === 0 ? (
										<p className="no-vendors">
											No vendors for this event
										</p>
									) : (
										<section className="vendors-grid">
											{eventVendors.map((vendor) => (
												<section
													key={vendor.vendorId}
													className="vendor-card"
												>
													<section className="vendor-card-header">
														<h4>
															{vendor.vendorName}
														</h4>
														<span className="services-count">
															{
																vendor.services
																	.length
															}{" "}
															service
															{vendor.services
																.length !== 1
																? "s"
																: ""}
														</span>
													</section>

													<section className="vendor-services-list">
														{vendor.services.map(
															(service) => (
																<section
																	key={
																		service.id
																	}
																	className="service-item-small"
																>
																	<span className="service-name">
																		{
																			service.serviceName
																		}
																	</span>
																	<span
																		className={`service-status ${service.status}`}
																	>
																		{
																			service.status
																		}
																	</span>
																</section>
															)
														)}
													</section>

													<button
														className="review-vendor-btn"
														onClick={() =>
															handleReviewVendor(
																vendor,
																event
															)
														}
													>
														<svg
															width="16"
															height="16"
															viewBox="0 0 24 24"
															fill="none"
															stroke="currentColor"
															strokeWidth="2"
														>
															<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
														</svg>
														Write Review
													</button>
												</section>
											))}
										</section>
									)}
								</section>
							</section>
						);
					})
				)}
			</section>

			{showReviewModal && selectedVendor && (
				<PlannerReviewVendor
					vendorId={selectedVendor.vendorId}
					vendorName={selectedVendor.vendorName}
					eventId={selectedVendor.eventId}
					serviceName={
						selectedVendor.services[0]?.serviceName ||
						"Multiple Services"
					}
					onClose={() => {
						setShowReviewModal(false);
						setSelectedVendor(null);
					}}
					onReviewSubmitted={handleReviewSubmitted}
				/>
			)}
		</section>
	);
}
