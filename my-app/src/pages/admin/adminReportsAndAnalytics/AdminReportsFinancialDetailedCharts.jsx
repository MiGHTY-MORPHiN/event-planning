import React from "react";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "./formatters";

const AdminReportsFinancialDetailedCharts = ({
	platformSummary,
	monthlyFinancials,
}) => (
	<section className="admin-report-detailed-charts-container">
		<h3>Financial Analytics Dashboard</h3>
		<section className="admin-report-detailed-charts-grid">
			<article className="admin-report-detailed-chart full-width">
				<h4>Revenue & Spending Trend</h4>
				<ResponsiveContainer width="100%" height={300}>
					<LineChart
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
			</article>
			<article className="admin-report-detailed-chart full-width">
				<h4>Financial Summary</h4>
				<dl className="admin-report-stats-list">
					<div className="admin-report-stat-item">
						<dt className="admin-report-stat-label">
							Total Platform Budget
						</dt>
						<dd className="admin-report-stat-value">
							{formatCurrency(
								platformSummary?.eventInsights?.budget
									?.totalBudget
							)}
						</dd>
					</div>
					<div className="admin-report-stat-item">
						<dt className="admin-report-stat-label">
							Total Negotiated Spend
						</dt>
						<dd className="admin-report-stat-value">
							{formatCurrency(
								platformSummary?.eventInsights?.budget
									?.totalNegotiatedSpend
							)}
						</dd>
					</div>
					<div className="admin-report-stat-item">
						<dt className="admin-report-stat-label">
							Average Spend per Event
						</dt>
						<dd className="admin-report-stat-value">
							{formatCurrency(
								platformSummary?.eventInsights?.budget
									?.avgSpendPerEvent
							)}
						</dd>
					</div>
				</dl>
			</article>
		</section>
	</section>
);

export default AdminReportsFinancialDetailedCharts;
