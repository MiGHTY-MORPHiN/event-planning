import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../../firebase"; // Ensure this path is correct
import "./AdminCreateProfile.css";

export default function AdminCreateProfile() {
	const navigate = useNavigate();

	// State for admin profile fields
	const [fullName, setFullName] = useState("");
	const [phone, setPhone] = useState("");
	const [email, setEmail] = useState(""); // Email will be pre-filled
	const [profilePic, setProfilePic] = useState(null);
	const [profilePreview, setProfilePreview] = useState(null); // NEW: for preview
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	// Pre-fill the email field once the user is logged in
	useEffect(() => {
		if (auth.currentUser) {
			setEmail(auth.currentUser.email);
			
		}
	}, []);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setSuccess("");

		if (!auth.currentUser) {
			setError("You must be logged in to create a profile");
			
			
			return;
		}

		try {
			const token = await auth.currentUser.getIdToken();

			let profilePicBase64 = "";
			if (profilePic) {
				const reader = new FileReader();
				profilePicBase64 = await new Promise((resolve, reject) => {
					reader.onloadend = () =>
						resolve(reader.result.split(",")[1]);
					reader.onerror = reject;
					reader.readAsDataURL(profilePic);
				});
			}

			const body = {
				fullName,
				phone,
				email,
				profilePic: profilePicBase64,
			};

			const res = await fetch(
				"https://us-central1-planit-sdp.cloudfunctions.net/api/admin/me",
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify(body),
				}
			);

			const data = await res.json();
			if (!res.ok)
				throw new Error(data.message || "Failed to create profile");

			setSuccess("Profile created successfully! Redirecting...");
			// Redirect to the main admin profile view after a short delay
			setTimeout(() => navigate("/admin"), 1500);
		} catch (err) {
			console.error(err);
			setError(err.message);
		}
	};

	// NEW: handle image selection and preview
	const handleProfilePicChange = (e) => {
		const file = e.target.files[0];
		setProfilePic(file);
		if (file) {
			const reader = new FileReader();
			reader.onloadend = () => {
				setProfilePreview(reader.result);
			};
			reader.readAsDataURL(file);
		} else {
			setProfilePreview(null);
		}
	};

	return (
		<main className="admin-create-page">
			<section className="admin-create-card">
				<h1>Create Your Admin Profile</h1>
				<p className="subtitle">
					This information will be used to identify you across the
					platform.
				</p>

				{error && <p className="error">{error}</p>}
				{success && <p className="success">{success}</p>}

				<form onSubmit={handleSubmit} className="admin-create-form">
					<label>
						Full Name
						<input
							type="text"
							value={fullName}
							onChange={(e) => setFullName(e.target.value)}
							placeholder="Enter your full name"
							required
						/>
					</label>

					<label>
						Phone Number
						<input
							type="tel"
							value={phone}
							onChange={(e) => setPhone(e.target.value)}
							placeholder="e.g., +27 12 345 6789"
							required
						/>
					</label>

					<label>
						Email
						<input
							type="email"
							value={email}
							readOnly // Email is taken from auth and cannot be changed
							className="readonly-input"
						/>
					</label>

					<label>
						Profile Picture
						<input
							type="file"
							accept="image/*"
							onChange={handleProfilePicChange} // UPDATED
						/>
					</label>

					{/* NEW: preview */}
					{profilePreview && (
						<div className="profile-preview">
							<img src={profilePreview} alt="Profile Preview" />
						</div>
					)}

					<button type="submit" className="btn-primary">
						Save and Continue
					</button>
				</form>
			</section>
		</main>
	);
}
