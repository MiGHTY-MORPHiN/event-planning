import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../../firebase";
import {
	Search,
	Edit,
	Phone,
	Mail,
	MapPin,
	Star,
	Calendar,
	DollarSign,
	Users,
	CheckCircle,
	XCircle,
	Clock,
	Briefcase,
	Tag,
	ThumbsUp,
	ThumbsDown,
} from "lucide-react";
import Popup from "../../general/popup/Popup.jsx";
import "./AdminVendorManagement.css";
import AdminVendorApplications from "./AdminVendorApplications.jsx";
import BASE_URL from "../../../apiConfig";
import LoadingSpinner from "../../general/loadingspinner/LoadingSpinner.jsx"; // Ensure correct path

function AdminVendorManagement() {
	const navigate = useNavigate();
	// State for general vendor list
	const [vendors, setVendors] = useState([]);
	const [filteredVendors, setFilteredVendors] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [categoryFilter, setCategoryFilter] = useState("all");
	const [ratingFilter, setRatingFilter] = useState("all");

	// State for Popup
	const [isPopupOpen, setIsPopupOpen] = useState(false);
	const [selectedVendor, setSelectedVendor] = useState(null);
	const [selectedVendorDetails, setSelectedVendorDetails] = useState(null);
	const [selectedVendorEvents, setSelectedVendorEvents] = useState([]);
	const [selectedVendorServices, setSelectedVendorServices] = useState([]);
	const [isLoadingDetails, setIsLoadingDetails] = useState(false);

	const getToken = () =>
		auth.currentUser
			? auth.currentUser.getIdToken()
			: Promise.reject("Not logged in");

	// --- Fetch All Vendors (includes service count, rating) ---
	const fetchVendors = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const token = await getToken();
			const response = await fetch(`${BASE_URL}/admin/vendors`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (!response.ok) {
				throw new Error("Failed to fetch vendors.");
			}
			const data = await response.json();
			setVendors(data);
			setFilteredVendorsBasedOnFilter(
				data,
				searchTerm,
				categoryFilter,
				ratingFilter
			);
		} catch (err) {
			setError(err.message);
			console.error("Fetch vendors error:", err);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchVendors();
	}, []);

	// --- Helper to apply filters ---
	const setFilteredVendorsBasedOnFilter = (
		allVendors,
		term,
		category,
		rating
	) => {
		let result = allVendors;
		if (term) {
			result = result.filter(
				(v) =>
					v.businessName
						?.toLowerCase()
						.includes(term.toLowerCase()) ||
					v.email?.toLowerCase().includes(term.toLowerCase()) ||
					v.category?.toLowerCase().includes(term.toLowerCase())
			);
		}
		if (category !== "all") {
			result = result.filter((v) => v.category === category);
		}
		if (rating !== "all") {
			const minRating = parseFloat(rating);
			result = result.filter(
				(v) => v.averageRating && v.averageRating >= minRating
			);
		}
		setFilteredVendors(result);
	};

	useEffect(() => {
		setFilteredVendorsBasedOnFilter(
			vendors,
			searchTerm,
			categoryFilter,
			ratingFilter
		);
	}, [searchTerm, categoryFilter, ratingFilter, vendors]);

	// --- Fetch Details for Popup (Analytics, Events, Services) ---
	const fetchVendorDetails = async (vendorId) => {
		setSelectedVendorDetails(null);
		setSelectedVendorEvents([]);
		setSelectedVendorServices([]);
		try {
			const token = await getToken();
			const analyticsPromise = fetch(
				`${BASE_URL}/admin/vendor/${vendorId}`,
				{ headers: { Authorization: `Bearer ${token}` } }
			).then((res) =>
				res.ok
					? res.json()
					: Promise.resolve({ reviews: [], averageRating: null })
			);
			const eventsPromise = fetch(
				`${BASE_URL}/admin/vendor/${vendorId}/events`,
				{ headers: { Authorization: `Bearer ${token}` } }
			).then((res) =>
				res.ok ? res.json() : Promise.resolve({ events: [] })
			);
			const servicesPromise = fetch(
				`${BASE_URL}/admin/vendor/${vendorId}/services`,
				{ headers: { Authorization: `Bearer ${token}` } }
			).then((res) =>
				res.ok ? res.json() : Promise.resolve({ services: [] })
			);

			const [analyticsData, eventsData, servicesData] = await Promise.all(
				[analyticsPromise, eventsPromise, servicesPromise]
			);

			setSelectedVendorDetails(analyticsData);
			setSelectedVendorEvents(eventsData.events || []);
			setSelectedVendorServices(servicesData.services || []);
		} catch (err) {
			console.error("Error fetching vendor details:", err);
			setError("Could not load vendor details.");
			setSelectedVendorDetails({ reviews: [], averageRating: null });
			setSelectedVendorEvents([]);
			setSelectedVendorServices([]);
		}
	};

	const handleViewDetails = async (vendor) => {
		setSelectedVendor(vendor);
		setIsPopupOpen(true);
		setIsLoadingDetails(true);
		try {
			await fetchVendorDetails(vendor.id);
		} catch (err) {
			console.error("Popup data fetch failed:", err);
		} finally {
			setIsLoadingDetails(false);
		}
	};

	const handleClosePopup = () => {
		setIsPopupOpen(false);
		setSelectedVendor(null);
		setSelectedVendorDetails(null);
		setSelectedVendorEvents([]);
		setSelectedVendorServices([]);
		setIsLoadingDetails(false);
	};

	const handleApplicationUpdate = async (vendorId, newStatus) => {
		try {
			const token = await getToken();
			const response = await fetch(
				`${BASE_URL}/admin/vendor-applications/${vendorId}`,
				{
					method: "PUT",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ status: newStatus }),
				}
			);
			if (response.ok) {
				setVendors((prev) =>
					prev.map((v) =>
						v.id === vendorId ? { ...v, status: newStatus } : v
					)
				);
				setSelectedVendor((prev) =>
					prev && prev.id === vendorId
						? { ...prev, status: newStatus }
						: prev
				);
				alert(`Vendor status updated to ${newStatus}`);
				// Manually trigger a refresh of the applications component if needed
				// This might involve passing a refresh function down or using a shared state/context
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || "Failed to update status");
			}
		} catch (err) {
			console.error("Error updating vendor status:", err);
			alert("Error updating vendor status: " + err.message);
		}
	};

	const formatRating = (rating) => {
		if (rating === null || rating === undefined || rating === 0)
			return "N/A";
		return rating.toFixed(1);
	};

	const formatDate = (dateString) => {
		if (!dateString) return "Date not set";
		try {
			const date = dateString._seconds
				? new Date(dateString._seconds * 1000)
				: new Date(dateString);
			if (isNaN(date)) return "Invalid Date";
			return date.toLocaleDateString("en-US", {
				year: "numeric",
				month: "short",
				day: "numeric",
			});
		} catch (e) {
			return "Invalid Date";
		}
	};

	const formatCurrency = (amount) => {
		if (amount === null || amount === undefined) return "N/A";
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
			minimumFractionDigits: 0,
			maximumFractionDigits: 2,
		}).format(amount);
	};

	const uniqueCategories = [
		"all",
		...new Set(vendors.map((v) => v.category).filter(Boolean)),
	];

	const renderLoadingError = (loading, error, data, type) => {
		if (loading) return <LoadingSpinner text={`Loading ${type}...`} />;
		if (error)
			return (
				<p className="error-message">
					Error loading {type}: {error}
				</p>
			);
		if (!data || data.length === 0)
			return (
				<p className="admin-vendor-management-empty">
					No {type} found.
				</p>
			);
		return null;
	};

	return (
		<section className="admin-vendor-management-container">
			<header className="admin-vendor-management-header">
				<h1>Vendor Management</h1>
				<p className="admin-vendor-management-subtitle">
					Manage vendor applications and approved vendors
				</p>
			</header>

			<section className="admin-vendor-management-section">
				<h2 className="admin-vendor-management-heading">
					Pending Applications
				</h2>
				<AdminVendorApplications onApplicationUpdate={fetchVendors} />
			</section>

			<section className="admin-vendor-management-section">
				<h2 className="admin-vendor-management-heading">
					All approved vendors ({filteredVendors.length})
				</h2>
				<section className="admin-vendor-management-filters">
					<div className="admin-vendor-management-search">
						<Search size={20} />
						<input
							type="text"
							placeholder="Search by business name, email, or category..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>
					<select
						className="admin-vendor-management-dropdown"
						value={categoryFilter}
						onChange={(e) => setCategoryFilter(e.target.value)}
					>
						<option value="all">All Categories</option>
						{uniqueCategories
							.filter((cat) => cat !== "all")
							.sort()
							.map((cat) => (
								<option key={cat} value={cat}>
									{cat}
								</option>
							))}
					</select>
					<select
						className="admin-vendor-management-dropdown"
						value={ratingFilter}
						onChange={(e) => setRatingFilter(e.target.value)}
					>
						<option value="all">All Ratings</option>
						<option value="4">4 Stars & Up</option>
						<option value="3">3 Stars & Up</option>
						<option value="2">2 Stars & Up</option>
						<option value="1">1 Star & Up</option>
					</select>
				</section>

				{renderLoadingError(
					isLoading,
					error,
					filteredVendors,
					"vendors"
				)}
				{filteredVendors && filteredVendors.length > 0 && (
					<div className="admin-vendor-grid">
						{filteredVendors.map((vendor) => (
							<article
								key={vendor.id}
								className="admin-vendor-summary-card"
							>
								<img
									src={
										vendor.profilePic ||
										"/default-avatar.png"
									}
									alt={vendor.businessName || "Vendor"}
									className="admin-vendor-profile-pic-card"
									onError={(e) => {
										e.target.src = "/default-avatar.png";
									}}
								/>
								<h4>
									{vendor.businessName || "Unnamed Vendor"}
								</h4>
								<p className="admin-vendor-category">
									{vendor.category || "No Category"}
								</p>
								<div className="admin-vendor-stats">
									<div className="admin-vendor-stat">
										<Star size={16} />
										<span>
											{formatRating(vendor.averageRating)}
										</span>
									</div>
									<div className="admin-vendor-stat">
										<Briefcase size={16} />
										<span>
											{vendor.serviceCount || 0} Services
										</span>
									</div>
								</div>
								<button
									onClick={() => handleViewDetails(vendor)}
									className="admin-vendor-btn-view-details"
								>
									View Details
								</button>
							</article>
						))}
					</div>
				)}
			</section>

			<Popup isOpen={isPopupOpen} onClose={handleClosePopup}>
				{selectedVendor && (
					<div className="admin-vendor-modal-details">
						<header className="admin-vendor-modal-header">
							<img
								src={
									selectedVendor.profilePic ||
									"/default-avatar.png"
								}
								alt={selectedVendor.businessName}
								className="admin-vendor-profile-pic-modal"
								onError={(e) => {
									e.target.src = "/default-avatar.png";
								}}
							/>
							<h2>
								{selectedVendor.businessName ||
									"Unnamed Vendor"}
							</h2>
							<p className="admin-vendor-category">
								{selectedVendor.category}
							</p>
							{selectedVendor.status === "pending" && (
								<div className="app-actions popup-actions">
									<button
										onClick={() =>
											handleApplicationUpdate(
												selectedVendor.id,
												"approved"
											)
										}
										className="btn-approve"
										title="Approve"
									>
										<ThumbsUp size={18} /> Approve
									</button>
									<button
										onClick={() =>
											handleApplicationUpdate(
												selectedVendor.id,
												"rejected"
											)
										}
										className="btn-reject"
										title="Reject"
									>
										<ThumbsDown size={18} /> Reject
									</button>
								</div>
							)}
						</header>

						{isLoadingDetails ? (
							<LoadingSpinner text="Loading vendor details..." />
						) : (
							<section className="admin-vendor-modal-body">
								<div className="admin-vendor-contact-info">
									<h4>Contact Information</h4>
									<p>
										<Mail size={14} />{" "}
										<strong>Email:</strong>{" "}
										{selectedVendor.email || "N/A"}
									</p>
									<p>
										<Phone size={14} />{" "}
										<strong>Phone:</strong>{" "}
										{selectedVendor.phone || "N/A"}
									</p>
									<p>
										<MapPin size={14} />{" "}
										<strong>Address:</strong>{" "}
										{selectedVendor.address || "N/A"}
									</p>
								</div>
								<div className="admin-vendor-description">
									<h4>Description</h4>
									<p>
										{selectedVendor.description ||
											"No description provided."}
									</p>
								</div>
								<div className="admin-vendor-services-offered">
									<h4>
										Services Offered (
										{selectedVendorServices?.length ?? 0})
									</h4>
									{selectedVendorServices &&
									selectedVendorServices.length > 0 ? (
										<ul>
											{selectedVendorServices.map(
												(service) => (
													<li key={service.id}>
														<Tag
															size={14}
															className="service-icon"
														/>
														<span className="service-name">
															{service.serviceName ||
																"Unnamed Service"}
														</span>
														<div className="service-pricing">
															{service.cost >
																0 && (
																<span>
																	<DollarSign
																		size={
																			12
																		}
																	/>
																	{formatCurrency(
																		service.cost
																	)}{" "}
																	(Fixed)
																</span>
															)}
															{service.chargeByHour >
																0 && (
																<span>
																	<Clock
																		size={
																			12
																		}
																	/>
																	{formatCurrency(
																		service.chargeByHour
																	)}
																	/hr
																</span>
															)}
															{service.chargePerPerson >
																0 && (
																<span>
																	<Users
																		size={
																			12
																		}
																	/>
																	{formatCurrency(
																		service.chargePerPerson
																	)}
																	/person
																</span>
															)}
															{service.chargePerSquareMeter >
																0 && (
																<span>
																	<MapPin
																		size={
																			12
																		}
																	/>
																	{formatCurrency(
																		service.chargePerSquareMeter
																	)}
																	/m²
																</span>
															)}
														</div>
														{service.extraNotes && (
															<p className="service-notes">
																Notes:{" "}
																{
																	service.extraNotes
																}
															</p>
														)}
													</li>
												)
											)}
										</ul>
									) : (
										<p>No specific services listed.</p>
									)}
								</div>
								<div className="admin-vendor-events-worked-on">
									<h4>
										Events Worked On (
										{selectedVendorEvents?.length ?? 0})
									</h4>
									{selectedVendorEvents &&
									selectedVendorEvents.length > 0 ? (
										<ul>
											{selectedVendorEvents.map(
												(event) => (
													<li key={event.id}>
														<Calendar size={14} />
														<span>
															{event.name} (
															{formatDate(
																event.date
															)}
															)
														</span>
														<span
															className={`event-status-${
																event.status ||
																"unknown"
															}`}
														>
															{event.status ||
																"unknown"}
														</span>
													</li>
												)
											)}
										</ul>
									) : (
										<p>No event history found.</p>
									)}
								</div>
								<div className="admin-vendor-reviews">
									<h4>
										Reviews (
										{selectedVendorDetails?.reviews
											?.length ?? 0}
										) - Avg:{" "}
										{formatRating(
											selectedVendorDetails?.averageRating
										)}
									</h4>
									{selectedVendorDetails?.reviews &&
									selectedVendorDetails.reviews.length > 0 ? (
										<ul>
											{selectedVendorDetails.reviews.map(
												(review) => (
													<li
														key={review.id}
														className="review-item-improved"
													>
														{" "}
														{/* Added a class */}
														<div className="review-meta">
															{" "}
															{/* Grouped meta info */}
															<div className="review-rating">
																{[
																	...Array(5),
																].map(
																	(_, i) => (
																		<Star
																			key={
																				i
																			}
																			size={
																				14
																			}
																			color={
																				i <
																				review.rating
																					? "#ffc107"
																					: "#e0e0e0"
																			}
																			fill={
																				i <
																				review.rating
																					? "#ffc107"
																					: "none"
																			}
																		/>
																	)
																)}
															</div>
															<p className="review-date">
																Reviewed on:{" "}
																{formatDate(
																	review.createdAt ||
																		review.timeOfReview
																)}
															</p>
														</div>
														<div className="review-context-improved">
															{" "}
															{/* Renamed and improved context */}
															{review.eventName &&
																![
																	"Event Not Found",
																	"Event Not Specified",
																].includes(
																	review.eventName
																) && (
																	<p className="review-event">
																		<Briefcase
																			size={
																				12
																			}
																		/>{" "}
																		<strong>
																			Event:
																		</strong>{" "}
																		{
																			review.eventName
																		}
																	</p>
																)}
															{review.plannerName &&
																![
																	"Planner Not Found",
																	"Planner Not Specified",
																].includes(
																	review.plannerName
																) && (
																	<p className="review-planner">
																		<Users
																			size={
																				12
																			}
																		/>{" "}
																		<strong>
																			By:
																		</strong>{" "}
																		{
																			review.plannerName
																		}
																	</p>
																)}
														</div>
														<p className="review-text">
															"
															{review.review ||
																review.comment}
															"
														</p>{" "}
														{/* Added quotes */}
														{review.reply && (
															<p className="review-reply">
																<strong>
																	Vendor's
																	Reply:
																</strong>{" "}
																{review.reply}
															</p>
														)}
													</li>
												)
											)}
										</ul>
									) : (
										<p>No reviews available yet.</p>
									)}
								</div>
							</section>
						)}
					</div>
				)}
			</Popup>
		</section>
	);
}

export default AdminVendorManagement;
