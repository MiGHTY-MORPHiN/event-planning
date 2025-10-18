import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../../firebase"; // Ensure this path is correct
import { Search, Edit } from "lucide-react";
import Popup from "../../general/popup/Popup.jsx";
import "./AdminVendorManagement.css";
import AdminVendorApplications from "./AdminVendorApplications.jsx";

function AdminVendorManagement() {
	const navigate = useNavigate();
	const [vendors, setVendors] = useState([]);
	const [filteredVendors, setFilteredVendors] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);

	// State for filtering and popup
	const [searchTerm, setSearchTerm] = useState("");
	const [categoryFilter, setCategoryFilter] = useState("all");
	const [isPopupOpen, setIsPopupOpen] = useState(false);
	const [selectedVendor, setSelectedVendor] = useState(null);

	const getToken = () =>
		auth.currentUser
			? auth.currentUser.getIdToken()
			: Promise.reject("Not logged in");

	useEffect(() => {
		const fetchVendors = async () => {
			let user = auth.currentUser;
			while (!user) {
				await new Promise((res) => setTimeout(res, 50)); // wait 50ms
				user = auth.currentUser;
			}
			try {
				const token = await getToken();
				const apiUrl =
					"https://us-central1-planit-sdp.cloudfunctions.net/api/admin/vendors";
				const response = await fetch(apiUrl, {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (!response.ok) throw new Error("Failed to fetch vendors.");
				const data = await response.json();
				setVendors(data);
				setFilteredVendors(data);
			} catch (err) {
				setError(err.message);
			} finally {
				setIsLoading(false);
			}
		};
		fetchVendors();
	}, []);

	// Apply filters whenever vendors, searchTerm, or categoryFilter changes
	useEffect(() => {
		let result = vendors;

		if (searchTerm) {
			result = result.filter((v) =>
				v.businessName.toLowerCase().includes(searchTerm.toLowerCase())
			);
		}

		if (categoryFilter !== "all") {
			result = result.filter((v) => v.category === categoryFilter);
		}

		setFilteredVendors(result);
	}, [searchTerm, categoryFilter, vendors]);

	const handleViewDetails = (vendor) => {
		setSelectedVendor(vendor);
		setIsPopupOpen(true);
	};

	const handleEdit = (vendorId) => {
		// You would navigate to a dedicated edit page for the vendor
		// navigate(`/admin/vendors/edit/${vendorId}`);
		alert(`Navigating to edit page for vendor ${vendorId}`);
	};

	const uniqueCategories = [
		"all",
		...new Set(vendors.map((v) => v.category)),
	];

	if (isLoading)
		return (
			<main className="main-container">
				<h3>Loading Vendors...</h3>
			</main>
		);
	if (error)
		return (
			<main className="main-container">
				<h3>Error: {error}</h3>
			</main>
		);

	return (
		<section className="main-container vendor-management-page">
			<AdminVendorApplications />
			<section className="filters-section">
				<h2>All approved vendors</h2>
				<section className="search-bar">
					<Search size={20} />
					<input
						type="text"
						placeholder="Search by business name..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</section>
				<select
					value={categoryFilter}
					onChange={(e) => setCategoryFilter(e.target.value)}
				>
					{uniqueCategories.map((cat) => (
						<option key={cat} value={cat}>
							{cat === "all" ? "All Categories" : cat}
						</option>
					))}
				</select>
			</section>

			<section className="vendor-grid">
				{filteredVendors.length > 0 ? (
					filteredVendors.map((vendor) => (
						<article
							key={vendor.id}
							className="vendor-summary-card"
						>
							<figure className="vendor-card-image">
								<img
									src={
										vendor.profilePic ||
										"/default-avatar.png"
									}
									alt={vendor.businessName}
								/>
							</figure>
							<section className="vendor-card-info">
								<h4>{vendor.businessName}</h4>
								<p className="vendor-category-tag">
									{vendor.category}
								</p>
							</section>
							<button
								className="btn-view-details"
								onClick={() => handleViewDetails(vendor)}
							>
								View Details
							</button>
						</article>
					))
				) : (
					<p>No vendors found.</p>
				)}
			</section>

			<Popup isOpen={isPopupOpen} onClose={() => setIsPopupOpen(false)}>
				{selectedVendor && (
					<section className="vendor-popup-details">
						<header className="vendor-popup-header">
							<img
								src={
									selectedVendor.profilePic ||
									"/default-avatar.png"
								}
								alt={selectedVendor.businessName}
								className="vendor-profile-pic-large"
							/>
							<h2 className="vendor-popup-name">
								{selectedVendor.businessName}
							</h2>
							<p className="vendor-popup-category">
								{selectedVendor.category}
							</p>
						</header>
						<section className="vendor-popup-body">
							<p className="vendor-popup-description">
								{selectedVendor.description}
							</p>
							<section className="vendor-contact-info">
								<p>
									<strong>Email:</strong>{" "}
									{selectedVendor.email}
								</p>
								<p>
									<strong>Phone:</strong>{" "}
									{selectedVendor.phone}
								</p>
								<p>
									<strong>Address:</strong>{" "}
									{selectedVendor.address}
								</p>
							</section>
						</section>
						<footer className="vendor-popup-footer">
							<button
								className="btn-edit"
								onClick={() => handleEdit(selectedVendor.id)}
							>
								<Edit size={16} /> Edit Vendor Details
							</button>
						</footer>
					</section>
				)}
			</Popup>
		</section>
	);
}

export default AdminVendorManagement;
