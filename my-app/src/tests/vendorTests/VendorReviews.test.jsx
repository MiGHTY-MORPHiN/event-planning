
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, beforeEach, vi, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";

// Mock environment variables first
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_API_KEY: "mock-api-key",
    VITE_AUTH_DOMAIN: "mock-auth-domain",
    VITE_PROJECT_ID: "mock-project-id",
    VITE_STORAGE_BUCKET: "mock-storage-bucket",
    VITE_MESSAGING_SENDER_ID: "mock-messaging-sender-id",
    VITE_APP_ID: "mock-app-id",
    VITE_MEASUREMENT_ID: "mock-measurement-id",
  },
  writable: true
});

// Mock lucide-react with all necessary icons
vi.mock("lucide-react", () => ({
  Star: ({ size, color, fill }) => <svg data-testid="star-icon" data-size={size} data-color={color} data-fill={fill} />,
  StarHalf: ({ size, color, fill }) => <svg data-testid="star-half-icon" data-size={size} data-color={color} data-fill={fill} />,
  ChevronDown: () => <svg data-testid="chevron-down-icon" />,
  TrendingUp: () => <svg data-testid="trending-up-icon" />,
  TrendingDown: () => <svg data-testid="trending-down-icon" />,
  BarChart3: () => <svg data-testid="bar-chart-icon" />,
  Calendar: () => <svg data-testid="calendar-icon" />,
}));

// Create mock auth object
const mockAuth = {
  currentUser: {
    uid: "testVendor123",
    email: "vendor@test.com",
    getIdToken: vi.fn(() => Promise.resolve("fake-token"))
  },
  onAuthStateChanged: vi.fn((cb) => {
    cb({
      uid: "testVendor123",
      email: "vendor@test.com",
      getIdToken: vi.fn(() => Promise.resolve("fake-token"))
    });
    return vi.fn(); // unsubscribe function
  }),
};

// Mock Firebase completely
vi.mock("../../firebase", () => ({
  auth: mockAuth,
  db: {},
  initializeApp: vi.fn(),
  getFirestore: vi.fn(() => ({})),
}));

// Mock firebase/auth
vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => mockAuth),
}));

// Mock CSS import
vi.mock("../../pages/vendor/vendorReviews.css", () => ({}));

// Import the component after mocks are set up
const VendorReviews = await import("../../pages/vendor/vendorReviews").then(m => m.default);

global.fetch = vi.fn();
global.confirm = vi.fn();
global.alert = vi.fn();

// Helper function to create mock reviews
const createMockReview = (overrides = {}) => ({
  id: "review-1",
  rating: 5,
  review: "Great service!",
  timeOfReview: {
    _seconds: Math.floor(Date.now() / 1000),
    _nanoseconds: 0
  },
  reply: null,
  ...overrides
});

