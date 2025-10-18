import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../../firebase";
import { Search, Edit } from "lucide-react";
import Popup from "../adminGeneralComponents/Popup.jsx";
import "./AdminAllVendorProfiles.css";
import BASE_URL from "../../../apiConfig";

function AdminAllVendorProfiles() {
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
			try {
				const token = await getToken();
				const apiUrl = `${BASE_URL}/admin/vendors`;
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
			<main className="admin-main-container">
				<h3>Loading Vendors...</h3>
			</main>
		);
	if (error)
		return (
			<main className="admin-main-container">
				<h3>Error: {error}</h3>
			</main>
		);

	return (
		<main className="view-vendor-profiles-container">
			<section className="admin-vendors-filters-section">
				<div className="admin-search-bar">
					<Search size={20} />
					<input
						type="text"
						placeholder="Search by business name..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</div>
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

			<section className="admin-vendor-grid">
				{filteredVendors.length > 0 ? (
					filteredVendors.map((vendor) => (
						<article
							key={vendor.id}
							className="admin-vendor-summary-card"
						>
							<figure className="admin-vendor-card-image">
								<img
									src={
										vendor.profilePic ||
										"/default-avatar.png"
									}
									alt={vendor.businessName}
								/>
							</figure>
							<div className="admin-vendor-card-info">
								<h4>{vendor.businessName}</h4>
								<p className="admin-vendor-category-tag">
									{vendor.category}
								</p>
							</div>
							<button
								className="admin-btn-view-details"
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
					<div className="admin-vendor-popup-details">
						<header className="admin-vendor-popup-header">
							<img
								src={
									selectedVendor.profilePic ||
									"/default-avatar.png"
								}
								alt={selectedVendor.businessName}
								className="admin-vendor-profile-pic-large"
							/>
							<h2 className="admin-vendor-popup-name">
								{selectedVendor.businessName}
							</h2>
							<p className="admin-vendor-popup-category">
								{selectedVendor.category}
							</p>
						</header>
						<section className="admin-vendor-popup-body">
							<p className="admin-vendor-popup-description">
								{selectedVendor.description}
							</p>
							<div className="admin-vendor-contact-info">
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
							</div>
						</section>
						<footer className="admin-vendor-popup-footer">
							<button
								className="admin-btn-edit"
								onClick={() => handleEdit(selectedVendor.id)}
							>
								<Edit size={16} /> Edit Vendor Details
							</button>
						</footer>
					</div>
				)}
			</Popup>
		</main>
	);
}

export default AdminAllVendorProfiles;
