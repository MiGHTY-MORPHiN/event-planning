// Code for one vendor list item **********
function ServiceItem({ service, showChat }) {
	return (
		<section className="vendor-item">
			<section className="vendor-info">
				<h4>{service?.serviceName || "Unnamed Service"}</h4>
				<p>Vendored By: {service?.vendorName || "Unknown Vendor"}</p>
			</section>

			<section className="vendor-cost">
				<h4>
					{service.status === "confirmed"
						? "Confirmed Total Cost:"
						: "Estimated Total Cost:"}
				</h4>
				<p>R {service.status === "confirmed" ? service.finalPrice : service.estimatedCost}</p>
			</section>

			<section className="serviceitem-footer">
				<section className="vendor-actions">
					<button className="contact-btn">Contract</button>
					<button
						onClick={() => showChat(service)}
						className="chat-btn"
					>
						Chat
					</button>
					<button className="remove-btn">Remove</button>
				</section>

				<section
					className={
						service.status === "confirmed"
							? "serviceitem-status confirmed"
							: "serviceitem-status pending"
					}
				>
					{service.status}
				</section>
			</section>
		</section>
	);
}
export default ServiceItem;
// End of code for one vendor list item **********
