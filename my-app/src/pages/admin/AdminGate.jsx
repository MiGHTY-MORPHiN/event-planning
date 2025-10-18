import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase"; // Ensure this path is correct

// This component decides which page to show
export default function AdminGate() {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const checkAdminProfile = async () => {
			// Wait for the auth state to be confirmed
			const user = await new Promise((resolve) => {
				const unsubscribe = auth.onAuthStateChanged((user) => {
					resolve(user);
					unsubscribe();
					
				});
			});

			if (!user) {
				// If no user is logged in, you might want to redirect to a login page
				// For now, we'll just stop loading.
				setLoading(false);
				return;
			}

			try {
				const token = await user.getIdToken();
				const res = await fetch(
					"https://us-central1-planit-sdp.cloudfunctions.net/api/admin/me",
					{
						headers: { Authorization: `Bearer ${token}` },
					}
				);

				if (res.status === 404) {
					// If profile is not found, redirect to the create profile page
					navigate("/admin-create-profile");
				} else if (res.ok) {
					// If profile exists, redirect to the main admin dashboard/home
					navigate("/admin/home");
				} else {
					// Handle other errors (e.g., server down)
					console.error("API error:", await res.text());
					setLoading(false); // Stop loading to show a potential error message
				}
			} catch (err) {
				console.error("Error checking admin profile:", err);
				setLoading(false);
			}
		};

		checkAdminProfile();
	}, [navigate]);

	// Display a loading indicator while checking the profile
	if (loading) {
		return (
			<div className="loading-screen">
				<div className="spinner"></div>
				<p>Checking your profile...</p>
			</div>
		);
	}

	// Fallback content in case of an unhandled error
	return <p>Could not verify admin status.</p>;
}
