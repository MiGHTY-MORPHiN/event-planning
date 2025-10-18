import { useRef, useState } from "react";
import "../PlannerViewEvent.css";
import { getAuth } from "firebase/auth";
import Papa from "papaparse";
import BASE_URL from "../../../apiConfig";

export default function GuestImportWithValidation({ eventId, onImportComplete, onClose }) {
	const [preview, setPreview] = useState([]);
	const [errors, setErrors] = useState([]);
	const [loading, setLoading] = useState(false);
	const fileInputRef = useRef(null);

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

			if (rowErrors.length > 0)
				validationErrors.push({ row: index + 1, errors: rowErrors });
			else validGuests.push(guest);
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
		try {
			setLoading(true);
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
		} catch (err) {
			console.error(err);
			alert("Failed to import guests. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<section className="guest-import-overlay">
			<section className="guest-import-modal">
				<header className="guest-import-header">
					<h2>Import Guests from CSV</h2>
					<button className="close-btn" onClick={onClose}>×</button>
				</header>

				<section className="guest-import-body">
					<button className="guest-import-select-btn" onClick={handleButtonClick}>
						Select CSV File
					</button>
					<input
						type="file"
						accept=".csv"
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
								disabled={loading}
								className="guest-import-confirm-btn"
								onClick={() => importGuests(preview)}
							>
								{loading
									? "Importing..."
									: `Import ${preview.length} Guests`}
							</button>
						</section>
					)}
				</section>
			</section>
		</section>
	);
}
