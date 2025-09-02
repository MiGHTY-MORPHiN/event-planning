import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import PlannerApp from "../pages/planner/PlannerApp";

// Mock Firebase
vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({})),
}));

vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
}));

// Mock all the planner components
vi.mock("../pages/planner/PlannerDashboard", () => ({
  default: ({ setActivePage }) => (
    <div data-testid="planner-dashboard">
      <h1>Dashboard Content</h1>
      <button onClick={() => setActivePage("events")} data-testid="dashboard-events-btn">
        Go to Events from Dashboard
      </button>
    </div>
  ),
}));

vi.mock("../pages/planner/PlannerVendorMarketplace", () => ({
  default: ({ setActivePage }) => (
    <div data-testid="planner-vendor-marketplace">
      <h1>Vendor Marketplace Content</h1>
      <button onClick={() => setActivePage("dashboard")} data-testid="vendor-back-btn">
        Back to Dashboard
      </button>
    </div>
  ),
}));

vi.mock("../pages/planner/PlannerAllEvents", () => ({
  default: ({ setActivePage, onSelectEvent }) => (
    <div data-testid="planner-all-events">
      <h1>All Events Content</h1>
      <button onClick={() => setActivePage("dashboard")} data-testid="events-back-btn">
        Back to Dashboard
      </button>
      <button onClick={onSelectEvent} data-testid="select-event-btn">
        Select Event
      </button>
    </div>
  ),
}));

