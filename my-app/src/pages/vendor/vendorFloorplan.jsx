import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebase";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import "./vendorFloorplan.css";

// Cache implementation
const createCache = (maxAge = 5 * 60 * 1000) => { // 5 minutes default
  const cache = new Map();
  
  return {
    get: (key) => {
      const item = cache.get(key);
      if (!item) return null;
      
      if (Date.now() - item.timestamp > maxAge) {
        cache.delete(key);
        return null;
      }
      
      return item.data;
    },
    
    set: (key, data) => {
      cache.set(key, {
        data,
        timestamp: Date.now()
      });
    },
    
    clear: () => cache.clear(),
    
    delete: (key) => cache.delete(key),
    
    size: () => cache.size
  };
};

// Create cache instances
const eventsCache = createCache(10 * 60 * 1000); // 10 minutes for events
const floorplansCache = createCache(15 * 60 * 1000); // 15 minutes for floorplans
const seenFloorplansCache = createCache(30 * 60 * 1000); // 30 minutes for seen floorplans

// Helper to format Firestore timestamps
function formatDate(date) {
  if (!date) return "";

  if (
    typeof date === "object" &&
    typeof date._seconds === "number" &&
    typeof date._nanoseconds === "number"
  ) {
    const jsDate = new Date(date._seconds * 1000 + date._nanoseconds / 1e6);
    return jsDate.toLocaleDateString();
  }

  if (date instanceof Date) {
    return date.toLocaleDateString();
  }

  if (typeof date === "string") {
    return new Date(date).toLocaleDateString();
  }

  return String(date);
}

