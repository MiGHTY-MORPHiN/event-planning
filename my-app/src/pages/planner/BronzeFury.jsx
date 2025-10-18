export default function BronzeFury(onClose) {
    const [showBronzeFuryPopup, setShowBronzeFuryPopup] = useState(true);

    const fetchUsersFromBronzeFury = async () => {
    try {
      const apiKey = import.meta.env.VITE_BRONZEFURY_API_KEY;
      if (!apiKey) {
        console.error("Missing BronzeFury API key in environment variables");
        return [];
      }

      const response = await fetch("https://event-flow-6514.onrender.com/api/events", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey, // secure header
        },
      });

      if (!response.ok) {
        console.error("Failed to fetch users:", response.status, response.statusText);
        return [];
      }

      const data = await response.json();
      console.log("Fetched BronzeFury users:", data);
      return data.users || [];
    } catch (err) {
      console.error("Error fetching users from BronzeFury:", err);
      return [];
    }
  };

  const fetchGuestsFromBronzeFury = async () => {
    try {
      const apiKey = import.meta.env.VITE_BRONZEFURY_API_KEY;
      if (!apiKey) {
        console.error("Missing BronzeFury API key");
        return [];
      }

      const response = await fetch("https://event-flow-6514.onrender.com/api/guests", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
      });

      if (!response.ok) {
        console.error("Failed to fetch guests:", response.statusText);
        return [];
      }

      const data = await response.json();
      console.log("Fetched BronzeFury guests:", data);
      return data.guests || [];
    } catch (err) {
      console.error("Error fetching guests from BronzeFury:", err);
      return [];
    }
  };
    
    return (
        <section className="popup-overlay">
        <div className="bronze-fury-popup">
            <h2>Import from BronzeFury</h2>
            <p>Connect to BronzeFury and import your events or guests.</p>
            <button className="close-btn" onClick={onClose}>Close</button>
        </div>
        </section>
    );
}