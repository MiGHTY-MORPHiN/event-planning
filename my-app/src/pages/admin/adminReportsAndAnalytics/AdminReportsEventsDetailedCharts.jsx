import React from "react";
import {
	BarChart,
	Bar,
	AreaChart,
	Area,
	PieChart,
	Pie,
	Cell,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "./formatters";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe"];

const AdminReportsEventsDetailedCharts = ({
	platformSummary,
	monthlyFinancials,
	newEventsData,
	eventCategoryData,
}) => (
	<section className="admin-report-detailed-charts-container">
		<h3>Events Analytics Dashboard</h3>
		<section className="admin-report-detailed-charts-grid">
			<article className="admin-report-detailed-chart">
				<h4>Event Creation Timeline</h4>
				<ResponsiveContainer width="100%" height={250}>
					<AreaChart
						data={newEventsData}
						margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
					>
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
			</article>
			<article className="admin-report-detailed-chart">
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
									fill={COLORS[index % COLORS.length]}
								/>
							))}
						</Pie>
						<Tooltip />
					</PieChart>
				</ResponsiveContainer>
			</article>
			<article className="admin-report-detailed-chart">
				<h4>Budget vs Actual Spending</h4>
				<ResponsiveContainer width="100%" height={250}>
					<BarChart
						data={monthlyFinancials}
						margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
					>
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
			</article>
			<article className="admin-report-detailed-chart">
				<h4>Event Status Overview</h4>
				<dl className="admin-report-stats-list">
					<div className="admin-report-stat-item">
						<dt className="admin-report-stat-label">
							Total Events
						</dt>
						<dd className="admin-report-stat-value">
							{platformSummary?.totals?.events || 0}
						</dd>
					</div>
					<div className="admin-report-stat-item">
						<dt className="admin-report-stat-label">
							Avg Guests/Event
						</dt>
						<dd className="admin-report-stat-value">
							{platformSummary?.eventInsights?.guestStats?.avgGuestsPerEvent?.toFixed(
								1
							) || 0}
						</dd>
					</div>
					<div className="admin-report-stat-item">
						<dt className="admin-report-stat-label">Avg Budget</dt>
						<dd className="admin-report-stat-value">
							{formatCurrency(
								platformSummary?.eventInsights?.budget
									?.avgBudgetPerEvent
							)}
						</dd>
					</div>
				</dl>
			</article>
		</section>
	</section>
);

export default AdminReportsEventsDetailedCharts;
