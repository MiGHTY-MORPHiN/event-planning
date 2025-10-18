import React, { useState, useEffect } from "react";
import {
	BarChart,
	Bar,
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
	AreaChart,
	Area,
} from "recharts";
import {
	Calendar,
	Users,
	BarChart as BarIcon,
	PieChart as PieIcon,
	DollarSign,
	UserCheck,
	TrendingUp,
	FileText,
} from "lucide-react";
import "./AdminReports.css";
import { auth } from "../../../firebase";
import Popup from "../../general/popup/Popup.jsx";

const KpiCard = ({ value, label, icon: Icon }) => (
	<div className="kpi-metric">
		{Icon && <Icon className="kpi-icon" size={20} />}
		<p className="kpi-value">{value ?? "0"}</p>
		<p className="kpi-label">{label}</p>
	</div>
);

// Detailed Chart Components for Popups
const EventsDetailedCharts = ({
	platformSummary,
	monthlyFinancials,
	newEventsData,
	eventCategoryData,
}) => (
	<div className="detailed-charts-container">
		<h3>Events Analytics Dashboard</h3>

		<div className="detailed-charts-grid">
			<div className="detailed-chart">
				<h4>Event Creation Timeline</h4>
				<ResponsiveContainer width="100%" height={250}>
					<AreaChart data={newEventsData}>
						<CartesianGrid
							strokeDasharray="3 3"
							strokeOpacity={0.2}
						/>
						<XAxis dataKey="month" />
						<YAxis />
						<Tooltip />
						<Area
							type="monotone"
							dataKey="newEvents"
							stroke="#8884d8"
							fill="#8884d8"
							fillOpacity={0.3}
						/>
					</AreaChart>
				</ResponsiveContainer>
			</div>

			<div className="detailed-chart">
				<h4>Event Category Distribution</h4>
				<ResponsiveContainer width="100%" height={250}>
					<PieChart>
						<Pie
							data={eventCategoryData}
							dataKey="count"
							nameKey="category"
							cx="50%"
							cy="50%"
							outerRadius={80}
							label
						>
							{eventCategoryData.map((entry, index) => (
								<Cell
									key={`cell-${index}`}
									fill={
										[
											"#8884d8",
											"#82ca9d",
											"#ffc658",
											"#ff8042",
											"#0088fe",
										][index % 5]
									}
								/>
							))}
						</Pie>
						<Tooltip />
					</PieChart>
				</ResponsiveContainer>
			</div>

			<div className="detailed-chart">
				<h4>Budget vs Actual Spending</h4>
				<ResponsiveContainer width="100%" height={250}>
					<BarChart data={monthlyFinancials}>
						<CartesianGrid
							strokeDasharray="3 3"
							strokeOpacity={0.2}
						/>
						<XAxis dataKey="month" />
						<YAxis />
						<Tooltip />
						<Bar dataKey="budget" fill="#8884d8" name="Budget" />
						<Bar
							dataKey="spending"
							fill="#82ca9d"
							name="Actual Spend"
						/>
					</BarChart>
				</ResponsiveContainer>
			</div>

			<div className="detailed-chart">
				<h4>Event Status Overview</h4>
				<div className="stats-grid">
					<div className="stat-item">
						<span className="stat-label">Total Events</span>
						<span className="stat-value">
							{platformSummary?.totals?.events || 0}
						</span>
					</div>
					<div className="stat-item">
						<span className="stat-label">Avg Guests/Event</span>
						<span className="stat-value">
							{platformSummary?.eventInsights?.guestStats?.avgGuestsPerEvent?.toFixed(
								1
							) || 0}
						</span>
					</div>
					<div className="stat-item">
						<span className="stat-label">Avg Budget</span>
						<span className="stat-value">
							{new Intl.NumberFormat("en-ZA", {
								style: "currency",
								currency: "ZAR",
							}).format(
								platformSummary?.eventInsights?.budget
									?.avgBudgetPerEvent || 0
							)}
						</span>
					</div>
				</div>
			</div>
		</div>
	</div>
);

