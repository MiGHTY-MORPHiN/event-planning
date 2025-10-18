const updateEventData = async () => {
		const auth = getAuth();
		const user = auth.currentUser;
		const token = await user.getIdToken(true);

		const res = await fetch(`${BASE_URL}/planner/me/${eventId}`, {
			method: "PUT",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(eventData),
		});
		if (!res.ok) console.log("Update Failed");
		console.log("Updated Event.");
	};

    // UPDATED: handleSave with conflict checking
	const handleSave = async () => {
		try {
			const auth = getAuth();
			const token = await auth.currentUser.getIdToken(true);

			// Prepare update data with location coordinates
			const updateData = {
				...editForm,
				locationCoordinates: locationData.coordinates,
			};

			const res = await fetch(`${BASE_URL}/planner/me/${eventId}`, {
				method: "PUT",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(updateData),
			});

			const data = await res.json();

			if (!res.ok) {
				if (res.status === 409) {
					// Location conflict detected
					const conflictMsg = `Location Conflict Detected!\n\n${
						data.message
					}\n\nConflicting Event: ${
						data.conflictingEvent?.name
					}\nDate: ${new Date(
						data.conflictingEvent?.date
					).toLocaleString()}\nLocation: ${
						data.conflictingEvent?.location
					}`;
					alert(conflictMsg);
					return;
				}
				throw new Error(data.message || "Failed to update event");
			}

			// Update local state with new data including coordinates
			setEventData({
				...editForm,
				locationCoordinates: locationData.coordinates,
			});
			setIsEditing(false);
			alert("Event updated successfully!");
		} catch (err) {
			console.error("Error saving event:", err);
			alert(`Error updating event: ${err.message}`);
		}
	};

	const handleCancel = () => {
		setEditForm({ ...eventData });
		// Reset location data to original
		if (eventData.locationCoordinates) {
			const coords = eventData.locationCoordinates._latitude
				? {
						lat: eventData.locationCoordinates._latitude,
						lng: eventData.locationCoordinates._longitude,
				  }
				: eventData.locationCoordinates;

			setLocationData({
				coordinates: coords,
				address: eventData.location || "",
			});
		}
		setIsEditing(false);
	};

const onSave = async (guestInfo) => {
		const auth = getAuth();
		const user = auth.currentUser;
		const token = await user.getIdToken(true);

		const res = await fetch(`${BASE_URL}/planner/me/${eventId}/guests`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(guestInfo),
		});
		if (!res.ok) return "Guest Creation Failed";
		console.log("Guest creation done.");
		await loadGuests();
	};

    export { fetchGuests, fetchVendors, fetchServices, handleCancel, handleSave, sendReminder, updateEventData, onSave};