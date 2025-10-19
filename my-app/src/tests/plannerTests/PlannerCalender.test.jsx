import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, beforeEach, afterEach, vi, expect, beforeAll } from "vitest";
import { MemoryRouter } from "react-router-dom";

// MOCKS
const mockAuth = {
  currentUser: {
    uid: "test-planner-uid",
    getIdToken: vi.fn(() => Promise.resolve("mock-token")),
  },
};

vi.mock("firebase/auth", () => ({
  getAuth: () => mockAuth,
}));

vi.mock("../../pages/general/calendar/Calendar", () => ({
  default: vi.fn(({ events, onEventClick, onDateClick }) => (
    <div data-testid="calendar-component">
      <div>Calendar Mock</div>
      {events.map((event) => (
        <div key={event.id} data-testid={`event-${event.id}`}>
          <button onClick={() => onEventClick(event)}>{event.title}</button>
        </div>
      ))}
      <button onClick={() => onDateClick(new Date("2025-06-15"))}>
        Select Date
      </button>
    </div>
  )),
}));

vi.mock("../../pages/general/popup/Popup", () => ({
  default: vi.fn(({ isOpen, onClose, children }) =>
    isOpen ? (
      <div data-testid="popup">
        <button data-testid="close-popup" onClick={onClose}>
          Close
        </button>
        {children}
      </div>
    ) : null
  ),
}));

vi.mock("../../pages/planner/PlannerViewEvent", () => ({
  default: vi.fn(({ event, setActivePage }) => (
    <div data-testid="view-event">
      <h2>View Event: {event.title}</h2>
      <button onClick={setActivePage}>Back</button>
    </div>
  )),
}));

vi.mock("../../pages/planner/NewEvent", () => ({
  default: vi.fn(({ onSave, onClose }) => (
    <div data-testid="new-event-form">
      <h2>Create Event</h2>
      <button onClick={() => onSave({ name: "Test Event" })}>Save</button>
      <button onClick={onClose}>Cancel</button>
    </div>
  )),
}));

vi.mock("../../pages/planner/PlannerAllEvents", () => ({
  default: vi.fn(({ setActivePage, onSelectEvent }) => (
    <div data-testid="all-events-list">
      <h2>All Events List View</h2>
      <button onClick={() => onSelectEvent({ id: "event1" })}>
        Select Event 1
      </button>
    </div>
  )),
}));

vi.mock("../../apiConfig", () => ({
  default: "https://test-api.com",
}));

import PlannerCalendar from "../../pages/planner/PlannerCalendar";

const mockEvents = [
  {
    id: "event1",
    name: "Summer Wedding",
    date: { _seconds: 1735689600, _nanoseconds: 0 },
    duration: "8",
    location: "Beach",
  },
  {
    id: "event2",
    name: "Birthday Party",
    date: { _seconds: 1740873600, _nanoseconds: 0 },
    duration: "4",
    location: "Home",
  },
  {
    id: "event3",
    name: "Meeting",
    date: { _seconds: 1745280000, _nanoseconds: 0 },
    location: "Office",
  },
];

const setupFetchMock = (overrides = {}) => {
  const config = {
    events: mockEvents,
    shouldFail: false,
    ...overrides,
  };

  global.fetch = vi.fn((url) => {
    if (config.shouldFail) {
      return Promise.reject(new Error("Network error"));
    }

    if (url.includes("/planner/me/events")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ events: config.events }),
      });
    }

    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
    });
  });
};

