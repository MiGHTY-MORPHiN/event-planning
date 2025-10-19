import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, beforeEach, afterEach, vi, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";

// Mocks
const mockVendor = {
  id: "vendor1",
  businessName: "Test Catering",
  category: "Catering",
  profilePic: "test.jpg",
  rating: 4.5,
  location: "Test City",
  description: "Test description",
  phone: "123-456-7890",
  email: "test@catering.com",
  services: [
    {
      serviceName: "Basic Package",
      cost: 1000,
      chargeByHour: 0,
      chargePerPerson: 100,
      chargePerSquareMeter: 0,
      extraNotes: "Test notes"
    },
    {
      serviceName: "Premium Package",
      cost: 2000,
      chargeByHour: 200,
      chargePerPerson: 0,
      chargePerSquareMeter: 0
    }
  ]
};

// Mock child components
vi.mock("../InformationToolTip", () => ({
  default: ({ children, content, top, left, minWidth }) => (
    <div data-testid="info-tooltip" data-content={content}>
      {children}
    </div>
  )
}));

vi.mock("../VendorHighlightDisplay", () => ({
  default: ({ vendorId }) => (
    <div data-testid="vendor-highlights">Highlights for {vendorId}</div>
  )
}));

// Mock Lucide icons
vi.mock("lucide-react", () => ({
  X: () => <span data-testid="x-icon">X</span>,
  MapPin: () => <span data-testid="map-pin-icon">"MAPPIN"</span>,
  Phone: () => <span data-testid="phone-icon">"PHONE</span>,
  Mail: () => <span data-testid="mail-icon">"MAIL"</span>,
  Star: () => <span data-testid="star-icon">"STAR'</span>,
  Clock: () => <span data-testid="clock-icon">"CLOCK"</span>,
  Users: () => <span data-testid="users-icon">"USERS"</span>,
  Ruler: () => <span data-testid="ruler-icon">"RULER"</span>
}));

// Import after mocks
import VendorModal from "../../pages/planner/MarketPlaceComponents/VendorDetails";

describe("VendorModal", () => {
  const mockOnClose = vi.fn();
  const mockAddService = vi.fn();
  const mockOnContactVendor = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders vendor information correctly", () => {
    render(
      <VendorModal
        vendor={mockVendor}
        onClose={mockOnClose}
        addService={mockAddService}
        onContactVendor={mockOnContactVendor}
      />
    );

    expect(screen.getByText("Test Catering")).toBeInTheDocument();
    expect(screen.getByText("Catering")).toBeInTheDocument();
    expect(screen.getByText("4.5")).toBeInTheDocument();
    expect(screen.getByText("Test City")).toBeInTheDocument();
    expect(screen.getByAltText("Test Catering")).toHaveAttribute("src", "test.jpg");
  });

  it("calls onClose when close button is clicked", () => {
    render(
      <VendorModal
        vendor={mockVendor}
        onClose={mockOnClose}
        addService={mockAddService}
        onContactVendor={mockOnContactVendor}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("switches between tabs correctly", () => {
    render(
      <VendorModal
        vendor={mockVendor}
        onClose={mockOnClose}
        addService={mockAddService}
        onContactVendor={mockOnContactVendor}
      />
    );

    // Default to overview tab
    expect(screen.getByText("About Test Catering")).toBeInTheDocument();
    expect(screen.getByText("Test description")).toBeInTheDocument();

    // Switch to services tab
    fireEvent.click(screen.getByText("Services (2)"));
    expect(screen.getByText("Basic Package")).toBeInTheDocument();
    expect(screen.getByText("Premium Package")).toBeInTheDocument();

    // Switch to highlights tab
    fireEvent.click(screen.getByText("Highlights"));
    expect(screen.getByTestId("vendor-highlights")).toBeInTheDocument();
  });

  it("displays contact information correctly", () => {
    render(
      <VendorModal
        vendor={mockVendor}
        onClose={mockOnClose}
        addService={mockAddService}
        onContactVendor={mockOnContactVendor}
      />
    );

    expect(screen.getByText("123-456-7890")).toBeInTheDocument();
    expect(screen.getByText("test@catering.com")).toBeInTheDocument();
  });

  it("formats charge types correctly", () => {
    render(
      <VendorModal
        vendor={mockVendor}
        onClose={mockOnClose}
        addService={mockAddService}
        onContactVendor={mockOnContactVendor}
      />
    );

    // Switch to services tab to see the formatted charges
    fireEvent.click(screen.getByText("Services (2)"));

    expect(screen.getByText("Per Person")).toBeInTheDocument();
    expect(screen.getByText("Per Hour")).toBeInTheDocument();
  });

  it("displays service prices correctly", () => {
    render(
      <VendorModal
        vendor={mockVendor}
        onClose={mockOnClose}
        addService={mockAddService}
        onContactVendor={mockOnContactVendor}
      />
    );

    fireEvent.click(screen.getByText("Services (2)"));

    expect(screen.getByText("R 100")).toBeInTheDocument(); // Per person price
    expect(screen.getByText("R 2000")).toBeInTheDocument(); // Fixed rate price
  });

  it("calls addService when Track Service button is clicked", () => {
    render(
      <VendorModal
        vendor={mockVendor}
        onClose={mockOnClose}
        addService={mockAddService}
        onContactVendor={mockOnContactVendor}
      />
    );

    fireEvent.click(screen.getByText("Services (2)"));
    fireEvent.click(screen.getAllByText("Track Service")[0]);

    expect(mockAddService).toHaveBeenCalledWith(mockVendor, mockVendor.services[0]);
  });

  it("calls onContactVendor when Contact Vendor button is clicked", () => {
    render(
      <VendorModal
        vendor={mockVendor}
        onClose={mockOnClose}
        addService={mockAddService}
        onContactVendor={mockOnContactVendor}
      />
    );

    fireEvent.click(screen.getByText("Contact Vendor"));
    expect(mockOnContactVendor).toHaveBeenCalledWith(mockVendor);
  });

  it("displays service summary in overview tab", () => {
    render(
      <VendorModal
        vendor={mockVendor}
        onClose={mockOnClose}
        addService={mockAddService}
        onContactVendor={mockOnContactVendor}
      />
    );

    expect(screen.getByText("Offers 2 services including:")).toBeInTheDocument();
    expect(screen.getByText("Basic Package - R 100 Per Person")).toBeInTheDocument();
    expect(screen.getByText("Premium Package - R 2000 Per Hour")).toBeInTheDocument();
  });

  it("handles vendor without services", () => {
    const vendorWithoutServices = { ...mockVendor, services: [] };
    
    render(
      <VendorModal
        vendor={vendorWithoutServices}
        onClose={mockOnClose}
        addService={mockAddService}
        onContactVendor={mockOnContactVendor}
      />
    );

    expect(screen.getByText("Services (0)")).toBeInTheDocument();
    
    fireEvent.click(screen.getByText("Services (0)"));
    expect(screen.queryByText("Track Service")).not.toBeInTheDocument();
  });

  it("displays extra notes for services when available", () => {
    render(
      <VendorModal
        vendor={mockVendor}
        onClose={mockOnClose}
        addService={mockAddService}
        onContactVendor={mockOnContactVendor}
      />
    );

    fireEvent.click(screen.getByText("Services (2)"));
    expect(screen.getByText("Test notes")).toBeInTheDocument();
  });
});