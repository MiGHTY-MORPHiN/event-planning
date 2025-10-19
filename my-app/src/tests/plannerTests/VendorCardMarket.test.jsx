import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, beforeEach, vi, expect } from "vitest";

// Mock Lucide icons
vi.mock("lucide-react", () => ({
  MapPin: () => <span data-testid="map-pin-icon">"MAPPIN"</span>
}));


// Import after mocks
import VendorCard from "../../pages/planner/MarketPlaceComponents/VendorCardMarket";

describe("VendorCardMarket", () => {
  const mockVendor = {
    id: "vendor1",
    businessName: "Test Catering",
    category: "Catering",
    profilePic: "test.jpg",
    location: "Test City",
    description: "Test description for catering services",
    services: [
      {
        serviceName: "Basic Package",
        cost: 1000,
        chargeByHour: 0,
        chargePerPerson: 100,
        chargePerSquareMeter: 0
      },
      {
        serviceName: "Premium Package",
        cost: 2000,
        chargeByHour: 200,
        chargePerPerson: 0,
        chargePerSquareMeter: 0
      },
      {
        serviceName: "Deluxe Package",
        cost: 3000,
        chargeByHour: 0,
        chargePerPerson: 0,
        chargePerSquareMeter: 50
      },
      {
        serviceName: "Custom Package",
        cost: 4000,
        chargeByHour: 0,
        chargePerPerson: 0,
        chargePerSquareMeter: 0
      }
    ]
  };

  const mockOnViewMore = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders vendor information correctly", () => {
    render(<VendorCard vendor={mockVendor} onViewMore={mockOnViewMore} />);

    expect(screen.getByText("Test Catering")).toBeInTheDocument();
    expect(screen.getByText("Catering")).toBeInTheDocument();
    expect(screen.getByText("Test City")).toBeInTheDocument();
    expect(screen.getByAltText("Test Catering")).toHaveAttribute("src", "test.jpg");
  });

  it("calculates and displays price range correctly", () => {
    render(<VendorCard vendor={mockVendor} onViewMore={mockOnViewMore} />);

    // Should show range from lowest (100) to highest (4000)
    expect(screen.getByText("R 50 - R 4000")).toBeInTheDocument();
  });

  it("displays top 3 services", () => {
    render(<VendorCard vendor={mockVendor} onViewMore={mockOnViewMore} />);

    expect(screen.getByText("Basic Package")).toBeInTheDocument();
    expect(screen.getByText("Premium Package")).toBeInTheDocument();
    expect(screen.getByText("Deluxe Package")).toBeInTheDocument();
    expect(screen.queryByText("Custom Package")).not.toBeInTheDocument(); // Should be hidden
  });

  it("shows correct service pricing types", () => {
    render(<VendorCard vendor={mockVendor} onViewMore={mockOnViewMore} />);

    expect(screen.getByText("Per person")).toBeInTheDocument();
    expect(screen.getByText("Per hour")).toBeInTheDocument();
    expect(screen.getByText("Per m²")).toBeInTheDocument();
  });

  it("displays 'more services' count when vendor has more than 3 services", () => {
    render(<VendorCard vendor={mockVendor} onViewMore={mockOnViewMore} />);

    expect(screen.getByText("+1 more services")).toBeInTheDocument();
  });

  it("calls onViewMore when View Details button is clicked", () => {
    render(<VendorCard vendor={mockVendor} onViewMore={mockOnViewMore} />);

    fireEvent.click(screen.getByText("View Details"));
    expect(mockOnViewMore).toHaveBeenCalledWith(mockVendor);
  });

  it("handles vendor without services", () => {
    const vendorWithoutServices = { ...mockVendor, services: [] };
    
    render(<VendorCard vendor={vendorWithoutServices} onViewMore={mockOnViewMore} />);

    expect(screen.getByText("No services listed yet")).toBeInTheDocument();
    expect(screen.getByText("No Services")).toBeInTheDocument();
  });

  it("handles vendor with single service", () => {
    const vendorWithOneService = { 
      ...mockVendor, 
      services: [mockVendor.services[0]] 
    };
    
    render(<VendorCard vendor={vendorWithOneService} onViewMore={mockOnViewMore} />);

    expect(screen.getByText("R 100")).toBeInTheDocument(); // Single price, not range
    expect(screen.queryByText("more services")).not.toBeInTheDocument();
  });

  it("uses placeholder image when profilePic is not provided", () => {
    const vendorWithoutImage = { ...mockVendor, profilePic: null };
    
    render(<VendorCard vendor={vendorWithoutImage} onViewMore={mockOnViewMore} />);

    expect(screen.getByAltText("Test Catering")).toHaveAttribute("src", "/src/assets/elementor-placeholder-image.png");
  });

  it("displays vendor description preview", () => {
    render(<VendorCard vendor={mockVendor} onViewMore={mockOnViewMore} />);

    expect(screen.getByText("Test description for catering services")).toBeInTheDocument();
  });

  it("handles vendor with only fixed rate services", () => {
    const fixedRateVendor = {
      ...mockVendor,
      services: [
        {
          serviceName: "Fixed Service",
          cost: 1500,
          chargeByHour: 0,
          chargePerPerson: 0,
          chargePerSquareMeter: 0
        }
      ]
    };
    
    render(<VendorCard vendor={fixedRateVendor} onViewMore={mockOnViewMore} />);

    expect(screen.getByText("R 1500")).toBeInTheDocument();
    expect(screen.getByText("Fixed rate")).toBeInTheDocument();
  });
});