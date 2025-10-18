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
import {onSave, onClose} from "./UpdateData.js"

const sendReminder = async (guestId, eventId) => {
		const auth = getAuth();
		const user = auth.currentUser;
		const token = await user.getIdToken(true);

		const res = await fetch(
			`${BASE_URL}/planner/${eventId}/${guestId}/sendReminder`,
			{
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			}
		);

		if (!res.ok) {
			alert("Unable to send reminder");
			console.log("Unable to send reminder");
		} else {
			alert("Reminder sent successfully");
		}
	};

function AddGuestPopup({ isOpen, onClose, onSave }) {
	const guestTags = [
		"VIP",
		"Family",
		"Friend",
		"Colleague",
		"Plus One",
		"Speaker",
		"Sponsor",
		"Media",
		"Performer",
		"Staff",
	];

	const dietaryOptions = [
		"None",
		"Vegetarian",
		"Vegan",
		"Gluten-Free",
		"Nut-Free",
		"Dairy-Free",
		"Halal",
		"Kosher",
	];

	const [selectedTags, setSelectedTags] = useState([]);
	const [dietary, setDietary] = useState("None");

	const [guestForm, setGuestForm] = useState({
		firstname: "",
		lastname: "",
		email: "",
		plusOne: 0,
	});

	const handleTagToggle = (tag) => {
		setSelectedTags((prev) => {
			const updatedTags = prev.includes(tag)
				? prev.filter((t) => t !== tag)
				: [...prev, tag];

			setGuestForm({ ...guestForm, tags: updatedTags });

			console.log(updatedTags);
			return updatedTags;
		});
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		if (guestForm.firstname.trim() && guestForm.email.trim()) {
			onSave({
				...guestForm,
				rsvpStatus: "pending",
			});
			setGuestForm({
				firstname: "",
				lastname: "",
				email: "",
				plusOne: 0,
			});
			onClose();
		}
	};

	const handleClose = () => {
		setGuestForm({
			firstname: "",
			lastname: "",
			email: "",
			plusOne: 0,
		});
		onClose();
	};

	if (!isOpen) return null;

	return (
		<Popup isOpen={isOpen} onClose={handleClose}>
			<section
				className="guest-popup-content"
				onClick={(e) => e.stopPropagation()}
			>
				<section className="guest-popup-header">
					<h3>Add Guest</h3>
					<button className="close-btn" onClick={handleClose}>
						Close
					</button>
				</section>
				<section onSubmit={handleSubmit} className="guest-form">
					<section className="form-row">
						<label>
							First Name *
							<input
								type="text"
								value={guestForm.firstname}
								onChange={(e) =>
									setGuestForm({
										...guestForm,
										firstname: e.target.value,
									})
								}
								required
								autoFocus
							/>
						</label>
						<label>
							Last Name
							<input
								type="text"
								value={guestForm.lastname}
								onChange={(e) =>
									setGuestForm({
										...guestForm,
										lastname: e.target.value,
									})
								}
							/>
						</label>
					</section>
					<label>
						Email Address *
						<input
							type="email"
							value={guestForm.email}
							onChange={(e) =>
								setGuestForm({
									...guestForm,
									email: e.target.value,
								})
							}
							required
						/>
					</label>
					<label>
						Phone
						<input
							type="text"
							checked={guestForm.plusOne}
							onChange={(e) =>
								setGuestForm({
									...guestForm,
									plusOne: e.target.value,
								})
							}
						/>
					</label>

					<section className="form-group">
						<label>Dietary Requirement:</label>
						<select
							value={dietary}
							onChange={(e) =>
								setGuestForm({
									...guestForm,
									dietary: e.target.value,
								})
							}
						>
							{dietaryOptions.map((option) => (
								<option key={option} value={option}>
									{option}
								</option>
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
							checked={guestForm.plusOne}
							onChange={(e) =>
								setGuestForm({
									...guestForm,
									plusOne: e.target.value,
								})
							}
						/>
					</label>
					<label className="plusones-label">
						Number of Plus Ones
						<input
							type="number"
							checked={guestForm.plusOne}
							onChange={(e) =>
								setGuestForm({
									...guestForm,
									plusOne: e.target.value,
								})
							}
						/>
					</label>
					<section className="form-actions">
						<button
							type="button"
							className="cancel-form-btn"
							onClick={handleClose}
						>
							Cancel
						</button>
						<button
							type="submit"
							className="save-form-btn"
							onClick={handleSubmit}
						>
							Add Guest
						</button>
					</section>
				</section>
			</section>
		</Popup>
	);
}
//End of code for the pop up when manually adding a guest **********

//Code for Guest RSVP Summary Bar **********
function GuestRSVPSummary({ guests }) {
	const totalGuests = guests.length;
	const confirmedGuests = guests.filter(
		(g) => g.rsvpStatus === "accepted"
	).length;
	const pendingGuests = guests.filter(
		(g) => g.rsvpStatus === "pending"
	).length;
	const declinedGuests = guests.filter(
		(g) => g.rsvpStatus === "declined"
	).length;

	return (
		<section className="rsvp-summary">
			<h4>RSVP Status</h4>
			<section className="rsvp-stats">
				<section className="rsvp-stat confirmed">
					<span data-testid="confirmed-count" className="rsvp-number">
						{confirmedGuests}
					</span>
					<span className="rsvp-label">Confirmed</span>
				</section>
				<section className="rsvp-stat pending">
					<span data-testid="pending-count" className="rsvp-number">
						{pendingGuests}
					</span>
					<span className="rsvp-label">Pending</span>
				</section>
				<section className="rsvp-stat declined">
					<span data-testid="declined-count" className="rsvp-number">
						{declinedGuests}
					</span>
					<span className="rsvp-label">Declined</span>
				</section>
			</section>
			<section className="rsvp-progress">
				<section
					className="rsvp-progress-bar"
					style={{
						width: `${
							totalGuests > 0
								? (confirmedGuests / totalGuests) * 100
								: 0
						}%`,
					}}
				></section>
			</section>
			<p className="rsvp-percentage">
				{totalGuests > 0
					? Math.round((confirmedGuests / totalGuests) * 100)
					: 0}
				% confirmed
			</p>
		</section>
	);
}
//End of code for guest RSVP summary bar *********



//Code for importing a guest list
function GuestImportWithValidation({ eventId, onImportComplete, onClose }) {
	const [preview, setPreview] = useState([]);
	const [errors, setErrors] = useState([]);
	const fileInputRef = useRef(null);

	// Trigger the hidden file input
	const handleButtonClick = () => fileInputRef.current.click();

	const validateGuests = (guests) => {
		const validationErrors = [];
		const validGuests = [];

		guests.forEach((guest, index) => {
			const rowErrors = [];

			if (!guest.email) rowErrors.push("Email required");
			else if (!/\S+@\S+\.\S+/.test(guest.email))
				rowErrors.push("Invalid email");

			if (!guest.firstname) rowErrors.push("First name required");

			if (rowErrors.length > 0) {
				validationErrors.push({ row: index + 1, errors: rowErrors });
			} else {
				validGuests.push(guest);
			}
		});

		setErrors(validationErrors);
		return validGuests;
	};

	const processFile = (event) => {
		const file = event.target.files[0];
		if (!file) return;

		Papa.parse(file, {
			header: true,
			skipEmptyLines: true,
			transformHeader: (header) =>
				header.trim().toLowerCase().replace(/\s+/g, ""),
			complete: (results) => {
				const validGuests = validateGuests(results.data);
				setPreview(validGuests);
			},
		});
	};

	const importGuests = async (guestData) => {
		const auth = getAuth();
		const token = await auth.currentUser.getIdToken();

		const response = await fetch(
			`${BASE_URL}/planner/events/${eventId}/guests/import`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ guests: guestData }),
			}
		);

		if (!response.ok) throw new Error("Import failed");
		onImportComplete();
	};

	return (
		<section className="guest-import-overlay">
			<section className="guest-import-modal">
				<header className="guest-import-header">
					<h2>Import Guests from CSV</h2>
					<button className="close-btn" onClick={onClose}>
						x
					</button>
				</header>

				<section className="guest-import-body">
					<button
						className="guest-import-select-btn"
						onClick={handleButtonClick}
					>
						Select CSV File
					</button>
					<input
						type="file"
						accept=".csv,.xlsx"
						ref={fileInputRef}
						className="guest-import-file-input"
						onChange={processFile}
					/>

					{errors.length > 0 && (
						<section className="guest-import-errors">
							<h4>Validation Errors:</h4>
							{errors.map((error) => (
								<p key={error.row}>
									Row {error.row}: {error.errors.join(", ")}
								</p>
							))}
						</section>
					)}

					{preview.length > 0 && (
						<section className="guest-import-preview">
							<h4>Preview ({preview.length} guests)</h4>
							<table className="guest-import-table">
								<thead>
									<tr>
										<th>First Name</th>
										<th>Last Name</th>
										<th>Email</th>
									</tr>
								</thead>
								<tbody>
									{preview.slice(0, 5).map((guest, i) => (
										<tr key={i}>
											<td>{guest.firstname}</td>
											<td>{guest.lastname}</td>
											<td>{guest.email}</td>
										</tr>
									))}
								</tbody>
							</table>
							<button
								className="guest-import-confirm-btn"
								onClick={() => importGuests(preview)}
							>
								Import {preview.length} Guests
							</button>
						</section>
					)}
				</section>
			</section>
		</section>
	);
}

