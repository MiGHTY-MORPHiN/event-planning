import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, beforeEach, afterEach, vi, expect, beforeAll } from "vitest";
import { MemoryRouter } from "react-router-dom";

// MOCKS
const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockAuth = {
  currentUser: {
    uid: "test-planner-uid",
    getIdToken: vi.fn(() => Promise.resolve("mock-token")),
  },
};

vi.mock("firebase/auth", () => ({
  getAuth: () => mockAuth,
}));

vi.mock("../../apiConfig", () => ({
  default: "https://test-api.com",
}));

import PlannerAllEvents from "../../pages/planner/PlannerAllEvents";

const mockEvents = [
  {
    id: "event1",
    name: "Summer Wedding",
    date: { _seconds: 1735689600, _nanoseconds: 0 }, // Future date
    location: "Beach Resort",
    status: "upcoming",
    budget: 50000,
    description: "Beautiful beach wedding",
  },
  {
    id: "event2",
    name: "Corporate Gala",
    date: "2025-03-20T18:00:00Z",
    location: "Grand Hall",
    status: "in-progress",
    budget: 75000,
    description: "Annual company gala",
  },
  {
    id: "event3",
    name: "Birthday Party",
    date: { _seconds: 1700000000, _nanoseconds: 0 }, // Past date
    location: "Home",
    status: "completed",
    budget: 5000,
    description: "50th birthday celebration",
  },
];

const mockGuests = {
  event1: [
    { id: "guest1", name: "John Doe", email: "john@example.com" },
    { id: "guest2", name: "Jane Smith", email: "jane@example.com" },
  ],
  event2: [
    { id: "guest3", name: "Bob Johnson", email: "bob@example.com" },
  ],
  event3: [],
};

const setupFetchMock = (overrides = {}) => {
  const config = {
    events: mockEvents,
    guests: mockGuests,
    ...overrides,
  };

  global.fetch = vi.fn((url) => {
    if (url.includes("/planner/me/events")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ events: config.events }),
      });
    }
    if (url.includes("/guests")) {
      const eventId = url.match(/planner\/(.+?)\/guests/)?.[1];
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ guests: config.guests[eventId] || [] }),
      });
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
    });
  });
};