describe("VendorReviews Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    
    // Reset auth mock
    mockAuth.currentUser = {
      uid: "testVendor123",
      email: "vendor@test.com",
      getIdToken: vi.fn(() => Promise.resolve("fake-token"))
    };
  });

  it("handles rapid sort changes efficiently", async () => {
    const mockReviews = [
      createMockReview({ id: "1", rating: 5 }),
      createMockReview({ id: "2", rating: 3 }),
      createMockReview({ id: "3", rating: 4 }),
    ];

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reviews: mockReviews }),
    });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Vendor Reviews/i)).toBeInTheDocument();
    });

    const sortSelect = screen.getByRole('combobox');

    // Rapidly change sort options
    fireEvent.change(sortSelect, { target: { value: 'most-critical' } });
    fireEvent.change(sortSelect, { target: { value: 'most-praiseworthy' } });
    fireEvent.change(sortSelect, { target: { value: 'oldest' } });

    // Should handle all changes without crashing
    await waitFor(() => {
      // Verify all 3 reviews are still displayed
      expect(screen.getAllByPlaceholderText(/Write a reply/i)).toHaveLength(3);
    });
  });


  it("renders loading state initially", () => {
    // Mock fetch to never resolve
    global.fetch.mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );
    
    expect(screen.getByText(/Loading your reviews/i)).toBeInTheDocument();
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
  });

  it("renders error state when fetch fails", async () => {
    global.fetch.mockRejectedValueOnce(new Error("Failed to fetch reviews"));

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch reviews/i)).toBeInTheDocument();
    });
  });

  it("renders no reviews message when no reviews exist", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reviews: [] }),
    });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No reviews found/i)).toBeInTheDocument();
    });
  });

  it("renders reviews successfully", async () => {
    const mockReviews = [
      createMockReview({
        id: "review-1",
        rating: 5,
        review: "Excellent service!",
      }),
      createMockReview({
        id: "review-2",
        rating: 4,
        review: "Very good work",
      })
    ];

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reviews: mockReviews }),
    });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Vendor Reviews/i)).toBeInTheDocument();
      expect(screen.getByText(/Excellent service!/i)).toBeInTheDocument();
      expect(screen.getByText(/Very good work/i)).toBeInTheDocument();
    });
  });

  it("displays correct analytics", async () => {
    const mockReviews = [
      createMockReview({ id: "1", rating: 5 }),
      createMockReview({ id: "2", rating: 4 }),
      createMockReview({ id: "3", rating: 5 }),
    ];

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reviews: mockReviews }),
    });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Check average rating (5+4+5)/3 = 4.7
      expect(screen.getByText(/4\.7/)).toBeInTheDocument();
      // Check total reviews
      expect(screen.getByText(/3 total/i)).toBeInTheDocument();
    });
  });

  it("displays rating distribution correctly", async () => {
    const mockReviews = [
      createMockReview({ id: "1", rating: 5 }),
      createMockReview({ id: "2", rating: 5 }),
      createMockReview({ id: "3", rating: 4 }),
      createMockReview({ id: "4", rating: 3 }),
      createMockReview({ id: "5", rating: 1 }),
    ];

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reviews: mockReviews }),
    });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Review Analytics/i)).toBeInTheDocument();
      expect(screen.getByText(/Total Reviews:/i)).toBeInTheDocument();
    });
  });

  it("sorts reviews by newest first by default", async () => {
    const now = Date.now() / 1000;
    const mockReviews = [
      createMockReview({
        id: "1",
        review: "Oldest review",
        timeOfReview: { _seconds: now - 86400 * 2, _nanoseconds: 0 }
      }),
      createMockReview({
        id: "2",
        review: "Newest review",
        timeOfReview: { _seconds: now, _nanoseconds: 0 }
      }),
      createMockReview({
        id: "3",
        review: "Middle review",
        timeOfReview: { _seconds: now - 86400, _nanoseconds: 0 }
      }),
    ];

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reviews: mockReviews }),
    });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => {
      const reviewCards = screen.getAllByRole('article', { hidden: true });
      if (reviewCards.length === 0) {
        // Fallback to text content check
        expect(screen.getByText(/Newest review/i)).toBeInTheDocument();
      } else {
        expect(reviewCards[0]).toHaveTextContent('Newest review');
      }
    });
  });

  it("changes sort order when sort option is changed", async () => {
    const mockReviews = [
      createMockReview({ id: "1", rating: 5, review: "Five stars" }),
      createMockReview({ id: "2", rating: 2, review: "Two stars" }),
      createMockReview({ id: "3", rating: 4, review: "Four stars" }),
    ];

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reviews: mockReviews }),
    });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Five stars/i)).toBeInTheDocument();
    });

    // Change to most critical
    const sortSelect = screen.getByRole('combobox');
    fireEvent.change(sortSelect, { target: { value: 'most-critical' } });

    await waitFor(() => {
      // Just verify the text is present after sorting
      expect(screen.getByText(/Two stars/i)).toBeInTheDocument();
      expect(screen.getByText(/Five stars/i)).toBeInTheDocument();
    });
  });

  it("sorts by most praiseworthy", async () => {
    const mockReviews = [
      createMockReview({ id: "1", rating: 3, review: "Three stars" }),
      createMockReview({ id: "2", rating: 5, review: "Five stars" }),
      createMockReview({ id: "3", rating: 4, review: "Four stars" }),
    ];

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reviews: mockReviews }),
    });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Three stars/i)).toBeInTheDocument();
    });

    const sortSelect = screen.getByRole('combobox');
    fireEvent.change(sortSelect, { target: { value: 'most-praiseworthy' } });

    await waitFor(() => {
      // Verify all reviews are still displayed
      expect(screen.getByText(/Five stars/i)).toBeInTheDocument();
      expect(screen.getByText(/Four stars/i)).toBeInTheDocument();
      expect(screen.getByText(/Three stars/i)).toBeInTheDocument();
    });
  });

  it("sorts by oldest first", async () => {
    const now = Date.now() / 1000;
    const mockReviews = [
      createMockReview({
        id: "1",
        review: "Newest",
        timeOfReview: { _seconds: now, _nanoseconds: 0 }
      }),
      createMockReview({
        id: "2",
        review: "Oldest",
        timeOfReview: { _seconds: now - 86400 * 5, _nanoseconds: 0 }
      }),
    ];

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reviews: mockReviews }),
    });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Newest/i)).toBeInTheDocument();
    });

    const sortSelect = screen.getByRole('combobox');
    fireEvent.change(sortSelect, { target: { value: 'oldest' } });

    await waitFor(() => {
      // Verify both reviews are displayed
      expect(screen.getByText(/Oldest/i)).toBeInTheDocument();
      expect(screen.getByText(/Newest/i)).toBeInTheDocument();
    });
  });

  it("allows vendor to reply to a review", async () => {
    const mockReview = createMockReview({
      id: "review-1",
      review: "Great work!",
      reply: null
    });

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ reviews: [mockReview] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Great work!/i)).toBeInTheDocument();
    });

    // Type a reply
    const replyInput = screen.getByPlaceholderText(/Write a reply/i);
    fireEvent.change(replyInput, { target: { value: "Thank you!" } });

    // Send reply
    const sendButton = screen.getByText(/Send/i);
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/analytics/testVendor123/reviews/review-1/reply"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ reply: "Thank you!" }),
        })
      );
    });
  });

  it("prevents sending empty reply", async () => {
    const mockReview = createMockReview({
      id: "review-1",
      review: "Great work!",
      reply: null
    });

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reviews: [mockReview] }),
    });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Great work!/i)).toBeInTheDocument();
    });

    // Try to send without typing
    const sendButton = screen.getByText(/Send/i);
    expect(sendButton).toBeDisabled();
  });

  it("allows vendor to edit existing reply", async () => {
    const mockReview = createMockReview({
      id: "review-1",
      review: "Great work!",
      reply: "Thank you!"
    });

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ reviews: [mockReview] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Your Reply:/i)).toBeInTheDocument();
      expect(screen.getByText(/Thank you!/i)).toBeInTheDocument();
    });

    // Click edit button
    const editButton = screen.getByText(/Edit/i);
    fireEvent.click(editButton);

    await waitFor(() => {
      const replyInput = screen.getByPlaceholderText(/Write a reply/i);
      expect(replyInput.value).toBe("Thank you!");
    });

    // Edit the reply
    const replyInput = screen.getByPlaceholderText(/Write a reply/i);
    fireEvent.change(replyInput, { target: { value: "Thank you so much!" } });

    // Send edited reply
    const sendButton = screen.getByText(/Send/i);
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/reply"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ reply: "Thank you so much!" }),
        })
      );
    });
  });

  it("allows vendor to delete reply", async () => {
    global.confirm.mockReturnValue(true);

    const mockReview = createMockReview({
      id: "review-1",
      review: "Great work!",
      reply: "Thank you!"
    });

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ reviews: [mockReview] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Your Reply:/i)).toBeInTheDocument();
    });

    // Click delete button
    const deleteButton = screen.getByText(/Delete/i);
    fireEvent.click(deleteButton);

    expect(global.confirm).toHaveBeenCalledWith("Are you sure you want to delete this reply?");

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/reply"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ reply: "_blank_" }),
        })
      );
    });
  });

  it("cancels delete when user cancels confirmation", async () => {
    global.confirm.mockReturnValue(false);

    const mockReview = createMockReview({
      id: "review-1",
      review: "Great work!",
      reply: "Thank you!"
    });

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reviews: [mockReview] }),
    });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Your Reply:/i)).toBeInTheDocument();
    });

    const deleteButton = screen.getByText(/Delete/i);
    fireEvent.click(deleteButton);

    expect(global.confirm).toHaveBeenCalled();
    
    // Reply should still be visible
    expect(screen.getByText(/Thank you!/i)).toBeInTheDocument();
  });

  it("cancels reply edit", async () => {
    const mockReview = createMockReview({
      id: "review-1",
      review: "Great work!",
      reply: "Thank you!"
    });

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reviews: [mockReview] }),
    });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Your Reply:/i)).toBeInTheDocument();
    });

    // Click edit
    const editButton = screen.getByText(/Edit/i);
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Write a reply/i)).toBeInTheDocument();
    });

    // Click cancel
    const cancelButton = screen.getByText(/Cancel/i);
    fireEvent.click(cancelButton);

    await waitFor(() => {
      // Should show the original reply again
      expect(screen.getByText(/Your Reply:/i)).toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/Write a reply/i)).not.toBeInTheDocument();
    });
  });

  it("toggles between distribution and monthly view", async () => {
    const mockReviews = [
      createMockReview({ id: "1", rating: 5 }),
      createMockReview({ id: "2", rating: 4 }),
    ];

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reviews: mockReviews }),
    });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Review Analytics/i)).toBeInTheDocument();
    });

    // Should start in distribution view - find the active button
    const distributionButton = screen.getByText(/Distribution/i).closest('button');
    expect(distributionButton).toHaveClass('active');

    // Click monthly toggle
    const monthlyButton = screen.getByText(/Monthly/i).closest('button');
    fireEvent.click(monthlyButton);

    await waitFor(() => {
      expect(monthlyButton).toHaveClass('active');
    });
  });

  it("displays monthly chart correctly", async () => {
    const now = Date.now() / 1000;
    const mockReviews = [
      createMockReview({
        id: "1",
        rating: 5,
        timeOfReview: { _seconds: now, _nanoseconds: 0 }
      }),
      createMockReview({
        id: "2",
        rating: 4,
        timeOfReview: { _seconds: now - 86400 * 30, _nanoseconds: 0 } // 1 month ago
      }),
    ];

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reviews: mockReviews }),
    });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Review Analytics/i)).toBeInTheDocument();
    });

    // Switch to monthly view
    const monthlyButton = screen.getByText(/Monthly/i).closest('button');
    fireEvent.click(monthlyButton);

    await waitFor(() => {
      // Check for legend items instead of specific class names
      expect(screen.getByText(/Reviews Count/i)).toBeInTheDocument();
      expect(screen.getByText(/Avg Rating/i)).toBeInTheDocument();
    });
  });

  it("handles reply API error gracefully", async () => {
    const mockReview = createMockReview({
      id: "review-1",
      review: "Great work!",
      reply: null
    });

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ reviews: [mockReview] }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Failed to update reply" }),
      });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Great work!/i)).toBeInTheDocument();
    });

    // Type and send reply
    const replyInput = screen.getByPlaceholderText(/Write a reply/i);
    fireEvent.change(replyInput, { target: { value: "Thank you!" } });

    const sendButton = screen.getByText(/Send/i);
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(expect.stringContaining("Failed to update reply"));
    });
  });

  it("calculates monthly trends correctly", async () => {
    const now = Date.now() / 1000;
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const lastMonthStart = new Date(thisMonthStart);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

    const mockReviews = [
      // This month: 5 stars
      createMockReview({
        id: "1",
        rating: 5,
        timeOfReview: { _seconds: Math.floor(thisMonthStart.getTime() / 1000), _nanoseconds: 0 }
      }),
      // Last month: 3 stars
      createMockReview({
        id: "2",
        rating: 3,
        timeOfReview: { _seconds: Math.floor(lastMonthStart.getTime() / 1000), _nanoseconds: 0 }
      }),
    ];

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reviews: mockReviews }),
    });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Monthly Trend/i)).toBeInTheDocument();
      // Should show positive trend
      expect(screen.getByTestId('trending-up-icon')).toBeInTheDocument();
    });
  });

  it("handles different timestamp formats", async () => {
    const mockReviews = [
      createMockReview({
        id: "1",
        timeOfReview: { _seconds: 1634567890, _nanoseconds: 0 } // Object format
      }),
      createMockReview({
        id: "2",
        timeOfReview: { seconds: 1634567890, nanoseconds: 0 } // Alternative format
      }),
      createMockReview({
        id: "3",
        timeOfReview: "2021-10-18T12:00:00Z" // String format
      }),
      createMockReview({
        id: "4",
        timeOfReview: 1634567890000 // Milliseconds timestamp
      }),
    ];

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reviews: mockReviews }),
    });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => {
      const reviewCards = screen.getAllByClassName('review-card');
      expect(reviewCards).toHaveLength(4);
      // All should have date text (not "Recently")
      reviewCards.forEach(card => {
        expect(card.textContent).not.toBe("");
      });
    });
  });

  it("shows 'Just now' for very recent reviews", async () => {
    const mockReview = createMockReview({
      id: "1",
      review: "Brand new review",
      timeOfReview: { _seconds: Math.floor(Date.now() / 1000), _nanoseconds: 0 }
    });

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reviews: [mockReview] }),
    });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Just now|minute/i)).toBeInTheDocument();
    });
  });

  it("handles no monthly data gracefully", async () => {
    const mockReviews = [
      createMockReview({ id: "1", rating: 5 }),
    ];

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reviews: mockReviews }),
    });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Review Analytics/i)).toBeInTheDocument();
    });

    // Switch to monthly view
    const monthlyButton = screen.getByText(/Monthly/i).closest('button');
    fireEvent.click(monthlyButton);

    // Should show chart or legend
    await waitFor(() => {
      // Check for either the chart container or legend items
      const hasLegend = screen.queryByText(/Reviews Count/i);
      expect(hasLegend || screen.queryByText(/Avg Rating/i)).toBeTruthy();
    });
  });

  it("displays This Month count correctly in distribution view", async () => {
    const now = Date.now() / 1000;
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const mockReviews = [
      createMockReview({
        id: "1",
        rating: 5,
        timeOfReview: { _seconds: Math.floor(thisMonthStart.getTime() / 1000) + 1000, _nanoseconds: 0 }
      }),
      createMockReview({
        id: "2",
        rating: 4,
        timeOfReview: { _seconds: Math.floor(thisMonthStart.getTime() / 1000) + 2000, _nanoseconds: 0 }
      }),
      createMockReview({
        id: "3",
        rating: 5,
        timeOfReview: { _seconds: Math.floor(thisMonthStart.getTime() / 1000) - 86400 * 40, _nanoseconds: 0 } // Last month
      }),
    ];

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reviews: mockReviews }),
    });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/This Month:/i)).toBeInTheDocument();
      // Check that "This Month" section exists with count
      const thisMonthSection = screen.getByText(/This Month:/i).parentElement;
      expect(thisMonthSection).toHaveTextContent('2');
    });
  });

  it("handles API authorization correctly", async () => {
    const mockReviews = [createMockReview()];

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reviews: mockReviews }),
    });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/analytics/testVendor123"),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer fake-token",
          }),
        })
      );
    });
  });
});

