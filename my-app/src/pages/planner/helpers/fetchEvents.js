import { getAuth } from "firebase/auth";

/**
 * Fetch all planner events for the currently logged-in user.
 * @returns {Promise<Array>} events
 */
export async function fetchEvents() {
  let user = getAuth().currentUser;
  while (!user) {
    await new Promise((res) => setTimeout(res, 50)); // wait 50ms
    user = getAuth().currentUser;
  }

  if (!user) {
    console.warn("No authenticated user, skipping event fetch");
    return [];
  }

  const token = await user.getIdToken(true);
  console.log("Fetching events from API...");

  const res = await fetch(
    `https://us-central1-planit-sdp.cloudfunctions.net/api/planner/me/events`,
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
      `Fetch events failed with status ${res.status}: ${text.slice(0, 100)}...`
    );
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  const data = await res.json();
  console.log("Events fetched:", data);
  return data.events || [];
}