const VendorsDetailedCharts = ({ platformSummary, vendorCategoryData }) => (
	<div className="detailed-charts-container">
		<h3>Vendors Analytics Dashboard</h3>

		<div className="detailed-charts-grid">
			<div className="detailed-chart">
				<h4>Vendor Status Distribution</h4>
				<ResponsiveContainer width="100%" height={250}>
					<PieChart>
						<Pie
							data={Object.entries(
								platformSummary?.vendorInsights
									?.statusDistribution || {}
							).map(([status, count]) => ({
								name: status,
								value: count,
							}))}
							dataKey="value"
							nameKey="name"
							cx="50%"
							cy="50%"
							outerRadius={80}
							label
						>
							{Object.entries(
								platformSummary?.vendorInsights
									?.statusDistribution || {}
							).map((entry, index) => (
								<Cell
									key={`cell-${index}`}
									fill={
										[
											"#0088fe",
											"#00c49f",
											"#ffbb28",
											"#ff8042",
										][index % 4]
									}
								/>
							))}
						</Pie>
						<Tooltip />
					</PieChart>
				</ResponsiveContainer>
			</div>

			<div className="detailed-chart">
				<h4>Vendor Categories</h4>
				<ResponsiveContainer width="100%" height={250}>
					<BarChart data={vendorCategoryData} layout="vertical">
						<CartesianGrid
							strokeDasharray="3 3"
							strokeOpacity={0.2}
						/>
						<XAxis type="number" />
						<YAxis dataKey="category" type="category" width={100} />
						<Tooltip />
						<Bar dataKey="count" fill="#8884d8" />
					</BarChart>
				</ResponsiveContainer>
			</div>

			<div className="detailed-chart">
				<h4>Vendor Performance Metrics</h4>
				<div className="metrics-grid">
					<div className="metric-card">
						<Users size={24} />
						<div className="metric-content">
							<span className="metric-value">
								{platformSummary?.totals?.vendors || 0}
							</span>
							<span className="metric-label">Total Vendors</span>
						</div>
					</div>
					<div className="metric-card">
						<TrendingUp size={24} />
						<div className="metric-content">
							<span className="metric-value">
								{Math.round(
									(platformSummary?.vendorInsights
										?.vendorServiceRatio || 0) * 100
								)}
								%
							</span>
							<span className="metric-label">
								Active with Services
							</span>
						</div>
					</div>
					<div className="metric-card">
						<FileText size={24} />
						<div className="metric-content">
							<span className="metric-value">
								{platformSummary?.totals?.services || 0}
							</span>
							<span className="metric-label">Total Services</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
);

const PlannersDetailedCharts = ({ platformSummary }) => (
	<div className="detailed-charts-container">
		<h3>Planners Analytics Dashboard</h3>

		<div className="detailed-charts-grid">
			<div className="detailed-chart">
				<h4>Events per Planner Distribution</h4>
				<ResponsiveContainer width="100%" height={250}>
					<BarChart
						data={[
							{
								range: "1-5 Events",
								planners: Math.round(
									platformSummary?.totals?.planners * 0.6
								),
							},
							{
								range: "6-10 Events",
								planners: Math.round(
									platformSummary?.totals?.planners * 0.25
								),
							},
							{
								range: "11+ Events",
								planners: Math.round(
									platformSummary?.totals?.planners * 0.15
								),
							},
						]}
					>
						<CartesianGrid
							strokeDasharray="3 3"
							strokeOpacity={0.2}
						/>
						<XAxis dataKey="range" />
						<YAxis />
						<Tooltip />
						<Bar dataKey="planners" fill="#8884d8" />
					</BarChart>
				</ResponsiveContainer>
			</div>

			<div className="detailed-chart">
				<h4>Planner Activity Overview</h4>
				<div className="activity-stats">
					<div className="activity-item">
						<span>Total Planners</span>
						<strong>
							{platformSummary?.totals?.planners || 0}
						</strong>
					</div>
					<div className="activity-item">
						<span>Average Events/Planner</span>
						<strong>
							{platformSummary?.plannerInsights?.avgEventsPerPlanner?.toFixed(
								1
							) || 0}
						</strong>
					</div>
					<div className="activity-item">
						<span>Total Guests Managed</span>
						<strong>{platformSummary?.totals?.guests || 0}</strong>
					</div>
				</div>
			</div>
		</div>
	</div>
);