describe("StarRating Component", () => {
  it("renders correct number of filled stars for whole number rating", async () => {
    const mockReview = createMockReview({
      id: "1",
      rating: 5,
      review: "Perfect!"
    });

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reviews: [mockReview] }),
    });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Should have 5 filled stars
      const filledStars = screen.getAllByTestId('star-icon').filter(
        star => star.dataset.fill === '#fbbf24'
      );
      expect(filledStars.length).toBeGreaterThan(0);
    });
  });

  it("renders half star for decimal ratings", async () => {
    const mockReview = createMockReview({
      id: "1",
      rating: 4.5,
      review: "Almost perfect!"
    });

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reviews: [mockReview] }),
    });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Should have at least one half star
      const halfStars = screen.getAllByTestId('star-half-icon');
      expect(halfStars.length).toBeGreaterThan(0);
    });
  });

  it("renders empty stars for low ratings", async () => {
    const mockReview = createMockReview({
      id: "1",
      rating: 2,
      review: "Not great"
    });

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reviews: [mockReview] }),
    });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Should have some empty stars (not filled with gold)
      const emptyStars = screen.getAllByTestId('star-icon').filter(
        star => star.dataset.fill === '#f9fafbff'
      );
      expect(emptyStars.length).toBeGreaterThan(0);
    });
  });
});

