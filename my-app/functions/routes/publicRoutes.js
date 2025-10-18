const express = require("express");

// --- Middleware for API key authentication ---
function apiKeyAuth(EXTERNAL_API_KEY) {
  return (req, res, next) => {
    const providedKey = req.header("x-api-key");

    if (!providedKey) {
      return res.status(401).json({ message: "Missing API key" });
    }

    if (providedKey !== EXTERNAL_API_KEY) {
      return res.status(403).json({ message: "Invalid API key" });
    }

    next();
  };
}

// --- Main exported router ---
module.exports = (db, bucket, EXTERNAL_API_KEY) => {
  const router = express.Router();

  // Apply API key middleware to all routes
  router.use(apiKeyAuth(EXTERNAL_API_KEY));

  // --- Example 1: Get all events for a user by UID ---
  router.get("/user/:uid/events", async (req, res) => {
    try {
      const uid = req.params.uid;
      const snapshot = await db
        .collection("Event")
        .where("plannerId", "==", uid)
        .get();

      if (snapshot.empty) {
        return res.json({ uid, events: [] });
      }

      const events = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.json({ uid, events });
    } catch (err) {
      console.error("Error fetching events:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  // --- Example 2: Get guests for an event ---
  router.get("/event/:eventId/guests", async (req, res) => {
    try {
      const eventId = req.params.eventId;
      const snapshot = await db
        .collection("Event")
        .doc(eventId)
        .collection("Guests")
        .get();

      if (snapshot.empty) {
        return res.json({ message: "No guests found for this event" });
      }

      const guests = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.json({ eventId, guests });
    } catch (err) {
      console.error("Error fetching guests:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  return router;
};
