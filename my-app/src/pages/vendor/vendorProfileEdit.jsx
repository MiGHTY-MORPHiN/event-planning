import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase";
import "./vendorProfileEdit.css";

export default function VendorProfileEdit() {
	const navigate = useNavigate();

	const [description, setDescription] = useState("");
	const [address, setAddress] = useState("");
	const [phone, setPhone] = useState("");
	const [email, setEmail] = useState("");
	const [profilePic, setProfilePic] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	const navProfile = () => navigate("/vendor-app");

	// Fetch current profile
	useEffect(() => {
		const fetchProfile = async () => {
			if (!auth.currentUser) return;
			try {
				const token = await auth.currentUser.getIdToken();
				const res = await fetch(
					"https://us-central1-planit-sdp.cloudfunctions.net/api/vendor/me",
					{
						headers: { Authorization: `Bearer ${token}` },
					}
				);
				if (!res.ok) throw new Error("Failed to fetch profile");
				const data = await res.json();
				setDescription(data.description || "");
				setAddress(data.address || "");
				setPhone(data.phone || "");
				setEmail(data.email || "");
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
					reader.onload = () => {
						const base64String = reader.result.split(",")[1];
						resolve(base64String);
					};
					reader.onerror = (error) => reject(error);
				});
			}

			const res = await fetch(
				"https://us-central1-planit-sdp.cloudfunctions.net/api/vendor/me",
				{
					method: "PUT",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						description,
						address,
						phone,
						email,
						profilePic: profilePicBase64,
					}),
				}
			);

			const data = await res.json();
			if (!res.ok) throw new Error(data.message || "Update failed");

			setSuccess("Profile updated successfully!");
			setTimeout(() => navigate("/vendor-app"), 1000);
		} catch (err) {
			console.error(err);
			setError(err.message);
		}
	};

	return (
		<main className="vendor-apply-page">
			<section className="vendor-apply-card">
				<button onClick={navProfile} className="edit-profile-btn">
					Back
				</button>
				<h1>Edit Vendor Profile</h1>
				{error && <p className="error">{error}</p>}
				{success && <p className="success">{success}</p>}

				<form onSubmit={handleSubmit} className="vendor-apply-form">
					<label>
						Description
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={4}
							required
						/>
					</label>

					<label>
						Address
						<input
							type="text"
							value={address}
							onChange={(e) => setAddress(e.target.value)}
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
						Email
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
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

					<button type="submit" className="btn primary">
						Save Changes
					</button>
				</form>
			</section>
		</main>
	);
}