export default function GuestsList({ guests, onSave, setShowAddGuestPopup, eventId }) {
  return (
    <section>
      <AddGuestPopup
        isOpen={true}
        onClose={() => setShowAddGuestPopup(false)}
        onSave={onSave}
      />

      <section className="guests-list">
        {guests.length > 0 ? (
          guests.map((guest) => (
            <section key={guest.id} className="guest-item">
              <section className="guest-info">
                <h4>{guest.firstname} {guest.lastname}</h4>
                <p>{guest.email}</p>
                <p>Plus Ones: {guest.plusOne}</p>
              </section>
              <section className="guest-rsvp">
                <span className={`rsvp-badge ${guest.rsvpStatus}`}>
                  {guest.rsvpStatus === "accepted"
                    ? "Confirmed"
                    : guest.rsvpStatus === "declined"
                    ? "Declined"
                    : "Pending"}
                </span>
              </section>
              <section className="guest-actions">
                <button
                  className="send-reminder-btn"
                  onClick={() => sendReminder(guest.id, eventId)}
                >
                  Send Reminder
                </button>
                <button className="edit-guest-btn">Edit</button>
              </section>
            </section>
          ))
        ) : (
          <section className="empty-state">
            <p>No guests added yet. Click "Add Guest" to invite people to your event.</p>
          </section>
        )}
      </section>
    </section>
  );
}
