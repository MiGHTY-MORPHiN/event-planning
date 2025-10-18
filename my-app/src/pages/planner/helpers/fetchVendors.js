import { getAuth } from "firebase/auth";

/**
 * Fetch vendors for a specific event.
 * @param {string} eventId - The ID of the event to fetch vendors for.
 * @returns {Promise<Array>} vendors - Returns an array of vendor objects.
 */
export async function fetchVendors(eventId) {
  if (!eventId) {
    console.warn("fetchVendors called without an eventId");
    return [];
  }

  try {
    const auth = getAuth();
    let user = auth.currentUser;

    // Wait for Firebase Auth to initialize
    while (!user) {
      await new Promise((res) => setTimeout(res, 50));
      user = getAuth().currentUser;
    }

    const token = user ? await user.getIdToken(true) : "";
    console.log(`Fetching vendors for event ${eventId}`);

    const res = await fetch(
      `https://us-central1-planit-sdp.cloudfunctions.net/api/planner/${eventId}/vendors`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error(
        `Fetch vendors failed with status ${res.status}: ${text.slice(0, 100)}...`
      );
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    console.log("Vendors fetched:", data);

    if (data.message === "No vendors found for this event") {
      return [];
    }

    return data.vendors || [];
  } catch (err) {
    console.error("Fetch vendors error:", err.message);
    throw err;
  }
}
