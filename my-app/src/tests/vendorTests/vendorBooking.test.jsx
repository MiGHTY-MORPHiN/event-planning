import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, vi, beforeEach, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import VendorBooking from "../../pages/vendor/vendorBooking";

// --- MOCKS --- //
vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => ({
    currentUser: {
      uid: "test-vendor",
      getIdToken: vi.fn(() => Promise.resolve("mock-token")),
    },
  })),
}));

vi.mock("../../firebase", () => ({
  auth: {
    currentUser: {
      uid: "test-vendor",
      getIdToken: vi.fn(() => Promise.resolve("mock-token")),
    },
  },
}));

// Avoid issues with ChatComponent
vi.mock("../../pages/planner/ChatComponent.jsx", () => ({
  default: () => <div data-testid="mock-chat">ChatComponent</div>,
}));

// --- GLOBAL MOCKS --- //
global.fetch = vi.fn();
global.confirm = vi.fn(() => true);
global.alert = vi.fn();

// Utility to robustly find a button by partial text content (case-insensitive, across nested elements)
function getButtonByText(text) {
  const buttons = screen.queryAllByRole("button");
  return buttons.find(
    (btn) =>
      btn.textContent &&
      btn.textContent.replace(/\s+/g, " ").trim().toLowerCase().includes(text.toLowerCase())
  );
}

describe("VendorBooking Component", () => {
  const mockSetActivePage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("shows loading screen initially", async () => {
    fetch.mockImplementationOnce(() => new Promise(() => {})); // never resolves
    render(
      <MemoryRouter>
        <VendorBooking setActivePage={mockSetActivePage} />
      </MemoryRouter>
    );
    expect(screen.getByText(/Loading your bookings/i)).toBeInTheDocument();
  });

  it("renders error message on fetch failure", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve({ message: "Server error" }),
    });

    render(
      <MemoryRouter>
        <VendorBooking setActivePage={mockSetActivePage} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Server error/i)).toBeInTheDocument();
    });
  });

  it("renders no bookings message when API returns empty list", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ bookings: [] }),
    });

    render(
      <MemoryRouter>
        <VendorBooking setActivePage={mockSetActivePage} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No bookings found/i)).toBeInTheDocument();
    });
  });

  it("renders bookings after successful fetch", async () => {
    const mockData = {
      bookings: [
        {
          eventId: "E1",
          eventName: "Wedding Bash",
          date: new Date().toISOString(),
          location: "Cape Town",
          expectedGuestCount: 150,
          budget: 5000,
          vendorServices: [
            { serviceId: "S1", serviceName: "Catering", status: "pending" },
          ],
        },
      ],
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    render(
      <MemoryRouter>
        <VendorBooking setActivePage={mockSetActivePage} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Booking Management/i)).toBeInTheDocument();
      expect(screen.getByText(/Wedding Bash/i)).toBeInTheDocument();
      expect(screen.getByText(/Catering/i)).toBeInTheDocument();
    });
  });

});
