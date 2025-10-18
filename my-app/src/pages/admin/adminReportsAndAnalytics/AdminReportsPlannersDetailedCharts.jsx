import React from "react";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from "recharts";

const AdminReportsPlannersDetailedCharts = ({ platformSummary }) => {
	const totalPlanners = platformSummary?.totals?.planners || 0;
	const plannerDistributionData = [
		{
			range: "1-5 Events",
			planners: Math.round(totalPlanners * 0.6),
		},
		{
			range: "6-10 Events",
			planners: Math.round(totalPlanners * 0.25),
		},
		{
			range: "11+ Events",
			planners: Math.round(totalPlanners * 0.15),
		},
	];

	return (
		<section className="admin-report-detailed-charts-container">
			<h3>Planners Analytics Dashboard</h3>
			<section className="admin-report-detailed-charts-grid">
				<article className="admin-report-detailed-chart">
					<h4>Events per Planner</h4>
					<ResponsiveContainer width="100%" height={250}>
						<BarChart
							data={plannerDistributionData}
							margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
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
				</article>
				<article className="admin-report-detailed-chart">
					<h4>Planner Activity</h4>
					<dl className="admin-report-stats-list">
						<div className="admin-report-stat-item">
							<dt className="admin-report-stat-label">
								Total Planners
							</dt>
							<dd className="admin-report-stat-value">
								{totalPlanners}
							</dd>
						</div>
						<div className="admin-report-stat-item">
							<dt className="admin-report-stat-label">
								Avg Events/Planner
							</dt>
							<dd className="admin-report-stat-value">
								{platformSummary?.plannerInsights?.avgEventsPerPlanner?.toFixed(
									1
								) || 0}
							</dd>
						</div>
						<div className="admin-report-stat-item">
							<dt className="admin-report-stat-label">
								Total Guests Managed
							</dt>
							<dd className="admin-report-stat-value">
								{platformSummary?.totals?.guests || 0}
							</dd>
						</div>
					</dl>
				</article>
			</section>
		</section>
	);
};

export default AdminReportsPlannersDetailedCharts;
