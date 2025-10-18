import { useRef, useEffect, useState } from "react";
import "./PlannerViewEvent.css";
import { getAuth } from "firebase/auth";
import Papa from "papaparse";
import ChatComponent from "./ChatComponent.jsx";
import Popup from "../general/popup/Popup.jsx";
import LocationPicker from "./LocationPicker";
import PlannerVendorMarketplace from "./PlannerVendorMarketplace.jsx";
import PlannerTasks from "./PlannerTasks.jsx";
import { format } from "date-fns";
import BronzeFury from "./BronzeFury.jsx";
import BASE_URL from "../../apiConfig";
import PlannerSchedules from "./PlannerSchedules.jsx";

//Code for one vendor list item **********
function ServiceItem({ service, showChat }) {
	return (
		<section className="vendor-item">
			<section className="vendor-info">
				<h4>{service.serviceName}</h4>
				<p>Vendored By: {service.vendorName}</p>
			</section>
			{service.status === "confirmed" ? (
				<section className="vendor-cost">
					<h4>Confirmed Total Cost: </h4>
					<p>R {service.finalPrice}</p>
				</section>
			) : (
				<section className="vendor-cost">
					<h4>Estimated Total Cost: </h4>
					<p>R {service.estimatedCost}</p>
				</section>
			)}

			<section className="serviceitem-footer">
				<section className="vendor-actions">
					<button className="contact-btn">Contract</button>
					<button
						onClick={() => showChat(service)}
						className="remove-btn"
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
					${service.status}
				</section>
			</section>
		</section>
	);
}
//End of code for one vendor list item **********


// Vendor Popup Component
function VendorPopup({ isOpen, onClose }) {
	if (!isOpen) return null;

	return (
		<Popup isOpen={isOpen} onClose={onClose}>
			<PlannerVendorMarketplace
				onClose={onClose}
				// Add any other props your PlannerVendorMarketplace needs
			/>
		</Popup>
	);
}