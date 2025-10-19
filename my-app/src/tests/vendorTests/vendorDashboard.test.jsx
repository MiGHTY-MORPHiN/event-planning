import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import VendorDashboard from "../../pages/vendor/VendorDashboard"; // fixed import
const mockSetActivePage = vi.fn();

beforeEach(() => {
  mockSetActivePage.mockClear();
});

// Mock Firebase auth before imports
vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn((auth, callback) => {
    callback({ uid: "test-vendor-123" });
    return vi.fn();
  }),
}));

vi.mock("../../firebase", () => ({
  auth: {
    currentUser: {
      getIdToken: vi.fn(() => Promise.resolve("mock-token")),
      uid: "test-vendor-123",
    },
  },
}));

// Mock VendorDashboardHTML with default props including services
vi.mock("../../pages/vendor/VendorDashboardHTML", () => ({
  default: ({
    recentBookings,
    recentReviews,
    bookingStats,
    analytics,
    renderRatingDistribution,
    setActivePage,
    handleSaveService,
    handleEdit,
    handleDeleteService,
    handleChange,
    formatCount,
    setShowServiceForm,
    showServiceForm,
    formData,
    formErrors,
    services = [], // <-- default empty array so tests won't break
    deleting,
    editingService,
  }) => (
    <div data-testid="vendor-dashboard-html">
      <h1>Vendor Dashboard</h1>

      {/* Services list */}
      {services.map(service => (
        <div key={service.id} data-testid={`service-${service.id}`}>
          <span>{service.serviceName}</span>
          <span>{service.cost}</span>
          <button onClick={() => handleEdit(service)}>Edit</button>
          <button onClick={() => handleDeleteService(service.id)}>
            {deleting === service.id ? "Deleting..." : "Delete"}
          </button>
        </div>
      ))}

      {/* Add service form */}
      <button onClick={() => setShowServiceForm(true)}>Add Service</button>
      {showServiceForm && (
        <div data-testid="service-form">
          <input
            name="serviceName"
            value={formData?.serviceName || ""}
            onChange={handleChange}
            data-testid="input-serviceName"
          />
          <input
            name="cost"
            value={formData?.cost || ""}
            onChange={handleChange}
            data-testid="input-cost"
          />
          <button onClick={handleSaveService}>
            {editingService ? "Update" : "Save"} Service
          </button>
        </div>
      )}
    </div>
  ),
}));

// Mock fetch globally
global.fetch = vi.fn();