describe("PlannerCalendar", () => {
  beforeAll(() => {
    window.HTMLElement.prototype.scrollIntoView = function () {};
    global.localStorage = {
      setItem: vi.fn(),
      getItem: vi.fn(),
      clear: vi.fn(),
    };
  });

  beforeEach(() => {
    setupFetchMock();
    mockAuth.currentUser = {
      uid: "test-planner-uid",
      getIdToken: vi.fn(() => Promise.resolve("mock-token")),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ===== BASIC RENDERING =====

  it("renders tabs", () => {
    render(
      <MemoryRouter>
        <PlannerCalendar setActivePage={vi.fn()} onSelectEvent={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText("Calendar View")).toBeInTheDocument();
    expect(screen.getByText("List View")).toBeInTheDocument();
  });

  it("shows calendar view by default", async () => {
    render(
      <MemoryRouter>
        <PlannerCalendar setActivePage={vi.fn()} onSelectEvent={vi.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("My Events Calendar")).toBeInTheDocument();
    });

    expect(screen.getByTestId("calendar-component")).toBeInTheDocument();
    expect(screen.getByText("+ Create New Event")).toBeInTheDocument();
  });

  it("fetches events on mount", async () => {
    render(
      <MemoryRouter>
        <PlannerCalendar setActivePage={vi.fn()} onSelectEvent={vi.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "https://test-api.com/planner/me/events",
        expect.objectContaining({
          headers: { Authorization: "Bearer mock-token" },
        })
      );
    });
  });

  it("displays events in calendar", async () => {
    render(
      <MemoryRouter>
        <PlannerCalendar setActivePage={vi.fn()} onSelectEvent={vi.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("event-event1")).toBeInTheDocument();
    });

    expect(screen.getByText("Summer Wedding")).toBeInTheDocument();
    expect(screen.getByText("Birthday Party")).toBeInTheDocument();
    expect(screen.getByText("Meeting")).toBeInTheDocument();
  });

  // ===== TAB SWITCHING =====

  it("switches to list view", async () => {
    render(
      <MemoryRouter>
        <PlannerCalendar setActivePage={vi.fn()} onSelectEvent={vi.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("calendar-component")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("List View"));

    await waitFor(() => {
      expect(screen.getByTestId("all-events-list")).toBeInTheDocument();
    });

    expect(screen.getByText("All Events List View")).toBeInTheDocument();
  });

  it("switches back to calendar view from list", async () => {
    render(
      <MemoryRouter>
        <PlannerCalendar setActivePage={vi.fn()} onSelectEvent={vi.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("calendar-component")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("List View"));

    await waitFor(() => {
      expect(screen.getByTestId("all-events-list")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Calendar View"));

    await waitFor(() => {
      expect(screen.getByTestId("calendar-component")).toBeInTheDocument();
    });
  });

  it("applies active class to calendar tab by default", async () => {
    render(
      <MemoryRouter>
        <PlannerCalendar setActivePage={vi.fn()} onSelectEvent={vi.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      const calendarTab = screen.getByText("Calendar View");
      expect(calendarTab.className).toContain("active");
    });
  });

  it("applies active class to list tab when clicked", async () => {
    render(
      <MemoryRouter>
        <PlannerCalendar setActivePage={vi.fn()} onSelectEvent={vi.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("calendar-component")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("List View"));

    await waitFor(() => {
      const listTab = screen.getByText("List View");
      expect(listTab.className).toContain("active");
    });
  });

  it("sets localStorage when switching to list view", async () => {
    render(
      <MemoryRouter>
        <PlannerCalendar setActivePage={vi.fn()} onSelectEvent={vi.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("calendar-component")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("List View"));

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "activePage",
        "PlannerAllEvents"
      );
    });
  });

  // ===== EVENT CLICK =====

  it("opens popup when clicking calendar event", async () => {
    render(
      <MemoryRouter>
        <PlannerCalendar setActivePage={vi.fn()} onSelectEvent={vi.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Summer Wedding")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Summer Wedding"));

    await waitFor(() => {
      expect(screen.getByTestId("popup")).toBeInTheDocument();
    });

    expect(screen.getByTestId("view-event")).toBeInTheDocument();
    expect(screen.getByText("View Event: Summer Wedding")).toBeInTheDocument();
  });

  it("closes popup when close button clicked", async () => {
    render(
      <MemoryRouter>
        <PlannerCalendar setActivePage={vi.fn()} onSelectEvent={vi.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Summer Wedding")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Summer Wedding"));

    await waitFor(() => {
      expect(screen.getByTestId("popup")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("close-popup"));

    await waitFor(() => {
      expect(screen.queryByTestId("popup")).not.toBeInTheDocument();
    });
  });

  it("closes popup when back button clicked in view event", async () => {
    render(
      <MemoryRouter>
        <PlannerCalendar setActivePage={vi.fn()} onSelectEvent={vi.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Summer Wedding")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Summer Wedding"));

    await waitFor(() => {
      expect(screen.getByTestId("view-event")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Back"));

    await waitFor(() => {
      expect(screen.queryByTestId("popup")).not.toBeInTheDocument();
    });
  });

  // ===== CREATE EVENT =====

  it("opens create event popup when create button clicked", async () => {
    render(
      <MemoryRouter>
        <PlannerCalendar setActivePage={vi.fn()} onSelectEvent={vi.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("+ Create New Event")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("+ Create New Event"));

    await waitFor(() => {
      expect(screen.getByTestId("new-event-form")).toBeInTheDocument();
    });

    expect(screen.getByText("Create Event")).toBeInTheDocument();
  });

  it("closes create event popup when cancel clicked", async () => {
    render(
      <MemoryRouter>
        <PlannerCalendar setActivePage={vi.fn()} onSelectEvent={vi.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("+ Create New Event")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("+ Create New Event"));

    await waitFor(() => {
      expect(screen.getByTestId("new-event-form")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Cancel"));

    await waitFor(() => {
      expect(screen.queryByTestId("new-event-form")).not.toBeInTheDocument();
    });
  });

  it("closes create event popup when save clicked", async () => {
    render(
      <MemoryRouter>
        <PlannerCalendar setActivePage={vi.fn()} onSelectEvent={vi.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("+ Create New Event")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("+ Create New Event"));

    await waitFor(() => {
      expect(screen.getByTestId("new-event-form")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(screen.queryByTestId("new-event-form")).not.toBeInTheDocument();
    });
  });

  // ===== LIST VIEW INTEGRATION =====

  it("passes onSelectEvent to list view", async () => {
    const mockOnSelectEvent = vi.fn();

    render(
      <MemoryRouter>
        <PlannerCalendar setActivePage={vi.fn()} onSelectEvent={mockOnSelectEvent} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("calendar-component")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("List View"));

    await waitFor(() => {
      expect(screen.getByTestId("all-events-list")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Select Event 1"));

    expect(mockOnSelectEvent).toHaveBeenCalledWith({ id: "event1" });
  });

  // ===== EVENT TRANSFORMATION =====

  it("transforms events with duration correctly", async () => {
    render(
      <MemoryRouter>
        <PlannerCalendar setActivePage={vi.fn()} onSelectEvent={vi.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Summer Wedding")).toBeInTheDocument();
    });

    // Events with duration should be displayed
    expect(screen.getByText("Birthday Party")).toBeInTheDocument();
  });

  it("transforms events without duration correctly", async () => {
    render(
      <MemoryRouter>
        <PlannerCalendar setActivePage={vi.fn()} onSelectEvent={vi.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Meeting")).toBeInTheDocument();
    });

    // Event without duration should still display
    expect(screen.getByTestId("event-event3")).toBeInTheDocument();
  });

  // ===== ERROR HANDLING =====

  it("handles fetch failure gracefully", async () => {
    setupFetchMock({ shouldFail: true });

    render(
      <MemoryRouter>
        <PlannerCalendar setActivePage={vi.fn()} onSelectEvent={vi.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("My Events Calendar")).toBeInTheDocument();
    });

    // Should still render calendar even if fetch fails
    expect(screen.getByTestId("calendar-component")).toBeInTheDocument();
  });

  it("handles no authentication", async () => {
    const originalUser = mockAuth.currentUser;
    mockAuth.currentUser = null;

    render(
      <MemoryRouter>
        <PlannerCalendar setActivePage={vi.fn()} onSelectEvent={vi.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("My Events Calendar")).toBeInTheDocument();
    });

    mockAuth.currentUser = originalUser;
  });

  it("handles empty events list", async () => {
    setupFetchMock({ events: [] });

    render(
      <MemoryRouter>
        <PlannerCalendar setActivePage={vi.fn()} onSelectEvent={vi.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("My Events Calendar")).toBeInTheDocument();
    });

    // Calendar renders but with no events
    expect(screen.getByTestId("calendar-component")).toBeInTheDocument();
  });

  it("handles API error response", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
      })
    );

    render(
      <MemoryRouter>
        <PlannerCalendar setActivePage={vi.fn()} onSelectEvent={vi.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("My Events Calendar")).toBeInTheDocument();
    });

    expect(screen.getByTestId("calendar-component")).toBeInTheDocument();
  });

  // ===== POPUP STATE MANAGEMENT =====

  it("does not show view event popup initially", () => {
    render(
      <MemoryRouter>
        <PlannerCalendar setActivePage={vi.fn()} onSelectEvent={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.queryByTestId("view-event")).not.toBeInTheDocument();
  });

  it("only shows one popup at a time", async () => {
    render(
      <MemoryRouter>
        <PlannerCalendar setActivePage={vi.fn()} onSelectEvent={vi.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Summer Wedding")).toBeInTheDocument();
    });

    // Open view event popup
    fireEvent.click(screen.getByText("Summer Wedding"));

    await waitFor(() => {
      expect(screen.getByTestId("view-event")).toBeInTheDocument();
    });

    // Close it
    fireEvent.click(screen.getByTestId("close-popup"));

    await waitFor(() => {
      expect(screen.queryByTestId("view-event")).not.toBeInTheDocument();
    });

    // Open create event popup
    fireEvent.click(screen.getByText("+ Create New Event"));

    await waitFor(() => {
      expect(screen.getByTestId("new-event-form")).toBeInTheDocument();
    });

    // View event should not be visible
    expect(screen.queryByTestId("view-event")).not.toBeInTheDocument();
  });
});