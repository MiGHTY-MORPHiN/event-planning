import React from "react";
import "./Popup.css";

function Popup({ isOpen, onClose, children }) {
	if (!isOpen) return null;

	return (
		<div className="popup-overlay">
			<section
				className="popup-content"
				onClick={(e) => e.stopPropagation()}
			>
				<button className="popup-close-button" onClick={onClose}>
					Close
				</button>
				{children}
			</section>
		</div>
	);
}

export default Popup;