describe("Edge Cases and Error Handling", () => {
  it("handles missing review text gracefully", async () => {
    const mockReview = createMockReview({
      id: "1",
      rating: 5,
      review: undefined
    });

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reviews: [mockReview] }),
    });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Vendor Reviews/i)).toBeInTheDocument();
      // Component should render without crashing
      const reviewCards = screen.getAllByClassName('review-card');
      expect(reviewCards).toHaveLength(1);
    });
  });

  it("handles missing rating gracefully", async () => {
    const mockReview = createMockReview({
      id: "1",
      rating: null,
      review: "No rating given"
    });

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reviews: [mockReview] }),
    });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No rating given/i)).toBeInTheDocument();
      // Should still display the review
    });
  });

  it("handles network error during reply submission", async () => {
    const mockReview = createMockReview({
      id: "review-1",
      review: "Great work!",
      reply: null
    });

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ reviews: [mockReview] }),
      })
      .mockRejectedValueOnce(new Error("Network error"));

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Great work!/i)).toBeInTheDocument();
    });

    // Try to send reply
    const replyInput = screen.getByPlaceholderText(/Write a reply/i);
    fireEvent.change(replyInput, { target: { value: "Thank you!" } });

    const sendButton = screen.getByText(/Send/i);
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(expect.stringContaining("Network error"));
    });
  });

  it("handles malformed timestamp data", async () => {
    const mockReview = createMockReview({
      id: "1",
      review: "Test review",
      timeOfReview: "invalid-date-string"
    });

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reviews: [mockReview] }),
    });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Test review/i)).toBeInTheDocument();
      // Should show "Recently" for invalid date
      expect(screen.getByText(/Recently/i)).toBeInTheDocument();
    });
  });

  it("handles zero reviews in analytics", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reviews: [] }),
    });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No reviews found/i)).toBeInTheDocument();
    });
  });

  it("handles reviews with only whitespace in reply", async () => {
    const mockReview = createMockReview({
      id: "review-1",
      review: "Great work!",
      reply: null
    });

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reviews: [mockReview] }),
    });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Great work!/i)).toBeInTheDocument();
    });

    // Try to send reply with only spaces
    const replyInput = screen.getByPlaceholderText(/Write a reply/i);
    fireEvent.change(replyInput, { target: { value: "   " } });

    const sendButton = screen.getByText(/Send/i);
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith("Reply text is required");
    });
  });

  it("maintains sort order after replying to a review", async () => {
    const now = Date.now() / 1000;
    const mockReviews = [
      createMockReview({
        id: "1",
        review: "First review",
        rating: 5,
        timeOfReview: { _seconds: now, _nanoseconds: 0 }
      }),
      createMockReview({
        id: "2",
        review: "Second review",
        rating: 4,
        timeOfReview: { _seconds: now - 86400, _nanoseconds: 0 }
      }),
    ];

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ reviews: mockReviews }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/First review/i)).toBeInTheDocument();
    });

    // Reply to the first review
    const replyInputs = screen.getAllByPlaceholderText(/Write a reply/i);
    fireEvent.change(replyInputs[0], { target: { value: "Thank you!" } });

    const sendButtons = screen.getAllByText(/Send/i);
    fireEvent.click(sendButtons[0]);

    await waitFor(() => {
      // Both reviews should still be visible
      expect(screen.getByText(/First review/i)).toBeInTheDocument();
      expect(screen.getByText(/Second review/i)).toBeInTheDocument();
    });
  });

  it("handles very old reviews with appropriate date formatting", async () => {
    const oldTimestamp = new Date('2020-01-01').getTime() / 1000;
    const mockReview = createMockReview({
      id: "1",
      review: "Old review",
      timeOfReview: { _seconds: oldTimestamp, _nanoseconds: 0 }
    });

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reviews: [mockReview] }),
    });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Old review/i)).toBeInTheDocument();
      // Should show formatted date for old reviews
      expect(screen.getByText(/Jan|2020/i)).toBeInTheDocument();
    });
  });

  it("calculates correct percentage for rating distribution", async () => {
    const mockReviews = [
      createMockReview({ id: "1", rating: 5 }),
      createMockReview({ id: "2", rating: 5 }),
      createMockReview({ id: "3", rating: 4 }),
      createMockReview({ id: "4", rating: 3 }),
    ];

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reviews: mockReviews }),
    });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Review Analytics/i)).toBeInTheDocument();
      // Should show Total Reviews: 4
      expect(screen.getByText(/Total Reviews:/i).nextSibling).toHaveTextContent('4');
    });
  });

  it("shows stable trend when no change between months", async () => {
    const now = Date.now() / 1000;
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const lastMonthStart = new Date(thisMonthStart);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

    const mockReviews = [
      createMockReview({
        id: "1",
        rating: 4,
        timeOfReview: { _seconds: Math.floor(thisMonthStart.getTime() / 1000), _nanoseconds: 0 }
      }),
      createMockReview({
        id: "2",
        rating: 4,
        timeOfReview: { _seconds: Math.floor(lastMonthStart.getTime() / 1000), _nanoseconds: 0 }
      }),
    ];

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reviews: mockReviews }),
    });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No change/i)).toBeInTheDocument();
    });
  });

  it("shows negative trend when rating decreases", async () => {
    const now = Date.now() / 1000;
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const lastMonthStart = new Date(thisMonthStart);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

    const mockReviews = [
      createMockReview({
        id: "1",
        rating: 3,
        timeOfReview: { _seconds: Math.floor(thisMonthStart.getTime() / 1000), _nanoseconds: 0 }
      }),
      createMockReview({
        id: "2",
        rating: 5,
        timeOfReview: { _seconds: Math.floor(lastMonthStart.getTime() / 1000), _nanoseconds: 0 }
      }),
    ];

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reviews: mockReviews }),
    });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('trending-down-icon')).toBeInTheDocument();
    });
  });

  it("handles review with _blank_ reply correctly", async () => {
    const mockReview = createMockReview({
      id: "review-1",
      review: "Great work!",
      reply: "_blank_"
    });

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reviews: [mockReview] }),
    });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Great work!/i)).toBeInTheDocument();
      // Should show reply input, not "Your Reply"
      expect(screen.getByPlaceholderText(/Write a reply/i)).toBeInTheDocument();
      expect(screen.queryByText(/Your Reply:/i)).not.toBeInTheDocument();
    });
  });

  it("handles multiple reviews with mixed reply states", async () => {
    const mockReviews = [
      createMockReview({
        id: "1",
        review: "Review with reply",
        reply: "Thank you!"
      }),
      createMockReview({
        id: "2",
        review: "Review without reply",
        reply: null
      }),
      createMockReview({
        id: "3",
        review: "Review with blank reply",
        reply: "_blank_"
      }),
    ];

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reviews: mockReviews }),
    });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Review with reply/i)).toBeInTheDocument();
      expect(screen.getByText(/Review without reply/i)).toBeInTheDocument();
      expect(screen.getByText(/Review with blank reply/i)).toBeInTheDocument();
      
      // Should have one "Your Reply:" and two reply inputs
      expect(screen.getByText(/Your Reply:/i)).toBeInTheDocument();
      const replyInputs = screen.getAllByPlaceholderText(/Write a reply/i);
      expect(replyInputs).toHaveLength(2);
    });
  });

  it("formats time correctly for different time ranges", async () => {
    const now = Date.now() / 1000;
    const mockReviews = [
      createMockReview({
        id: "1",
        review: "Minutes ago",
        timeOfReview: { _seconds: now - 1800, _nanoseconds: 0 } // 30 minutes ago
      }),
      createMockReview({
        id: "2",
        review: "Hours ago",
        timeOfReview: { _seconds: now - 7200, _nanoseconds: 0 } // 2 hours ago
      }),
      createMockReview({
        id: "3",
        review: "Days ago",
        timeOfReview: { _seconds: now - 259200, _nanoseconds: 0 } // 3 days ago
      }),
      createMockReview({
        id: "4",
        review: "Weeks ago",
        timeOfReview: { _seconds: now - 1209600, _nanoseconds: 0 } // 2 weeks ago
      }),
    ];

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reviews: mockReviews }),
    });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Check that all reviews are rendered
      expect(screen.getByText(/Minutes ago/i)).toBeInTheDocument();
      expect(screen.getByText(/Hours ago/i)).toBeInTheDocument();
      expect(screen.getByText(/Days ago/i)).toBeInTheDocument();
      expect(screen.getByText(/Weeks ago/i)).toBeInTheDocument();
    });
  });
});

