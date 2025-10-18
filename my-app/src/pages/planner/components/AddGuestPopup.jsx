import { useState } from "react";
import Popup from "../../general/popup/Popup.jsx";
import { getAuth } from "firebase/auth";
import BASE_URL from "../../../apiConfig";
import "../PlannerViewEvent.css";

export default function AddGuestPopup({ isOpen, onClose, eventId, setGuests, guests }) {
	const auth = getAuth();

	// Local form state
	const [selectedTags, setSelectedTags] = useState([]);
	const [guestForm, setGuestForm] = useState({
		firstname: "",
		lastname: "",
		email: "",
		phone: "",
		dietary: "None",
		notes: "",
		plusOne: 0,
		tags: [],
	});

	const guestTags = [
		"VIP", "Family", "Friend", "Colleague",
		"Plus One", "Speaker", "Sponsor", "Media",
		"Performer", "Staff",
	];

	const dietaryOptions = [
		"None", "Vegetarian", "Vegan", "Gluten-Free",
		"Nut-Free", "Dairy-Free", "Halal", "Kosher",
	];

	// ✅ Moved handleAddGuest here
	const handleAddGuest = async (guest) => {
		try {
			const token = await auth.currentUser.getIdToken();
			const res = await fetch(`${BASE_URL}/planner/events/${eventId}/guests`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(guest),
			});
			if (!res.ok) throw new Error("Failed to add guest");
			setGuests([...guests, guest]);
		} catch (err) {
			console.error(err);
		}
	};

	const handleTagToggle = (tag) => {
		setSelectedTags((prev) => {
			const updated = prev.includes(tag)
				? prev.filter((t) => t !== tag)
				: [...prev, tag];
			setGuestForm({ ...guestForm, tags: updated });
			return updated;
		});
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (guestForm.firstname.trim() && guestForm.email.trim()) {
			const guest = {
				...guestForm,
				tags: selectedTags,
				rsvpStatus: "pending",
			};
			await handleAddGuest(guest);
			resetForm();
			onClose();
		}
	};

	const resetForm = () => {
		setGuestForm({
			firstname: "",
			lastname: "",
			email: "",
			phone: "",
			dietary: "None",
			notes: "",
			plusOne: 0,
			tags: [],
		});
		setSelectedTags([]);
	};

	if (!isOpen) return null;

	return (
		<Popup isOpen={isOpen} onClose={onClose}>
			<section className="guest-popup-content" onClick={(e) => e.stopPropagation()}>
				<section className="guest-popup-header">
					<h3>Add Guest</h3>
					<button className="close-btn" onClick={onClose}>Close</button>
				</section>

				<form onSubmit={handleSubmit} className="guest-form">
					<section className="form-row">
						<label>
							First Name *
							<input
								type="text"
								value={guestForm.firstname}
								onChange={(e) => setGuestForm({ ...guestForm, firstname: e.target.value })}
								required
								autoFocus
							/>
						</label>
						<label>
							Last Name
							<input
								type="text"
								value={guestForm.lastname}
								onChange={(e) => setGuestForm({ ...guestForm, lastname: e.target.value })}
							/>
						</label>
					</section>

					<label>
						Email Address *
						<input
							type="email"
							value={guestForm.email}
							onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })}
							required
						/>
					</label>

					<label>
						Phone
						<input
							type="text"
							value={guestForm.phone}
							onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
						/>
					</label>

					<section className="form-group">
						<label>Dietary Requirement:</label>
						<select
							value={guestForm.dietary}
							onChange={(e) => setGuestForm({ ...guestForm, dietary: e.target.value })}
						>
							{dietaryOptions.map((option) => (
								<option key={option} value={option}>{option}</option>
							))}
						</select>
					</section>

					<section className="form-group">
						<label>Guest Tags:</label>
						<section className="checkbox-group">
							{guestTags.map((tag) => (
								<label key={tag} className="checkbox-label">
									<input
										type="checkbox"
										checked={selectedTags.includes(tag)}
										onChange={() => handleTagToggle(tag)}
									/>
									{tag}
								</label>
							))}
						</section>
					</section>

					<label>
						Notes
						<input
							type="text"
							value={guestForm.notes}
							onChange={(e) => setGuestForm({ ...guestForm, notes: e.target.value })}
						/>
					</label>

					<label className="plusones-label">
						Number of Plus Ones
						<input
							type="number"
							min="0"
							value={guestForm.plusOne}
							onChange={(e) => setGuestForm({ ...guestForm, plusOne: parseInt(e.target.value) || 0 })}
						/>
					</label>

					<section className="form-actions">
						<button type="button" className="cancel-form-btn" onClick={onClose}>
							Cancel
						</button>
						<button type="submit" className="save-form-btn">
							Add Guest
						</button>
					</section>
				</form>
			</section>
		</Popup>
	);
}
