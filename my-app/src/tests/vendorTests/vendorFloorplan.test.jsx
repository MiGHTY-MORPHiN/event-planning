// src/tests/vendorTests/vendorFloorplan.test.jsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, beforeEach, vi } from "vitest";
import VendorFloorplan from "../../pages/vendor/vendorFloorplan";
import { auth, db } from "../../firebase";
import { getDoc } from "firebase/firestore";

// --- Mock Firebase ---
vi.mock("../../firebase", () => ({
  auth: { onAuthStateChanged: vi.fn() },
  db: {},
}));
vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
}));

// --- Mock data ---
const mockUser = {
  uid: "vendor1",
  getIdToken: vi.fn().mockResolvedValue("fake-token"),
};
const mockEvents = [
  { eventId: "e1", eventName: "Wedding", date: "2025-10-01T10:00:00Z" },
  { eventId: "e2", eventName: "Conference", date: "2025-09-15T14:00:00Z" },
];

beforeEach(() => {
  vi.clearAllMocks();

  // Mock onAuthStateChanged
  auth.onAuthStateChanged.mockImplementation((cb) => {
    cb(mockUser); // logged in
    return () => {}; // no-op unsubscribe
  });

  // Mock fetch for bookings
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ bookings: mockEvents }),
  });

  // Mock Firestore getDoc
  getDoc.mockResolvedValue({
    exists: () => true,
    data: () => ({ floorplanUrl: "https://example.com/floorplan.png" }),
  });
});

describe("VendorFloorplan Component", () => {
  it("renders loading state initially", async () => {
    render(<VendorFloorplan />);
    expect(screen.getByText(/Loading Floorplans/i)).toBeInTheDocument();
    // Wait for async effects to finish
    await screen.findByText(/Vendor Floorplan/i);
  });

  it("fetches and displays events with floorplans", async () => {
    render(<VendorFloorplan />);
    // Wait for events to appear
    const event1 = await screen.findByText(/Wedding/i);
    const event2 = await screen.findByText(/Conference/i);
    expect(event1).toBeInTheDocument();
    expect(event2).toBeInTheDocument();

    

  });

  it("filters events based on search input", async () => {
    render(<VendorFloorplan />);
    await screen.findByText(/Vendor Floorplan/i);

    fireEvent.change(screen.getByPlaceholderText(/Search event name/i), {
      target: { value: "Wedding" },
    });

    expect(screen.getByText(/Wedding/i)).toBeInTheDocument();
    expect(screen.queryByText(/Conference/i)).not.toBeInTheDocument();
  });

  it("opens and closes floorplan modal", async () => {
    render(<VendorFloorplan />);
    const tile = await screen.findByText(/Wedding/i);
    fireEvent.click(tile);

    expect(screen.getByText(/Wedding - Floorplan/i)).toBeInTheDocument();

    const closeBtn = screen.getByText("×");
    fireEvent.click(closeBtn);
    await waitFor(() =>
      expect(screen.queryByText(/Wedding - Floorplan/i)).not.toBeInTheDocument()
    );
  });

  it("sorts events by date ascending/descending", async () => {
  render(<VendorFloorplan />);
  await screen.findByText(/Vendor Floorplan/i);

  // Default asc order
  const tiles = screen.getAllByText(/Floorplan Available/i);
  expect(tiles.length).toBe(2);

  // Fix combobox selection
  const dropdowns = screen.getAllByRole("combobox");
  const sortDropdown = dropdowns[1]; // second is sort
  fireEvent.change(sortDropdown, { target: { value: "desc" } });

  // Wait for re-render
  await screen.findByText(/Wedding/i);

  const firstEventName = screen.getAllByRole("heading", { level: 3 })[0];
  expect(firstEventName.textContent).toBe("Conference"); 
});

  it("shows error if user is not authenticated", async () => {
    auth.onAuthStateChanged.mockImplementation((cb) => {
      cb(null); // not logged in
      return () => {};
    });

    render(<VendorFloorplan />);
    const errorMsg = await screen.findByText(/User not authenticated/i);
    expect(errorMsg).toBeInTheDocument();
  });
});