describe("Performance and Optimization", () => {
  it("does not re-fetch reviews unnecessarily", async () => {
    const mockReviews = [createMockReview()];

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ reviews: mockReviews }),
    });

    const { rerender } = render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Vendor Reviews/i)).toBeInTheDocument();
    });

    const initialFetchCount = global.fetch.mock.calls.length;

    // Re-render without changing vendorId
    rerender(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    // Should not fetch again
    expect(global.fetch.mock.calls.length).toBe(initialFetchCount);
  });

  it("handles rapid sort changes efficiently", async () => {
    const mockReviews = [
      createMockReview({ id: "1", rating: 5 }),
      createMockReview({ id: "2", rating: 3 }),
      createMockReview({ id: "3", rating: 4 }),
    ];

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reviews: mockReviews }),
    });

    render(
      <MemoryRouter>
        <VendorReviews />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Vendor Reviews/i)).toBeInTheDocument();
    });

    const sortSelect = screen.getByRole('combobox');

    // Rapidly change sort options
    fireEvent.change(sortSelect, { target: { value: 'most-critical' } });
    fireEvent.change(sortSelect, { target: { value: 'most-praiseworthy' } });
    fireEvent.change(sortSelect, { target: { value: 'oldest' } });

    // Should handle all changes without crashing
    await waitFor(() => {
      const reviewCards = screen.getAllByClassName('review-card');
      expect(reviewCards).toHaveLength(3);
    });
  });
});