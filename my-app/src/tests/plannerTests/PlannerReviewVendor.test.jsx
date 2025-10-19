import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, beforeEach, afterEach, vi, expect, beforeAll } from "vitest";

import { configure } from "@testing-library/react";

configure({
  getElementError: (message) => {
    // Instead of dumping the full DOM, just throw the message
    return new Error(message);
  },
});

// MOCKS
// --- Mock firebase/auth ---
const mockAuth = {
  currentUser: {
    uid: "test-planner",
    getIdToken: vi.fn(() => Promise.resolve("mock-token")),
  },
};

vi.mock("firebase/auth", () => ({
  getAuth: () => mockAuth,
}));

// --- Mock global functions ---
beforeAll(() => {
  global.alert = vi.fn();
});

beforeEach(() => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
    })
  );
  global.alert.mockClear();
  mockAuth.currentUser.getIdToken.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

import PlannerReviewVendor from "../../pages/planner/ReviewComponents/PlannerReviewVendor";

describe("PlannerReviewVendor", () => {
  const defaultProps = {
    vendorId: "vendor123",
    vendorName: "ProPhotos Inc",
    eventId: "event123",
    serviceName: "Photography",
    onClose: vi.fn(),
    onReviewSubmitted: vi.fn(),
  };

  beforeEach(() => {
    global.fetch.mockClear();
    global.alert.mockClear();
    mockAuth.currentUser.getIdToken.mockClear();
    defaultProps.onClose.mockClear();
    defaultProps.onReviewSubmitted.mockClear();
  });

  it("renders modal with vendor information", () => {
    render(<PlannerReviewVendor {...defaultProps} />);

    expect(screen.getByText("Review Vendor")).toBeInTheDocument();
    expect(screen.getByText("ProPhotos Inc")).toBeInTheDocument();
    expect(screen.getByText("Photography")).toBeInTheDocument();
    expect(screen.getByText("Your Rating *")).toBeInTheDocument();
    expect(screen.getByText("Your Review *")).toBeInTheDocument();
  });

  it("renders without service name", () => {
    const props = { ...defaultProps, serviceName: null };
    render(<PlannerReviewVendor {...props} />);

    expect(screen.getByText("ProPhotos Inc")).toBeInTheDocument();
    expect(screen.queryByText("Photography")).not.toBeInTheDocument();
  });

  it("displays all 5 star buttons", () => {
    render(<PlannerReviewVendor {...defaultProps} />);

    const starButtons = screen.getAllByRole("button").filter(btn => 
      btn.getAttribute("aria-label")?.includes("Rate")
    );
    expect(starButtons).toHaveLength(5);
  });

  it("updates rating when star is clicked", () => {
    render(<PlannerReviewVendor {...defaultProps} />);

    const threeStarButton = screen.getByRole("button", { name: "Rate 3 stars" });
    fireEvent.click(threeStarButton);

    expect(screen.getByText("Good")).toBeInTheDocument();
  });

  it("displays correct rating text for each star level", () => {
    render(<PlannerReviewVendor {...defaultProps} />);

    const starButtons = screen.getAllByRole("button").filter(btn => 
      btn.getAttribute("aria-label")?.includes("Rate")
    );

    fireEvent.click(starButtons[0]); // 1 star
    expect(screen.getByText("Poor")).toBeInTheDocument();

    fireEvent.click(starButtons[1]); // 2 stars
    expect(screen.getByText("Fair")).toBeInTheDocument();

    fireEvent.click(starButtons[2]); // 3 stars
    expect(screen.getByText("Good")).toBeInTheDocument();

    fireEvent.click(starButtons[3]); // 4 stars
    expect(screen.getByText("Very Good")).toBeInTheDocument();

    fireEvent.click(starButtons[4]); // 5 stars
    expect(screen.getByText("Excellent")).toBeInTheDocument();
  });

  it("shows hover rating text on star hover", () => {
    render(<PlannerReviewVendor {...defaultProps} />);

    const fourStarButton = screen.getByRole("button", { name: "Rate 4 stars" });
    
    fireEvent.mouseEnter(fourStarButton);
    expect(screen.getByText("Very Good")).toBeInTheDocument();

    fireEvent.mouseLeave(fourStarButton);
    expect(screen.getByText("Select a rating")).toBeInTheDocument();
  });

  it("maintains selected rating after hover", () => {
    render(<PlannerReviewVendor {...defaultProps} />);

    const threeStarButton = screen.getByRole("button", { name: "Rate 3 stars" });
    const fiveStarButton = screen.getByRole("button", { name: "Rate 5 stars" });

    // Select 3 stars
    fireEvent.click(threeStarButton);
    expect(screen.getByText("Good")).toBeInTheDocument();

    // Hover over 5 stars
    fireEvent.mouseEnter(fiveStarButton);
    expect(screen.getByText("Excellent")).toBeInTheDocument();

    // Leave hover, should return to selected rating (3)
    fireEvent.mouseLeave(fiveStarButton);
    expect(screen.getByText("Good")).toBeInTheDocument();
  });

  it("updates review text on input", () => {
    render(<PlannerReviewVendor {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/Share your experience/i);
    fireEvent.change(textarea, { target: { value: "This is a great vendor!" } });

    expect(textarea.value).toBe("This is a great vendor!");
  });

  it("displays character count", () => {
    render(<PlannerReviewVendor {...defaultProps} />);

    expect(screen.getByText("0/1000 characters")).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/Share your experience/i);
    fireEvent.change(textarea, { target: { value: "Great service!" } });

    expect(screen.getByText("14/1000 characters")).toBeInTheDocument();
  });

  it("submits review successfully", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ 
        review: { 
          id: "review123", 
          rating: 5, 
          review: "Excellent service!" 
        } 
      }),
    });

    render(<PlannerReviewVendor {...defaultProps} />);

    // Select 5 stars
    const fiveStarButton = screen.getByRole("button", { name: "Rate 5 stars" });
    fireEvent.click(fiveStarButton);

    // Enter review text
    const textarea = screen.getByPlaceholderText(/Share your experience/i);
    fireEvent.change(textarea, { target: { value: "Excellent service! Very professional." } });

    // Submit
    const submitButton = screen.getByText("Submit Review");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/planner/vendors/vendor123/reviews"),
        expect.objectContaining({
          method: "POST",
          headers: {
            Authorization: "Bearer mock-token",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rating: 5,
            review: "Excellent service! Very professional.",
            eventId: "event123",
            serviceName: "Photography",
          }),
        })
      );
    });

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith("Review submitted successfully!");
      expect(defaultProps.onReviewSubmitted).toHaveBeenCalledWith({
        id: "review123",
        rating: 5,
        review: "Excellent service!",
      });
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  it("disables submit button while submitting", async () => {
    let resolveSubmit;
    const submitPromise = new Promise((resolve) => {
      resolveSubmit = resolve;
    });

    global.fetch.mockImplementation(() => submitPromise);

    render(<PlannerReviewVendor {...defaultProps} />);

    // Select rating and enter text
    const fiveStarButton = screen.getByRole("button", { name: "Rate 5 stars" });
    fireEvent.click(fiveStarButton);

    const textarea = screen.getByPlaceholderText(/Share your experience/i);
    fireEvent.change(textarea, { target: { value: "Great service provided" } });

    // Submit
    const submitButton = screen.getByText("Submit Review");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Submitting...")).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    // Resolve the promise
    resolveSubmit({
      ok: true,
      json: () => Promise.resolve({ review: {} }),
    });

    await waitFor(() => {
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  it("disables buttons when submitting", async () => {
    let resolveSubmit;
    const submitPromise = new Promise((resolve) => {
      resolveSubmit = resolve;
    });

    global.fetch.mockImplementation(() => submitPromise);

    render(<PlannerReviewVendor {...defaultProps} />);

    const fiveStarButton = screen.getByRole("button", { name: "Rate 5 stars" });
    fireEvent.click(fiveStarButton);

    const textarea = screen.getByPlaceholderText(/Share your experience/i);
    fireEvent.change(textarea, { target: { value: "Great service provided" } });

    const submitButton = screen.getByText("Submit Review");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(screen.getByText("Cancel")).toBeDisabled();
    });

    resolveSubmit({
      ok: true,
      json: () => Promise.resolve({ review: {} }),
    });
  });

  it("handles API error during submission", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<PlannerReviewVendor {...defaultProps} />);

    const fiveStarButton = screen.getByRole("button", { name: "Rate 5 stars" });
    fireEvent.click(fiveStarButton);

    const textarea = screen.getByPlaceholderText(/Share your experience/i);
    fireEvent.change(textarea, { target: { value: "Great service provided" } });

    const submitButton = screen.getByText("Submit Review");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Failed to submit review. Please try again.")).toBeInTheDocument();
    });

    expect(defaultProps.onClose).not.toHaveBeenCalled();
    expect(defaultProps.onReviewSubmitted).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("handles network error during submission", async () => {
    global.fetch.mockRejectedValueOnce(new Error("Network error"));

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<PlannerReviewVendor {...defaultProps} />);

    const fiveStarButton = screen.getByRole("button", { name: "Rate 5 stars" });
    fireEvent.click(fiveStarButton);

    const textarea = screen.getByPlaceholderText(/Share your experience/i);
    fireEvent.change(textarea, { target: { value: "Great service provided" } });

    const submitButton = screen.getByText("Submit Review");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Failed to submit review. Please try again.")).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalledWith("Error submitting review:", expect.any(Error));
    consoleSpy.mockRestore();
  });

  it("closes modal when clicking close button", () => {
    render(<PlannerReviewVendor {...defaultProps} />);

    const closeButton = screen.getByText("×");
    fireEvent.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("closes modal when clicking cancel button", () => {
    render(<PlannerReviewVendor {...defaultProps} />);

    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("closes modal when clicking overlay", () => {
    render(<PlannerReviewVendor {...defaultProps} />);

    const overlay = document.querySelector(".review-vendor-overlay");
    fireEvent.click(overlay);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("does not close modal when clicking modal content", () => {
    render(<PlannerReviewVendor {...defaultProps} />);

    const modalContent = document.querySelector(".review-vendor-modal");
    fireEvent.click(modalContent);

    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it("prevents event propagation when clicking modal content", () => {
    render(<PlannerReviewVendor {...defaultProps} />);

    const overlay = document.querySelector(".review-vendor-overlay");
    const modalContent = document.querySelector(".review-vendor-modal");

    const overlayClickHandler = vi.fn();
    overlay.addEventListener("click", overlayClickHandler);

    fireEvent.click(modalContent);

    // Modal content click should not propagate to overlay
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it("disables submit button when rating is 0", () => {
    render(<PlannerReviewVendor {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/Share your experience/i);
    fireEvent.change(textarea, { target: { value: "This is a great vendor with excellent service!" } });

    const submitButton = screen.getByText("Submit Review");
    expect(submitButton).toBeDisabled();
  });

  it("disables submit button when review text is too short", () => {
    render(<PlannerReviewVendor {...defaultProps} />);

    const fiveStarButton = screen.getByRole("button", { name: "Rate 5 stars" });
    fireEvent.click(fiveStarButton);

    const textarea = screen.getByPlaceholderText(/Share your experience/i);
    fireEvent.change(textarea, { target: { value: "Short" } });

    const submitButton = screen.getByText("Submit Review");
    expect(submitButton).toBeDisabled();
  });

  it("enables submit button when all validations pass", () => {
    render(<PlannerReviewVendor {...defaultProps} />);

    const fiveStarButton = screen.getByRole("button", { name: "Rate 5 stars" });
    fireEvent.click(fiveStarButton);

    const textarea = screen.getByPlaceholderText(/Share your experience/i);
    fireEvent.change(textarea, { target: { value: "This is a great vendor!" } });

    const submitButton = screen.getByText("Submit Review");
    expect(submitButton).not.toBeDisabled();
  });

  it("enforces maximum character limit", () => {
    render(<PlannerReviewVendor {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/Share your experience/i);
    expect(textarea).toHaveAttribute("maxLength", "1000");
  });

  it("enforces minimum character requirement", () => {
    render(<PlannerReviewVendor {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/Share your experience/i);
    expect(textarea).toHaveAttribute("minLength", "10");
    expect(textarea).toHaveAttribute("required");
  });

  it("accepts exactly 10 characters", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ review: {} }),
    });

    render(<PlannerReviewVendor {...defaultProps} />);

    const fiveStarButton = screen.getByRole("button", { name: "Rate 5 stars" });
    fireEvent.click(fiveStarButton);

    const textarea = screen.getByPlaceholderText(/Share your experience/i);
    fireEvent.change(textarea, { target: { value: "1234567890" } }); // Exactly 10 chars

    const submitButton = screen.getByText("Submit Review");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it("updates character count in real-time", () => {
    render(<PlannerReviewVendor {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/Share your experience/i);
    
    fireEvent.change(textarea, { target: { value: "Hello" } });
    expect(screen.getByText("5/1000 characters")).toBeInTheDocument();

    fireEvent.change(textarea, { target: { value: "Hello World!" } });
    expect(screen.getByText("12/1000 characters")).toBeInTheDocument();

    fireEvent.change(textarea, { target: { value: "" } });
    expect(screen.getByText("0/1000 characters")).toBeInTheDocument();
  });

  it("calls onReviewSubmitted with correct data", async () => {
    const reviewData = {
      id: "review123",
      rating: 4,
      review: "Very good service",
      vendorId: "vendor123",
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ review: reviewData }),
    });

    render(<PlannerReviewVendor {...defaultProps} />);

    const fourStarButton = screen.getByRole("button", { name: "Rate 4 stars" });
    fireEvent.click(fourStarButton);

    const textarea = screen.getByPlaceholderText(/Share your experience/i);
    fireEvent.change(textarea, { target: { value: "Very good service provided" } });

    const submitButton = screen.getByText("Submit Review");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(defaultProps.onReviewSubmitted).toHaveBeenCalledWith(reviewData);
    });
  });

  it("does not call onReviewSubmitted if callback is not provided", async () => {
    const propsWithoutCallback = {
      ...defaultProps,
      onReviewSubmitted: undefined,
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ review: {} }),
    });

    render(<PlannerReviewVendor {...propsWithoutCallback} />);

    const fiveStarButton = screen.getByRole("button", { name: "Rate 5 stars" });
    fireEvent.click(fiveStarButton);

    const textarea = screen.getByPlaceholderText(/Share your experience/i);
    fireEvent.change(textarea, { target: { value: "Great service provided" } });

    const submitButton = screen.getByText("Submit Review");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith("Review submitted successfully!");
      expect(propsWithoutCallback.onClose).toHaveBeenCalled();
    });
  });

  it("uses correct API endpoint", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ review: {} }),
    });

    render(<PlannerReviewVendor {...defaultProps} />);

    const fiveStarButton = screen.getByRole("button", { name: "Rate 5 stars" });
    fireEvent.click(fiveStarButton);

    const textarea = screen.getByPlaceholderText(/Share your experience/i);
    fireEvent.change(textarea, { target: { value: "Great service provided" } });

    const submitButton = screen.getByText("Submit Review");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/planner/vendors/vendor123/reviews"),
        expect.any(Object)
      );
    });
  });

  it("sends authorization token in request", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ review: {} }),
    });

    render(<PlannerReviewVendor {...defaultProps} />);

    const fiveStarButton = screen.getByRole("button", { name: "Rate 5 stars" });
    fireEvent.click(fiveStarButton);

    const textarea = screen.getByPlaceholderText(/Share your experience/i);
    fireEvent.change(textarea, { target: { value: "Great service provided" } });

    const submitButton = screen.getByText("Submit Review");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockAuth.currentUser.getIdToken).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer mock-token",
          }),
        })
      );
    });
  });

  it("includes all required fields in request body", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ review: {} }),
    });

    render(<PlannerReviewVendor {...defaultProps} />);

    const threeStarButton = screen.getByRole("button", { name: "Rate 3 stars" });
    fireEvent.click(threeStarButton);

    const textarea = screen.getByPlaceholderText(/Share your experience/i);
    const reviewText = "Good service but room for improvement";
    fireEvent.change(textarea, { target: { value: reviewText } });

    const submitButton = screen.getByText("Submit Review");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            rating: 3,
            review: reviewText,
            eventId: "event123",
            serviceName: "Photography",
          }),
        })
      );
    });
  });

  it("applies filled class to stars based on rating", () => {
    render(<PlannerReviewVendor {...defaultProps} />);

    const threeStarButton = screen.getByRole("button", { name: "Rate 3 stars" });
    fireEvent.click(threeStarButton);

    const starButtons = screen.getAllByRole("button").filter(btn => 
      btn.getAttribute("aria-label")?.includes("Rate")
    );

    // First 3 stars should have filled class
    expect(starButtons[0].classList.contains("filled")).toBe(true);
    expect(starButtons[1].classList.contains("filled")).toBe(true);
    expect(starButtons[2].classList.contains("filled")).toBe(true);
    expect(starButtons[3].classList.contains("filled")).toBe(false);
    expect(starButtons[4].classList.contains("filled")).toBe(false);
  });

  it("applies filled class to stars on hover", () => {
    render(<PlannerReviewVendor {...defaultProps} />);

    const fourStarButton = screen.getByRole("button", { name: "Rate 4 stars" });
    fireEvent.mouseEnter(fourStarButton);

    const starButtons = screen.getAllByRole("button").filter(btn => 
      btn.getAttribute("aria-label")?.includes("Rate")
    );

    // First 4 stars should have filled class during hover
    expect(starButtons[0].classList.contains("filled")).toBe(true);
    expect(starButtons[1].classList.contains("filled")).toBe(true);
    expect(starButtons[2].classList.contains("filled")).toBe(true);
    expect(starButtons[3].classList.contains("filled")).toBe(true);
    expect(starButtons[4].classList.contains("filled")).toBe(false);
  });

  it("handles form submission via enter key", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ review: {} }),
    });

    render(<PlannerReviewVendor {...defaultProps} />);

    const fiveStarButton = screen.getByRole("button", { name: "Rate 5 stars" });
    fireEvent.click(fiveStarButton);

    const textarea = screen.getByPlaceholderText(/Share your experience/i);
    fireEvent.change(textarea, { target: { value: "Great service provided" } });

    const form = screen.getByText("Your Review *").closest("form");
    fireEvent.submit(form);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it("maintains state through re-renders", () => {
    const { rerender } = render(<PlannerReviewVendor {...defaultProps} />);

    const fiveStarButton = screen.getByRole("button", { name: "Rate 5 stars" });
    fireEvent.click(fiveStarButton);

    const textarea = screen.getByPlaceholderText(/Share your experience/i);
    fireEvent.change(textarea, { target: { value: "Great service!" } });

    // Re-render with same props
    rerender(<PlannerReviewVendor {...defaultProps} />);

    expect(screen.getByText("Excellent")).toBeInTheDocument();
    expect(textarea.value).toBe("Great service!");
  });

  it("renders star icons correctly", () => {
    render(<PlannerReviewVendor {...defaultProps} />);

    const starButtons = screen.getAllByRole("button").filter(btn => 
      btn.getAttribute("aria-label")?.includes("Rate")
    );

    // Each star button should contain an SVG (Star component from lucide-react)
    starButtons.forEach(button => {
      expect(button.querySelector("svg")).toBeInTheDocument();
    });
  });

  it("displays rating text with proper initial state", () => {
    render(<PlannerReviewVendor {...defaultProps} />);

    expect(screen.getByText("Select a rating")).toBeInTheDocument();
    
    const ratingTextElement = screen.getByText("Select a rating");
    expect(ratingTextElement.classList.contains("rating-text")).toBe(true);
  });
});