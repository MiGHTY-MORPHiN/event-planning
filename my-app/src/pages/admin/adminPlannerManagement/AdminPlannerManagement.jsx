import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../../firebase";
import {
	Search,
	Calendar,
	MapPin,
	Users,
	DollarSign,
	Clock,
	Tag,
	Briefcase,
} from "lucide-react";
import Popup from "../../general/popup/Popup.jsx";
import "./AdminPlannerManagement.css";
import BASE_URL from "../../../apiConfig.js";
import LoadingSpinner from "../../general/loadingspinner/LoadingSpinner.jsx";

export default function PlannerManagement() {
	const navigate = useNavigate();
	const [planners, setPlanners] = useState([]);
	const [filteredPlanners, setFilteredPlanners] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);

	// State for filtering and modal
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [isPopupOpen, setIsPopupOpen] = useState(false);
	const [selectedPlanner, setSelectedPlanner] = useState(null);
	const [plannerEvents, setPlannerEvents] = useState([]);

	const getToken = () =>
		auth.currentUser
			? auth.currentUser.getIdToken()
			: Promise.reject("Not logged in");

	// Fetch all planners on component mount
	useEffect(() => {
		const fetchPlanners = async () => {
			let user = auth.currentUser;
			while (!user) {
				await new Promise((res) => setTimeout(res, 50));
				user = auth.currentUser;
			}
			try {
				const token = await getToken();
				// This endpoint will now return the event counts
				const apiUrl = `${BASE_URL}/admin/planners`;
				const response = await fetch(apiUrl, {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (!response.ok) throw new Error("Failed to fetch planners.");
				const data = await response.json();
				setPlanners(data);
				setFilteredPlanners(data);
			} catch (err) {
				setError(err.message);
			} finally {
				setIsLoading(false);
			}
		};
		fetchPlanners();
	}, []);

	// Apply filters whenever planners, searchTerm, or statusFilter changes
	useEffect(() => {
		let result = planners;
		if (searchTerm) {
			result = result.filter(
				(p) =>
					p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
					p.email?.toLowerCase().includes(searchTerm.toLowerCase())
			);
		}
		if (statusFilter !== "all") {
			result = result.filter((p) => p.status === statusFilter);
		}
		setFilteredPlanners(result);
	}, [searchTerm, statusFilter, planners]);

	// Fetch detailed events when a planner is selected
	const fetchPlannerEvents = async (plannerId) => {
		try {
			const token = await getToken();

			// Call the new secure admin endpoint for a specific planner's events
			const response = await fetch(
				`${BASE_URL}/admin/planner/${plannerId}/events`,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			if (response.ok) {
				const data = await response.json();
				setPlannerEvents(data.events || []); // Endpoint returns { events: [...] }
			} else {
				console.error(
					"Failed to fetch events:",
					response.status,
					response.statusText
				);
				setPlannerEvents([]);
			}
		} catch (err) {
			console.error("Error fetching planner events:", err);
			setPlannerEvents([]);
		}
	};

	const handleViewDetails = async (planner) => {
		setSelectedPlanner(planner);
		await fetchPlannerEvents(planner.id); // Use planner.id (which is the UID)
		setIsPopupOpen(true);
	};

	const formatDate = (dateString) => {
		if (!dateString) return "Not set";
		// Check if date is Firestore Timestamp
		if (dateString._seconds) {
			const date = new Date(dateString._seconds * 1000);
			return date.toLocaleDateString("en-US", {
				year: "numeric",
				month: "short",
				day: "numeric",
			});
		}
		// Check if it's a regular JS Date string
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	const formatCurrency = (amount) => {
		// This handles 0, but returns "Not set" for null/undefined
		if (amount === null || amount === undefined) return "Not set";
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
		}).format(amount);
	};

	if (isLoading)
		return (
			<main className="main-container">
				<LoadingSpinner text="Loading planners..." />
			</main>
		);
	if (error)
		return (
			<main className="main-container">
				<h3>Error: {error}</h3>
			</main>
		);

	return (
		<main className="admin-planner-management-page">
			<header className="admin-planner-management-page-header">
				<h1>Planner Management</h1>
				<p className="admin-planner-management-subtitle">
					Manage planners
				</p>
				<section className="admin-planner-management-filters-section">
					<div className="admin-planner-management-search-bar">
						<Search size={20} />
						<input
							type="text"
							placeholder="Search by planner name or email..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>
				</section>
			</header>

			<section className="admin-planner-management-grid">
				{filteredPlanners.length > 0 ? (
					filteredPlanners.map((planner) => (
						<article
							key={planner.id}
							className="admin-planner-management-summary-card"
						>
							<div className="admin-planner-management-card-info">
								<img
									src={
										planner.profilePicture ||
										"/default-avatar.png"
									}
									alt={planner.name}
									className="admin-planner-management-profile-pic"
									onError={(e) => {
										e.target.src = "/default-avatar.png";
									}}
								/>
								<h4>{planner.name || "Unnamed Planner"}</h4>
								<div className="admin-planner-management-stat">
									{/* Assumes backend provides activeEvents count */}
									<span>{planner.activeEvents || 0}</span>{" "}
									Active Events
								</div>
								<div className="admin-planner-management-stat">
									{/* Assumes backend provides eventHistoryCount */}
									<span>
										{planner.eventHistoryCount || 0}
									</span>{" "}
									Past Events
								</div>
							</div>
							<button
								className="admin-planner-management-btn-view-details"
								onClick={() => handleViewDetails(planner)}
							>
								View Details
							</button>
						</article>
					))
				) : (
					<p>No planners found.</p>
				)}
			</section>

			<Popup isOpen={isPopupOpen} onClose={() => setIsPopupOpen(false)}>
				{selectedPlanner && (
					<div className="admin-planner-management-modal-details">
						<header className="admin-planner-management-modal-header">
							<img
								src={
									selectedPlanner.profilePicture ||
									"/default-avatar.png"
								}
								alt={selectedPlanner.name}
								className="admin-planner-management-profile-pic"
								onError={(e) => {
									e.target.src = "/default-avatar.png";
								}}
							/>
							<h2 className="admin-planner-management-modal-name">
								{selectedPlanner.name || "Unnamed Planner"}
							</h2>
						</header>
						<section className="admin-planner-management-modal-body">
							<div className="admin-planner-management-contact-info">
								<p>
									<strong>Email:</strong>{" "}
									{selectedPlanner.email || "Not provided"}
								</p>
								<p>
									<strong>Phone:</strong>{" "}
									{selectedPlanner.phone || "Not provided"}
								</p>
								<p>
									<strong>Active Events:</strong>{" "}
									{selectedPlanner.activeEvents || 0}
								</p>
								<p>
									<strong>Total Events:</strong>{" "}
									{plannerEvents.length}
								</p>
							</div>

							<div className="admin-planner-management-events">
								<h4>All Events ({plannerEvents.length})</h4>
								{plannerEvents.length > 0 ? (
									<ul>
										{plannerEvents.map((event) => (
											<li key={event.id}>
												<div className="admin-planner-management-event-header">
													<strong>
														{event.name ||
															"Unnamed Event"}
													</strong>
													<span
														className={`admin-planner-management-event-status admin-planner-management-event-status-${
															event.status ||
															"planning"
														}`}
													>
														{event.status ||
															"planning"}
													</span>
												</div>

												<div className="admin-planner-management-event-details">
													<div className="admin-planner-management-event-detail">
														<Calendar size={16} />
														<span>
															{formatDate(
																event.date
															)}
														</span>
													</div>
													{event.duration && (
														<div className="admin-planner-management-event-detail">
															<Clock size={16} />
															<span>
																{event.duration}{" "}
																hours
															</span>
														</div>
													)}
													{event.location && (
														<div className="admin-planner-management-event-detail">
															<MapPin size={16} />
															<span>
																{event.location}
															</span>
														</div>
													)}

													{/* --- THIS IS THE FIX --- */}
													{event.expectedGuestCount !==
														null &&
														event.expectedGuestCount !==
															undefined && (
															<div className="admin-planner-management-event-detail">
																<Users
																	size={16}
																/>
																<span>
																	{
																		event.expectedGuestCount
																	}{" "}
																	guests
																</span>
															</div>
														)}

													{/* This block was already correct */}
													{event.budget !== null &&
														event.budget !==
															undefined && (
															<div className="admin-planner-management-event-detail">
																<DollarSign
																	size={16}
																/>
																<span>
																	{formatCurrency(
																		event.budget
																	)}
																</span>
															</div>
														)}
													{event.eventCategory && (
														<div className="admin-planner-management-event-detail">
															<Briefcase
																size={16}
															/>
															<span>
																{
																	event.eventCategory
																}
															</span>
														</div>
													)}
													{event.theme && (
														<div className="admin-planner-management-event-detail">
															<Tag size={16} />
															<span>
																{event.theme}
															</span>
														</div>
													)}
												</div>
												{event.description && (
													<p className="admin-planner-management-event-description">
														{event.description}
													</p>
												)}
											</li>
										))}
									</ul>
								) : (
									<p>No events found for this planner.</p>
								)}
							</div>
						</section>
					</div>
				)}
			</Popup>
		</main>
	);
}
