import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, beforeEach, vi, expect, afterEach } from "vitest";
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



// Mock useNavigate hook
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock CSS import
vi.mock("../../pages/vendor/VendorWaiting.css", () => ({}));

// Import the component after mocks are set up
import VendorWaiting from "../../pages/vendor/VendorWaiting.jsx";

// Mock window.scrollTo
const mockScrollTo = vi.fn();
Object.defineProperty(window, 'scrollTo', {
  value: mockScrollTo,
  writable: true,
});

describe("VendorWaiting Component", () => {
  let originalOverflow;

  beforeEach(() => {
    vi.clearAllMocks();
    // Store original overflow value
    originalOverflow = document.body.style.overflow;
    // Reset body overflow
    document.body.style.overflow = "auto";
  });

  afterEach(() => {
    // Restore original overflow value
    document.body.style.overflow = originalOverflow;
  });

  it("renders the waiting message correctly", () => {
    render(
      <MemoryRouter>
        <VendorWaiting />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Your application is in progress"
    );
    
    expect(screen.getByText(
      "Please wait while we review your vendor application. You will be notified once it is approved or rejected."
    )).toBeInTheDocument();
    
    expect(screen.getByRole("button", { name: /back to home/i })).toBeInTheDocument();
  });

  it("scrolls to top and locks scroll on mount", () => {
    render(
      <MemoryRouter>
        <VendorWaiting />
      </MemoryRouter>
    );

    // Check that scrollTo was called to jump to top
    expect(mockScrollTo).toHaveBeenCalledWith(0, 0);
    
    // Check that body overflow is set to hidden
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("unlocks scroll on unmount", () => {
    const { unmount } = render(
      <MemoryRouter>
        <VendorWaiting />
      </MemoryRouter>
    );

    // Verify scroll is locked
    expect(document.body.style.overflow).toBe("hidden");

    // Unmount component
    unmount();

    // Verify scroll is unlocked
    expect(document.body.style.overflow).toBe("auto");
  });

  it("navigates to home when back button is clicked", () => {
    render(
      <MemoryRouter>
        <VendorWaiting />
      </MemoryRouter>
    );

    const backButton = screen.getByRole("button", { name: /back to home/i });
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith("/home");
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  

  it("handles multiple mount/unmount cycles correctly", () => {
    // First mount
    const { unmount: firstUnmount } = render(
      <MemoryRouter>
        <VendorWaiting />
      </MemoryRouter>
    );

    expect(document.body.style.overflow).toBe("hidden");
    expect(mockScrollTo).toHaveBeenCalledWith(0, 0);

    firstUnmount();
    expect(document.body.style.overflow).toBe("auto");

    // Clear mock calls
    mockScrollTo.mockClear();

    // Second mount
    const { unmount: secondUnmount } = render(
      <MemoryRouter>
        <VendorWaiting />
      </MemoryRouter>
    );

    expect(document.body.style.overflow).toBe("hidden");
    expect(mockScrollTo).toHaveBeenCalledWith(0, 0);

    secondUnmount();
    expect(document.body.style.overflow).toBe("auto");
  });

  it("scroll lock behavior works with existing overflow styles", () => {
    // Set initial overflow style
    document.body.style.overflow = "scroll";

    const { unmount } = render(
      <MemoryRouter>
        <VendorWaiting />
      </MemoryRouter>
    );

    // Should be locked regardless of initial state
    expect(document.body.style.overflow).toBe("hidden");

    unmount();

    // Should be restored to auto (cleanup behavior)
    expect(document.body.style.overflow).toBe("auto");
  });

  it("button is accessible and properly labeled", () => {
    render(
      <MemoryRouter>
        <VendorWaiting />
      </MemoryRouter>
    );

    const button = screen.getByRole("button", { name: /back to home/i });
    
    // Check button is focusable
    expect(button).not.toHaveAttribute("disabled");
    expect(button).toBeVisible();
    
    // Check button text content
    expect(button).toHaveTextContent("Back to Home");
  });

  

  it("handles navigation error gracefully", () => {
    // Mock navigate to throw error
    mockNavigate.mockImplementationOnce(() => {
      throw new Error("Navigation error");
    });

    render(
      <MemoryRouter>
        <VendorWaiting />
      </MemoryRouter>
    );

    const backButton = screen.getByRole("button", { name: /back to home/i });
    
    // Should not crash when navigation fails
    expect(() => fireEvent.click(backButton)).not.toThrow();
  });

  it("component renders without MemoryRouter wrapper", () => {
    // Test that component doesn't break without router context
    // (though useNavigate would throw in real scenario)
    expect(() => {
      render(<VendorWaiting />);
    }).not.toThrow();

    // Basic content should still render
    expect(screen.getByText("Your application is in progress")).toBeInTheDocument();
  });
});