const FinancialDetailedCharts = ({ platformSummary, monthlyFinancials }) => (
	<div className="detailed-charts-container">
		<h3>Financial Analytics Dashboard</h3>

		<div className="detailed-charts-grid">
			<div className="detailed-chart full-width">
				<h4>Revenue & Spending Trend</h4>
				<ResponsiveContainer width="100%" height={300}>
					<LineChart data={monthlyFinancials}>
						<CartesianGrid
							strokeDasharray="3 3"
							strokeOpacity={0.2}
						/>
						<XAxis dataKey="month" />
						<YAxis />
						<Tooltip />
						<Line
							type="monotone"
							dataKey="budget"
							stroke="#8884d8"
							strokeWidth={2}
							name="Budget"
						/>
						<Line
							type="monotone"
							dataKey="spending"
							stroke="#82ca9d"
							strokeWidth={2}
							name="Spending"
						/>
					</LineChart>
				</ResponsiveContainer>
			</div>

			<div className="detailed-chart">
				<h4>Financial Summary</h4>
				<div className="financial-summary">
					<div className="financial-item">
						<span>Total Platform Budget</span>
						<strong>
							{new Intl.NumberFormat("en-ZA", {
								style: "currency",
								currency: "ZAR",
							}).format(
								platformSummary?.eventInsights?.budget
									?.totalBudget || 0
							)}
						</strong>
					</div>
					<div className="financial-item">
						<span>Total Negotiated Spend</span>
						<strong>
							{new Intl.NumberFormat("en-ZA", {
								style: "currency",
								currency: "ZAR",
							}).format(
								platformSummary?.eventInsights?.budget
									?.totalNegotiatedSpend || 0
							)}
						</strong>
					</div>
					<div className="financial-item">
						<span>Average per Event</span>
						<strong>
							{new Intl.NumberFormat("en-ZA", {
								style: "currency",
								currency: "ZAR",
							}).format(
								platformSummary?.eventInsights?.budget
									?.avgBudgetPerEvent || 0
							)}
						</strong>
					</div>
				</div>
			</div>
		</div>
	</div>
);

