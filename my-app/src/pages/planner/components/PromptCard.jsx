import "../PlannerViewEvent.css";

// Code for prompt card (No Guests, No Vendors, No Tasks)
export default function PromptCard({ title, message, buttonText, onClick }) {
	return (
		<section className="prompt-card">
			<section className="prompt-content">
				<h4>{title}</h4>
				<p>{message}</p>
				<button className="prompt-btn" onClick={onClick}>
					{buttonText}
				</button>
			</section>
		</section>
	);
}
// End of code for prompt card
