// src/tests/VendorReviews.test.jsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, beforeEach, vi, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";

// Mock firebase/auth getAuth so the component's while (!user) loop sees a currentUser immediately
vi.mock("firebase/auth", () => {
  return {
    getAuth: vi.fn(() => ({
      currentUser: {
        uid: "test-vendor",
        getIdToken: () => Promise.resolve("mock-token"),
      },
    })),
  };
});

// --- MOCKS --- //
vi.mock("../../firebase", () => {
  const mockAuth = {
    currentUser: {
      uid: "test-vendor",
      getIdToken: vi.fn(() => Promise.resolve("mock-token")),
    },
    onAuthStateChanged: vi.fn((cb) => {
      cb({ uid: "test-vendor", getIdToken: () => Promise.resolve("mock-token") });
      return vi.fn();
    }),
  };
  return { auth: mockAuth };
});

global.fetch = vi.fn();
global.confirm = vi.fn(() => true);

// Component import
import VendorReviews from "../../pages/vendor/vendorReviews";

describe("VendorReviews Component", () => {
  beforeEach(() => {
    global.fetch.mockClear();
    global.confirm.mockClear();
    // ensure mocked getAuth/currentUser token fn is reset between tests if needed
    const { getAuth } = require("firebase/auth");
    if (getAuth && getAuth.mockClear) getAuth.mockClear();
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
    // Fixed: fetch mock now includes json() to prevent errors
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: "Server error" }),
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

  it("renders no reviews found message when reviews array is empty", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ reviews: [] }),
    });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No reviews /i)).toBeInTheDocument();
    });
  });

  it("renders reviews and overall rating correctly", async () => {
    const mockData = {
      reviews: [
        { id: "r1", rating: 5, review: "Excellent!", createdAt: new Date().toISOString(), reply: null },
        { id: "r2", rating: 4, review: "Good service", createdAt: new Date().toISOString(), reply: "_blank_" },
      ],
    };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
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
      expect(screen.getByText(/Review Analytics/i)).toBeInTheDocument();
    });
  });

  it("allows adding a reply", async () => {
    const mockData = {
      reviews: [
        { id: "r1", rating: 5, review: "Excellent!", createdAt: new Date().toISOString(), reply: null },
      ],
    };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    });
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByPlaceholderText(/Write a reply/i));

    const input = screen.getByPlaceholderText(/Write a reply/i);
    fireEvent.change(input, { target: { value: "Thank you!" } });
    const sendBtn = screen.getByText(/Send/i);
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText("Your Reply:")).toBeInTheDocument();
      expect(screen.getByText("Thank you!")).toBeInTheDocument();
    });
  });

  it("allows editing a reply", async () => {
    const mockData = {
      reviews: [
        { id: "r1", rating: 5, review: "Excellent!", createdAt: new Date().toISOString(), reply: "Initial reply" },
      ],
    };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    });
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText(/Edit/i));
    fireEvent.click(screen.getByText(/Edit/i));

    const input = screen.getByPlaceholderText(/Write a reply/i);
    fireEvent.change(input, { target: { value: "Edited reply" } });

    fireEvent.click(screen.getByText(/Send/i));

    await waitFor(() => {
      expect(screen.getByText("Edited reply")).toBeInTheDocument();
    });
  });
});
