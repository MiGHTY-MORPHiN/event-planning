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