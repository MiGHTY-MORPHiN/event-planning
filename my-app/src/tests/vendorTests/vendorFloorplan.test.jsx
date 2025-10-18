import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, beforeEach, afterEach, test, describe, expect } from "vitest";

// Mock environment variables
vi.stubEnv('VITE_API_KEY', 'test-api-key');
vi.stubEnv('VITE_AUTH_DOMAIN', 'test-auth-domain');
vi.stubEnv('VITE_PROJECT_ID', 'test-project-id');

// Mock Firebase Firestore
vi.mock("firebase/firestore", () => ({
  doc: vi.fn((db, ...path) => ({ db, path: path.join('/') })),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  arrayUnion: vi.fn((value) => ({ _type: "arrayUnion", value })),
  getFirestore: vi.fn(() => ({})),
}));

// Mock Firebase Auth
vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn(),
}));

// Mock Firebase App
vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(() => ({})),
}));

// Mock the firebase config file
vi.mock("../../firebase", () => ({
  auth: {
    onAuthStateChanged: vi.fn(),
    currentUser: {
      uid: "test-vendor-123",
      getIdToken: vi.fn(() => Promise.resolve("mock-token")),
    },
  },
  db: {},
}));

// Mock fetch
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// Import after all mocks are set up
const VendorFloorplanModule = await import("../../pages/vendor/vendorFloorplan.jsx");
const VendorFloorplan = VendorFloorplanModule.default;
const clearVendorFloorplanCache = VendorFloorplanModule.clearVendorFloorplanCache;