describe("PlannerAllEvents", () => {
  beforeAll(() => {
    window.HTMLElement.prototype.scrollIntoView = function () {};
  });

  beforeEach(() => {
    setupFetchMock();
    mockAuth.currentUser = {
      uid: "test-planner-uid",
      getIdToken: vi.fn(() => Promise.resolve("mock-token")),
    };
    mockNavigate.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ===== BASIC RENDERING =====

  it("renders events list with header", async () => {
    render(
      <MemoryRouter>
        <PlannerAllEvents setActivePage={vi.fn()} onSelectEvent={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText("My Events")).toBeInTheDocument();
    expect(screen.getByText("Manage and track all your events")).toBeInTheDocument();
    expect(screen.getByText("+ New Event")).toBeInTheDocument();
  });

  it("fetches and displays events", async () => {
    render(
      <MemoryRouter>
        <PlannerAllEvents setActivePage={vi.fn()} onSelectEvent={vi.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Summer Wedding")).toBeInTheDocument();
      expect(screen.getByText("Corporate Gala")).toBeInTheDocument();
      expect(screen.getByText("Birthday Party")).toBeInTheDocument();
    });
  });

  it("displays event status badges", async () => {
    render(
      <MemoryRouter>
        <PlannerAllEvents setActivePage={vi.fn()} onSelectEvent={vi.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("upcoming")).toBeInTheDocument();
      expect(screen.getByText("in-progress")).toBeInTheDocument();
      expect(screen.getByText("completed")).toBeInTheDocument();
    });
  });

  it("fetches and displays guest counts", async () => {
    render(
      <MemoryRouter>
        <PlannerAllEvents setActivePage={vi.fn()} onSelectEvent={vi.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Summer Wedding")).toBeInTheDocument();
    });

    // Wait for guests to be loaded
    await waitFor(() => {
      expect(screen.getByText("2 attendees")).toBeInTheDocument();
    });

    expect(screen.getByText("1 attendees")).toBeInTheDocument();
  });

  // ===== SEARCH FUNCTIONALITY =====

  it("filters events by name search", async () => {
    render(
      <MemoryRouter>
        <PlannerAllEvents setActivePage={vi.fn()} onSelectEvent={vi.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Summer Wedding")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search events...");
    fireEvent.change(searchInput, { target: { value: "Wedding" } });

    expect(screen.getByText("Summer Wedding")).toBeInTheDocument();
    expect(screen.queryByText("Corporate Gala")).not.toBeInTheDocument();
    expect(screen.queryByText("Birthday Party")).not.toBeInTheDocument();
  });

  it("filters events by location search", async () => {
    render(
      <MemoryRouter>
        <PlannerAllEvents setActivePage={vi.fn()} onSelectEvent={vi.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Summer Wedding")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search events...");
    fireEvent.change(searchInput, { target: { value: "Hall" } });

    expect(screen.queryByText("Summer Wedding")).not.toBeInTheDocument();
    expect(screen.getByText("Corporate Gala")).toBeInTheDocument();
    expect(screen.queryByText("Birthday Party")).not.toBeInTheDocument();
  });

  it("shows no events message when search has no results", async () => {
    render(
      <MemoryRouter>
        <PlannerAllEvents setActivePage={vi.fn()} onSelectEvent={vi.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Summer Wedding")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search events...");
    fireEvent.change(searchInput, { target: { value: "NonexistentEvent" } });

    expect(screen.getByText("No events found matching your criteria")).toBeInTheDocument();
  });

  // ===== STATUS FILTERING =====

  it("filters events by status", async () => {
    render(
      <MemoryRouter>
        <PlannerAllEvents setActivePage={vi.fn()} onSelectEvent={vi.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Summer Wedding")).toBeInTheDocument();
    });

    const upcomingButton = screen.getByRole("button", { name: /upcoming/i });
    fireEvent.click(upcomingButton);

    expect(screen.getByText("Summer Wedding")).toBeInTheDocument();
    expect(screen.queryByText("Corporate Gala")).not.toBeInTheDocument();
    expect(screen.queryByText("Birthday Party")).not.toBeInTheDocument();
  });

  it("switches between status filters", async () => {
    render(
      <MemoryRouter>
        <PlannerAllEvents setActivePage={vi.fn()} onSelectEvent={vi.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Summer Wedding")).toBeInTheDocument();
    });

    // Filter by in-progress
    const inProgressButton = screen.getByRole("button", { name: /in-progress/i });
    fireEvent.click(inProgressButton);

    expect(screen.queryByText("Summer Wedding")).not.toBeInTheDocument();
    expect(screen.getByText("Corporate Gala")).toBeInTheDocument();

    // Switch to completed
    const completedButton = screen.getByRole("button", { name: /completed/i });
    fireEvent.click(completedButton);

    expect(screen.queryByText("Summer Wedding")).not.toBeInTheDocument();
    expect(screen.queryByText("Corporate Gala")).not.toBeInTheDocument();
    expect(screen.getByText("Birthday Party")).toBeInTheDocument();
  });

  it("shows all events when All filter is selected", async () => {
    render(
      <MemoryRouter>
        <PlannerAllEvents setActivePage={vi.fn()} onSelectEvent={vi.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Summer Wedding")).toBeInTheDocument();
    });

    // First filter by upcoming
    const upcomingButton = screen.getByRole("button", { name: /upcoming/i });
    fireEvent.click(upcomingButton);

    expect(screen.queryByText("Corporate Gala")).not.toBeInTheDocument();

    // Then click All
    const allButton = screen.getByRole("button", { name: "All" });
    fireEvent.click(allButton);

    expect(screen.getByText("Summer Wedding")).toBeInTheDocument();
    expect(screen.getByText("Corporate Gala")).toBeInTheDocument();
    expect(screen.getByText("Birthday Party")).toBeInTheDocument();
  });

  // ===== SORTING =====

  it("sorts events by date (default)", async () => {
    render(
      <MemoryRouter>
        <PlannerAllEvents setActivePage={vi.fn()} onSelectEvent={vi.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Summer Wedding")).toBeInTheDocument();
    });

    const eventCards = screen.getAllByRole("heading", { level: 3 });
    // Default sort is by date ascending, so completed event should be first
    expect(eventCards[0].textContent).toBe("Birthday Party");
  });

  it("sorts events by name", async () => {
    render(
      <MemoryRouter>
        <PlannerAllEvents setActivePage={vi.fn()} onSelectEvent={vi.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Summer Wedding")).toBeInTheDocument();
    });

    const sortSelect = screen.getByRole("combobox");
    fireEvent.change(sortSelect, { target: { value: "name" } });

    const eventCards = screen.getAllByRole("heading", { level: 3 });
    expect(eventCards[0].textContent).toBe("Birthday Party");
    expect(eventCards[1].textContent).toBe("Corporate Gala");
    expect(eventCards[2].textContent).toBe("Summer Wedding");
  });

  it("sorts events by budget", async () => {
    render(
      <MemoryRouter>
        <PlannerAllEvents setActivePage={vi.fn()} onSelectEvent={vi.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Summer Wedding")).toBeInTheDocument();
    });

    const sortSelect = screen.getByRole("combobox");
    fireEvent.change(sortSelect, { target: { value: "budget" } });

    const eventCards = screen.getAllByRole("heading", { level: 3 });
    // Budget sort is descending, so highest budget first
    expect(eventCards[0].textContent).toBe("Corporate Gala"); // 75000
    expect(eventCards[1].textContent).toBe("Summer Wedding"); // 50000
    expect(eventCards[2].textContent).toBe("Birthday Party"); // 5000
  });

  it("sorts events by attendees", async () => {
    render(
      <MemoryRouter>
        <PlannerAllEvents setActivePage={vi.fn()} onSelectEvent={vi.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Summer Wedding")).toBeInTheDocument();
    });

    // Wait for guests to load
    await waitFor(() => {
      expect(screen.getByText("2 attendees")).toBeInTheDocument();
    });

    const sortSelect = screen.getByRole("combobox");
    fireEvent.change(sortSelect, { target: { value: "attendees" } });

    const eventCards = screen.getAllByRole("heading", { level: 3 });
    // Attendees sort is descending
    expect(eventCards[0].textContent).toBe("Summer Wedding"); // 2 guests
  });


  // ===== EVENT SELECTION =====

  it("calls onSelectEvent when select button clicked", async () => {
    const mockOnSelectEvent = vi.fn();

    render(
      <MemoryRouter>
        <PlannerAllEvents setActivePage={vi.fn()} onSelectEvent={mockOnSelectEvent} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Summer Wedding")).toBeInTheDocument();
    });

    const selectButtons = screen.getAllByTestId("select-event-button");
    fireEvent.click(selectButtons[0]);

    expect(mockOnSelectEvent).toHaveBeenCalledTimes(1);
    expect(mockOnSelectEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Birthday Party", // First in sorted order
      })
    );
  });

  // ===== NAVIGATION =====

  it("navigates to new event page when clicking New Event button", async () => {
    render(
      <MemoryRouter>
        <PlannerAllEvents setActivePage={vi.fn()} onSelectEvent={vi.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Summer Wedding")).toBeInTheDocument();
    });

    const newEventButton = screen.getByText("+ New Event");
    fireEvent.click(newEventButton);

    expect(mockNavigate).toHaveBeenCalledWith("/planner/new-event");
  });

  // ===== ERROR HANDLING =====

  it("handles fetch error gracefully", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
      })
    );

    render(
      <MemoryRouter>
        <PlannerAllEvents setActivePage={vi.fn()} onSelectEvent={vi.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("No events found matching your criteria")).toBeInTheDocument();
    });
  });

  it("handles empty events list", async () => {
    setupFetchMock({ events: [] });

    render(
      <MemoryRouter>
        <PlannerAllEvents setActivePage={vi.fn()} onSelectEvent={vi.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("No events found matching your criteria")).toBeInTheDocument();
    });
  });

  it("handles authentication timeout", async () => {
    const originalCurrentUser = mockAuth.currentUser;
    mockAuth.currentUser = null;

    render(
      <MemoryRouter>
        <PlannerAllEvents setActivePage={vi.fn()} onSelectEvent={vi.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("No events found matching your criteria")).toBeInTheDocument();
    });

    mockAuth.currentUser = originalCurrentUser;
  });

  it("handles missing event properties gracefully", async () => {
    const eventsWithMissingData = [
      {
        id: "event-incomplete",
        name: "Incomplete Event",
        date: null,
        location: "",
        status: "upcoming",
      },
    ];

    setupFetchMock({ events: eventsWithMissingData });

    render(
      <MemoryRouter>
        <PlannerAllEvents setActivePage={vi.fn()} onSelectEvent={vi.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Incomplete Event")).toBeInTheDocument();
    });

    expect(screen.getByText("R0")).toBeInTheDocument();
    expect(screen.getByText("0 attendees")).toBeInTheDocument();
  });

  // ===== GUEST FETCH ERROR =====

  it("handles guest fetch error gracefully", async () => {
    global.fetch = vi.fn((url) => {
      if (url.includes("/planner/me/events")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ events: mockEvents }),
        });
      }
      if (url.includes("/guests")) {
        return Promise.resolve({
          ok: false,
          status: 500,
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    render(
      <MemoryRouter>
        <PlannerAllEvents setActivePage={vi.fn()} onSelectEvent={vi.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Summer Wedding")).toBeInTheDocument();
    });

    // Events should still be displayed even if guest fetch fails
    expect(screen.getByText("Corporate Gala")).toBeInTheDocument();
  });

  // ===== DATE FORMATTING =====

  it("formats Firestore timestamp dates correctly", async () => {
    render(
      <MemoryRouter>
        <PlannerAllEvents setActivePage={vi.fn()} onSelectEvent={vi.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Summer Wedding")).toBeInTheDocument();
    });

    const expectedDate = new Date(1735689600 * 1000).toLocaleString();
    expect(screen.getByText(expectedDate)).toBeInTheDocument();
  });

  it("formats ISO string dates correctly", async () => {
    render(
      <MemoryRouter>
        <PlannerAllEvents setActivePage={vi.fn()} onSelectEvent={vi.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Corporate Gala")).toBeInTheDocument();
    });

    const expectedDate = new Date("2025-03-20T18:00:00Z").toLocaleString();
    expect(screen.getByText(expectedDate)).toBeInTheDocument();
  });
});