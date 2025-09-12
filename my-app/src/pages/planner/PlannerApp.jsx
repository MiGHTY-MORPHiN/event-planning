// src/vendor/VendorApp.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Users,
	Calendar,
	MapPin,
	FileText,
	ArrowLeft,
	Building2,
	BarChart3,
} from "lucide-react";

//Paging imports
import PlannerDashboard from "./PlannerDashboard";
import PlannerVendorMarketplace from "./PlannerVendorMarketplace";

//css import
import "./PlannerApp.css";
import PlannerViewEvent from "./PlannerViewEvent";
import PlannerAllEvents from "./PlannerAllEvents";
import PlannerContract from "./PlannerContract";
import PlannerFloorPlan from "./PlannerFloorPlan";

const PlannerApp = () => {
	//USing to page to the selected tab
	const [activePage, setActivePage] = useState("dashboard");
	const [selectedEvent, setSelectedEvent] = useState(null);

	const navigate = useNavigate();

	const navigationItems = [
		{ id: "dashboard", label: "Dashboard", icon: BarChart3 },
		{ id: "events", label: "Events", icon: Calendar },
		{ id: "vendor", label: "Vendor Marketplace", icon: Users },
		{ id: "guest management", label: "Guest Management", icon: Users },
		{ id: "floorplan", label: "Floorplan", icon: MapPin },
		{ id: "documents", label: "Documents", icon: FileText },
	];

	const renderPlaceholderPage = (pageTitle) => (
		<section className="placeholder-page">
			<section className="placeholder-content">
				<section className="placeholder-icon">
					{navigationItems.find((item) => item.id === activePage)
						?.icon &&
						React.createElement(
							navigationItems.find(
								(item) => item.id === activePage
							).icon,
							{ size: 32 }
						)}
				</section>
				<h1 className="placeholder-title">{pageTitle}</h1>
				<p className="placeholder-text">
					This page is coming soon. All the functionality will be
					built here.
				</p>
				<button
					onClick={() => setActivePage("dashboard")}
					className="back-to-dashboard-btn"
				>
					Back to Dashboard
				</button>
			</section>
		</section>
	);

	const renderCurrentPage = () => {
		switch (activePage) {
			case "dashboard":
				return <PlannerDashboard setActivePage={setActivePage} />;
			case "events":
				return (
					<PlannerAllEvents
						setActivePage={setActivePage}
						onSelectEvent={onSelectEvent}
					/>
				);
			case "vendor":
				return (
					<PlannerVendorMarketplace
						setActivePage={setActivePage}
						event={selectedEvent}
					/>
				);
			case "floorplan":
				return <PlannerFloorPlan setActivePage={setActivePage} />;
			case "guest management":
				return renderPlaceholderPage("Guest Management");
			case "documents":
				return <PlannerContract setActivePage={setActivePage} />;
			case "selected-event":
				return (
					<PlannerViewEvent
						event={selectedEvent}
						onOpenMarketplace={onOpenMarketplace}
						setActivePage={setActivePage}
					/>
				);
			default:
				return <PlannerDashboard setActivePage={setActivePage} />;
		}
	};

	const onSelectEvent = (event) => {
		setSelectedEvent(event);
		setActivePage("selected-event");
	};

	const onOpenMarketplace = () => {
		setActivePage("vendor-marketplace");
	};

	return (
		<section className="vendor-app">
			{/* Navigation Bar */}
			<nav className="vendor-navbar">
				<section className="navbar-container">
					<section className="navbar-content">
						<section className="navbar-left">
							<button
								className="home-btn"
								onClick={() => navigate("/home")}
							>
								<ArrowLeft size={20} />
								<section>Home</section>
							</button>

							<section className="vendor-logo">
								<Building2 size={24} />
								<section className="logo-text">
									Planner Home
								</section>
							</section>
						</section>

						<section className="navbar-right">
							{navigationItems.map((item) => {
								const Icon = item.icon;
								return (
									<button
										key={item.id}
										className={`nav-btn ${
											activePage === item.id
												? "active"
												: ""
										}`}
										onClick={() => setActivePage(item.id)}
									>
										<Icon size={18} />
										{item.label}
									</button>
								);
							})}
						</section>
					</section>
				</section>
			</nav>

			{/* Main Content */}
			<main className="vendor-main">{renderCurrentPage()}</main>
		</section>
	);
};

export default PlannerApp;