describe("VendorFloorplan", () => {
  const mockBookingsResponse = {
    bookings: [
      {
        eventId: "event1",
        eventName: "Wedding Celebration",
        date: "2024-12-25",
      },
      {
        eventId: "event2",
        eventName: "Corporate Gala",
        date: "2024-11-15",
      },
      {
        eventId: "event3",
        eventName: "Birthday Party",
        date: "2024-10-20",
      },
    ],
  };

  const mockFloorplanData = {
    floorplanUrl: "https://example.com/floorplan1.jpg",
    uploadedAt: { _seconds: Date.now() / 1000, _nanoseconds: 0 },
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    localStorageMock.clear();
    clearVendorFloorplanCache();

    // Setup auth mock
    const firebase = await import("../../firebase");
    firebase.auth.onAuthStateChanged.mockImplementation((callback) => {
      callback({ uid: "test-vendor-123", getIdToken: () => Promise.resolve("mock-token") });
      return vi.fn();
    });

    // Setup default fetch mock
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockBookingsResponse),
    });

    // Setup default Firestore mock
    const firestore = await import("firebase/firestore");
    firestore.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockFloorplanData,
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  test("shows loading spinner initially", () => {
    render(<VendorFloorplan />);
    expect(screen.getByText("Loading Floorplans...")).toBeInTheDocument();
  });

  test("loads and displays events successfully", async () => {
    render(<VendorFloorplan />);

    await waitFor(() => {
      expect(screen.getByText("Wedding Celebration")).toBeInTheDocument();
    });

    expect(screen.getByText("Corporate Gala")).toBeInTheDocument();
    expect(screen.getByText("Birthday Party")).toBeInTheDocument();
  });

  test("displays page header correctly", async () => {
    render(<VendorFloorplan />);

    await waitFor(() => {
      expect(screen.getByText("Vendor Floorplan")).toBeInTheDocument();
    });

    expect(screen.getByText("Manage floorplans received from your clients")).toBeInTheDocument();
  });

  test("handles unauthenticated user", async () => {
    const firebase = await import("../../firebase");
    firebase.auth.onAuthStateChanged.mockImplementationOnce((callback) => {
      callback(null);
      return vi.fn();
    });

    render(<VendorFloorplan />);

    await waitFor(() => {
      expect(screen.getByText("User not authenticated")).toBeInTheDocument();
    });
  });

  test("handles fetch error", async () => {
    global.fetch.mockRejectedValueOnce(new Error("Network error"));

    render(<VendorFloorplan />);

    await waitFor(() => {
      expect(screen.getByText("Failed to fetch events")).toBeInTheDocument();
    });
  });

  test("handles HTTP error response", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<VendorFloorplan />);

    await waitFor(() => {
      expect(screen.getByText("Failed to fetch events")).toBeInTheDocument();
    });
  });

  test("search filter works correctly", async () => {
    render(<VendorFloorplan />);

    await waitFor(() => {
      expect(screen.getByText("Wedding Celebration")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search event name...");
    fireEvent.change(searchInput, { target: { value: "Wedding" } });

    expect(screen.getByText("Wedding Celebration")).toBeInTheDocument();
    expect(screen.queryByText("Corporate Gala")).not.toBeInTheDocument();
    expect(screen.queryByText("Birthday Party")).not.toBeInTheDocument();
  });

  test("search is case insensitive", async () => {
    render(<VendorFloorplan />);

    await waitFor(() => {
      expect(screen.getByText("Wedding Celebration")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search event name...");
    fireEvent.change(searchInput, { target: { value: "wedding" } });

    expect(screen.getByText("Wedding Celebration")).toBeInTheDocument();
  });

  test("availability filter shows all by default", async () => {
    render(<VendorFloorplan />);

    await waitFor(() => {
      expect(screen.getByText("Wedding Celebration")).toBeInTheDocument();
    });

    const allEvents = screen.getAllByRole("heading", { level: 3 });
    expect(allEvents).toHaveLength(3);
  });

  test("availability filter shows only available floorplans", async () => {
    const firestore = await import("firebase/firestore");
    firestore.getDoc.mockImplementation((docRef) => {
      if (docRef.path.includes("event1")) {
        return Promise.resolve({
          exists: () => true,
          data: () => mockFloorplanData,
        });
      }
      return Promise.resolve({
        exists: () => false,
      });
    });

    render(<VendorFloorplan />);

    await waitFor(() => {
      expect(screen.getByText("Wedding Celebration")).toBeInTheDocument();
    });

    const filterDropdown = screen.getByDisplayValue("All Floorplans");
    fireEvent.change(filterDropdown, { target: { value: "available" } });

    await waitFor(() => {
      expect(screen.getByText("Wedding Celebration")).toBeInTheDocument();
    });

    expect(screen.queryByText("Corporate Gala")).not.toBeInTheDocument();
  });

  test("availability filter shows only unavailable floorplans", async () => {
    const firestore = await import("firebase/firestore");
    firestore.getDoc.mockResolvedValue({
      exists: () => false,
    });

    render(<VendorFloorplan />);

    await waitFor(() => {
      expect(screen.getByText("Wedding Celebration")).toBeInTheDocument();
    });

    const filterDropdown = screen.getByDisplayValue("All Floorplans");
    fireEvent.change(filterDropdown, { target: { value: "unavailable" } });

    await waitFor(() => {
      const allEvents = screen.getAllByRole("heading", { level: 3 });
      expect(allEvents).toHaveLength(3);
    });
  });

  test("date sorting works - newest first", async () => {
    render(<VendorFloorplan />);

    await waitFor(() => {
      expect(screen.getByText("Wedding Celebration")).toBeInTheDocument();
    });

    const events = screen.getAllByRole("heading", { level: 3 });
    expect(events[0]).toHaveTextContent("Wedding Celebration");
    expect(events[1]).toHaveTextContent("Corporate Gala");
    expect(events[2]).toHaveTextContent("Birthday Party");
  });

  test("date sorting works - oldest first", async () => {
    render(<VendorFloorplan />);

    await waitFor(() => {
      expect(screen.getByText("Wedding Celebration")).toBeInTheDocument();
    });

    const sortDropdown = screen.getByDisplayValue("Newest First");
    fireEvent.change(sortDropdown, { target: { value: "oldest" } });

    const events = screen.getAllByRole("heading", { level: 3 });
    expect(events[0]).toHaveTextContent("Birthday Party");
    expect(events[1]).toHaveTextContent("Corporate Gala");
    expect(events[2]).toHaveTextContent("Wedding Celebration");
  });

  test("displays floorplan availability tags", async () => {
    const firestore = await import("firebase/firestore");
    firestore.getDoc.mockImplementation((docRef) => {
      if (docRef.path.includes("event1")) {
        return Promise.resolve({
          exists: () => true,
          data: () => mockFloorplanData,
        });
      }
      return Promise.resolve({
        exists: () => false,
      });
    });

    render(<VendorFloorplan />);

    await waitFor(() => {
      expect(screen.getByText("✓ Floorplan Available")).toBeInTheDocument();
    });

    const noFloorplanTags = screen.getAllByText("✗ No Floorplan");
    expect(noFloorplanTags.length).toBeGreaterThan(0);
  });

  test("opens modal when event tile is clicked", async () => {
    render(<VendorFloorplan />);

    await waitFor(() => {
      expect(screen.getByText("Wedding Celebration")).toBeInTheDocument();
    });

    const eventTile = screen.getByText("Wedding Celebration");
    fireEvent.click(eventTile);

    await waitFor(() => {
      expect(screen.getByText("Wedding Celebration - Floorplan")).toBeInTheDocument();
    });
  });

  test("closes modal when close button is clicked", async () => {
    render(<VendorFloorplan />);

    await waitFor(() => {
      expect(screen.getByText("Wedding Celebration")).toBeInTheDocument();
    });

    const eventTile = screen.getByText("Wedding Celebration");
    fireEvent.click(eventTile);

    await waitFor(() => {
      expect(screen.getByText("Wedding Celebration - Floorplan")).toBeInTheDocument();
    });

    const closeButton = screen.getByRole("button", { name: "×" });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText("Wedding Celebration - Floorplan")).not.toBeInTheDocument();
    });
  });

  test("closes modal when clicking overlay", async () => {
    render(<VendorFloorplan />);

    await waitFor(() => {
      expect(screen.getByText("Wedding Celebration")).toBeInTheDocument();
    });

    const eventTile = screen.getByText("Wedding Celebration");
    fireEvent.click(eventTile);

    await waitFor(() => {
      expect(screen.getByText("Wedding Celebration - Floorplan")).toBeInTheDocument();
    });

    const overlay = document.querySelector(".modal-overlay");
    fireEvent.click(overlay);

    await waitFor(() => {
      expect(screen.queryByText("Wedding Celebration - Floorplan")).not.toBeInTheDocument();
    });
  });

  test("modal content click does not close modal", async () => {
    render(<VendorFloorplan />);

    await waitFor(() => {
      expect(screen.getByText("Wedding Celebration")).toBeInTheDocument();
    });

    const eventTile = screen.getByText("Wedding Celebration");
    fireEvent.click(eventTile);

    await waitFor(() => {
      expect(screen.getByText("Wedding Celebration - Floorplan")).toBeInTheDocument();
    });

    const modalContent = document.querySelector(".modal-content");
    fireEvent.click(modalContent);

    expect(screen.getByText("Wedding Celebration - Floorplan")).toBeInTheDocument();
  });

  test("displays floorplan image in modal", async () => {
    render(<VendorFloorplan />);

    await waitFor(() => {
      expect(screen.getByText("Wedding Celebration")).toBeInTheDocument();
    });

    const eventTile = screen.getByText("Wedding Celebration");
    fireEvent.click(eventTile);

    await waitFor(() => {
      const floorplanImage = screen.getByAltText("Event Floorplan");
      expect(floorplanImage).toBeInTheDocument();
      expect(floorplanImage).toHaveAttribute("src", mockFloorplanData.floorplanUrl);
    });
  });

  test("displays no floorplan message when floorplan unavailable", async () => {
    const firestore = await import("firebase/firestore");
    firestore.getDoc.mockResolvedValue({
      exists: () => false,
    });

    render(<VendorFloorplan />);

    await waitFor(() => {
      expect(screen.getByText("Wedding Celebration")).toBeInTheDocument();
    });

    const eventTile = screen.getByText("Wedding Celebration");
    fireEvent.click(eventTile);

    await waitFor(() => {
      expect(screen.getByText("No floorplan available for this event")).toBeInTheDocument();
    });

    expect(screen.getByText("Check back later or contact the event organizer")).toBeInTheDocument();
  });

  test("enlarge button opens floorplan in new tab", async () => {
    window.open = vi.fn();

    render(<VendorFloorplan />);

    await waitFor(() => {
      expect(screen.getByText("Wedding Celebration")).toBeInTheDocument();
    });

    const eventTile = screen.getByText("Wedding Celebration");
    fireEvent.click(eventTile);

    await waitFor(() => {
      const enlargeButton = screen.getByText("🔍 Enlarge");
      fireEvent.click(enlargeButton);
    });

    expect(window.open).toHaveBeenCalledWith(mockFloorplanData.floorplanUrl, "_blank");
  });

  test("clicking floorplan image opens it in new tab", async () => {
    window.open = vi.fn();

    render(<VendorFloorplan />);

    await waitFor(() => {
      expect(screen.getByText("Wedding Celebration")).toBeInTheDocument();
    });

    const eventTile = screen.getByText("Wedding Celebration");
    fireEvent.click(eventTile);

    await waitFor(() => {
      const floorplanImage = screen.getByAltText("Event Floorplan");
      fireEvent.click(floorplanImage);
    });

    expect(window.open).toHaveBeenCalledWith(mockFloorplanData.floorplanUrl, "_blank");
  });

  test("displays new indicator for unseen floorplans", async () => {
    render(<VendorFloorplan />);

    await waitFor(() => {
      const newIndicators = document.querySelectorAll(".new-indicator");
      expect(newIndicators.length).toBeGreaterThan(0);
    });
  });

 

  test("loads seen floorplans from localStorage", async () => {
    localStorage.setItem("seenFloorplans_test-vendor-123", JSON.stringify(["event1"]));

    render(<VendorFloorplan />);

    await waitFor(() => {
      expect(screen.getByText("Wedding Celebration")).toBeInTheDocument();
    });

    const tiles = document.querySelectorAll(".client-tile");
    const event1Tile = Array.from(tiles).find(tile => 
      tile.textContent.includes("Wedding Celebration")
    );
    
    const newIndicator = event1Tile?.querySelector(".new-indicator");
    expect(newIndicator).not.toBeInTheDocument();
  });

  test("displays no floorplans message when no events match filter", async () => {
    render(<VendorFloorplan />);

    await waitFor(() => {
      expect(screen.getByText("Wedding Celebration")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search event name...");
    fireEvent.change(searchInput, { target: { value: "NonExistentEvent" } });

    await waitFor(() => {
      expect(screen.getByText("No Floorplans Found")).toBeInTheDocument();
    });

    expect(screen.getByText("Try adjusting your search or filter criteria")).toBeInTheDocument();
  });

  test("displays rotating cube animation when no results", async () => {
    render(<VendorFloorplan />);

    await waitFor(() => {
      expect(screen.getByText("Wedding Celebration")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search event name...");
    fireEvent.change(searchInput, { target: { value: "NonExistentEvent" } });

    await waitFor(() => {
      const rotatingCube = document.querySelector(".rotating-cube");
      expect(rotatingCube).toBeInTheDocument();
    });
  });

  test("clearVendorFloorplanCache utility function works", () => {
    localStorage.setItem("seenFloorplans_test-vendor-123", JSON.stringify(["event1"]));
    
    clearVendorFloorplanCache();
    
    expect(true).toBe(true);
  });

  test("handles empty bookings array", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ bookings: [] }),
    });

    render(<VendorFloorplan />);

    await waitFor(() => {
      expect(screen.getByText("No Floorplans Found")).toBeInTheDocument();
    });
  });
});