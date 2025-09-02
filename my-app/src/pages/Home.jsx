import React from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Calendar, ChefHat, ArrowRight } from "lucide-react"; // icons
import "./Home.css"; // scoped styles

export default function Home() {
	const navigate = useNavigate();

	const navPlannerDashboard = () => {
		navigate("/planner-dashboard");
	};

	const navVendorDashboard = () => {
		navigate("/vendor-app");
	};

	const navAdminDashboard = () => {
		navigate("/admin");
	};

	const navVendorApply = () => {
		navigate("/vendor/vendor-apply");
	};

	const navLogout = () => {
		navigate("/");
	};

	return (
		<section className="home-page">
			<button id="logout" onClick={navLogout}>
				Logout
			</button>
			<h1>Welcome to PLANiT</h1>
			<h4>
				The complete platform for event planning, vendor management, and
				seamless execution
			</h4>

			<section className="choose-experience">
				<h1>Choose your experience</h1>
				<p>Access the resources you need to get you there.</p>

				{/* Event Manager Tile */}
				<section className="role-tile center-tile">
					<div className="icon-circle">
						<Calendar size={40} color="white" />
					</div>
					<h2>Event Manager</h2>
					<ul>
						<li style={{ color: "grey" }}>
							Event creation & management
						</li>
						<li style={{ color: "grey" }}>Guest list management</li>
						<li style={{ color: "grey" }}>
							Vendor marketplace access
						</li>
					</ul>
					<button id="dashboard" onClick={navPlannerDashboard}>
						Enter Event Dashboard <ArrowRight size={20} />
					</button>
				</section>

				{/* Vendor Tile */}
				<section className="role-tile center-tile">
					<div className="icon-circle">
						<ChefHat size={40} color="white" />
					</div>
					<h2>Vendor</h2>
					<ul>
						<li style={{ color: "grey" }}>
							Business profile management
						</li>
						<li style={{ color: "grey" }}>Booking calendar</li>
						<li style={{ color: "grey" }}>Ratings & reviews</li>
					</ul>
					<button id="dashboard" onClick={navVendorApply}>
						Enter Vendor Dashboard{" "}
						<ArrowRight size={20}></ArrowRight>
					</button>
				</section>

				{/* Admin Tile */}
				<section className="role-tile center-tile">
					<div className="icon-circle">
						<Shield size={40} color="white" />
					</div>
					<h2>Admin</h2>
					<ul>
						<li style={{ color: "grey" }}>
							User profile management
						</li>
						<li style={{ color: "grey" }}>Event management</li>
					</ul>
					<button id="dashboard" onClick={navAdminDashboard}>
						Enter Admin Dashboard{" "}
						<ArrowRight size={20}></ArrowRight>
					</button>
				</section>
			</section>

			<section className="trusted-section">
				<h1>Trusted by Event Organisers</h1>
				<p>
					Join hundreds of successful events planned on our platform
				</p>
				<br></br>
				<p>
					"PLANiT eased my worries when I had to plan a dinner gala
					for my company's year-end celebration. I could organise my
					venue decorations, book vendors and manage guest lists all
					on one app." - Tawananyasha, Event Manager
				</p>
				<p>
					"I am caterer who is hoping to expand his business. PLANiT
					helped me with getting my first clients around my area." -
					Austin, Vendor
				</p>
				<p>
					"Tracking venue management has never been easier." - Amahle,
					Vendor
				</p>
			</section>

			<footer>
				<p>&copy; 2025 PLANiT. All rights reserved.</p>
			</footer>
		</section>
	);
}
