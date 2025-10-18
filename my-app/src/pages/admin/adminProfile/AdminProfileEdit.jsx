import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../../firebase";
import "./AdminProfileEdit.css";

export default function AdminProfileEdit() {
	const navigate = useNavigate();

	const [fullName, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [profilePic, setProfilePic] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	const navProfile = () => navigate("/admin/profile");

	// Fetch current admin profile
	useEffect(() => {
		const fetchProfile = async () => {
			if (!auth.currentUser) return;
			try {
				const token = await auth.currentUser.getIdToken();
				const res = await fetch(
					"https://us-central1-planit-sdp.cloudfunctions.net/api/admin/me",
					{
						headers: { Authorization: `Bearer ${token}` },
					}
				);
				if (!res.ok) throw new Error("Failed to fetch profile");
				const data = await res.json();
				setName(data.fullName || "");
				setPhone(data.phone || "");
			} catch (err) {
				console.error(err);
				setError(err.message);
			} finally {
				setLoading(false);
			}
		};
		fetchProfile();
	}, []);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setSuccess("");

		if (!auth.currentUser) {
			setError("You must be logged in.");
			return;
		}

		const token = await auth.currentUser.getIdToken();

		try {
			let profilePicBase64 = null;
			if (profilePic) {
				profilePicBase64 = await new Promise((resolve, reject) => {
					const reader = new FileReader();
					reader.readAsDataURL(profilePic);
					reader.onload = () => resolve(reader.result.split(",")[1]);
					reader.onerror = (error) => reject(error);
				});
			}

			const res = await fetch(
				"https://us-central1-planit-sdp.cloudfunctions.net/api/admin/me",
				{
					method: "PUT",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						fullName,
						phone,
						profilePic: profilePicBase64,
					}),
				}
			);

			const data = await res.json();
			if (!res.ok) throw new Error(data.message || "Update failed");

			setSuccess("Profile updated successfully!");
			setTimeout(() => navProfile(), 1000);
		} catch (err) {
			console.error(err);
			setError(err.message);
		}
	};

	if (loading) return <p>Loading...</p>;

	return (
		<main className="admin-edit-page">
			<section className="admin-edit-card">
				<button onClick={navProfile} className="back-btn">
					Back to Profile
				</button>
				<h1>Edit Admin Profile</h1>
				{error && <p className="error">{error}</p>}
				{success && <p className="success">{success}</p>}

				<form onSubmit={handleSubmit} className="admin-edit-form">
					<label>
						Full Name
						<input
							type="text"
							value={fullName}
							onChange={(e) => setName(e.target.value)}
							required
						/>
					</label>

					<label>
						Phone
						<input
							type="text"
							value={phone}
							onChange={(e) => setPhone(e.target.value)}
						/>
					</label>

					<label>
						Profile Picture
						<input
							type="file"
							accept="image/*"
							onChange={(e) => setProfilePic(e.target.files[0])}
						/>
					</label>

					<button type="submit" className="btn-primary">
						Save Changes
					</button>
				</form>
			</section>
		</main>
	);
}
