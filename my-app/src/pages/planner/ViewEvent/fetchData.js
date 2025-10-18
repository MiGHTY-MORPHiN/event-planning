const fetchGuests = async () => {
		try {
			const auth = getAuth();
			const user = auth.currentUser;
			const token = await user.getIdToken(true);

			const res = await fetch(`${BASE_URL}/planner/${eventId}/guests`, {
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			});

			if (!res.ok) throw new Error("Failed to fetch guests");

			const data = await res.json();
			return data.guests || [];
		} catch (err) {
			console.error(err);
			alert("Unable to fetch guests");
			return [];
		}
	};

	const fetchVendors = async () => {
		const auth = getAuth();
		const user = auth.currentUser;
		const token = await user.getIdToken(true);

		const res = await fetch(`${BASE_URL}/planner/${eventId}/vendors`, {
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
		});
		if (!res.ok) return [];

		const data = await res.json();
		return data.vendors || [];
	};

    const fetchServices = async () => {
		const auth = getAuth();
		const user = auth.currentUser;
		const token = await user.getIdToken(true);

		try {
			const res = await fetch(`${BASE_URL}/planner/${eventId}/services`, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!res.ok) return [];

			const data = await res.json();
			console.log("Data: ", data);
			return data.services;
		} catch (err) {
			console.error("Failed to fetch services");
		}
	};

export default {fetchGuests, fetchVendors, fetchServices};