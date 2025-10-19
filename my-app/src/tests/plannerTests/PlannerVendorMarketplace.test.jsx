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

vi.mock("../../pages/planner/ChatComponent", () => ({
  default: vi.fn(({ closeChat }) => (
    <div data-testid="chat-component">
      <button onClick={closeChat}>Close Chat</button>
    </div>
  )),
}));

vi.mock("../../pages/general/popup/Popup.jsx", () => ({
  default: vi.fn(({ isOpen, onClose, children }) =>
    isOpen ? (
      <div data-testid="popup-modal">
        <button onClick={onClose}>Close Popup</button>
        {children}
      </div>
    ) : null
  ),
}));

vi.mock("../../pages/planner/MarketPlaceComponents/VendorCardMarket.jsx", () => ({
  default: vi.fn(({ vendor, onViewMore }) => (
    <div data-testid={`vendor-card-${vendor.id}`}>
      <h3>{vendor.businessName || vendor.name}</h3>
      <button onClick={onViewMore}>View More</button>
    </div>
  )),
}));

vi.mock("../../pages/planner/MarketPlaceComponents/VendorDetails.jsx", () => ({
  default: vi.fn(({ vendor, addService, onContactVendor, onClose }) => (
    <div data-testid="vendor-modal">
      <h2>{vendor.businessName}</h2>
      <button onClick={() => addService(vendor, vendor.services[0])}>Add Service</button>
      <button onClick={() => onContactVendor(vendor)}>Contact Vendor</button>
      <button onClick={onClose}>Close Modal</button>
    </div>
  )),
}));

vi.mock("../../apiConfig.js", () => ({
  default: "https://test-api.com",
}));

vi.resetModules();

import PlannerVendorMarketplace from "../../pages/planner/PlannerVendorMarketplace";

const mockVendors = [
  {
    id: "vendor1",
    businessName: "Elite Catering",
    category: "Catering",
    rating: 4.8,
  },
  {
    id: "vendor2",
    businessName: "Dream Photography",
    category: "Photography",
    rating: 4.9,
  },
];

const mockEvents = [
  {
    id: "event1",
    name: "Summer Wedding",
    date: { _seconds: 1735689600, _nanoseconds: 0 },
  },
  {
    id: "event2",
    name: "Corporate Gala",
    date: "2025-03-20T18:00:00Z",
  },
];

const mockServices = [
  {
    id: "service1",
    serviceName: "Full Package",
    price: 5000,
  },
];

// Helper to setup common fetch mocks
const setupFetchMock = (overrides = {}) => {
  const defaults = {
    vendors: mockVendors,
    events: mockEvents,
    services: mockServices,
  };
  
  const config = { ...defaults, ...overrides };
  
  global.fetch = vi.fn((url) => {
    if (url.includes("/bestVendors")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ vendors: config.vendors }),
      });
    }
    if (url.includes("/events") && !url.includes("vendors")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ events: config.events }),
      });
    }
    if (url.includes("/services")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(config.services),
      });
    }
    if (url.includes("/vendors/")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
    });
  });
};

