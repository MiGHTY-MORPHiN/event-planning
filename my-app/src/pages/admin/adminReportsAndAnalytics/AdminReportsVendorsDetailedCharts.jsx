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
	ResponsiveContainer,
} from "recharts";

const COLORS = ["#0088fe", "#00c49f", "#ffbb28", "#ff8042"];

const AdminReportsVendorsDetailedCharts = ({
	platformSummary,
	vendorCategoryData,
}) => {
	const statusData = Object.entries(
		platformSummary?.vendorInsights?.statusDistribution || {}
	).map(([status, count]) => ({ name: status, value: count }));

	return (
		<section className="admin-report-detailed-charts-container">
			<h3>Vendors Analytics Dashboard</h3>
			<section className="admin-report-detailed-charts-grid">
				<article className="admin-report-detailed-chart">
					<h4>Vendor Status Distribution</h4>
					<ResponsiveContainer width="100%" height={250}>
						<PieChart>
							<Pie
								data={statusData}
								dataKey="value"
								nameKey="name"
								cx="50%"
								cy="50%"
								outerRadius={80}
								label
							>
								{statusData.map((entry, index) => (
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
					<h4>Vendor Categories</h4>
					<ResponsiveContainer width="100%" height={250}>
						<BarChart
							data={vendorCategoryData}
							layout="vertical"
							margin={{ top: 5, right: 20, left: 30, bottom: 5 }}
						>
							<CartesianGrid
								strokeDasharray="3 3"
								strokeOpacity={0.2}
							/>
							<XAxis type="number" />
							<YAxis
								dataKey="category"
								type="category"
								width={80}
							/>
							<Tooltip />
							<Bar dataKey="count" fill="#8884d8" />
						</BarChart>
					</ResponsiveContainer>
				</article>
				<article className="admin-report-detailed-chart">
					<h4>Vendor Performance</h4>
					<dl className="admin-report-stats-list">
						<div className="admin-report-stat-item">
							<dt className="admin-report-stat-label">
								Total Vendors
							</dt>
							<dd className="admin-report-stat-value">
								{platformSummary?.totals?.vendors || 0}
							</dd>
						</div>
						<div className="admin-report-stat-item">
							<dt className="admin-report-stat-label">
								Active with Services
							</dt>
							<dd className="admin-report-stat-value">{`${Math.round(
								(platformSummary?.vendorInsights
									?.vendorServiceRatio || 0) * 100
							)}%`}</dd>
						</div>
						<div className="admin-report-stat-item">
							<dt className="admin-report-stat-label">
								Total Services
							</dt>
							<dd className="admin-report-stat-value">
								{platformSummary?.totals?.services || 0}
							</dd>
						</div>
					</dl>
				</article>
			</section>
		</section>
	);
};

export default AdminReportsVendorsDetailedCharts;
