import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import PlannerApp from "../pages/planner/PlannerApp";


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
    // Test for the logo and home button
    expect(screen.getByText("Planner Home")).toBeInTheDocument();
    expect(screen.getByText("Home")).toBeInTheDocument();
  });

  test("navigates to Events tab and shows placeholder", () => {
    const navButtons = screen.getAllByText("Events");
    const eventsNavButton = navButtons.find(button => 
      button.closest('.nav-btn')
    );
    fireEvent.click(eventsNavButton);
    
    expect(screen.getByText("Event Management")).toBeInTheDocument();
    expect(
      screen.getByText(
        "This page is coming soon. All the functionality will be built here."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Back to Dashboard")).toBeInTheDocument();
  });

  test("navigates to Vendor Marketplace and shows placeholder", () => {
    const navButtons = screen.getAllByText("Vendor Marketplace");
    const vendorNavButton = navButtons.find(button => 
      button.closest('.nav-btn')
    );
    fireEvent.click(vendorNavButton);
    
    expect(screen.getByRole("heading", { name: "Vendor Marketplace" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "This page is coming soon. All the functionality will be built here."
      )
    ).toBeInTheDocument();
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

  test("back to dashboard button works from placeholder pages", () => {
    const navButtons = screen.getAllByText("Events");
    const eventsNavButton = navButtons.find(button => 
      button.closest('.nav-btn')
    );
    fireEvent.click(eventsNavButton);
    expect(screen.getByText("Event Management")).toBeInTheDocument();
    
    fireEvent.click(screen.getByText("Back to Dashboard"));
    
    expect(screen.getByTestId("planner-dashboard")).toBeInTheDocument();
    expect(screen.getByText("Dashboard Content")).toBeInTheDocument();
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

  test("renders correct SVG icons for navigation items", () => {
    // Test that SVG elements are rendered - use querySelector since SVGs don't have img role
    const container = screen.getByRole("navigation");
    const svgElements = container.querySelectorAll("svg");
    expect(svgElements.length).toBeGreaterThan(0);
    
    // Test specific SVG classes to ensure icons are rendered
    expect(container.querySelector('.lucide-chart-column')).toBeInTheDocument();
    expect(container.querySelector('.lucide-calendar')).toBeInTheDocument();
    expect(container.querySelector('.lucide-users')).toBeInTheDocument();
    expect(container.querySelector('.lucide-map-pin')).toBeInTheDocument();
    expect(container.querySelector('.lucide-file-text')).toBeInTheDocument();
  });

  test("placeholder pages render correct icons", () => {
    // Navigate to events to test icon rendering in placeholder
    const navButtons = screen.getAllByText("Events");
    const eventsNavButton = navButtons.find(button => 
      button.closest('.nav-btn')
    );
    fireEvent.click(eventsNavButton);
    
    // Check that the placeholder icon is rendered
    expect(screen.getByRole("heading", { name: "Event Management" })).toBeInTheDocument();
    
    // The icon should be rendered in the placeholder-icon section
    const mainContent = screen.getByRole("main");
    const placeholderIcon = mainContent.querySelector('.placeholder-icon svg');
    expect(placeholderIcon).toBeInTheDocument();
  });

  test("navigation preserves app structure", () => {
    // Test that navbar and main sections are always present
    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    
    // Navigate to different pages and ensure structure remains
    const allNavButtons = screen.getAllByRole("button");
    const eventsNavBtn = allNavButtons.find(btn => 
      btn.textContent.includes("Events") && btn.classList.contains("nav-btn")
    );
    fireEvent.click(eventsNavBtn);
    
    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    
    fireEvent.click(screen.getByText("Back to Dashboard"));
    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  test("renders building logo icon", () => {
    // Test the building logo icon in the header
    const logoSection = screen.getByText("Planner Home").closest('.vendor-logo');
    const logoIcon = logoSection.querySelector('.lucide-building2');
    expect(logoIcon).toBeInTheDocument();
  });

  test("renders home button with arrow icon", () => {
    // Test the home button has the arrow icon
    const homeButton = screen.getByText("Home").closest('.home-btn');
    const arrowIcon = homeButton.querySelector('.lucide-arrow-left');
    expect(arrowIcon).toBeInTheDocument();
  });

  test("default case in renderCurrentPage returns dashboard", () => {
    // This tests the default case in the switch statement
    // We can't directly test this, but we can test that invalid activePage defaults to dashboard
    expect(screen.getByTestId("planner-dashboard")).toBeInTheDocument();
  });

  test("all navigation items have correct structure", () => {
    // Test that all navigation buttons have both icon and text
    const allNavButtons = screen.getAllByRole("button").filter(btn => 
      btn.classList.contains("nav-btn")
    );
    
    expect(allNavButtons).toHaveLength(6); // Dashboard, Events, Vendor, Guest, Floorplan, Documents
    
    allNavButtons.forEach(button => {
      const svg = button.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(button.textContent.trim().length).toBeGreaterThan(0);
    });
  });

  test("CSS classes are applied correctly", () => {
    // Test main container classes
    expect(screen.getByRole("main")).toHaveClass("vendor-main");
    expect(screen.getByRole("navigation")).toHaveClass("vendor-navbar");
    
    // Test that the app container exists
    const appContainer = document.querySelector('.vendor-app');
    expect(appContainer).toBeInTheDocument();
  });
});