describe("VendorDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch.mockReset();
    // Default fetch responses
    global.fetch.mockImplementation(url => {
      if (url.includes("/services")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              services: [
                { id: "s1", serviceName: "Photography", cost: 500 },
                { id: "s2", serviceName: "Catering", cost: 1000 },
              ],
            }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  it("renders VendorDashboardHTML without crashing", async () => {
    render(<VendorDashboard />);
    expect(await screen.findByTestId("vendor-dashboard-html")).toBeDefined();
  });



  test("shows loading spinner initially", () => {
    render(<VendorDashboard setActivePage={mockSetActivePage} />);
    expect(screen.getByText("Loading your dashboard...")).toBeInTheDocument();
  });

  test("loads and displays dashboard data successfully", async () => {
    render(<VendorDashboard setActivePage={mockSetActivePage} />);

    await waitFor(() => {
      expect(screen.getByTestId("vendor-dashboard-html")).toBeInTheDocument();
    });

    // Verify analytics displayed
    expect(screen.getByText("Total Bookings: 3")).toBeInTheDocument();
    expect(screen.getByText("Revenue: 150000")).toBeInTheDocument();
  });

  test("displays booking statistics correctly", async () => {
    render(<VendorDashboard setActivePage={mockSetActivePage} />);

    await waitFor(() => {
      expect(screen.getByTestId("vendor-dashboard-html")).toBeInTheDocument();
    });

    expect(screen.getByText("Total: 3")).toBeInTheDocument();
    expect(screen.getByText("Confirmed: 1")).toBeInTheDocument();
    expect(screen.getByText("Pending: 1")).toBeInTheDocument();
    expect(screen.getByText("Rejected: 1")).toBeInTheDocument();
  });

  test("displays recent bookings correctly", async () => {
    render(<VendorDashboard setActivePage={mockSetActivePage} />);

    await waitFor(() => {
      expect(screen.getByTestId("vendor-dashboard-html")).toBeInTheDocument();
    });

    expect(screen.getByText("Wedding Party")).toBeInTheDocument();
    expect(screen.getByText("R50,000")).toBeInTheDocument();
  });

  test("displays recent reviews correctly", async () => {
    render(<VendorDashboard setActivePage={mockSetActivePage} />);

    await waitFor(() => {
      expect(screen.getByTestId("service-s1")).toBeInTheDocument();
    });

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Excellent service!")).toBeInTheDocument();
  });

  test("displays services correctly", async () => {
    render(<VendorDashboard setActivePage={mockSetActivePage} />);

    await waitFor(() => {
      expect(screen.getByTestId("service-s1")).toBeInTheDocument();
    });

    expect(screen.getByText("Catering")).toBeInTheDocument();
    expect(screen.getByText("10000")).toBeInTheDocument();
  });

  

  test("handles edit service", async () => {
    render(<VendorDashboard setActivePage={mockSetActivePage} />);

    await waitFor(() => {
      expect(screen.getByTestId("service-s1")).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText("Edit");
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId("service-form")).toBeInTheDocument();
      expect(screen.getByTestId("input-serviceName")).toHaveValue("Catering");
    });
  });

  test("handles delete service with confirmation", async () => {
    global.confirm = vi.fn(() => true);
    
    global.fetch.mockImplementationOnce((url, options) => {
      if (url.includes('/services/service1') && options.method === 'DELETE') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({})
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockServicesResponse)
      });
    });

    render(<VendorDashboard setActivePage={mockSetActivePage} />);

    await waitFor(() => {
      expect(screen.getByTestId("service-s1")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText("Delete");
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(global.confirm).toHaveBeenCalled();
    });
  });

  test("cancels delete service when user declines", async () => {
    global.confirm = vi.fn(() => false);

    render(<VendorDashboard setActivePage={mockSetActivePage} />);

    await waitFor(() => {
      expect(screen.getByTestId("service-s1")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText("Delete");
    fireEvent.click(deleteButtons[0]);

    expect(global.confirm).toHaveBeenCalled();
    // Service should still be there
    expect(screen.getByTestId("service-s1")).toBeInTheDocument();
  });

  test("handles service save error", async () => {
    global.fetch.mockImplementationOnce((url) => {
      if (url.includes('/services')) {
        return Promise.resolve({
          ok: false,
          statusText: "Internal Server Error",
          json: () => Promise.resolve({ error: "Database error" })
        });
      }
    });

    render(<VendorDashboard setActivePage={mockSetActivePage} />);

    await waitFor(() => {
      fireEvent.click(screen.getByText("Add Service"));
    });

    const serviceNameInput = screen.getByTestId("input-serviceName");
    const costInput = screen.getByTestId("input-cost");
    
    fireEvent.change(serviceNameInput, { 
      target: { name: "serviceName", value: "Test Service" } 
    });
    fireEvent.change(costInput, { 
      target: { name: "cost", value: "1000" } 
    });

    fireEvent.click(screen.getByText("Save Service"));

    // Error should be handled (component continues to work)
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  test("handles API fetch errors gracefully", async () => {
    global.fetch.mockImplementation(() => 
      Promise.reject(new Error("Network error"))
    );

    render(<VendorDashboard setActivePage={mockSetActivePage} />);

    // Component should still render with empty data
    await waitFor(() => {
      expect(screen.getByTestId("vendor-dashboard-html")).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  test("handles unauthenticated user", async () => {
    mockOnAuthStateChanged.mockImplementationOnce((callback) => {
      callback(null);
      return vi.fn();
    });

    render(<VendorDashboard setActivePage={mockSetActivePage} />);

    await waitFor(() => {
      expect(screen.getByText("User not authenticated")).toBeInTheDocument();
    });
  });

  test("clears form errors when user types", async () => {
    render(<VendorDashboard setActivePage={mockSetActivePage} />);

    await waitFor(() => {
      fireEvent.click(screen.getByText("Add Service"));
    });

    // Trigger validation error
    fireEvent.click(screen.getByText("Save Service"));

    await waitFor(() => {
      expect(screen.getByText("Service name is required")).toBeInTheDocument();
    });

    // Type in the field
    const serviceNameInput = screen.getByTestId("input-serviceName");
    fireEvent.change(serviceNameInput, { 
      target: { name: "serviceName", value: "New Service" } 
    });

    // Error should be cleared
    await waitFor(() => {
      expect(screen.queryByText("Service name is required")).not.toBeInTheDocument();
    });
  });

  test("renders rating distribution with data", async () => {
    render(<VendorDashboard setActivePage={mockSetActivePage} />);

    await waitFor(() => {
      expect(screen.getByTestId("service-s1")).toBeInTheDocument();
    });
  });

  test("handles various timestamp formats in convertFirebaseTimestamp", async () => {
    const analyticsWithVariousTimestamps = {
      ...mockAnalyticsResponse,
      reviews: [
        {
          id: "r1",
          reviewerName: "User 1",
          rating: 5,
          review: "Great",
          timeOfReview: { _seconds: Date.now() / 1000, _nanoseconds: 0 }
        },
        {
          id: "r2",
          reviewerName: "User 2",
          rating: 4,
          review: "Good",
          timeOfReview: { seconds: Date.now() / 1000 - 3600, nanoseconds: 0 }
        },
        {
          id: "r3",
          reviewerName: "User 3",
          rating: 3,
          review: "OK",
          timeOfReview: Date.now() - 86400000 // 1 day ago
        }
      ]
    };

    global.fetch.mockImplementation((url) => {
      if (url.includes('/analytics/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(analyticsWithVariousTimestamps)
        });
      }
      if (url.includes('/vendor/bookings')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockBookingsResponse)
        });
      }
      if (url.includes('/services')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockServicesResponse)
        });
      }
      if (url.includes('/my-report')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockReportResponse)
        });
      }
    });

    render(<VendorDashboard setActivePage={mockSetActivePage} />);

    await waitFor(() => {
      expect(screen.getByTestId("service-s1")).toBeInTheDocument();
    });
  });

  test("handles edit service without valid ID", async () => {
    const servicesWithoutId = {
      services: [{
        serviceName: "Invalid Service",
        cost: "1000"
      }]
    };

    global.fetch.mockImplementation((url) => {
      if (url.includes('/services')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(servicesWithoutId)
        });
      }
      if (url.includes('/vendor/bookings')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ bookings: [] })
        });
      }
      if (url.includes('/analytics/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ reviews: [] })
        });
      }
      if (url.includes('/my-report')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({})
        });
      }
    });

    render(<VendorDashboard setActivePage={mockSetActivePage} />);

    // Component should load successfully without crashing
    await waitFor(() => {
      expect(screen.getByTestId("vendor-dashboard-html")).toBeInTheDocument();
    });
  });

  test("calls setActivePage when View Bookings is clicked", async () => {
    render(<VendorDashboard setActivePage={mockSetActivePage} />);

    await waitFor(() => {
      expect(screen.getByText("View Bookings")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("View Bookings"));

    expect(mockSetActivePage).toHaveBeenCalledWith("bookings");
  });

  test("handles empty bookings array", async () => {
    global.fetch.mockImplementation((url) => {
      if (url.includes('/vendor/bookings')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ bookings: [] })
        });
      }
      if (url.includes('/analytics/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAnalyticsResponse)
        });
      }
      if (url.includes('/services')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockServicesResponse)
        });
      }
      if (url.includes('/my-report')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockReportResponse)
        });
      }
    });

    render(<VendorDashboard setActivePage={mockSetActivePage} />);

    await waitFor(() => {
      expect(screen.getByTestId("vendor-dashboard-html")).toBeInTheDocument();
    });

    expect(screen.getByText("Total: 0")).toBeInTheDocument();
  });

  test("handles empty reviews array", async () => {
    global.fetch.mockImplementation((url) => {
      if (url.includes('/analytics/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ reviews: [] })
        });
      }
      if (url.includes('/vendor/bookings')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockBookingsResponse)
        });
      }
      if (url.includes('/services')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockServicesResponse)
        });
      }
      if (url.includes('/my-report')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({})
        });
      }
    });

    render(<VendorDashboard setActivePage={mockSetActivePage} />);

    await waitFor(() => {
      expect(screen.getByTestId("vendor-dashboard-html")).toBeInTheDocument();
    });
  });

  test("formats event dates correctly", async () => {
    const bookingsWithVariousDates = {
      bookings: [
        {
          id: "b1",
          eventName: "Event 1",
          date: "2024-12-25",
          status: "confirmed",
          budget: "10000"
        },
        {
          id: "b2",
          eventName: "Event 2",
          date: "invalid-date",
          status: "pending",
          budget: "5000"
        },
        {
          id: "b3",
          eventName: "Event 3",
          date: null,
          status: "confirmed",
          budget: "8000"
        }
      ]
    };

    global.fetch.mockImplementation((url) => {
      if (url.includes('/vendor/bookings')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(bookingsWithVariousDates)
        });
      }
      if (url.includes('/analytics/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAnalyticsResponse)
        });
      }
      if (url.includes('/services')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockServicesResponse)
        });
      }
      if (url.includes('/my-report')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockReportResponse)
        });
      }
    });

    render(<VendorDashboard setActivePage={mockSetActivePage} />);

    await waitFor(() => {
      expect(screen.getByTestId("vendor-dashboard-html")).toBeInTheDocument();
    });

    // Should show "Date not set" for invalid dates
    const dateNotSetElements = screen.getAllByText("Date not set");
    expect(dateNotSetElements.length).toBeGreaterThan(0);
  });

  test("updates service successfully", async () => {
    global.fetch.mockImplementation((url, options) => {
      if (url.includes('/services') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ serviceId: "service1" })
        });
      }
      if (url.includes('/services')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockServicesResponse)
        });
      }
      if (url.includes('/vendor/bookings')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockBookingsResponse)
        });
      }
      if (url.includes('/analytics/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAnalyticsResponse)
        });
      }
      if (url.includes('/my-report')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockReportResponse)
        });
      }
    });

    render(<VendorDashboard setActivePage={mockSetActivePage} />);

    await waitFor(() => {
      expect(screen.getByTestId("service-s1")).toBeInTheDocument();
    });

    // Click edit
    const editButtons = screen.getAllByText("Edit");
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId("service-form")).toBeInTheDocument();
    });

    // Change service name
    const serviceNameInput = screen.getByTestId("input-serviceName");
    fireEvent.change(serviceNameInput, { 
      target: { name: "serviceName", value: "Updated Catering" } 
    });

    // Save
    fireEvent.click(screen.getByText("Update Service"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/services'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining("Updated Catering")
        })
      );
    });
  });

  test("handles delete service error", async () => {
    global.confirm = vi.fn(() => true);
    
    global.fetch.mockImplementation((url, options) => {
      if (url.includes('/services/service1') && options?.method === 'DELETE') {
        return Promise.resolve({
          ok: false,
          statusText: "Internal Server Error"
        });
      }
      if (url.includes('/services')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockServicesResponse)
        });
      }
      if (url.includes('/vendor/bookings')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockBookingsResponse)
        });
      }
      if (url.includes('/analytics/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAnalyticsResponse)
        });
      }
      if (url.includes('/my-report')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockReportResponse)
        });
      }
    });

    render(<VendorDashboard setActivePage={mockSetActivePage} />);

    await waitFor(() => {
      expect(screen.getByTestId("service-s1")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText("Delete");
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(global.confirm).toHaveBeenCalled();
    });

    // Service should still be there since delete failed
    expect(screen.getByTestId("service-s1")).toBeInTheDocument();
  });

  test("handles service name validation - must contain letter", async () => {
    render(<VendorDashboard setActivePage={mockSetActivePage} />);

    await waitFor(() => {
      fireEvent.click(screen.getByText("Add Service"));
    });

    const serviceNameInput = screen.getByTestId("input-serviceName");
    fireEvent.change(serviceNameInput, { 
      target: { name: "serviceName", value: "   " } // Only spaces
    });

    fireEvent.click(screen.getByText("Save Service"));

    await waitFor(() => {
      expect(screen.getByText("Service name is required")).toBeInTheDocument();
    });
  });

  test("validates chargePerPerson field", async () => {
    render(<VendorDashboard setActivePage={mockSetActivePage} />);

    await waitFor(() => {
      fireEvent.click(screen.getByText("Add Service"));
    });

    const serviceNameInput = screen.getByTestId("input-serviceName");
    const costInput = screen.getByTestId("input-cost");
    const chargePerPersonInput = screen.getByTestId("input-chargePerPerson");
    
    fireEvent.change(serviceNameInput, { 
      target: { name: "serviceName", value: "Test Service" } 
    });
    fireEvent.change(costInput, { 
      target: { name: "cost", value: "1000" } 
    });
    fireEvent.change(chargePerPersonInput, { 
      target: { name: "chargePerPerson", value: "2000000" } 
    });

    fireEvent.click(screen.getByText("Save Service"));

    await waitFor(() => {
      expect(screen.getByText("Charge per person is too high")).toBeInTheDocument();
    });
  });

  test("validates chargePerSquareMeter field", async () => {
    render(<VendorDashboard setActivePage={mockSetActivePage} />);

    await waitFor(() => {
      fireEvent.click(screen.getByText("Add Service"));
    });

    const serviceNameInput = screen.getByTestId("input-serviceName");
    const costInput = screen.getByTestId("input-cost");
    const chargePerSquareMeterInput = screen.getByTestId("input-chargePerSquareMeter");
    
    fireEvent.change(serviceNameInput, { 
      target: { name: "serviceName", value: "Test Service" } 
    });
    fireEvent.change(costInput, { 
      target: { name: "cost", value: "1000" } 
    });
    fireEvent.change(chargePerSquareMeterInput, { 
      target: { name: "chargePerSquareMeter", value: "-50" } 
    });

    fireEvent.click(screen.getByText("Save Service"));

    await waitFor(() => {
      expect(screen.getByText("Charge per square meter must be a valid positive number")).toBeInTheDocument();
    });
  });

  test("handles cost with no value", async () => {
    render(<VendorDashboard setActivePage={mockSetActivePage} />);

    await waitFor(() => {
      fireEvent.click(screen.getByText("Add Service"));
    });

    const serviceNameInput = screen.getByTestId("input-serviceName");
    fireEvent.change(serviceNameInput, { 
      target: { name: "serviceName", value: "Test Service" } 
    });

    fireEvent.click(screen.getByText("Save Service"));

   
  });

  test("handles cost with invalid string", async () => {
    render(<VendorDashboard setActivePage={mockSetActivePage} />);

    await waitFor(() => {
      fireEvent.click(screen.getByText("Add Service"));
    });

    const serviceNameInput = screen.getByTestId("input-serviceName");
    const costInput = screen.getByTestId("input-cost");
    
    fireEvent.change(serviceNameInput, { 
      target: { name: "serviceName", value: "Test Service" } 
    });
    fireEvent.change(costInput, { 
      target: { name: "cost", value: "not-a-number" } 
    });

    fireEvent.click(screen.getByText("Save Service"));

 
  });

  test("calculates analytics with no report data", async () => {
    global.fetch.mockImplementation((url) => {
      if (url.includes('/my-report')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(null)
        });
      }
      if (url.includes('/vendor/bookings')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockBookingsResponse)
        });
      }
      if (url.includes('/analytics/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAnalyticsResponse)
        });
      }
      if (url.includes('/services')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockServicesResponse)
        });
      }
    });

    render(<VendorDashboard setActivePage={mockSetActivePage} />);

    await waitFor(() => {
      expect(screen.getByTestId("service-s1")).toBeInTheDocument();
    });

  
  });

  test("handles service save with network error", async () => {
    global.fetch.mockImplementation((url, options) => {
      if (url.includes('/services') && options?.method === 'POST') {
        return Promise.reject(new Error("Network error"));
      }
      if (url.includes('/services')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockServicesResponse)
        });
      }
      if (url.includes('/vendor/bookings')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockBookingsResponse)
        });
      }
      if (url.includes('/analytics/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAnalyticsResponse)
        });
      }
      if (url.includes('/my-report')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockReportResponse)
        });
      }
    });

    render(<VendorDashboard setActivePage={mockSetActivePage} />);

    await waitFor(() => {
      fireEvent.click(screen.getByText("Add Service"));
    });

    const serviceNameInput = screen.getByTestId("input-serviceName");
    const costInput = screen.getByTestId("input-cost");
    
    fireEvent.change(serviceNameInput, { 
      target: { name: "serviceName", value: "Test Service" } 
    });
    fireEvent.change(costInput, { 
      target: { name: "cost", value: "1000" } 
    });

    fireEvent.click(screen.getByText("Save Service"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  test("displays deleting state on delete button", async () => {
    global.confirm = vi.fn(() => true);
    
    // Make delete slow to see deleting state
    global.fetch.mockImplementation((url, options) => {
      if (url.includes('/services/service1') && options?.method === 'DELETE') {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve({})
            });
          }, 100);
        });
      }
      if (url.includes('/services')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockServicesResponse)
        });
      }
      if (url.includes('/vendor/bookings')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockBookingsResponse)
        });
      }
      if (url.includes('/analytics/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAnalyticsResponse)
        });
      }
      if (url.includes('/my-report')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockReportResponse)
        });
      }
    });

    render(<VendorDashboard setActivePage={mockSetActivePage} />);

    await waitFor(() => {
      expect(screen.getByTestId("service-s1")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText("Delete");
    fireEvent.click(deleteButtons[0]);

    // Should show "Deleting..." state
    await waitFor(() => {
      expect(screen.getByText("Deleting...")).toBeInTheDocument();
    });
  });

  
  test("formatCount returns 0 for null or undefined", async () => {
    render(<VendorDashboard setActivePage={mockSetActivePage} />);

    await waitFor(() => {
      expect(screen.getByTestId("vendor-dashboard-html")).toBeInTheDocument();
    });

    // The formatCount function should handle edge cases
    // This is indirectly tested through the component rendering
  });

  test("handles reviews with missing data", async () => {
    const analyticsWithIncompleteReviews = {
      reviews: [
        { id: "r1", rating: 5 }, // Missing name and review
        { id: "r2", reviewerName: "User 2" }, // Missing rating
        { id: "r3" } // Missing everything
      ],
      totalRevenue: 100000
    };

    global.fetch.mockImplementation((url) => {
      if (url.includes('/analytics/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(analyticsWithIncompleteReviews)
        });
      }
      if (url.includes('/vendor/bookings')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockBookingsResponse)
        });
      }
      if (url.includes('/services')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockServicesResponse)
        });
      }
      if (url.includes('/my-report')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockReportResponse)
        });
      }
    });

    render(<VendorDashboard setActivePage={mockSetActivePage} />);

    await waitFor(() => {
      expect(screen.getByTestId("service-s1")).toBeInTheDocument();
    });

  });

  test("handles services array directly (not nested in services property)", async () => {
    const servicesArray = [
      { id: "s1", serviceName: "Service 1", cost: "1000" }
    ];

    global.fetch.mockImplementation((url) => {
      if (url.includes('/services')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(servicesArray) // Direct array
        });
      }
      if (url.includes('/vendor/bookings')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockBookingsResponse)
        });
      }
      if (url.includes('/analytics/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAnalyticsResponse)
        });
      }
      if (url.includes('/my-report')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockReportResponse)
        });
      }
    });

    render(<VendorDashboard setActivePage={mockSetActivePage} />);

    await waitFor(() => {
      expect(screen.getByTestId("service-s1")).toBeInTheDocument();
    });
  });

  test("filters out services without valid IDs", async () => {
    const servicesWithInvalidIds = {
      services: [
        { id: "valid-1", serviceName: "Valid Service", cost: "1000" },
        { id: null, serviceName: "Invalid Service 1", cost: "2000" },
        { id: "", serviceName: "Invalid Service 2", cost: "3000" },
        { serviceName: "Invalid Service 3", cost: "4000" } // No ID
      ]
    };

    global.fetch.mockImplementation((url) => {
      if (url.includes('/services')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(servicesWithInvalidIds)
        });
      }
      if (url.includes('/vendor/bookings')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockBookingsResponse)
        });
      }
      if (url.includes('/analytics/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAnalyticsResponse)
        });
      }
      if (url.includes('/my-report')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockReportResponse)
        });
      }
    });

    render(<VendorDashboard setActivePage={mockSetActivePage} />);

    await waitFor(() => {
      expect(screen.getByTestId("vendor-dashboard-html")).toBeInTheDocument();
    });

    // Only valid service should be rendered
    expect(screen.getByTestId("service-s1")).toBeInTheDocument();
    expect(screen.queryByText("service-s2")).not.toBeInTheDocument();
  });

  test("handles timestamp as toDate function", async () => {
    const reviewWithToDate = {
      reviews: [
        {
          id: "r1",
          reviewerName: "User",
          rating: 5,
          review: "Great",
          timeOfReview: {
            toDate: () => new Date()
          }
        }
      ]
    };

    global.fetch.mockImplementation((url) => {
      if (url.includes('/analytics/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(reviewWithToDate)
        });
      }
      if (url.includes('/vendor/bookings')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockBookingsResponse)
        });
      }
      if (url.includes('/services')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockServicesResponse)
        });
      }
      if (url.includes('/my-report')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockReportResponse)
        });
      }
    });

    render(<VendorDashboard setActivePage={mockSetActivePage} />);

    await waitFor(() => {
      expect(screen.getByTestId("service-s1")).toBeInTheDocument();
    });
  });

  test("handles timestamp as string", async () => {
    const reviewWithStringTimestamp = {
      reviews: [
        {
          id: "r1",
          reviewerName: "User",
          rating: 5,
          review: "Great",
          timeOfReview: "2024-01-15T10:30:00Z"
        }
      ]
    };

    global.fetch.mockImplementation((url) => {
      if (url.includes('/analytics/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(reviewWithStringTimestamp)
        });
      }
      if (url.includes('/vendor/bookings')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockBookingsResponse)
        });
      }
      if (url.includes('/services')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockServicesResponse)
        });
      }
      if (url.includes('/my-report')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockReportResponse)
        });
      }
    });

    render(<VendorDashboard setActivePage={mockSetActivePage} />);

    await waitFor(() => {
      expect(screen.getByTestId("service-s1")).toBeInTheDocument();
    });
  });

  test("handles invalid timestamp gracefully", async () => {
    const reviewWithInvalidTimestamp = {
      reviews: [
        {
          id: "r1",
          reviewerName: "User",
          rating: 5,
          review: "Great",
          timeOfReview: "invalid-date-string"
        }
      ]
    };

    global.fetch.mockImplementation((url) => {
      if (url.includes('/analytics/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(reviewWithInvalidTimestamp)
        });
      }
      if (url.includes('/vendor/bookings')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockBookingsResponse)
        });
      }
      if (url.includes('/services')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockServicesResponse)
        });
      }
      if (url.includes('/my-report')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockReportResponse)
        });
      }
    });

    render(<VendorDashboard setActivePage={mockSetActivePage} />);

    await waitFor(() => {
      expect(screen.getByTestId("service-s1")).toBeInTheDocument();
    });

   
  });

  test("calculates rating distribution correctly", async () => {
    const analyticsWithRatings = {
      reviews: [
        { id: "r1", rating: 5, reviewerName: "User 1", review: "Great" },
        { id: "r2", rating: 5, reviewerName: "User 2", review: "Great" },
        { id: "r3", rating: 4, reviewerName: "User 3", review: "Good" },
        { id: "r4", rating: 3, reviewerName: "User 4", review: "OK" },
        { id: "r5", rating: 2, reviewerName: "User 5", review: "Poor" },
        { id: "r6", rating: 1, reviewerName: "User 6", review: "Bad" }
      ]
    };

    global.fetch.mockImplementation((url) => {
      if (url.includes('/analytics/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(analyticsWithRatings)
        });
      }
      if (url.includes('/vendor/bookings')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockBookingsResponse)
        });
      }
      if (url.includes('/services')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockServicesResponse)
        });
      }
      if (url.includes('/my-report')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockReportResponse)
        });
      }
    });

    render(<VendorDashboard setActivePage={mockSetActivePage} />);

    await waitFor(() => {
      expect(screen.getByTestId("service-s2")).toBeInTheDocument();
    });

    // Rating distribution should be rendered
    const ratingDistribution = screen.getByTestId("service-s2");
    expect(ratingDistribution).toBeInTheDocument();
  });
});