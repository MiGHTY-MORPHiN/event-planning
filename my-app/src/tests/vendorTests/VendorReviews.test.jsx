// src/tests/VendorReviews.test.jsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, beforeEach, vi, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";

// ✅ Mock firebase/auth so useEffect loops don’t hang
vi.mock("firebase/auth", () => {
  return {
    getAuth: vi.fn(() => ({
      currentUser: {
        uid: "test-vendor",
        getIdToken: vi.fn(() => Promise.resolve("mock-token")),
      },
    })),
  };
});



// ✅ Mock firebase import
vi.mock("../../firebase", () => {
  const mockAuth = {
    currentUser: {
      uid: "test-vendor",
      getIdToken: vi.fn(() => Promise.resolve("mock-token")),
    },
    onAuthStateChanged: vi.fn((cb) => {
      cb({
        uid: "test-vendor",
        getIdToken: () => Promise.resolve("mock-token"),
      });
      return vi.fn();
    }),
  };
  return { auth: mockAuth };
});

// ✅ Global mocks
global.fetch = vi.fn();
global.confirm = vi.fn(() => true);
global.localStorage = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

// ✅ Import component last so mocks apply before module load
import VendorReviews from "../../pages/vendor/vendorReviews";

describe("VendorReviews Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state initially", () => {
    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );
    expect(screen.getByText(/Loading your reviews/i)).toBeInTheDocument();
  });

  it("renders error state when fetch fails", async () => {
    // 🩹 Include json() to avoid type errors
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: "Server error" }),
      headers: { get: () => "application/json" },
    });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch reviews/i)).toBeInTheDocument();
    });
  });

  it("renders 'no reviews' message when none exist", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ reviews: [] }),
      headers: { get: () => "application/json" },
    });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No reviews yet/i)).toBeInTheDocument();
    });
  });

  it("renders reviews and overall rating correctly", async () => {
    const mockData = {
      reviews: [
        {
          id: "r1",
          rating: 5,
          review: "Excellent!",
          createdAt: new Date().toISOString(),
          reply: null,
        },
        {
          id: "r2",
          rating: 4,
          review: "Good service",
          createdAt: new Date().toISOString(),
          reply: "_blank_",
        },
      ],
    };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
      headers: { get: () => "application/json" },
    });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Vendor Reviews")).toBeInTheDocument();
      expect(screen.getByText("Excellent!")).toBeInTheDocument();
      expect(screen.getByText("Good service")).toBeInTheDocument();
    });
  });

  it("allows adding a reply", async () => {
    const mockData = {
      reviews: [
        {
          id: "r1",
          rating: 5,
          review: "Excellent!",
          createdAt: new Date().toISOString(),
          reply: null,
        },
      ],
    };

    // first fetch: load reviews
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
      headers: { get: () => "application/json" },
    });
    // second fetch: reply submission
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
      headers: { get: () => "application/json" },
    });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    const input = await screen.findByPlaceholderText(/Write a reply/i);
    fireEvent.change(input, { target: { value: "Thank you!" } });
    fireEvent.click(screen.getByText(/Send/i));

    await waitFor(() => {
      expect(screen.getByText("Your Reply:")).toBeInTheDocument();
      expect(screen.getByText("Thank you!")).toBeInTheDocument();
    });
  });

  it("allows editing a reply", async () => {
    const mockData = {
      reviews: [
        {
          id: "r1",
          rating: 5,
          review: "Excellent!",
          createdAt: new Date().toISOString(),
          reply: "Initial reply",
        },
      ],
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
      headers: { get: () => "application/json" },
    });
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
      headers: { get: () => "application/json" },
    });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    const editBtn = await screen.findByText(/Edit/i);
    fireEvent.click(editBtn);

    const input = screen.getByPlaceholderText(/Write a reply/i);
    fireEvent.change(input, { target: { value: "Edited reply" } });
    fireEvent.click(screen.getByText(/Send/i));

    await waitFor(() => {
      expect(screen.getByText("Edited reply")).toBeInTheDocument();
    });
  });
});
