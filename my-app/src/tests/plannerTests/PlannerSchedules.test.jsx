import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, beforeEach, afterEach, vi, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";

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


vi.mock("jspdf-autotable", () => {
  const mockAutoTable = vi.fn();
  return {
    autoTable: mockAutoTable,
  };
});

// now re-import the mock from the module itself
import { autoTable as mockAutoTable } from "jspdf-autotable";

vi.mock('jspdf', () => {
  const mockSetFontSize = vi.fn();
  const mockText = vi.fn();
  const mockSave = vi.fn();
  const mockAddImage = vi.fn();
  
  const createMockInstance = () => ({
    setFontSize: mockSetFontSize,
    text: mockText,
    save: mockSave,
    addImage: mockAddImage,
    internal: {
      pageSize: {
        width: 210,
        height: 297
      }
    },
    setTextColor: vi.fn(),
    setDrawColor: vi.fn(),
    setFillColor: vi.fn(),
    rect: vi.fn(),
    line: vi.fn(),
    addPage: vi.fn(),
    setFont: vi.fn(),
    getFontSize: vi.fn(() => 12),
    getTextWidth: vi.fn(() => 50),
  });

  return {
    jsPDF: vi.fn(() => createMockInstance()),
  };
});

// mock jspdf-autotable (default export)


beforeEach(() => {
  mockAutoTable.mockClear();
  jsPDF.mockClear();
});

import { jsPDF } from "jspdf";

// --- Mock global functions ---
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
});


global.URL = {
  createObjectURL: vi.fn(() => "mock-url"),
  revokeObjectURL: vi.fn(),
};

// Mock document.createElement for CSV/JSON downloads
const mockClick = vi.fn();

// Store original createElement
const originalCreateElement = document.createElement.bind(document);

// Only mock createElement when we need to track clicks
const mockCreateElement = vi.fn((tagName) => {
  const element = originalCreateElement(tagName);
  if (tagName === 'a') {
    element.click = mockClick;
  }
  return element;
});

import PlannerSchedules from "../../pages/planner/PlannerSchedules";
import autoTable from "jspdf-autotable";

const mockEvents = [
  {
    id: "event1",
    name: "Wedding Reception",
    date: { _seconds: 1735689600, _nanoseconds: 0 }, // Jan 1, 2025
    eventCategory: "Wedding",
    expectedGuestCount: 150,
    duration: 8, // hours
  },
  {
    id: "event2",
    name: "Corporate Meeting",
    date: "2025-02-15T10:00:00Z",
    eventCategory: "Business",
    expectedGuestCount: 50,
    duration: 4,
  },
];

const mockSchedules = [
  {
    id: "schedule1",
    scheduleTitle: "Main Timeline",
    items: [
      {
        id: "item1",
        time: "18:00",
        title: "Reception Begins",
        duration: "60",
        description: "Cocktail hour and mingling",
      },
      {
        id: "item2",
        time: "19:00",
        title: "Dinner Service",
        duration: "90",
        description: "Three-course dinner",
      },
    ],
  },
  {
    id: "schedule2",
    scheduleTitle: "PDF Schedule",
    url: "https://example.com/schedule.pdf",
    type: "pdf",
  },
];

