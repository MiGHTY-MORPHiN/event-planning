import React, { useState, useEffect } from "react";
import { auth } from "../../firebase"; // Make sure this path is correct

function VendorApplications() {
	const [applications, setApplications] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);

	// This function can be removed if you are not using authentication for these routes
	const getToken = async () => {
		if (auth.currentUser) {
			return await auth.currentUser.getIdToken();
		}
		// Return a dummy token or null if no user is logged in, for local testing
		return null;
	};

	// Fetch pending applications when the component mounts
	useEffect(() => {
		const fetchApplications = async () => {
			try {
				const apiUrl =
					"https://us-central1-planit-sdp.cloudfunctions.net/api/admin/vendor-applications";

				const response = await fetch(apiUrl); // No auth headers needed for local testing

				if (!response.ok) {
					throw new Error(
						"Failed to fetch applications. Is the emulator running?"
					);
				}
				const data = await response.json();
				setApplications(data);
			} catch (err) {
				setError(err.message);
			} finally {
				setIsLoading(false);
			}
		};

		fetchApplications();
	}, []);

	// Function to handle approving or rejecting a vendor
	const handleUpdateStatus = async (vendorId, status) => {
		try {
			const apiUrl = `https://us-central1-planit-sdp.cloudfunctions.net/api/admin/vendor-applications/${vendorId}`;

			const response = await fetch(apiUrl, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ status }),
			});

			if (!response.ok) {
				throw new Error(`Failed to ${status} vendor`);
			}

			// If successful, remove the application from the list in the UI
			setApplications((prev) =>
				prev.filter((app) => app.id !== vendorId)
			);
		} catch (err) {
			setError(err.message);
		}
	};

	if (isLoading)
		return (
			<main className="main-container">
				<h3>Loading applications...</h3>
			</main>
		);
	if (error)
		return (
			<main className="main-container">
				<h3>Error: {error}</h3>
			</main>
		);

	return (
		<div className="applications-list">
			{applications.length > 0 ? (
				applications.map((app) => (
					<div key={app.id} className="card-application">
						<table class="table-layout">
							<thead>
								<tr>
									<td class="col-75">
										{/* Left Column for all text details */}
										<div className="vendor-card-details">
											<div className="vendor-card-header">
												<div className="vendor-header-info">
													<h4>{app.businessName}</h4>
													<p className="vendor-category">
														{app.category}
													</p>
												</div>
											</div>
											<div className="vendor-card-body">
												<p>
													<strong>
														Description:
													</strong>{" "}
													{app.description}
												</p>
												<div className="vendor-contact-info">
													<p>
														<strong>Email:</strong>{" "}
														{app.email}
													</p>
													<p>
														<strong>Phone:</strong>{" "}
														{app.phone}
													</p>
												</div>
												<p>
													<strong>Address:</strong>{" "}
													{app.address}
												</p>
											</div>
										</div>
									</td>
									<td class="col-25">
										{/* Right Column for the profile picture */}
										<div className="vendor-card-image-container">
											<img
												src={app.profilePic}
												alt={`${app.businessName} profile`}
												className="vendor-profile-pic"
											/>
										</div>
									</td>
								</tr>
							</thead>
						</table>

						<div className="application-actions">
							<button
								className="btn-approve"
								onClick={() =>
									handleUpdateStatus(app.id, "approved")
								}
							>
								Approve
							</button>
							<button
								className="btn-reject"
								onClick={() =>
									handleUpdateStatus(app.id, "rejected")
								}
							>
								Reject
							</button>
						</div>
					</div>
				))
			) : (
				<p>No pending applications found.</p>
			)}
		</div>
	);
}

export default VendorApplications;
