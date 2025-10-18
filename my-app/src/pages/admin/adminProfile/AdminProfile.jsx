
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Edit, Mail, Phone } from "lucide-react";
import "./AdminProfile.css";

const AdminProfile = () => {
	const navigate = useNavigate();
	const [admin, setAdmin] = useState(null);
	const [loading, setLoading] = useState(true);
	const [imageVersion, setImageVersion] = useState(Date.now());

	const navProfileEdit = () => navigate("/admin-edit-profile");

	const fetchAdminProfile = async () => {
		if (!auth.currentUser) return;
		setLoading(true);
		try {
			const token = await auth.currentUser.getIdToken();
			const res = await fetch(
				"https://us-central1-planit-sdp.cloudfunctions.net/api/admin/me",
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			if (res.status === 403)
				throw new Error("Access Forbidden: You are not an admin.");
			if (!res.ok) throw new Error("Failed to fetch admin profile");
			const data = await res.json();
			setAdmin(data);
			setImageVersion(Date.now());
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			if (user) {
				fetchAdminProfile();
			} else {
				setLoading(false);
			}
		});
		return () => unsubscribe();
	}, []);

	// Refresh data when returning to the page
	useEffect(() => {
		const handleFocus = () => fetchAdminProfile();
		window.addEventListener("focus", handleFocus);
		return () => window.removeEventListener("focus", handleFocus);
	}, []);

	if (loading) {
		return (
			<div className="loading-screen">
				<div className="spinner"></div>
				<p>Loading Admin Profile...</p>
			</div>
		);
	}

	if (!admin)
		return (
			<p id="no-profile-found">
				Admin profile not found or you do not have permission.
			</p>
		);

	return (
		<div className="admin-profile">
			{/* Header */}
			<div className="admin-profile-header">
				<div>
					<h1 className="admin-profile-title">Admin Profile</h1>
					<p className="admin-profile-subtitle">
						Manage your personal information
					</p>
				</div>
				<button className="edit-profile-btn" onClick={navProfileEdit}>
					<Edit size={16} /> Edit Profile
				</button>
			</div>

			<img
				className="admin-profile-picture"
				src={
					admin.profilePic
						? `${admin.profilePic}?v=${imageVersion}`
						: "/default-avatar.png"
				}
				alt="Admin's Profile Picture"
			/>

			{/* Admin Information Card */}
			<div className="profile-card">
				<h3 className="admin-name">{admin.name}</h3>
				<span className="admin-badge">Administrator</span>
				<div className="admin-contact">
					<p className="contact-item">
						<Mail size={16} /> {admin.email}
					</p>
					<p className="contact-item">
						<Phone size={16} /> {admin.phone || "Not provided"}
					</p>
				</div>
			</div>
		</div>
	);
};

export default AdminProfile;
