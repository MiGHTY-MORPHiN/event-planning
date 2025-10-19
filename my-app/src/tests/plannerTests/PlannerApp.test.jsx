import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, beforeEach, vi, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import PlannerApp from "../../pages/planner/PlannerApp";

// Simple mocks for all child components
vi.mock("../../pages/planner/PlannerDashboard", () => ({
  default: () => <div data-testid="planner-dashboard">Planner Dashboard</div>
}));

vi.mock("../../pages/planner/PlannerVendorMarketplace", () => ({
  default: () => <div data-testid="vendor-marketplace">Vendor Marketplace</div>
}));

vi.mock("../../pages/planner/PlannerViewEvent", () => ({
  default: () => <div data-testid="view-event">View Event</div>
}));

vi.mock("../../pages/planner/PlannerCalendar", () => ({
  default: () => <div data-testid="planner-calendar">Calendar</div>
}));

vi.mock("../../pages/planner/Floorplan/PlannerFloorPlan", () => ({
  default: () => <div data-testid="floorplan">Floorplan</div>
}));

vi.mock("../../pages/planner/PlannerContract", () => ({
  default: () => <div data-testid="documents">Documents</div>
}));

vi.mock("../../pages/planner/PlannerReview", () => ({
  default: () => <div data-testid="reviews">Reviews</div>
}));

// Mock Lucide icons
vi.mock("lucide-react", () => ({
  Users: () => <span>USERS</span>,
  Calendar: () => <span>CALENDAR</span>,
  MapPin: () => <span>MAPPIN</span>,
  FileText: () => <span>FILETEXT</span>,
  ArrowLeft: () => <span>ARROWLEFT</span>,
  Building2: () => <span>BUILDING2</span>,
  BarChart3: () => <span>BARCHART3</span>,
}));

// Create a mock navigate function
const mockNavigate = vi.fn();

// Mock react-router-dom
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
};

beforeAll(() => {
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
    writable: true,
  });
});

describe("PlannerApp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    mockNavigate.mockClear();
  });

  const renderPlannerApp = () => {
    return render(
      <MemoryRouter>
        <PlannerApp />
      </MemoryRouter>
    );
  };

  it("renders the planner app with navigation", () => {
    renderPlannerApp();

    expect(screen.getByText("PlannerHub")).toBeInTheDocument();
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Events")).toBeInTheDocument();
    expect(screen.getByText("Vendor Marketplace")).toBeInTheDocument();
    expect(screen.getByText("Floorplan")).toBeInTheDocument();
    expect(screen.getByText("Reviews")).toBeInTheDocument();
    expect(screen.getByText("Documents")).toBeInTheDocument();
  });

  it("renders dashboard by default", () => {
    renderPlannerApp();

    expect(screen.getByTestId("planner-dashboard")).toBeInTheDocument();
    expect(screen.getByText("Planner Dashboard")).toBeInTheDocument();
  });

  it("renders dashboard when localStorage has dashboard as active page", () => {
    localStorageMock.getItem.mockReturnValue("dashboard");
    renderPlannerApp();

    expect(screen.getByTestId("planner-dashboard")).toBeInTheDocument();
  });

  it("navigates to home when home button is clicked", () => {
    renderPlannerApp();

    const homeButton = screen.getByText("Home").closest("button");
    fireEvent.click(homeButton);
    
    expect(mockNavigate).toHaveBeenCalledWith("/home");
  });

  it("switches to reviews when clicking reviews nav button", () => {
    renderPlannerApp();

    fireEvent.click(screen.getByText("Reviews"));
    
    expect(screen.getByTestId("reviews")).toBeInTheDocument();
  });

  it("switches to vendor marketplace when clicking vendor nav button", () => {
    renderPlannerApp();

    fireEvent.click(screen.getByText("Vendor Marketplace"));
    
    expect(screen.getByTestId("vendor-marketplace")).toBeInTheDocument();
  });

  it("switches to events/calendar when clicking events nav button", () => {
    renderPlannerApp();

    fireEvent.click(screen.getByText("Events"));
    
    expect(screen.getByTestId("planner-calendar")).toBeInTheDocument();
  });

  it("switches to floorplan when clicking floorplan nav button", () => {
    renderPlannerApp();

    fireEvent.click(screen.getByText("Floorplan"));
    
    expect(screen.getByTestId("floorplan")).toBeInTheDocument();
  });

  it("switches to documents when clicking documents nav button", () => {
    renderPlannerApp();

    fireEvent.click(screen.getByText("Documents"));
    
    expect(screen.getByTestId("documents")).toBeInTheDocument();
  });
});