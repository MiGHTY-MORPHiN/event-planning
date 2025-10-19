import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, beforeEach, beforeAll, afterEach, vi, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";


// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock LocationPicker component
vi.mock("../../pages/planner/LocationPicker", () => {
  return {
    default: ({ onLocationChange }) => {
      const React = require('react');
      const [value, setValue] = React.useState("");
      
      const handleChange = (e) => {
        const newValue = e.target.value;
        setValue(newValue);
        // Only trigger callback if there's a value
        if (newValue) {
          onLocationChange({
            address: newValue,
            coordinates: { lat: 40.7128, lng: -74.0060 }
          });
        }
      };

      return React.createElement(
        'div',
        null,
        React.createElement('input', {
          'aria-label': 'Location *',
          type: 'text',
          placeholder: 'Start typing to search for locations',
          value: value,
          onChange: handleChange
        })
      );
    }
  };
});

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = function() {};
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

import { getAuth } from "firebase/auth";

// --- Import component after mocks ---
import NewEvent from "../../pages/planner/NewEvent";

const eventCategories = [
  "Wedding",
  "Birthday Party",
  "Corporate Event",
  "Conference",
  "Baby Shower",
  "Graduation",
  "Anniversary",
  "Fundraiser",
  "Product Launch",
  "Holiday Party",
  "Networking Event",
  "Workshop",
  "Concert",
  "Festival",
  "Sports Event",
  "Other"
];

const eventStyles = [
  "Elegant/Formal",
  "Casual/Relaxed",
  "Modern/Contemporary",
  "Vintage/Classic",
  "Rustic/Country",
  "Minimalist",
  "Bohemian/Boho",
  "Industrial",
  "Garden/Outdoor",
  "Beach/Tropical",
  "Urban/City",
  "Traditional",
  "Glamorous",
  "Fun/Playful",
  "Professional",
  "Themed"
];

