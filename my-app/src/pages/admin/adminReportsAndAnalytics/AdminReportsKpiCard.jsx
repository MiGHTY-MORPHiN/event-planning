import React from "react";

const KpiCard = ({ value, label, icon: Icon }) => (
	<figure className="admin-report-kpi-metric">
		<div className="admin-report-kpi-header">
			{Icon && (
				<Icon
					className="admin-report-kpi-icon"
					size={20}
					aria-hidden="true"
				/>
			)}
			<figcaption className="admin-report-kpi-label">{label}</figcaption>
		</div>
		<strong className="admin-report-kpi-value">{value ?? "0"}</strong>
	</figure>
);

export default KpiCard;