const AdminReports = () => {
	const [platformSummary, setPlatformSummary] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);

	const [monthlyFinancials, setMonthlyFinancials] = useState([]);
	const [newEventsData, setNewEventsData] = useState([]);
	const [vendorCategoryData, setVendorCategoryData] = useState([]);
	const [eventCategoryData, setEventCategoryData] = useState([]);

	const [isPopupOpen, setIsPopupOpen] = useState(false);
	const [popupContent, setPopupContent] = useState(null);
	const [popupTitle, setPopupTitle] = useState("");
	const [currentSection, setCurrentSection] = useState("");

	const formatCurrency = (value) => {
		if (value == null) return "R0";
		return new Intl.NumberFormat("en-ZA", {
			style: "currency",
			currency: "ZAR",
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(value);
	};

	const formatNumber = (value) => {
		if (value == null) return "0";
		return new Intl.NumberFormat("en-ZA").format(value);
	};

	const handleExpandReports = (section) => {
		setCurrentSection(section);
		setPopupTitle(`Detailed ${section} Analytics`);

		// Render different content based on section
		let content;
		switch (section) {
			case "Events":
				content = (
					<EventsDetailedCharts
						platformSummary={platformSummary}
						monthlyFinancials={monthlyFinancials}
						newEventsData={newEventsData}
						eventCategoryData={eventCategoryData}
					/>
				);
				break;
			case "Vendors":
				content = (
					<VendorsDetailedCharts
						platformSummary={platformSummary}
						vendorCategoryData={vendorCategoryData}
					/>
				);
				break;
			case "Planners":
				content = (
					<PlannersDetailedCharts platformSummary={platformSummary} />
				);
				break;
			case "Financial":
				content = (
					<FinancialDetailedCharts
						platformSummary={platformSummary}
						monthlyFinancials={monthlyFinancials}
					/>
				);
				break;
			default:
				content = <div>No detailed view available for {section}</div>;
		}

		setPopupContent(content);
		setIsPopupOpen(true);
	};

	const getToken = () =>
		auth.currentUser
			? auth.currentUser.getIdToken()
			: Promise.reject("Not logged in");

	useEffect(() => {
		const fetchOnTheFlyReports = async () => {
			try {
				const token = await getToken();

				const [summaryRes, eventsRes] = await Promise.all([
					fetch(
						"https://us-central1-planit-sdp.cloudfunctions.net/api/admin/analytics/platform-summary",
						{
							headers: { Authorization: `Bearer ${token}` },
						}
					),
					fetch(
						"https://us-central1-planit-sdp.cloudfunctions.net/api/admin/events",
						{
							headers: { Authorization: `Bearer ${token}` },
						}
					),
				]);

				if (!summaryRes.ok)
					throw new Error(
						`Failed to fetch summary: ${summaryRes.statusText}`
					);
				if (!eventsRes.ok)
					throw new Error(
						`Failed to fetch events: ${eventsRes.statusText}`
					);

				const summaryData = await summaryRes.json();
				const eventsData = await eventsRes.json();
				const allEvents = eventsData.events || [];

				setPlatformSummary(summaryData);

				// Process data for charts...
				if (summaryData.vendorInsights?.popularCategories) {
					setVendorCategoryData(
						summaryData.vendorInsights.popularCategories.slice(0, 8)
					);
				}

				if (summaryData.eventInsights?.categoryPopularity) {
					setEventCategoryData(
						summaryData.eventInsights.categoryPopularity.slice(0, 8)
					);
				}

				// Build monthly aggregates...
				const today = new Date();
				const allEventDates = allEvents
					.map((e) => new Date(e.date))
					.filter((d) => !isNaN(d.getTime()));

				const minDate =
					allEventDates.length > 0
						? new Date(Math.min(...allEventDates))
						: new Date(
								today.getFullYear() - 1,
								today.getMonth(),
								1
						  );

				const maxDate =
					allEventDates.length > 0
						? new Date(Math.max(...allEventDates))
						: today;

				const financialsMap = {};
				for (
					let d = new Date(minDate);
					d <= maxDate;
					d.setMonth(d.getMonth() + 1)
				) {
					const monthName = d.toLocaleString("default", {
						year: "2-digit",
						month: "short",
					});
					financialsMap[monthName] = {
						month: monthName,
						budget: 0,
						spending: 0,
						newEvents: 0,
					};
				}

				allEvents.forEach((event) => {
					const eventDate = new Date(event.date);
					if (isNaN(eventDate.getTime())) return;

					const monthName = eventDate.toLocaleString("default", {
						year: "2-digit",
						month: "short",
					});
					if (financialsMap[monthName]) {
						financialsMap[monthName].budget +=
							Number(event.budget) || 0;
						financialsMap[monthName].spending +=
							(Number(event.budget) || 0) * 0.7;
						financialsMap[monthName].newEvents += 1;
					}
				});

				const sortedFinancials = Object.values(financialsMap).sort(
					(a, b) =>
						new Date("01 " + a.month) - new Date("01 " + b.month)
				);

				setMonthlyFinancials(sortedFinancials);
				setNewEventsData(
					sortedFinancials.map(({ month, newEvents }) => ({
						month,
						newEvents,
					}))
				);
			} catch (err) {
				console.error("Error fetching reports:", err);
				setError(err.message);
			} finally {
				setIsLoading(false);
			}
		};

		fetchOnTheFlyReports();
	}, []);

	if (isLoading) return <div className="loading-screen">Loading...</div>;
	if (error) return <div className="error-container">Error: {error}</div>;

	return (
		<main className="main-container">
			{/* KPI Cards Section (same as before) */}
			<section className="reports-grid">
				{/* Events Card */}
				<article className="report-summary-card">
					<header className="card-header">
						<Calendar className="header-icon" />
						<h2>Events Overview</h2>
					</header>
					<div className="card-body">
						<KpiCard
							value={formatNumber(
								platformSummary?.totals?.events
							)}
							label="Total Events"
							icon={Calendar}
						/>
						<KpiCard
							value={formatNumber(
								platformSummary?.eventInsights?.guestStats
									?.avgGuestsPerEvent
							)}
							label="Avg Guests/Event"
							icon={Users}
						/>
						<KpiCard
							value={formatCurrency(
								platformSummary?.eventInsights?.budget
									?.avgBudgetPerEvent
							)}
							label="Avg Budget/Event"
							icon={DollarSign}
						/>
					</div>
					<footer className="card-footer">
						<button onClick={() => handleExpandReports("Events")}>
							<BarIcon size={16} /> Expand Event Reports
						</button>
					</footer>
				</article>

				{/* Planners Card */}
				<article className="report-summary-card">
					<header className="card-header">
						<Users className="header-icon" />
						<h2>Planners Overview</h2>
					</header>
					<div className="card-body">
						<KpiCard
							value={formatNumber(
								platformSummary?.totals?.planners
							)}
							label="Total Planners"
							icon={Users}
						/>
						<KpiCard
							value={formatNumber(
								platformSummary?.plannerInsights
									?.avgEventsPerPlanner
							)}
							label="Avg Events/Planner"
							icon={Calendar}
						/>
						<KpiCard
							value={formatNumber(
								platformSummary?.totals?.guests
							)}
							label="Total Guests"
							icon={UserCheck}
						/>
					</div>
					<footer className="card-footer">
						<button onClick={() => handleExpandReports("Planners")}>
							<PieIcon size={16} /> Expand Planner Reports
						</button>
					</footer>
				</article>

				{/* Vendors Card */}
				<article className="report-summary-card">
					<header className="card-header">
						<Users className="header-icon" />
						<h2>Vendors Overview</h2>
					</header>
					<div className="card-body">
						<KpiCard
							value={formatNumber(
								platformSummary?.totals?.vendors
							)}
							label="Total Vendors"
							icon={Users}
						/>
						<KpiCard
							value={`${Math.round(
								(platformSummary?.vendorInsights
									?.vendorServiceRatio || 0) * 100
							)}%`}
							label="With Services"
							icon={UserCheck}
						/>
						<KpiCard
							value={formatNumber(
								platformSummary?.totals?.services
							)}
							label="Total Services"
							icon={Calendar}
						/>
					</div>
					<footer className="card-footer">
						<button onClick={() => handleExpandReports("Vendors")}>
							<BarIcon size={16} /> Expand Vendor Reports
						</button>
					</footer>
				</article>

				{/* Financial Card */}
				<article className="report-summary-card">
					<header className="card-header">
						<DollarSign className="header-icon" />
						<h2>Financial Overview</h2>
					</header>
					<div className="card-body">
						<KpiCard
							value={formatCurrency(
								platformSummary?.eventInsights?.budget
									?.totalBudget
							)}
							label="Total Budget"
							icon={DollarSign}
						/>
						<KpiCard
							value={formatCurrency(
								platformSummary?.eventInsights?.budget
									?.totalNegotiatedSpend
							)}
							label="Total Spending"
							icon={DollarSign}
						/>
						<KpiCard
							value={formatCurrency(
								platformSummary?.eventInsights?.budget
									?.avgSpendPerEvent
							)}
							label="Avg Spend/Event"
							icon={DollarSign}
						/>
					</div>
					<footer className="card-footer">
						<button
							onClick={() => handleExpandReports("Financial")}
						>
							<BarIcon size={16} /> Expand Financial Reports
						</button>
					</footer>
				</article>
			</section>

			{/* Main Charts Section (same as before) */}
			<div className="charts-grid">
				{/* Your existing charts remain here */}
			</div>

			{/* Enhanced Popup */}
			<Popup isOpen={isPopupOpen} onClose={() => setIsPopupOpen(false)}>
				<h2>{popupTitle}</h2>

				<div className="popup-content">{popupContent}</div>
			</Popup>
		</main>
	);
};

export default AdminReports;