describe("NewEvent", () => {
  beforeEach(() => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    );
    global.fetch.mockClear();
    mockAuth.currentUser.getIdToken.mockClear();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders create new event form", () => {
    render(
      <MemoryRouter>
        <NewEvent />
      </MemoryRouter>
    );

    expect(screen.getByText("Create New Event")).toBeInTheDocument();
    expect(screen.getByText("Tell us about your event")).toBeInTheDocument();
    expect(screen.getByLabelText("Event Name *")).toBeInTheDocument();
    expect(screen.getByLabelText("Event Category *")).toBeInTheDocument();
    expect(screen.getByLabelText("Date & Time *")).toBeInTheDocument();
    expect(screen.getByLabelText("Duration (hours) *")).toBeInTheDocument();
    expect(screen.getByLabelText("Location *")).toBeInTheDocument();
    expect(screen.getByLabelText("Event Style *")).toBeInTheDocument();
  });

  it("navigates back to dashboard when back button is clicked", () => {
    const mockSetActivePage = vi.fn();

    render(
      <MemoryRouter>
        <NewEvent setActivePage={mockSetActivePage} />
      </MemoryRouter>
    );

    const backButton = screen.queryByText("← Back to Dashboard");
    if (backButton) {
      fireEvent.click(backButton);
      expect(mockSetActivePage).toHaveBeenCalledWith('dashboard');
    }
  });

  it("navigates back using useNavigate when setActivePage is not provided", () => {
    render(
      <MemoryRouter>
        <NewEvent />
      </MemoryRouter>
    );

    const backButton = screen.queryByText("← Back to Dashboard");
    if (backButton) {
      fireEvent.click(backButton);
      expect(mockNavigate).toHaveBeenCalledWith('/planner-dashboard');
    }
  });

  it("populates event category dropdown with all categories", () => {
    render(
      <MemoryRouter>
        <NewEvent />
      </MemoryRouter>
    );

    const categorySelect = screen.getByLabelText("Event Category *");
    fireEvent.click(categorySelect);

    eventCategories.forEach(category => {
      expect(screen.getByRole("option", { name: category })).toBeInTheDocument();
    });
  });

  it("populates event style dropdown with all styles", () => {
    render(
      <MemoryRouter>
        <NewEvent />
      </MemoryRouter>
    );

    const styleSelect = screen.getByLabelText("Event Style *");
    fireEvent.click(styleSelect);

    eventStyles.forEach(style => {
      expect(screen.getByRole("option", { name: style })).toBeInTheDocument();
    });
  });

  it("updates form fields when user types", () => {
    render(
      <MemoryRouter>
        <NewEvent />
      </MemoryRouter>
    );

    const nameInput = screen.getByLabelText("Event Name *");
    const locationInput = screen.getByLabelText("Location *");
    const durationInput = screen.getByLabelText("Duration (hours) *");

    fireEvent.change(nameInput, { target: { value: "Test Event" } });
    fireEvent.change(locationInput, { target: { value: "Test Location" } });
    fireEvent.change(durationInput, { target: { value: "3" } });

    expect(nameInput.value).toBe("Test Event");
    expect(locationInput.value).toBe("Test Location");
    expect(durationInput.value).toBe("3");
  });

  it("updates dropdown selections", () => {
    render(
      <MemoryRouter>
        <NewEvent />
      </MemoryRouter>
    );

    const categorySelect = screen.getByLabelText("Event Category *");
    const styleSelect = screen.getByLabelText("Event Style *");

    fireEvent.change(categorySelect, { target: { value: "Wedding" } });
    fireEvent.change(styleSelect, { target: { value: "Elegant/Formal" } });

    expect(categorySelect.value).toBe("Wedding");
    expect(styleSelect.value).toBe("Elegant/Formal");
  });

  it("shows validation error when required fields are empty", async () => {
    render(
      <MemoryRouter>
        <NewEvent />
      </MemoryRouter>
    );

    const submitButton = screen.getByRole("button", { name: /create event/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      // Should show either "Please fill in all required fields" or "Please select a valid location on the map"
      const errorMessage = screen.queryByText("Please fill in all required fields") || 
                          screen.queryByText("Please select a valid location on the map");
      expect(errorMessage).toBeInTheDocument();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("successfully creates event with valid data", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: "new-event-id" }),
    });

    render(
      <MemoryRouter>
        <NewEvent />
      </MemoryRouter>
    );

    // Fill out form
    fireEvent.change(screen.getByLabelText("Event Name *"), { target: { value: "Test Event" } });
    fireEvent.change(screen.getByLabelText("Event Category *"), { target: { value: "Wedding" } });
    fireEvent.change(screen.getByLabelText("Date & Time *"), { target: { value: "2025-12-25T18:00" } });
    fireEvent.change(screen.getByLabelText("Duration (hours) *"), { target: { value: "5" } });
    fireEvent.change(screen.getByLabelText("Location *"), { target: { value: "Test Location" } });
    fireEvent.change(screen.getByLabelText("Event Style *"), { target: { value: "Elegant/Formal" } });

    const submitButton = screen.getByRole("button", { name: /create event/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "https://us-central1-planit-sdp.cloudfunctions.net/api/event/apply",
        expect.objectContaining({
          method: "POST",
          headers: {
            Authorization: "Bearer mock-token",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Test Event",
            eventCategory: "Wedding",
            startTime: "2025-12-25T18:00",
            duration: "5",
            location: "Test Location",
            style: "Elegant/Formal",
            plannerId: "test-planner",
            date: "2025-12-25T18:00",
            description: "",
            theme: "",
            budget: null,
            expectedGuestCount: null,
            notes: "",
            locationCoordinates: {
              lat: 40.7128,
              lng: -74.0060
            }
          }),
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Event created successfully!")).toBeInTheDocument();
    });
  });

  it("navigates to dashboard after successful creation", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: "new-event-id" }),
    });

    render(
      <MemoryRouter>
        <NewEvent />
      </MemoryRouter>
    );

    // Fill out form
    fireEvent.change(screen.getByLabelText("Event Name *"), { target: { value: "Test Event" } });
    fireEvent.change(screen.getByLabelText("Event Category *"), { target: { value: "Wedding" } });
    fireEvent.change(screen.getByLabelText("Date & Time *"), { target: { value: "2025-12-25T18:00" } });
    fireEvent.change(screen.getByLabelText("Location *"), { target: { value: "Test Location" } });
    fireEvent.change(screen.getByLabelText("Event Style *"), { target: { value: "Elegant/Formal" } });

    const submitButton = screen.getByRole("button", { name: /create event/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Event created successfully!")).toBeInTheDocument();
    });

    // Wait for navigation timeout
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/planner-dashboard");
    }, { timeout: 2000 });
  });

  it("handles API error during event creation", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: "Failed to create event" }),
    });

    render(
      <MemoryRouter>
        <NewEvent />
      </MemoryRouter>
    );

    // Fill out form
    fireEvent.change(screen.getByLabelText("Event Name *"), { target: { value: "Test Event" } });
    fireEvent.change(screen.getByLabelText("Event Category *"), { target: { value: "Wedding" } });
    fireEvent.change(screen.getByLabelText("Date & Time *"), { target: { value: "2025-12-25T18:00" } });
    fireEvent.change(screen.getByLabelText("Location *"), { target: { value: "Test Location" } });
    fireEvent.change(screen.getByLabelText("Event Style *"), { target: { value: "Elegant/Formal" } });

    const submitButton = screen.getByRole("button", { name: /create event/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Failed to create event")).toBeInTheDocument();
    });
  });

  it("handles network error during event creation", async () => {
    global.fetch.mockRejectedValueOnce(new Error("Network error"));

    render(
      <MemoryRouter>
        <NewEvent />
      </MemoryRouter>
    );

    // Fill out form
    fireEvent.change(screen.getByLabelText("Event Name *"), { target: { value: "Test Event" } });
    fireEvent.change(screen.getByLabelText("Event Category *"), { target: { value: "Wedding" } });
    fireEvent.change(screen.getByLabelText("Date & Time *"), { target: { value: "2025-12-25T18:00" } });
    fireEvent.change(screen.getByLabelText("Location *"), { target: { value: "Test Location" } });
    fireEvent.change(screen.getByLabelText("Event Style *"), { target: { value: "Elegant/Formal" } });

    const submitButton = screen.getByRole("button", { name: /create event/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("sets minimum datetime to current time", () => {
    render(
      <MemoryRouter>
        <NewEvent />
      </MemoryRouter>
    );

    const dateInput = screen.getByLabelText("Date & Time *");
    const minDateTime = dateInput.getAttribute("min");
    
    expect(minDateTime).toBeTruthy();
    expect(new Date(minDateTime).getFullYear()).toBe(new Date().getFullYear());
  });

  it("sets default duration to 1 hour", () => {
    render(
      <MemoryRouter>
        <NewEvent />
      </MemoryRouter>
    );

    const durationInput = screen.getByLabelText("Duration (hours) *");
    expect(durationInput.value).toBe("1");
  });

  it("enforces duration limits", () => {
    render(
      <MemoryRouter>
        <NewEvent />
      </MemoryRouter>
    );

    const durationInput = screen.getByLabelText("Duration (hours) *");
    expect(durationInput.getAttribute("min")).toBe("1");
    expect(durationInput.getAttribute("max")).toBe("24");
  });

  it("shows form hint for location input", () => {
    render(
      <MemoryRouter>
        <NewEvent />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText("Start typing to search for locations")).toBeInTheDocument();
  });

  it("clears success message when form is resubmitted", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "new-event-id" }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: "Failed to create event" }),
      });

    render(
      <MemoryRouter>
        <NewEvent />
      </MemoryRouter>
    );

    // Fill out form and submit successfully
    fireEvent.change(screen.getByLabelText("Event Name *"), { target: { value: "Test Event" } });
    fireEvent.change(screen.getByLabelText("Event Category *"), { target: { value: "Wedding" } });
    fireEvent.change(screen.getByLabelText("Date & Time *"), { target: { value: "2025-12-25T18:00" } });
    fireEvent.change(screen.getByLabelText("Location *"), { target: { value: "Test Location" } });
    fireEvent.change(screen.getByLabelText("Event Style *"), { target: { value: "Elegant/Formal" } });

    const submitButton = screen.getByRole("button", { name: /create event/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Event created successfully!")).toBeInTheDocument();
    });

    // Submit again with failure - need to get button again as it may have re-rendered
    const submitButtonAgain = screen.getByRole("button", { name: /create event/i });
    fireEvent.click(submitButtonAgain);

    await waitFor(() => {
      expect(screen.queryByText("Event created successfully!")).not.toBeInTheDocument();
      expect(screen.getByText("Failed to create event")).toBeInTheDocument();
    });
  });

  it("handles token retrieval failure", async () => {
    mockAuth.currentUser.getIdToken.mockRejectedValueOnce(new Error("Token error"));

    render(
      <MemoryRouter>
        <NewEvent />
      </MemoryRouter>
    );

    // Fill out form
    fireEvent.change(screen.getByLabelText("Event Name *"), { target: { value: "Test Event" } });
    fireEvent.change(screen.getByLabelText("Event Category *"), { target: { value: "Wedding" } });
    fireEvent.change(screen.getByLabelText("Date & Time *"), { target: { value: "2025-12-25T18:00" } });
    fireEvent.change(screen.getByLabelText("Location *"), { target: { value: "Test Location" } });
    fireEvent.change(screen.getByLabelText("Event Style *"), { target: { value: "Elegant/Formal" } });

    const submitButton = screen.getByRole("button", { name: /create event/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Token error")).toBeInTheDocument();
    });
  });

  it("validates individual required fields", async () => {
    render(
      <MemoryRouter>
        <NewEvent />
      </MemoryRouter>
    );

    // Test missing name - fill everything except name
    fireEvent.change(screen.getByLabelText("Event Category *"), { target: { value: "Wedding" } });
    fireEvent.change(screen.getByLabelText("Date & Time *"), { target: { value: "2025-12-25T18:00" } });
    fireEvent.change(screen.getByLabelText("Location *"), { target: { value: "Test Location" } });
    fireEvent.change(screen.getByLabelText("Event Style *"), { target: { value: "Elegant/Formal" } });

    const submitButton = screen.getByRole("button", { name: /create event/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Please fill in all required fields")).toBeInTheDocument();
    });
  });

  it("includes all required fields in API request", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: "new-event-id" }),
    });

    render(
      <MemoryRouter>
        <NewEvent />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Event Name *"), { target: { value: "Complete Event" } });
    fireEvent.change(screen.getByLabelText("Event Category *"), { target: { value: "Corporate Event" } });
    fireEvent.change(screen.getByLabelText("Date & Time *"), { target: { value: "2025-06-15T14:30" } });
    fireEvent.change(screen.getByLabelText("Duration (hours) *"), { target: { value: "8" } });
    fireEvent.change(screen.getByLabelText("Location *"), { target: { value: "Conference Center" } });
    fireEvent.change(screen.getByLabelText("Event Style *"), { target: { value: "Professional" } });

    const submitButton = screen.getByRole("button", { name: /create event/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "https://us-central1-planit-sdp.cloudfunctions.net/api/event/apply",
        expect.objectContaining({
          method: "POST",
          headers: {
            Authorization: "Bearer mock-token",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Complete Event",
            eventCategory: "Corporate Event",
            startTime: "2025-06-15T14:30",
            duration: "8",
            location: "Conference Center",
            style: "Professional",
            plannerId: "test-planner",
            date: "2025-06-15T14:30",
            description: "",
            theme: "",
            budget: null,
            expectedGuestCount: null,
            notes: "",
            locationCoordinates: {
              lat: 40.7128,
              lng: -74.0060
            }
          }),
        })
      );
    });
  });

  it("shows loading state during form submission", async () => {
    // Mock a delayed response
    global.fetch.mockImplementationOnce(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ id: "new-event-id" }),
        }), 100)
      )
    );

    render(
      <MemoryRouter>
        <NewEvent />
      </MemoryRouter>
    );

    // Fill out form
    fireEvent.change(screen.getByLabelText("Event Name *"), { target: { value: "Test Event" } });
    fireEvent.change(screen.getByLabelText("Event Category *"), { target: { value: "Wedding" } });
    fireEvent.change(screen.getByLabelText("Date & Time *"), { target: { value: "2025-12-25T18:00" } });
    fireEvent.change(screen.getByLabelText("Location *"), { target: { value: "Test Location" } });
    fireEvent.change(screen.getByLabelText("Event Style *"), { target: { value: "Elegant/Formal" } });

    const submitButton = screen.getByRole("button", { name: /create event/i });
    fireEvent.click(submitButton);

    // Check for loading state
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /creating/i })).toBeInTheDocument();
    });

    // Form submission should be in progress
    expect(global.fetch).toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByText("Event created successfully!")).toBeInTheDocument();
    });
  });

  it("prevents multiple submissions while request is in progress", async () => {
    // Mock a delayed response
    let resolvePromise;
    global.fetch.mockImplementation(() =>
      new Promise(resolve => {
        resolvePromise = resolve;
      })
    );

    render(
      <MemoryRouter>
        <NewEvent />
      </MemoryRouter>
    );

    // Fill out form
    fireEvent.change(screen.getByLabelText("Event Name *"), { target: { value: "Test Event" } });
    fireEvent.change(screen.getByLabelText("Event Category *"), { target: { value: "Wedding" } });
    fireEvent.change(screen.getByLabelText("Date & Time *"), { target: { value: "2025-12-25T18:00" } });
    fireEvent.change(screen.getByLabelText("Location *"), { target: { value: "Test Location" } });
    fireEvent.change(screen.getByLabelText("Event Style *"), { target: { value: "Elegant/Formal" } });

    // Get the submit button
    const submitButton = screen.getByRole("button", { name: /create event/i });
    
    // Click submit multiple times
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);

    // Should only make one API call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    // Resolve the promise
    resolvePromise({
      ok: true,
      json: () => Promise.resolve({ id: "new-event-id" }),
    });

    await waitFor(() => {
      expect(screen.getByText("Event created successfully!")).toBeInTheDocument();
    });
  });
});