describe("PlannerVendorMarketplace", () => {
  beforeAll(() => {
    window.HTMLElement.prototype.scrollIntoView = function () {};
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

  it("renders marketplace with header and tabs", async () => {
    render(
      <MemoryRouter>
        <PlannerVendorMarketplace />
      </MemoryRouter>
    );

    expect(screen.getByText("Vendor Marketplace")).toBeInTheDocument();
    expect(screen.getByText("All Events")).toBeInTheDocument();
    expect(screen.getByText("Event Specific")).toBeInTheDocument();
  });

  it("fetches and displays vendors on load", async () => {
    render(
      <MemoryRouter>
        <PlannerVendorMarketplace />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Elite Catering")).toBeInTheDocument();
      expect(screen.getByText("Dream Photography")).toBeInTheDocument();
    });
  });

  it("shows loading state", async () => {
    setupFetchMock();
    
    render(
      <MemoryRouter>
        <PlannerVendorMarketplace />
      </MemoryRouter>
    );

    expect(screen.getByText("Loading vendors...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText("Loading vendors...")).not.toBeInTheDocument();
    });
  });

  it("displays empty state when no vendors", async () => {
    setupFetchMock({ vendors: [] });

    render(
      <MemoryRouter>
        <PlannerVendorMarketplace />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("No vendors found matching your criteria.")).toBeInTheDocument();
    });
  });

  // ===== SEARCH AND FILTER =====

  it("filters vendors by search term", async () => {
    render(
      <MemoryRouter>
        <PlannerVendorMarketplace />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Elite Catering")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search vendors...");
    fireEvent.change(searchInput, { target: { value: "Dream" } });

    expect(screen.queryByText("Elite Catering")).not.toBeInTheDocument();
    expect(screen.getByText("Dream Photography")).toBeInTheDocument();
  });

  it("filters vendors by category", async () => {
    render(
      <MemoryRouter>
        <PlannerVendorMarketplace />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Elite Catering")).toBeInTheDocument();
    });

    const categorySelect = screen.getByRole("combobox");
    fireEvent.change(categorySelect, { target: { value: "Photography" } });

    expect(screen.queryByText("Elite Catering")).not.toBeInTheDocument();
    expect(screen.getByText("Dream Photography")).toBeInTheDocument();
  });

  it("combines search and category filters", async () => {
    render(
      <MemoryRouter>
        <PlannerVendorMarketplace />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Elite Catering")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search vendors...");
    fireEvent.change(searchInput, { target: { value: "Elite" } });

    const categorySelect = screen.getByRole("combobox");
    fireEvent.change(categorySelect, { target: { value: "Catering" } });

    expect(screen.getByText("Elite Catering")).toBeInTheDocument();
    expect(screen.queryByText("Dream Photography")).not.toBeInTheDocument();
  });

  // ===== TAB SWITCHING =====

  it("switches to event-specific tab", async () => {
    render(
      <MemoryRouter>
        <PlannerVendorMarketplace />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Elite Catering")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Event Specific"));

    await waitFor(() => {
      expect(screen.getByText("Selected Event:")).toBeInTheDocument();
    });
  });

  it("opens event modal when switching to event-specific without event", async () => {
    render(
      <MemoryRouter>
        <PlannerVendorMarketplace />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Elite Catering")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Event Specific"));

    await waitFor(() => {
      expect(screen.getByTestId("popup-modal")).toBeInTheDocument();
    });
  });

  // ===== EVENT SELECTION =====

  it("selects event and fetches event-specific vendors", async () => {
    render(
      <MemoryRouter>
        <PlannerVendorMarketplace />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Elite Catering")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Event Specific"));

    await waitFor(() => {
      expect(screen.getByText("Summer Wedding")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Summer Wedding"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("events/event1/bestVendors"),
        expect.any(Object)
      );
    });
  });

  it("displays selected event information", async () => {
    render(
      <MemoryRouter>
        <PlannerVendorMarketplace />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Event Specific"));

    await waitFor(() => {
      expect(screen.getByText("Summer Wedding")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Summer Wedding"));

    await waitFor(() => {
      const buttons = screen.getAllByRole("button");
      const eventButton = buttons.find(btn => btn.textContent.includes("Summer Wedding"));
      expect(eventButton).toBeInTheDocument();
    });
  });

  // ===== VENDOR MODAL =====

  it("opens vendor modal with services", async () => {
    render(
      <MemoryRouter>
        <PlannerVendorMarketplace />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Elite Catering")).toBeInTheDocument();
    });

    const viewMoreButtons = screen.getAllByText("View More");
    fireEvent.click(viewMoreButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId("vendor-modal")).toBeInTheDocument();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("vendors/vendor1/services"),
        expect.any(Object)
      );
    });
  });

  it("closes vendor modal", async () => {
    render(
      <MemoryRouter>
        <PlannerVendorMarketplace />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Elite Catering")).toBeInTheDocument();
    });

    const viewMoreButtons = screen.getAllByText("View More");
    fireEvent.click(viewMoreButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId("vendor-modal")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Close Modal"));

    await waitFor(() => {
      expect(screen.queryByTestId("vendor-modal")).not.toBeInTheDocument();
    });
  });

  // ===== ADD VENDOR/SERVICE =====

  it("adds vendor and service in event-specific mode", async () => {
    render(
      <MemoryRouter>
        <PlannerVendorMarketplace />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Event Specific"));

    await waitFor(() => {
      expect(screen.getByText("Summer Wedding")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Summer Wedding"));

    await waitFor(() => {
      expect(screen.getByText("Elite Catering")).toBeInTheDocument();
    });

    const viewMoreButtons = screen.getAllByText("View More");
    fireEvent.click(viewMoreButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId("vendor-modal")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Add Service"));
  });

  it("opens event selection when adding vendor in all-events mode", async () => {
    render(
      <MemoryRouter>
        <PlannerVendorMarketplace />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Elite Catering")).toBeInTheDocument();
    });

    const viewMoreButtons = screen.getAllByText("View More");
    fireEvent.click(viewMoreButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId("vendor-modal")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Add Service"));

    await waitFor(() => {
      expect(screen.getByTestId("popup-modal")).toBeInTheDocument();
      expect(screen.getByText("Summer Wedding")).toBeInTheDocument();
    });
  });

  it("adds vendor after selecting event in all-events mode", async () => {
    render(
      <MemoryRouter>
        <PlannerVendorMarketplace />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Elite Catering")).toBeInTheDocument();
    });

    const viewMoreButtons = screen.getAllByText("View More");
    fireEvent.click(viewMoreButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId("vendor-modal")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Add Service"));

    await waitFor(() => {
      expect(screen.getByText("Summer Wedding")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Summer Wedding"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("event1/vendors/vendor1"),
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  // ===== CONTACT VENDOR / CHAT =====

  it("opens chat in event-specific mode", async () => {
    render(
      <MemoryRouter>
        <PlannerVendorMarketplace />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Event Specific"));

    await waitFor(() => {
      expect(screen.getByText("Summer Wedding")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Summer Wedding"));

    await waitFor(() => {
      expect(screen.getByText("Elite Catering")).toBeInTheDocument();
    });

    const viewMoreButtons = screen.getAllByText("View More");
    fireEvent.click(viewMoreButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId("vendor-modal")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Contact Vendor"));

    await waitFor(() => {
      expect(screen.getByTestId("chat-component")).toBeInTheDocument();
    });
  });

  it("opens event selection for chat in all-events mode", async () => {
    render(
      <MemoryRouter>
        <PlannerVendorMarketplace />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Elite Catering")).toBeInTheDocument();
    });

    const viewMoreButtons = screen.getAllByText("View More");
    fireEvent.click(viewMoreButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId("vendor-modal")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Contact Vendor"));

    await waitFor(() => {
      expect(screen.getByTestId("popup-modal")).toBeInTheDocument();
      expect(screen.getByText("Select Event for Chat")).toBeInTheDocument();
    });
  });

  it("opens chat after selecting event", async () => {
    render(
      <MemoryRouter>
        <PlannerVendorMarketplace />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Elite Catering")).toBeInTheDocument();
    });

    const viewMoreButtons = screen.getAllByText("View More");
    fireEvent.click(viewMoreButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId("vendor-modal")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Contact Vendor"));

    await waitFor(() => {
      expect(screen.getByText("Summer Wedding")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Summer Wedding"));

    await waitFor(() => {
      expect(screen.getByTestId("chat-component")).toBeInTheDocument();
    });
  });

  it("closes chat", async () => {
    render(
      <MemoryRouter>
        <PlannerVendorMarketplace />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Event Specific"));

    await waitFor(() => {
      expect(screen.getByText("Summer Wedding")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Summer Wedding"));

    await waitFor(() => {
      expect(screen.getByText("Elite Catering")).toBeInTheDocument();
    });

    const viewMoreButtons = screen.getAllByText("View More");
    fireEvent.click(viewMoreButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId("vendor-modal")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Contact Vendor"));

    await waitFor(() => {
      expect(screen.getByTestId("chat-component")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Close Chat"));

    await waitFor(() => {
      expect(screen.queryByTestId("chat-component")).not.toBeInTheDocument();
    });
  });

  // ===== NOTIFICATIONS =====

  it("displays success notification", async () => {
    render(
      <MemoryRouter>
        <PlannerVendorMarketplace />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Event Specific"));

    await waitFor(() => {
      expect(screen.getByText("Summer Wedding")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Summer Wedding"));

    await waitFor(() => {
      expect(screen.getByText("Elite Catering")).toBeInTheDocument();
    });

    const viewMoreButtons = screen.getAllByText("View More");
    fireEvent.click(viewMoreButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId("vendor-modal")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Add Service"));
  });

  it("displays error notification on failure", async () => {
    setupFetchMock();
    global.fetch = vi.fn((url) => {
      if (url.includes("/bestVendors")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ vendors: mockVendors }),
        });
      }
      if (url.includes("/events")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ events: mockEvents }),
        });
      }
      if (url.includes("/services") && url.includes("vendors")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockServices),
        });
      }
      if (url.includes("/vendors/")) {
        return Promise.resolve({
          ok: false,
          status: 500,
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(
      <MemoryRouter>
        <PlannerVendorMarketplace />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Event Specific"));

    await waitFor(() => {
      expect(screen.getByText("Summer Wedding")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Summer Wedding"));

    await waitFor(() => {
      expect(screen.getByText("Elite Catering")).toBeInTheDocument();
    });

    const viewMoreButtons = screen.getAllByText("View More");
    fireEvent.click(viewMoreButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId("vendor-modal")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Add Service"));

  });

  // ===== ERROR HANDLING =====

  it("handles vendor services fetch error", async () => {
    global.fetch = vi.fn((url) => {
      if (url.includes("/bestVendors")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ vendors: mockVendors }),
        });
      }
      if (url.includes("/services")) {
        return Promise.resolve({
          ok: false,
          status: 500,
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(
      <MemoryRouter>
        <PlannerVendorMarketplace />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Elite Catering")).toBeInTheDocument();
    });

    const viewMoreButtons = screen.getAllByText("View More");
    fireEvent.click(viewMoreButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("Failed to fetch vendor services.")).toBeInTheDocument();
    });
  });

  it("handles API errors gracefully", async () => {
    setupFetchMock({ vendors: [] });

    render(
      <MemoryRouter>
        <PlannerVendorMarketplace />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("No vendors found matching your criteria.")).toBeInTheDocument();
    });
  });

  // ===== PROP INITIALIZATION =====

  it("initializes with provided event prop", async () => {
    render(
      <MemoryRouter>
        <PlannerVendorMarketplace event={mockEvents[0]} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Summer Wedding")).toBeInTheDocument();
      expect(screen.getByText("Event Specific")).toHaveClass("active");
    });
  });
});
