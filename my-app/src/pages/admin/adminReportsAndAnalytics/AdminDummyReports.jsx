import React from "react";
import {
	BarChart,
	Bar,
	PieChart,
	Pie,
	Cell,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from "recharts";
import "./AdminReports.css";

const data = {
	totals: { vendors: 13, planners: 5, events: 6, guests: 3, services: 5 },
	vendorInsights: {
		statusDistribution: { approved: 9, rejected: 3, unknown: 1 },
		popularCategories: [
			{ category: "js", count: 4 },
			{ category: "Catering", count: 3 },
			{ category: "Florist", count: 1 },
			{ category: "books", count: 1 },
			{ category: "e", count: 1 },
			{ category: "Music & DJ", count: 1 },
			{ category: "wedding-planning", count: 1 },
			{ category: "catering", count: 1 },
		],
		vendorServiceRatio: 0.15384615384615385,
	},
	plannerInsights: { avgEventsPerPlanner: 0 },
	eventInsights: {
		budget: {
			totalBudget: 322000,
			avgBudgetPerEvent: 53666.67,
			totalNegotiatedSpend: 62200,
			avgSpendPerEvent: 10366.67,
		},
		guestStats: {
			overallRsvpBreakdown: { accepted: 1, declined: 1, pending: 1 },
			avgGuestsPerEvent: 0.5,
		},
		categoryPopularity: [
			{ category: "Concert", count: 1 },
			{ category: "Birthday Party", count: 1 },
			{ category: "Conference", count: 1 },
			{ category: "Sports Event", count: 1 },
			{ category: "Birthday party", count: 1 },
			{ category: "Technological", count: 1 },
		],
	},
};

const COLORS = [
	"#4CAF50",
	"#F44336",
	"#FFC107",
	"#2196F3",
	"#9C27B0",
	"#00BCD4",
	"#FF5722",
];

export default function AdminDummyReports() {
	const { eventInsights, plannerInsights, vendorInsights, totals } = data;

	const vendorStatus = Object.entries(vendorInsights.statusDistribution).map(
		([name, value]) => ({ name, value })
	);

	const rsvpBreakdown = Object.entries(
		eventInsights.guestStats.overallRsvpBreakdown
	).map(([name, value]) => ({ name, value }));

	return (
		<div className="reports-container">
			{/* EVENTS OVERVIEW */}
			<section className="report-card">
				<h2>Events Overview</h2>
				<div className="chart-row">
					<div className="chart-box">
						<h4>Category Popularity</h4>
						<ResponsiveContainer width="100%" height={250}>
							<BarChart data={eventInsights.categoryPopularity}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis
									dataKey="category"
									angle={-30}
									textAnchor="end"
									height={70}
								/>
								<YAxis />
								<Tooltip />
								<Bar dataKey="count" fill="#4CAF50" />
							</BarChart>
						</ResponsiveContainer>
					</div>
					<div className="chart-box">
						<h4>RSVP Breakdown</h4>
						<ResponsiveContainer width="100%" height={250}>
							<PieChart>
								<Pie
									data={rsvpBreakdown}
									dataKey="value"
									nameKey="name"
									outerRadius={80}
									label
								>
									{rsvpBreakdown.map((_, i) => (
										<Cell
											key={i}
											fill={COLORS[i % COLORS.length]}
										/>
									))}
								</Pie>
								<Tooltip />
							</PieChart>
						</ResponsiveContainer>
					</div>
				</div>
				<div className="stats">
					<p>
						<strong>Total Budget:</strong> R
						{eventInsights.budget.totalBudget.toLocaleString()}
					</p>
					<p>
						<strong>Average Budget per Event:</strong> R
						{eventInsights.budget.avgBudgetPerEvent.toFixed(2)}
					</p>
					<p>
						<strong>Total Negotiated Spend:</strong> R
						{eventInsights.budget.totalNegotiatedSpend.toLocaleString()}
					</p>
				</div>
			</section>

			{/* PLANNERS OVERVIEW */}
			<section className="report-card">
				<h2>Planners Overview</h2>
				<p>Total Planners: {totals.planners}</p>
				<p>
					Average Events per Planner:{" "}
					{plannerInsights.avgEventsPerPlanner}
				</p>
			</section>

			{/* VENDORS OVERVIEW */}
			<section className="report-card">
				<h2>Vendors Overview</h2>
				<div className="chart-row">
					<div className="chart-box">
						<h4>Status Distribution</h4>
						<ResponsiveContainer width="100%" height={250}>
							<PieChart>
								<Pie
									data={vendorStatus}
									dataKey="value"
									nameKey="name"
									outerRadius={80}
									label
								>
									{vendorStatus.map((_, i) => (
										<Cell
											key={i}
											fill={COLORS[i % COLORS.length]}
										/>
									))}
								</Pie>
								<Tooltip />
							</PieChart>
						</ResponsiveContainer>
					</div>
					<div className="chart-box">
						<h4>Popular Categories</h4>
						<ResponsiveContainer width="100%" height={250}>
							<BarChart data={vendorInsights.popularCategories}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis
									dataKey="category"
									angle={-30}
									textAnchor="end"
									height={70}
								/>
								<YAxis />
								<Tooltip />
								<Bar dataKey="count" fill="#2196F3" />
							</BarChart>
						</ResponsiveContainer>
					</div>
				</div>
				<p>
					Vendor/Service Ratio:{" "}
					{vendorInsights.vendorServiceRatio.toFixed(2)}
				</p>
			</section>
		</div>
	);
}