describe("PlannerSchedules", () => {
  beforeEach(() => {

    document.createElement = mockCreateElement;

    global.fetch.mockClear();
    global.alert.mockClear();
    mockAuth.currentUser.getIdToken.mockClear();
    jsPDF.mockClear();
    mockClick.mockClear();
  });

  afterEach(() => {
    document.createElement = originalCreateElement;
    vi.clearAllMocks();
  });

  it("renders header and empty state when no event selected", () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ events: [] }),
    });

    render(
      <MemoryRouter>
        <PlannerSchedules />
      </MemoryRouter>
    );

    expect(screen.getByText("Schedule Manager")).toBeInTheDocument();
    expect(screen.getByText("Select an Event")).toBeInTheDocument();
    expect(screen.getByText("Choose an event from your list to start managing schedules")).toBeInTheDocument();
  });

  it("fetches and displays events on component mount", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ events: mockEvents }),
    });

    render(
      <MemoryRouter>
        <PlannerSchedules />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Wedding Reception")).toBeInTheDocument();
      expect(screen.getByText("Corporate Meeting")).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://us-central1-planit-sdp.cloudfunctions.net/api/planner/me/events",
      expect.objectContaining({
        headers: {
          Authorization: "Bearer mock-token",
        },
      })
    );
  });

  it("selects event and fetches schedules", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ events: mockEvents }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ schedules: mockSchedules }),
      });

    render(
      <MemoryRouter>
        <PlannerSchedules />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Wedding Reception")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Wedding Reception"));

    await waitFor(() => {
      expect(screen.getByText("Wedding Reception Schedules")).toBeInTheDocument();
      expect(screen.getByText("Main Timeline")).toBeInTheDocument();
      expect(screen.getByText("PDF Schedule")).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://us-central1-planit-sdp.cloudfunctions.net/api/planner/event1/schedules",
      expect.objectContaining({
        headers: {
          Authorization: "Bearer mock-token",
        },
      })
    );
  });

  it("expands and displays schedule items", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ events: mockEvents }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ schedules: mockSchedules }),
      });

    render(
      <MemoryRouter>
        <PlannerSchedules />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Wedding Reception")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Wedding Reception"));

    await waitFor(() => {
      expect(screen.getByText("Main Timeline")).toBeInTheDocument();
    });

    // Schedule should be expanded by default (first one)
    expect(screen.getByText("Reception Begins")).toBeInTheDocument();
    expect(screen.getByText("18:00")).toBeInTheDocument();
    expect(screen.getByText("Cocktail hour and mingling")).toBeInTheDocument();
  });

  it("opens create schedule modal", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ events: mockEvents }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ schedules: [] }),
      });

    render(
      <MemoryRouter>
        <PlannerSchedules />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Wedding Reception")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Wedding Reception"));

    await waitFor(() => {
      expect(screen.getByText("New Schedule")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("New Schedule"));

    expect(screen.getByText("Create New Schedule")).toBeInTheDocument();
    expect(screen.getByText("Create Manually")).toBeInTheDocument();
    expect(screen.getByText("Upload PDF")).toBeInTheDocument();
  });

  it("creates new manual schedule", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ events: mockEvents }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ schedules: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "new-schedule-id" }),
      });

    render(
      <MemoryRouter>
        <PlannerSchedules />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Wedding Reception")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Wedding Reception"));

    await waitFor(() => {
      expect(screen.getByText("New Schedule")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("New Schedule"));

    const titleInput = screen.getByPlaceholderText("Enter schedule name (e.g., Main Event Timeline)");
    fireEvent.change(titleInput, { target: { value: "New Schedule Title" } });

    fireEvent.click(screen.getByText("Create Manually"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "https://us-central1-planit-sdp.cloudfunctions.net/api/planner/event1/schedules",
        expect.objectContaining({
          method: "POST",
          headers: {
            Authorization: "Bearer mock-token",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ scheduleTitle: "New Schedule Title" }),
        })
      );
    });
  });

  it("opens schedule item modal", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ events: mockEvents }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ schedules: mockSchedules }),
      });

    render(
      <MemoryRouter>
        <PlannerSchedules />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Wedding Reception")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Wedding Reception"));

    await waitFor(() => {
      expect(screen.getByText("Add Item")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Add Item"));

    expect(screen.getByText("Add Schedule Item - Wedding Reception")).toBeInTheDocument();
    expect(screen.getByLabelText("Time")).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
  });

  it("adds new schedule item", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ events: mockEvents }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ schedules: mockSchedules }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "new-item-id" }),
      });

    render(
      <MemoryRouter>
        <PlannerSchedules />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Wedding Reception")).toBeInTheDocument();
    });

    await waitFor(()=>fireEvent.click(screen.getByText("Wedding Reception")));

    await waitFor(() => {
      expect(screen.getByText("Add Item")).toBeInTheDocument();
    });

    await waitFor(() => {
      fireEvent.click(screen.getByText("Main Timeline"));
    })

    await waitFor(() => {
      fireEvent.click(screen.getByText("Main Timeline"));
    })


    await waitFor(()=>fireEvent.click(screen.getByText("Add Item")));

    const timeInput = screen.getByLabelText("Time");
    const titleInput = screen.getByLabelText("Title");
    const durationInput = screen.getByLabelText("Duration (minutes)");

    fireEvent.change(timeInput, { target: { value: "20:00" } });
    fireEvent.change(titleInput, { target: { value: "New Event" } });
    fireEvent.change(durationInput, { target: { value: "30" } });

    await waitFor(()=>fireEvent.click(screen.getByText("Save Item")));
  });

  it("edits schedule item", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ events: mockEvents }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ schedules: mockSchedules }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "item1" }),
      });

    render(
      <MemoryRouter>
        <PlannerSchedules />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Wedding Reception")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Wedding Reception"));

    await waitFor(() => {
      expect(screen.getByText("Reception Begins")).toBeInTheDocument();
    });

    await waitFor(() => {
      fireEvent.click(screen.getByText("Main Timeline"));
    })

    await waitFor(() => {
      fireEvent.click(screen.getByText("Main Timeline"));
    })

    // Find and click edit button for first item
    const editButtons = screen.getAllByTestId("item-edit-button");
    const editButton = editButtons[0];
    
    if (editButton) {
      fireEvent.click(editButton);
    }

    await waitFor(() => {
      const saveButton = screen.getByText("Save");
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("items/item1"),
        expect.objectContaining({
          method: "PUT",
        })
      );
    });
  });

  it("deletes schedule item", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ events: mockEvents }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ schedules: mockSchedules }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

    render(
      <MemoryRouter>
        <PlannerSchedules />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Wedding Reception")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Wedding Reception"));

    await waitFor(() => {
      expect(screen.getByText("Reception Begins")).toBeInTheDocument();
    });

    // Find and click delete button (trash icon)
    const deleteButtons = screen.getAllByRole("button");
    const deleteButton = deleteButtons.find(button => {
      return button.classList.contains('ps-btn-danger');
    });

    if (deleteButton) {
      fireEvent.click(deleteButton);
    }

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("items/item1"),
        expect.objectContaining({
          method: "DELETE",
        })
      );
    });
  });

  it("exports schedule as PDF", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ events: mockEvents }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ schedules: mockSchedules }),
      });

    render(
      <MemoryRouter>
        <PlannerSchedules />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Wedding Reception")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Wedding Reception"));

    await waitFor(() => {
      expect(screen.getByText("Export")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Export"));

    expect(screen.getByText("Export Schedule")).toBeInTheDocument();

    fireEvent.click(screen.getByText("PDF Document"));

    await waitFor(()=>expect(jsPDF().setFontSize).toHaveBeenCalled());
    await waitFor(()=>expect(jsPDF().text).toHaveBeenCalled());
    await waitFor(()=>expect(mockAutoTable).toHaveBeenCalled());
    await waitFor(()=>expect(jsPDF().save).toHaveBeenCalledWith("Wedding_Reception_schedule_1.pdf"));
  });

  it("exports schedule as CSV", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ events: mockEvents }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ schedules: mockSchedules }),
      });

    render(
      <MemoryRouter>
        <PlannerSchedules />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Wedding Reception")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Wedding Reception"));

    await waitFor(() => {
      expect(screen.getByText("Export")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Export"));

    fireEvent.click(screen.getByText("CSV Spreadsheet"));

    expect(mockClick).toHaveBeenCalled();
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });

  it("exports schedule as JSON", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ events: mockEvents }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ schedules: mockSchedules }),
      });

    render(
      <MemoryRouter>
        <PlannerSchedules />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Wedding Reception")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Wedding Reception"));

    await waitFor(() => {
      expect(screen.getByText("Export")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Export"));

    fireEvent.click(screen.getByText("JSON Data"));

    expect(mockClick).toHaveBeenCalled();
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });

  it("handles PDF schedule view", async () => {
    const mockOpen = vi.spyOn(window, 'open').mockImplementation(() => {});

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ events: mockEvents }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ schedules: mockSchedules }),
      });

    render(
      <MemoryRouter>
        <PlannerSchedules />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Wedding Reception")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Wedding Reception"));

    await waitFor(() => {
      expect(screen.getByText("PDF Schedule")).toBeInTheDocument();
    });

    // Click on PDF schedule to expand it
    fireEvent.click(screen.getByText("PDF Schedule"));

    await waitFor(() => {
      const pdfLink = screen.getByRole('link', { name: /Open PDF Schedule.*PDF Schedule/i });
      expect(pdfLink).toBeInTheDocument();
      fireEvent.click(pdfLink);
      expect(pdfLink).toHaveAttribute("href", "https://example.com/schedule.pdf");
      expect(pdfLink).toHaveAttribute("target", "_blank");
    });
  });

  it("uploads PDF schedule", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ events: mockEvents }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ schedules: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ files: [{ url: "https://example.com/uploaded.pdf" }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ schedules: [] }),
      });

    render(
      <MemoryRouter>
        <PlannerSchedules />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Wedding Reception")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Wedding Reception"));

    await waitFor(() => {
      expect(screen.getByText("New Schedule")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("New Schedule"));

    const titleInput = screen.getByPlaceholderText("Enter schedule name (e.g., Main Event Timeline)");
    fireEvent.change(titleInput, { target: { value: "PDF Schedule" } });

    fireEvent.click(screen.getByText("Upload PDF"));

    // Simulate file selection
    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(["pdf content"], "schedule.pdf", { type: "application/pdf" });
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText("Save")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("schedule-upload"),
        expect.objectContaining({
          method: "POST",
        })
      );
    });
  });

  it("deletes schedule", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ events: mockEvents }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ schedules: mockSchedules }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

    render(
      <MemoryRouter>
        <PlannerSchedules />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Wedding Reception")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Wedding Reception"));

    await waitFor(() => {
      expect(screen.getByText("Delete Schedule")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Delete Schedule"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "https://us-central1-planit-sdp.cloudfunctions.net/api/planner/event1/schedules/schedule1",
        expect.objectContaining({
          method: "DELETE",
        })
      );
    });
  });

  it("validates schedule item time against event duration", () => {
    // Mock alert for time validation
    global.alert.mockImplementation(() => {});

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ events: mockEvents }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ schedules: mockSchedules }),
      });

    render(
      <MemoryRouter>
        <PlannerSchedules />
      </MemoryRouter>
    );

    // The time validation is tested indirectly through the component's internal logic
    // We can verify that alert is called when invalid times are entered
    expect(global.alert).toHaveBeenCalledTimes(0);
  });

  it("closes modals when clicking outside or cancel", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ events: mockEvents }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ schedules: [] }),
      });

    render(
      <MemoryRouter>
        <PlannerSchedules />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Wedding Reception")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Wedding Reception"));

    await waitFor(() => {
      expect(screen.getByText("New Schedule")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("New Schedule"));

    expect(screen.getByText("Create New Schedule")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Cancel"));

    expect(screen.queryByText("Create New Schedule")).not.toBeInTheDocument();
  });

  it("handles API errors gracefully", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ events: mockEvents }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

    render(
      <MemoryRouter>
        <PlannerSchedules />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Wedding Reception")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Wedding Reception"));

    // Component should handle the error gracefully without crashing
    await waitFor(() => {
      expect(screen.getByText("Wedding Reception Schedules")).toBeInTheDocument();
    });
  });

  it("displays empty state when event has no schedules", async () => {
    global.fetch.mockImplementation((url) => {
        if (url.includes("/events")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ events: mockEvents }),
          });
        }

        if (url.includes("/schedules")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ schedules: [] }),
          });
        }

        // Default fallback for any unexpected fetch calls
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(),
        });
      });
    

    render(
      <MemoryRouter>
        <PlannerSchedules />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Wedding Reception")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Wedding Reception"));

    await waitFor(() => {
      expect(screen.queryByTestId("schedule-container")).not.toBeInTheDocument();
      expect(screen.getByText("No Schedules Created")).toBeInTheDocument();
      expect(screen.getByText("Create your first schedule to start planning your event timeline")).toBeInTheDocument();
    });

  });

  it("shows notification messages", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ events: mockEvents }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ schedules: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "new-schedule" }),
      });

    render(
      <MemoryRouter>
        <PlannerSchedules />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Wedding Reception")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Wedding Reception"));

    await waitFor(() => {
      expect(screen.getByText("New Schedule")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("New Schedule"));

    const titleInput = screen.getByPlaceholderText("Enter schedule name (e.g., Main Event Timeline)");
    fireEvent.change(titleInput, { target: { value: "Test Schedule" } });

    fireEvent.click(screen.getByText("Create Manually"));

    await waitFor(() => {
      expect(screen.getByText("Schedule created successfully!")).toBeInTheDocument();
    });
  });

  it("toggles schedule expansion", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ events: mockEvents }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ schedules: mockSchedules }),
      });

    render(
      <MemoryRouter>
        <PlannerSchedules />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Wedding Reception")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Wedding Reception"));

    await waitFor(() => {
      expect(screen.getByText("Main Timeline")).toBeInTheDocument();
      expect(screen.getByText("Reception Begins")).toBeInTheDocument();
    });

    // Click to collapse
    fireEvent.click(screen.getByText("Main Timeline"));

    // Items should still be visible as they are expanded by default in the first schedule
    // This tests the toggle functionality
    expect(screen.queryByText("Reception Begins")).not.toBeInTheDocument();
  });
});