const useFloorplans = (events, vendorId) => {
  const [floorplans, setFloorplans] = useState({});
  const [seenFloorplans, setSeenFloorplans] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFloorplans = async () => {
      if (events.length === 0 || !vendorId) {
        setLoading(false);
        return;
      }

      // Check cache first
      const cacheKey = `floorplans_${vendorId}`;
      const cached = floorplansCache.get(cacheKey);
      
      if (cached) {
        console.log("Loading floorplans from cache");
        setFloorplans(cached);
        setLoading(false);
        return;
      }

      setLoading(true);
      const floorplansData = {};
      
      // Only fetch floorplans for events that don't have cached data
      const eventsToFetch = events.filter(event => {
        const eventCacheKey = `floorplan_${vendorId}_${event.eventId}`;
        const eventCached = floorplansCache.get(eventCacheKey);
        if (eventCached) {
          floorplansData[event.eventId] = eventCached;
          return false;
        }
        return true;
      });

      await Promise.all(
        eventsToFetch.map(async (event) => {
          try {
            const floorplanRef = doc(
              db,
              "Event",
              event.eventId,
              "Floorplans",
              vendorId
            );
            const docSnap = await getDoc(floorplanRef);
            if (docSnap.exists()) {
              const data = docSnap.data();
              const floorplanData = {
                url: data.floorplanUrl,
                uploadedAt: data.uploadedAt || new Date(),
              };
              floorplansData[event.eventId] = floorplanData;
              
              // Cache individual event floorplan
              const eventCacheKey = `floorplan_${vendorId}_${event.eventId}`;
              floorplansCache.set(eventCacheKey, floorplanData);
            }
          } catch (error) {
            console.error(
              `Error fetching floorplan for event ${event.eventId}:`,
              error
            );
          }
        })
      );
      
      // Cache the complete floorplans data
      floorplansCache.set(cacheKey, floorplansData);
      console.log("Fetched and cached floorplans:", floorplansData);
      setFloorplans(floorplansData);
      setLoading(false);
    };
    
    fetchFloorplans();
  }, [events, vendorId]);

  // Load seen floorplans from cache and localStorage
  useEffect(() => {
    const loadSeenFloorplans = () => {
      if (!vendorId) return;
      
      // Check memory cache first
      const cacheKey = `seenFloorplans_${vendorId}`;
      const cached = seenFloorplansCache.get(cacheKey);
      
      if (cached) {
        console.log("Loading seen floorplans from cache");
        setSeenFloorplans(new Set(cached));
        return;
      }
      
      // Fallback to localStorage
      const saved = localStorage.getItem(`seenFloorplans_${vendorId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSeenFloorplans(new Set(parsed));
        // Cache the loaded data
        seenFloorplansCache.set(cacheKey, parsed);
      }
    };
    
    loadSeenFloorplans();
  }, [vendorId]);

  const markAsSeen = async (eventId) => {
    if (!vendorId) return;
    
    const newSeen = new Set(seenFloorplans);
    newSeen.add(eventId);
    const seenArray = [...newSeen];
    
    setSeenFloorplans(newSeen);
    
    // Update all caches
    const cacheKey = `seenFloorplans_${vendorId}`;
    
    // Memory cache
    seenFloorplansCache.set(cacheKey, seenArray);
    
    // localStorage for persistence
    localStorage.setItem(`seenFloorplans_${vendorId}`, JSON.stringify(seenArray));
    
    // Firestore for cross-device sync (debounced to avoid too many writes)
    try {
      const userRef = doc(db, "Vendors", vendorId);
      await updateDoc(userRef, {
        seenFloorplans: arrayUnion(eventId)
      });
    } catch (error) {
      console.error("Error updating seen floorplans in Firestore:", error);
    }
  };

  const isNewFloorplan = (eventId) => {
    return floorplans[eventId] && !seenFloorplans.has(eventId);
  };

  return { floorplans, isNewFloorplan, markAsSeen, loading };
};

const VendorFloorplan = () => {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [dateOrder, setDateOrder] = useState("newest");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [vendorId, setVendorId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { floorplans, isNewFloorplan, markAsSeen, loading: floorplansLoading } = useFloorplans(events, vendorId);

  // Fetch vendor ID and events with caching
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setVendorId(user.uid);
        
        // Check cache for events
        const cacheKey = `events_${user.uid}`;
        const cachedEvents = eventsCache.get(cacheKey);
        
        if (cachedEvents) {
          console.log("Loading events from cache");
          setEvents(cachedEvents);
          setLoading(false);
          return;
        }

        try {
          const token = await user.getIdToken();
          const res = await fetch(
            "https://us-central1-planit-sdp.cloudfunctions.net/api/vendor/bookings",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
          const data = await res.json();
          const bookings = data.bookings.map((booking) => ({
            id: booking.eventId,
            eventId: booking.eventId,
            name: booking.eventName,
            date: booking.date,
          }));
          
          // Cache the events
          eventsCache.set(cacheKey, bookings);
          setEvents(bookings);
          setLoading(false);
        } catch (err) {
          console.error("Error fetching bookings:", err);
          setError("Failed to fetch events");
          setLoading(false);
        }
      } else {
        setError("User not authenticated");
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Clear cache when component unmounts (optional - for development)
  useEffect(() => {
    return () => {
      // You can choose to clear cache on unmount or keep it
      // eventsCache.clear();
      // floorplansCache.clear();
      // seenFloorplansCache.clear();
    };
  }, []);

  const filteredEvents = events
    .filter((event) => {
      const matchesSearch = event.name.toLowerCase().includes(search.toLowerCase());
      const hasFloorplan = !!floorplans[event.eventId];
      
      switch (availabilityFilter) {
        case "available":
          return matchesSearch && hasFloorplan;
        case "unavailable":
          return matchesSearch && !hasFloorplan;
        default:
          return matchesSearch;
      }
    })
    .sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

  const handleTileClick = (event) => {
    setSelectedEvent(event);
    if (floorplans[event.eventId]) {
      markAsSeen(event.eventId);
    }
  };

  // Combined loading state
  const isLoading = loading || floorplansLoading;

  if (isLoading) return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <h2>Loading Floorplans...</h2>
    </div>
  );
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="floorplan-page">
      <header>
        <h1>Vendor Floorplan</h1>
        <p>Manage floorplans received from your clients</p>
      </header>

      <div className="controls-row">
        <div className="left-controls">
          <input
            type="text"
            placeholder="Search event name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="filter-dropdown"
          >
            <option value="all">All Floorplans</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>
          <select
            value={dateOrder}
            onChange={(e) => setDateOrder(e.target.value)}
            className="sort-dropdown"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      <div className="tiles-grid minimized">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <div
              key={event.id}
              className={`client-tile minimized ${floorplans[event.eventId] ? 'has-floorplan' : 'no-floorplan'}`}
              onClick={() => handleTileClick(event)}
            >
              <div className="tile-header">
                <h3>{event.name}</h3>
                {isNewFloorplan(event.eventId) && (
                  <div className="new-indicator" title="New floorplan available!">
                    <span className="ping"></span>
                  </div>
                )}
              </div>
              <p className="event-date">Date: {formatDate(event.date)}</p>
              
              <div className="availability-tag">
                {floorplans[event.eventId] ? (
                  <span className="tag available">
                    ✓ Floorplan Available
                  </span>
                ) : (
                  <span className="tag unavailable">
                    ✗ No Floorplan
                  </span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="no-floorplans-alert">
            <div className="rotating-cube">
              <div className="cube-face cube-front">📋</div>
              <div className="cube-face cube-back">📄</div>
              <div className="cube-face cube-right">📊</div>
              <div className="cube-face cube-left">📝</div>
              <div className="cube-face cube-top">📈</div>
              <div className="cube-face cube-bottom">📑</div>
            </div>
            <h3>No Floorplans Found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {selectedEvent && (
        <div
          className="modal-overlay active"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>{selectedEvent.name} - Floorplan</h2>
              <button
                className="close-btn"
                onClick={() => setSelectedEvent(null)}
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              <p className="event-info">
                Event Date: {formatDate(selectedEvent.date)}
              </p>
              
              <div className="floorplan-display">
                {floorplans[selectedEvent.eventId] ? (
                  <>
                    <img
                      src={floorplans[selectedEvent.eventId].url}
                      alt="Event Floorplan"
                      className="modal-floorplan-image"
                      onClick={() => window.open(floorplans[selectedEvent.eventId].url, "_blank")}
                    />
                    <div className="modal-actions">
                      <button 
                        className="enlarge-btn"
                        onClick={() => window.open(floorplans[selectedEvent.eventId].url, "_blank")}
                      >
                        🔍 Enlarge
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="no-floorplan-message">
                    <p>No floorplan available for this event</p>
                    <p className="subtext">Check back later or contact the event organizer</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Utility function to manually clear cache (useful for debugging)
export const clearVendorFloorplanCache = () => {
  eventsCache.clear();
  floorplansCache.clear();
  seenFloorplansCache.clear();
  console.log("Vendor floorplan cache cleared");
};

export default VendorFloorplan;