vi.mock("../pages/planner/PlannerViewEvent", () => ({
  default: ({ setActivePage }) => (
    <div data-testid="planner-view-event">
      <h1>View Event Content</h1>
      <button onClick={() => setActivePage("events")} data-testid="view-event-back-btn">
        Back to Events
      </button>
    </div>
  ),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("PlannerApp", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    render(
      <MemoryRouter>
        <PlannerApp />
      </MemoryRouter>
    );
  });

  test("renders initial dashboard content", () => {
    expect(screen.getByTestId("planner-dashboard")).toBeInTheDocument();
    expect(screen.getByText("Dashboard Content")).toBeInTheDocument();
  });

  test("renders navigation items", () => {
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Events")).toBeInTheDocument();
    expect(screen.getByText("Vendor Marketplace")).toBeInTheDocument();
    expect(screen.getByText("Guest Management")).toBeInTheDocument();
    expect(screen.getByText("Floorplan")).toBeInTheDocument();
    expect(screen.getByText("Documents")).toBeInTheDocument();
  });

  test("renders app header elements", () => {
    expect(screen.getByText("Planner Home")).toBeInTheDocument();
    expect(screen.getByText("Home")).toBeInTheDocument();
  });

  test("navigates to Events tab and shows all events component", () => {
    const navButtons = screen.getAllByText("Events");
    const eventsNavButton = navButtons.find(button => 
      button.closest('.nav-btn')
    );
    fireEvent.click(eventsNavButton);
    
    expect(screen.getByTestId("planner-all-events")).toBeInTheDocument();
    expect(screen.getByText("All Events Content")).toBeInTheDocument();
  });

  test("navigates to Vendor Marketplace and shows vendor component", () => {
    const navButtons = screen.getAllByText("Vendor Marketplace");
    const vendorNavButton = navButtons.find(button => 
      button.closest('.nav-btn')
    );
    fireEvent.click(vendorNavButton);
    
    expect(screen.getByTestId("planner-vendor-marketplace")).toBeInTheDocument();
    expect(screen.getByText("Vendor Marketplace Content")).toBeInTheDocument();
  });

  test("navigates to Guest Management and shows placeholder", () => {
    const allNavButtons = screen.getAllByRole("button");
    const guestNavButton = allNavButtons.find(btn => 
      btn.textContent.includes("Guest Management") && btn.classList.contains("nav-btn")
    );
    fireEvent.click(guestNavButton);
    
    expect(screen.getByRole("heading", { name: "Guest Management" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "This page is coming soon. All the functionality will be built here."
      )
    ).toBeInTheDocument();
  });

  test("navigates to Floorplan and shows placeholder", () => {
    const allNavButtons = screen.getAllByRole("button");
    const floorplanNavButton = allNavButtons.find(btn => 
      btn.textContent.includes("Floorplan") && btn.classList.contains("nav-btn")
    );
    fireEvent.click(floorplanNavButton);
    
    expect(screen.getByText("Floorplan View")).toBeInTheDocument();
    expect(
      screen.getByText(
        "This page is coming soon. All the functionality will be built here."
      )
    ).toBeInTheDocument();
  });

  test("navigates to Documents and shows placeholder", () => {
    const allNavButtons = screen.getAllByRole("button");
    const documentsNavButton = allNavButtons.find(btn => 
      btn.textContent.includes("Documents") && btn.classList.contains("nav-btn")
    );
    fireEvent.click(documentsNavButton);
    
    expect(screen.getByText("Document Management")).toBeInTheDocument();
    expect(
      screen.getByText(
        "This page is coming soon. All the functionality will be built here."
      )
    ).toBeInTheDocument();
  });

  test("onSelectEvent function navigates to selected-event page", () => {
    // Navigate to events first
    const navButtons = screen.getAllByText("Events");
    const eventsNavButton = navButtons.find(button => 
      button.closest('.nav-btn')
    );
    fireEvent.click(eventsNavButton);
    
    // Click select event button
    const selectEventBtn = screen.getByTestId("select-event-btn");
    fireEvent.click(selectEventBtn);
    
    // Should navigate to view event page
    expect(screen.getByTestId("planner-view-event")).toBeInTheDocument();
    expect(screen.getByText("View Event Content")).toBeInTheDocument();
  });

  test("back to dashboard button works from placeholder pages", () => {
    const allNavButtons = screen.getAllByRole("button");
    const floorplanNavButton = allNavButtons.find(btn => 
      btn.textContent.includes("Floorplan") && btn.classList.contains("nav-btn")
    );
    fireEvent.click(floorplanNavButton);
    expect(screen.getByText("Floorplan View")).toBeInTheDocument();
    
    fireEvent.click(screen.getByText("Back to Dashboard"));
    
    expect(screen.getByTestId("planner-dashboard")).toBeInTheDocument();
    expect(screen.getByText("Dashboard Content")).toBeInTheDocument();
  });

  test("back to events from view event works", () => {
    // Navigate to events -> select event -> back to events
    const navButtons = screen.getAllByText("Events");
    const eventsNavButton = navButtons.find(button => 
      button.closest('.nav-btn')
    );
    fireEvent.click(eventsNavButton);
    
    const selectEventBtn = screen.getByTestId("select-event-btn");
    fireEvent.click(selectEventBtn);
    
    const backToEventsBtn = screen.getByTestId("view-event-back-btn");
    fireEvent.click(backToEventsBtn);
    
    expect(screen.getByTestId("planner-all-events")).toBeInTheDocument();
  });

  test("home button navigates to home route", () => {
    const homeButton = screen.getByText("Home");
    fireEvent.click(homeButton);
    
    expect(mockNavigate).toHaveBeenCalledWith("/home");
  });

  test("active navigation state changes correctly", () => {
    const allNavButtons = screen.getAllByRole("button");
    const dashboardNavBtn = allNavButtons.find(btn => 
      btn.textContent.includes("Dashboard") && btn.classList.contains("nav-btn")
    );
    expect(dashboardNavBtn).toHaveClass("active");

    const eventsNavBtn = allNavButtons.find(btn => 
      btn.textContent.includes("Events") && btn.classList.contains("nav-btn")
    );
    
    fireEvent.click(eventsNavBtn);
    
    expect(eventsNavBtn).toHaveClass("active");
    expect(dashboardNavBtn).not.toHaveClass("active");
  });

  test("vendor marketplace navigation button becomes active when clicked", () => {
    const allNavButtons = screen.getAllByRole("button");
    const vendorNavBtn = allNavButtons.find(btn => 
      btn.textContent.includes("Vendor Marketplace") && btn.classList.contains("nav-btn")
    );
    
    fireEvent.click(vendorNavBtn);
    expect(vendorNavBtn).toHaveClass("active");
  });

  test("guest management navigation button becomes active when clicked", () => {
    const allNavButtons = screen.getAllByRole("button");
    const guestNavBtn = allNavButtons.find(btn => 
      btn.textContent.includes("Guest Management") && btn.classList.contains("nav-btn")
    );
    fireEvent.click(guestNavBtn);
    expect(guestNavBtn).toHaveClass("active");
  });

  test("floorplan navigation button becomes active when clicked", () => {
    const allNavButtons = screen.getAllByRole("button");
    const floorplanNavBtn = allNavButtons.find(btn => 
      btn.textContent.includes("Floorplan") && btn.classList.contains("nav-btn")
    );
    fireEvent.click(floorplanNavBtn);
    expect(floorplanNavBtn).toHaveClass("active");
  });

  test("documents navigation button becomes active when clicked", () => {
    const allNavButtons = screen.getAllByRole("button");
    const documentsNavBtn = allNavButtons.find(btn => 
      btn.textContent.includes("Documents") && btn.classList.contains("nav-btn")
    );
    fireEvent.click(documentsNavBtn);
    expect(documentsNavBtn).toHaveClass("active");
  });

  test("selected-event page does not show active state for nav buttons", () => {
    // Navigate to events -> select event
    const navButtons = screen.getAllByText("Events");
    const eventsNavButton = navButtons.find(button => 
      button.closest('.nav-btn')
    );
    fireEvent.click(eventsNavButton);
    
    const selectEventBtn = screen.getByTestId("select-event-btn");
    fireEvent.click(selectEventBtn);
    
    // No nav button should be active for selected-event page
    const allNavButtons = screen.getAllByRole("button").filter(btn => 
      btn.classList.contains("nav-btn")
    );
    
    allNavButtons.forEach(button => {
      expect(button).not.toHaveClass("active");
    });
  });

  test("renders correct SVG icons for navigation items", () => {
    const container = screen.getByRole("navigation");
    const svgElements = container.querySelectorAll("svg");
    expect(svgElements.length).toBeGreaterThan(0);
    
    expect(container.querySelector('.lucide-chart-column')).toBeInTheDocument();
    expect(container.querySelector('.lucide-calendar')).toBeInTheDocument();
    expect(container.querySelector('.lucide-users')).toBeInTheDocument();
    expect(container.querySelector('.lucide-map-pin')).toBeInTheDocument();
    expect(container.querySelector('.lucide-file-text')).toBeInTheDocument();
  });

  test("placeholder pages render correct icons", () => {
    const allNavButtons = screen.getAllByRole("button");
    const floorplanNavButton = allNavButtons.find(btn => 
      btn.textContent.includes("Floorplan") && btn.classList.contains("nav-btn")
    );
    fireEvent.click(floorplanNavButton);
    
    expect(screen.getByRole("heading", { name: "Floorplan View" })).toBeInTheDocument();
    
    const mainContent = screen.getByRole("main");
    const placeholderIcon = mainContent.querySelector('.placeholder-icon svg');
    expect(placeholderIcon).toBeInTheDocument();
  });

  test("navigation preserves app structure", () => {
    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    
    const allNavButtons = screen.getAllByRole("button");
    const eventsNavBtn = allNavButtons.find(btn => 
      btn.textContent.includes("Events") && btn.classList.contains("nav-btn")
    );
    fireEvent.click(eventsNavBtn);
    
    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  test("renders building logo icon", () => {
    const logoSection = screen.getByText("Planner Home").closest('.vendor-logo');
    const logoIcon = logoSection.querySelector('.lucide-building2');
    expect(logoIcon).toBeInTheDocument();
  });

  test("renders home button with arrow icon", () => {
    const homeButton = screen.getByText("Home").closest('.home-btn');
    const arrowIcon = homeButton.querySelector('.lucide-arrow-left');
    expect(arrowIcon).toBeInTheDocument();
  });

  test("default case in renderCurrentPage returns dashboard", () => {
    expect(screen.getByTestId("planner-dashboard")).toBeInTheDocument();
  });

  test("all navigation items have correct structure", () => {
    const allNavButtons = screen.getAllByRole("button").filter(btn => 
      btn.classList.contains("nav-btn")
    );
    
    expect(allNavButtons).toHaveLength(6);
    
    allNavButtons.forEach(button => {
      const svg = button.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(button.textContent.trim().length).toBeGreaterThan(0);
    });
  });

  test("CSS classes are applied correctly", () => {
    expect(screen.getByRole("main")).toHaveClass("vendor-main");
    expect(screen.getByRole("navigation")).toHaveClass("vendor-navbar");
    
    const appContainer = document.querySelector('.vendor-app');
    expect(appContainer).toBeInTheDocument();
  });

  test("selectedEvent state is initialized as null", () => {
    // This tests the initial state - we can verify by checking initial render
    expect(screen.getByTestId("planner-dashboard")).toBeInTheDocument();
  });

  test("renderPlaceholderPage function creates correct structure", () => {
    const allNavButtons = screen.getAllByRole("button");
    const documentsNavButton = allNavButtons.find(btn => 
      btn.textContent.includes("Documents") && btn.classList.contains("nav-btn")
    );
    fireEvent.click(documentsNavButton);
    
    // Test placeholder structure
    expect(screen.getByText("Document Management")).toBeInTheDocument();
    expect(screen.getByText("This page is coming soon. All the functionality will be built here.")).toBeInTheDocument();
    expect(screen.getByText("Back to Dashboard")).toBeInTheDocument();
    
    // Test placeholder classes
    const placeholderPage = document.querySelector('.placeholder-page');
    expect(placeholderPage).toBeInTheDocument();
    
    const placeholderContent = document.querySelector('.placeholder-content');
    expect(placeholderContent).toBeInTheDocument();
    
    const placeholderIcon = document.querySelector('.placeholder-icon');
    expect(placeholderIcon).toBeInTheDocument();
  });

  test("switch statement covers all cases", () => {
    // Test each switch case by navigating to each page
    const testCases = [
      { navText: "Dashboard", expectedTestId: "planner-dashboard" },
      { navText: "Events", expectedTestId: "planner-all-events" },
      { navText: "Vendor Marketplace", expectedTestId: "planner-vendor-marketplace" },
      { navText: "Guest Management", expectedHeading: "Guest Management" },
      { navText: "Floorplan", expectedHeading: "Floorplan View" },
      { navText: "Documents", expectedHeading: "Document Management" },
    ];

    testCases.forEach(({ navText, expectedTestId, expectedHeading }) => {
      // Navigate to each page
      const allNavButtons = screen.getAllByRole("button");
      const navButton = allNavButtons.find(btn => 
        btn.textContent.includes(navText) && btn.classList.contains("nav-btn")
      );
      fireEvent.click(navButton);
      
      if (expectedTestId) {
        expect(screen.getByTestId(expectedTestId)).toBeInTheDocument();
      } else if (expectedHeading) {
        expect(screen.getByRole("heading", { name: expectedHeading })).toBeInTheDocument();
      }
    });
  });
});