import "../PlannerViewEvent.css";

// Guest RSVP Summary Bar
export default function GuestRSVPSummary({ guests = [] }) {
	const total = guests.length;
	const confirmed = guests.filter((g) => g.rsvpStatus === "accepted").length;
	const pending = guests.filter((g) => g.rsvpStatus === "pending").length;
	const declined = guests.filter((g) => g.rsvpStatus === "declined").length;

	const confirmedPercent =
		total > 0 ? Math.round((confirmed / total) * 100) : 0;

	return (
		<section className="rsvp-summary">
			<h4>RSVP Status</h4>

			<section className="rsvp-stats">
				<section className="rsvp-stat confirmed">
					<span data-testid="confirmed-count" className="rsvp-number">
						{confirmed}
					</span>
					<span className="rsvp-label">Confirmed</span>
				</section>

				<section className="rsvp-stat pending">
					<span data-testid="pending-count" className="rsvp-number">
						{pending}
					</span>
					<span className="rsvp-label">Pending</span>
				</section>

				<section className="rsvp-stat declined">
					<span data-testid="declined-count" className="rsvp-number">
						{declined}
					</span>
					<span className="rsvp-label">Declined</span>
				</section>
			</section>

			<section className="rsvp-progress">
				<section
					className="rsvp-progress-bar"
					style={{
						width: `${total > 0 ? (confirmed / total) * 100 : 0}%`,
					}}
				></section>
			</section>

			<p className="rsvp-percentage">{confirmedPercent}% confirmed</p>
		</section>
	);
}
