import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, beforeEach, beforeAll, afterEach, vi, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Papa from "papaparse";


vi.mock("papaparse", () => ({
  __esModule: true,
  default: {
    parse: vi.fn(),   // mock parse
  },
}));

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = function() {};
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
  Papa.parse.mockClear();
});


afterEach(() => {
  Papa.parse.mockClear();
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



// --- Mock ChatComponent ---
vi.mock("./ChatComponent.jsx", () => ({
  default: ({ plannerId, vendorId, eventId, closeChat, currentUser, otherUser, serviceType }) => (
    <div data-testid="chat-component">
      <div>Chat: {plannerId} - {vendorId} - {eventId}</div>
      <div>Current User: {currentUser.name}</div>
      <div>Other User: {otherUser.name}</div>
      <div>Service: {serviceType}</div>
      <button onClick={closeChat}>Close Chat</button>
    </div>
  ),
}));

// --- Mock global functions ---
global.fetch = vi.fn();
global.alert = vi.fn();

import PlannerViewEvent from "../../pages/planner/PlannerViewEvent";

const mockEvent = {
  id: "event1",
  name: "Wedding Reception",
  date: { _seconds: 1735689600, _nanoseconds: 0 }, // Jan 1, 2025
  location: "Garden Venue",
  duration: 8,
  expectedGuestCount: 150,
  eventCategory: "Wedding",
  eventStyle: "Elegant",
  budget: 50000,
  specialRequirements: "Wheelchair accessible",
  notes: "Evening ceremony",
  plannerId: "planner1",
  tasks: {
    "Send invitations": true,
    "Book catering": false,
    "Arrange flowers": false,
  },
};

const mockGuests = [
  {
    id: "guest1",
    firstname: "John",
    lastname: "Doe",
    email: "john@example.com",
    plusOne: 1,
    rsvpStatus: "accepted",
  },
  {
    id: "guest2",
    firstname: "Jane",
    lastname: "Smith",
    email: "jane@example.com",
    plusOne: 0,
    rsvpStatus: "pending",
  },
];

const mockServices = [
  {
    id: "service1",
    serviceName: "Wedding Catering",
    vendorName: "Gourmet Foods",
    vendorId: "vendor1",
    status: "confirmed",
    finalPrice: 15000,
    estimatedCost: 15000,
  },
  {
    id: "service2",
    serviceName: "Photography",
    vendorName: "Photo Pro",
    vendorId: "vendor2",
    status: "pending",
    estimatedCost: 5000,
  },
];

const mockVendors = [
  {
    id: "vendor1",
    businessName: "Gourmet Foods",
    category: "Catering",
    cost: "$15,000",
  },
];

describe("PlannerViewEvent", () => {
  beforeEach(() => {
    global.fetch.mockClear();
    global.alert.mockClear();
    mockAuth.currentUser.getIdToken.mockClear();
    Papa.parse.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state when no event is provided", () => {
    render(
      <MemoryRouter>
        <PlannerViewEvent event={null} />
      </MemoryRouter>
    );

    expect(screen.getByText("Loading Event...")).toBeInTheDocument();
  });

  it("renders event details in overview tab", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ guests: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ vendors: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ services: [] }),
      });

    render(
      <MemoryRouter>
        <PlannerViewEvent event={mockEvent} />
      </MemoryRouter>
    );

    expect(screen.getByText("Wedding Reception")).toBeInTheDocument();
    expect(screen.getByText("Garden Venue")).toBeInTheDocument();
    expect(screen.getByText("8 hrs")).toBeInTheDocument();
    expect(screen.getByText("150")).toBeInTheDocument();
    expect(screen.getByText("Wedding")).toBeInTheDocument();
  });

  it("fetches guests on component mount", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ guests: mockGuests }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ vendors: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ services: [] }),
      });

    render(
      <MemoryRouter>
        <PlannerViewEvent event={mockEvent} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "https://us-central1-planit-sdp.cloudfunctions.net/api/planner/event1/guests",
        expect.objectContaining({
          headers: {
            Authorization: "Bearer mock-token",
            "Content-Type": "application/json",
          },
        })
      );
    });
  });

  it("switches to edit mode when edit button is clicked", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ guests: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ vendors: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ services: [] }),
      });

    render(
      <MemoryRouter>
        <PlannerViewEvent event={mockEvent} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Edit Event"));

    expect(screen.getByText("Save Changes")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Wedding Reception")).toBeInTheDocument();
  });

  it("saves changes when save button is clicked", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ guests: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ vendors: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ services: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

    render(
      <MemoryRouter>
        <PlannerViewEvent event={mockEvent} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Edit Event"));

    const nameInput = screen.getByDisplayValue("Wedding Reception");
    fireEvent.change(nameInput, { target: { value: "Updated Wedding" } });

    fireEvent.click(screen.getByText("Save Changes"));

    await waitFor(() => {
      expect(screen.getByText("Updated Wedding")).toBeInTheDocument();
      expect(screen.queryByText("Save Changes")).not.toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://us-central1-planit-sdp.cloudfunctions.net/api/planner/me/event1",
      expect.objectContaining({
        method: "PUT",
        headers: {
          Authorization: "Bearer mock-token",
          "Content-Type": "application/json",
        },
      })
    );
  });

  it("cancels edit mode when cancel button is clicked", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ guests: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ vendors: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ services: [] }),
      });

    render(
      <MemoryRouter>
        <PlannerViewEvent event={mockEvent} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Edit Event"));

    const nameInput = screen.getByDisplayValue("Wedding Reception");
    fireEvent.change(nameInput, { target: { value: "Changed Name" } });

    fireEvent.click(screen.getByText("Cancel"));

    expect(screen.getByText("Wedding Reception")).toBeInTheDocument();
    expect(screen.queryByText("Save Changes")).not.toBeInTheDocument();
  });

  it("switches between tabs", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ guests: mockGuests }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ vendors: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ services: [] }),
      });

    render(
      <MemoryRouter>
        <PlannerViewEvent event={mockEvent} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Guests & RSVP"));

    await waitFor(() => {
      expect(screen.getByText("Guest List")).toBeInTheDocument();
      expect(screen.getByText("RSVP Status")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Services"));
    expect(screen.getByText("Event Services")).toBeInTheDocument();

    fireEvent.click(screen.getByText("My To-Do List"));
    expect(screen.getByText("Event Tasks")).toBeInTheDocument();
  });

  it("displays RSVP summary correctly", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ guests: mockGuests }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ vendors: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ services: [] }),
      });

    render(
      <MemoryRouter>
        <PlannerViewEvent event={mockEvent} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Guests & RSVP"));

    await waitFor(() => {
      expect(screen.getByTestId("confirmed-count")).toHaveTextContent("1"); // Confirmed count
      expect(screen.getByTestId("pending-count")).toHaveTextContent("1"); // Pending count
      expect(screen.getByTestId("declined-count")).toHaveTextContent("0"); // Declined count
      expect(screen.getByText("50% confirmed")).toBeInTheDocument();
    });
  });

  it("opens add guest popup", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ guests: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ vendors: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ services: [] }),
      });

    render(
      <MemoryRouter>
        <PlannerViewEvent event={mockEvent} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Guests & RSVP"));
    fireEvent.click(screen.getByText("+ Add Guest"));

    expect(screen.getByRole("button", {name: "Add Guest"})).toBeInTheDocument();
    expect(screen.getByLabelText("First Name *")).toBeInTheDocument();
    expect(screen.getByLabelText("Email Address *")).toBeInTheDocument();
  });

  it("adds guest manually", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ guests: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ vendors: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ services: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "guest3" }),
      });

    render(
      <MemoryRouter>
        <PlannerViewEvent event={mockEvent} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Guests & RSVP"));
    fireEvent.click(screen.getByText("+ Add Guest"));

    const firstNameInput = screen.getByLabelText("First Name *");
    const emailInput = screen.getByLabelText("Email Address *");

    fireEvent.change(firstNameInput, { target: { value: "New" } });
    fireEvent.change(emailInput, { target: { value: "new@example.com" } });

    fireEvent.click(screen.getByRole("button", {name: "Add Guest"}));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "https://us-central1-planit-sdp.cloudfunctions.net/api/planner/me/event1/guests",
        expect.objectContaining({
          method: "POST",
          headers: {
            Authorization: "Bearer mock-token",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstname: "New",
            lastname: "",
            email: "new@example.com",
            plusOne: 0,
            rsvpStatus: "pending",
          }),
        })
      );
    });
  });

  it("opens CSV import modal", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ guests: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ vendors: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ services: [] }),
      });

    render(
      <MemoryRouter>
        <PlannerViewEvent event={mockEvent} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Guests & RSVP"));
    fireEvent.click(screen.getByText("+ Add Guests from CSV"));

    expect(screen.getByText("Import Guests from CSV")).toBeInTheDocument();
    expect(screen.getByText("Select CSV File")).toBeInTheDocument();
  });

  it("processes CSV file upload", async () => {
    const mockGuestData = [
      { firstname: "CSV", lastname: "Guest", email: "csv@example.com" },
    ];

    Papa.parse.mockImplementation((file, options) => {
      options.complete({ data: mockGuestData });
    });

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ guests: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ vendors: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ services: [] }),
      });

    render(
      <MemoryRouter>
        <PlannerViewEvent event={mockEvent} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Guests & RSVP"));
    fireEvent.click(screen.getByText("+ Add Guests from CSV"));

    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(["csv content"], "guests.csv", { type: "text/csv" });

    Object.defineProperty(fileInput, "files", {
      value: [file],
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText("Preview (1 guests)")).toBeInTheDocument();
      expect(screen.getByText("CSV")).toBeInTheDocument();
      expect(screen.getByText("csv@example.com")).toBeInTheDocument();
    });
  });

  it("sends reminder to guest", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ guests: mockGuests }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ vendors: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ services: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

    render(
      <MemoryRouter>
        <PlannerViewEvent event={mockEvent} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Guests & RSVP"));

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    const reminderButtons = screen.getAllByText("Send Reminder");
    fireEvent.click(reminderButtons[0]);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "https://us-central1-planit-sdp.cloudfunctions.net/api/planner/event1/guest1/sendReminder",
        expect.objectContaining({
          headers: {
            Authorization: "Bearer mock-token",
            "Content-Type": "application/json",
          },
        })
      );
    });

    expect(global.alert).toHaveBeenCalledWith("Reminder sent successfully");
  });

  it("displays services in vendors tab", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ guests: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ vendors: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ services: mockServices }),
      });

    render(
      <MemoryRouter>
        <PlannerViewEvent event={mockEvent} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Services"));

    await waitFor(() => {
      expect(screen.getByText("Wedding Catering")).toBeInTheDocument();
      expect(screen.getByText("Vendored By: Gourmet Foods")).toBeInTheDocument();
      expect(screen.getByText("Photography")).toBeInTheDocument();
      expect(screen.getByText("$confirmed")).toBeInTheDocument();
      expect(screen.getByText("$pending")).toBeInTheDocument();
    });
  });

  it("opens chat when chat button is clicked", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ guests: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ vendors: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ services: mockServices }),
      });

    render(
      <MemoryRouter>
        <PlannerViewEvent event={mockEvent} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Services"));

    await waitFor(() => {
      expect(screen.getByText("Wedding Catering")).toBeInTheDocument();
    });

    const chatButtons = screen.getAllByText("Chat");
    fireEvent.click(chatButtons[0]);

    expect(screen.getByTestId("chat-component")).toBeInTheDocument();
    expect(screen.getByTestId("message-input-area")).toBeInTheDocument();
  });

  it("closes chat when close chat button is clicked", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ guests: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ vendors: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ services: mockServices }),
      });

    render(
      <MemoryRouter>
        <PlannerViewEvent event={mockEvent} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Services"));

    await waitFor(() => {
      const chatButtons = screen.getAllByText("Chat");
      fireEvent.click(chatButtons[0]);
    });

    expect(screen.getByTestId("chat-component")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("close-chat"));

    expect(screen.queryByTestId("chat-component")).not.toBeInTheDocument();
  });


  it("shows empty states for each tab", async () => {
    const emptyEvent = { ...mockEvent, tasks: {} };
    
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ guests: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ vendors: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ services: [] }),
      });

    render(
      <MemoryRouter>
        <PlannerViewEvent event={emptyEvent} />
      </MemoryRouter>
    );

    // Guests tab empty state
    fireEvent.click(screen.getByText("Guests & RSVP"));
    expect(screen.getByText('No guests added yet. Click "Add Guest" to invite people to your event.')).toBeInTheDocument();

    // Services tab empty state
    fireEvent.click(screen.getByText("Services"));
    expect(screen.getByText('No services added yet. Click "Add Vendor" to start building your services list.')).toBeInTheDocument();

    // Tasks tab empty state
    fireEvent.click(screen.getByText("My To-Do List"));
    expect(screen.getByText('No tasks added yet. Click "Add Task" to start organizing your event planning.')).toBeInTheDocument();
  });

  it("displays prompt cards in overview when data is missing", async () => {
    const emptyEvent = { ...mockEvent, tasks: {} };
    
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ guests: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ vendors: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ services: [] }),
      });

    render(
      <MemoryRouter>
        <PlannerViewEvent event={emptyEvent} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("No Guests Yet")).toBeInTheDocument();
      expect(screen.getByText("No Vendors Yet")).toBeInTheDocument();
    });
  });


  it("handles API errors gracefully", async () => {
  // Mock fetch to handle any request safely
  global.fetch.mockImplementation((url) => {
    if (url.includes("guests")) {
      // Simulate network failure only for guests
      return Promise.reject(new Error("Network error"));
    }
    // All other fetch calls succeed
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ vendors: [], services: [] }),
    });
  });

  render(
    <MemoryRouter>
      <PlannerViewEvent event={mockEvent} />
    </MemoryRouter>
  );

  // Wait for async effects and ensure component still renders
  expect(await screen.findByText("Wedding Reception")).toBeInTheDocument();
});

  it("handles guest tags and dietary requirements in add guest form", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ guests: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ vendors: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ services: [] }),
      });

    render(
      <MemoryRouter>
        <PlannerViewEvent event={mockEvent} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Guests & RSVP"));
    fireEvent.click(screen.getByText("+ Add Guest"));

    expect(screen.getByText("Guest Tags:")).toBeInTheDocument();
    expect(screen.getByText("Dietary Requirement:")).toBeInTheDocument();
    expect(screen.getByText("VIP")).toBeInTheDocument();
    expect(screen.getByText("Family")).toBeInTheDocument();
    expect(screen.getByText("Vegetarian")).toBeInTheDocument();
  });

  it("formats dates correctly", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ guests: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ vendors: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ services: [] }),
      });

    render(
      <MemoryRouter>
        <PlannerViewEvent event={mockEvent} />
      </MemoryRouter>
    );

    // Should display formatted date
    await waitFor(() => {
      const dateElements = screen.getAllByText(/2025/);
      expect(dateElements.length).toBeGreaterThan(0);
    });
  });

  it("validates guest form inputs", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ guests: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ vendors: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ services: [] }),
      });

    render(
      <MemoryRouter>
        <PlannerViewEvent event={mockEvent} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Guests & RSVP"));
    fireEvent.click(screen.getByText("+ Add Guest"));

    // Click the "Add Guest" button
    fireEvent.click(screen.getByRole("button", { name: "Add Guest" }));

    // Form should not close because validation should prevent submission
    expect(screen.getByRole("button", { name: "Add Guest" })).toBeInTheDocument();
    expect(screen.getByLabelText("First Name *")).toBeInTheDocument();
  });

  it("handles reminder sending failure", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ guests: mockGuests }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ vendors: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ services: [] }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

    render(
      <MemoryRouter>
        <PlannerViewEvent event={mockEvent} />
      </MemoryRouter>
    );

    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({ ok: false, status: 500 })
    );

    fireEvent.click(screen.getByText("Guests & RSVP"));

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    const reminderButtons = screen.getAllByText("Send Reminder");
    fireEvent.click(reminderButtons[0]);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith("Unable to send reminder");
    });
  });

  it("imports guests successfully", async () => {
    const mockGuestData = [
      { firstname: "Import", lastname: "Test", email: "import@test.com" },
    ];

    Papa.parse.mockImplementation((file, options) => {
      options.complete({ data: mockGuestData });
    });

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ guests: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ vendors: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ services: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ imported: 1 }),
      });

    render(
      <MemoryRouter>
        <PlannerViewEvent event={mockEvent} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Guests & RSVP"));
    fireEvent.click(screen.getByText("+ Add Guests from CSV"));

    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(["csv content"], "guests.csv", { type: "text/csv" });

    Object.defineProperty(fileInput, "files", {
      value: [file],
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText("Import 1 Guests")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Import 1 Guests"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "https://us-central1-planit-sdp.cloudfunctions.net/api/planner/events/event1/guests/import",
        expect.objectContaining({
          method: "POST",
          headers: {
            Authorization: "Bearer mock-token",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ guests: mockGuestData }),
        })
      );
    });
  });

  it("shows validation errors for invalid CSV data", async () => {
    const invalidGuestData = [
      { firstname: "", lastname: "Test", email: "invalid-email" },
      { firstname: "Valid", lastname: "User", email: "valid@test.com" },
    ];

    Papa.parse.mockImplementation((file, options) => {
      options.complete({ data: invalidGuestData });
    });

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ guests: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ vendors: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ services: [] }),
      });

    render(
      <MemoryRouter>
        <PlannerViewEvent event={mockEvent} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Guests & RSVP"));
    fireEvent.click(screen.getByText("+ Add Guests from CSV"));

    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(["csv content"], "guests.csv", { type: "text/csv" });

    Object.defineProperty(fileInput, "files", {
      value: [file],
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText("Validation Errors:")).toBeInTheDocument();
      expect(screen.getByText(/Row 1:/)).toBeInTheDocument();
      expect(screen.getByText("Preview (1 guests)")).toBeInTheDocument(); // Only valid guest shown
    });
  });

  it("closes popups when close button is clicked", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ guests: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ vendors: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ services: [] }),
      });

    render(
      <MemoryRouter>
        <PlannerViewEvent event={mockEvent} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Guests & RSVP"));
    fireEvent.click(screen.getByText("+ Add Guest"));

    expect(screen.getByText("First Name *")).toBeInTheDocument();

    fireEvent.click(screen.getAllByText("Close")[0]);

    expect(screen.queryByText("First Name *")).not.toBeInTheDocument();
  });

  it("updates guest form fields correctly", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ guests: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ vendors: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ services: [] }),
      });

    render(
      <MemoryRouter>
        <PlannerViewEvent event={mockEvent} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Guests & RSVP"));
    fireEvent.click(screen.getByText("+ Add Guest"));

    const firstNameInput = screen.getByLabelText("First Name *");
    const lastNameInput = screen.getByLabelText("Last Name");
    const emailInput = screen.getByLabelText("Email Address *");

    fireEvent.change(firstNameInput, { target: { value: "Test" } });
    fireEvent.change(lastNameInput, { target: { value: "User" } });
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    expect(firstNameInput.value).toBe("Test");
    expect(lastNameInput.value).toBe("User");
    expect(emailInput.value).toBe("test@example.com");
  });

  it("toggles guest tags correctly", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ guests: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ vendors: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ services: [] }),
      });

    render(
      <MemoryRouter>
        <PlannerViewEvent event={mockEvent} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Guests & RSVP"));
    fireEvent.click(screen.getByText("+ Add Guest"));

    const vipCheckbox = screen.getByRole("checkbox", { name: "VIP" });
    const familyCheckbox = screen.getByRole("checkbox", { name: "Family" });

    fireEvent.click(vipCheckbox);
    fireEvent.click(familyCheckbox);

    expect(vipCheckbox).toBeChecked();
    expect(familyCheckbox).toBeChecked();

    // Uncheck VIP
    fireEvent.click(vipCheckbox);
    expect(vipCheckbox).not.toBeChecked();
    expect(familyCheckbox).toBeChecked();
  });

  it("displays service status correctly", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ guests: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ vendors: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ services: mockServices }),
      });

    render(
      <MemoryRouter>
        <PlannerViewEvent event={mockEvent} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Services"));

    await waitFor(() => {
      expect(screen.getByText("Confirmed Total Cost:")).toBeInTheDocument();
      expect(screen.getByText("R 15000")).toBeInTheDocument();
      expect(screen.getByText("Estimated Total Cost:")).toBeInTheDocument();
      expect(screen.getByText("R 5000")).toBeInTheDocument();
    });
  });

});
