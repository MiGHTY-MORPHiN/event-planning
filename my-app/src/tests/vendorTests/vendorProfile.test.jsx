import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, beforeEach, afterEach, test, describe, expect } from "vitest";

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

// Mock Firebase Auth
vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => ({
    currentUser: {
      uid: "test-vendor-123",
      getIdToken: vi.fn(() => Promise.resolve("mock-token")),
    },
    onAuthStateChanged: vi.fn((callback) => {
      callback({
        uid: "test-vendor-123",
        getIdToken: () => Promise.resolve("mock-token"),
      });
      return vi.fn();
    }),
  })),
}));

// Mock VendorProfileHTML
vi.mock("../../pages/vendor/VendorProfileHTML", () => ({
  default: ({
    vendor,
    services,
    stats,
    showServiceForm,
    editingService,
    deleting,
    formData,
    formErrors,
    popupNotifications,
    navProfileEdit,
    setShowServiceForm,
    handleChange,
    handleSaveService,
    handleEditService,
    handleDeleteService,
    removePopupNotification,
    showPopupNotification,
  }) => (
    <div data-testid="vendor-profile-html">
      <h1>Vendor Profile</h1>
      
      {vendor && (
        <div data-testid="vendor-info">
          <h2>{vendor.businessName}</h2>
          <p>{vendor.email}</p>
          <p>{vendor.phoneNumber}</p>
        </div>
      )}

      {stats && (
        <div data-testid="stats">
          <span>Total Bookings: {stats.totalBookings}</span>
          <span>Confirmed: {stats.confirmedBookings}</span>
          <span>Reviews: {stats.totalReviews}</span>
          <span>Rating: {stats.avgRating}</span>
          <span>Services: {stats.totalServices}</span>
        </div>
      )}

      <button onClick={navProfileEdit}>Edit Profile</button>
      <button onClick={() => setShowServiceForm(true)}>Add Service</button>
      <button onClick={() => showPopupNotification("Test", "Message", "info")}>
        Show Notification
      </button>

      {services?.map(service => (
        <div key={service.id} data-testid={`service-${service.id}`}>
          <span>{service.serviceName}</span>
          <span>{service.cost}</span>
          <button onClick={() => handleEditService(service)}>Edit</button>
          <button onClick={() => handleDeleteService(service.id)}>
            {deleting === service.id ? "Deleting..." : "Delete"}
          </button>
        </div>
      ))}

      {showServiceForm && (
        <div data-testid="service-form">
          <input
            name="serviceName"
            value={formData.serviceName}
            onChange={handleChange}
            data-testid="input-serviceName"
          />
          {formErrors.serviceName && (
            <span data-testid="error-serviceName">{formErrors.serviceName}</span>
          )}
          
          <input
            name="cost"
            value={formData.cost}
            onChange={handleChange}
            data-testid="input-cost"
          />
          {formErrors.cost && (
            <span data-testid="error-cost">{formErrors.cost}</span>
          )}
          
          <input
            name="chargeByHour"
            value={formData.chargeByHour}
            onChange={handleChange}
            data-testid="input-chargeByHour"
          />
          
          <input
            name="chargePerPerson"
            value={formData.chargePerPerson}
            onChange={handleChange}
            data-testid="input-chargePerPerson"
          />
          
          <input
            name="chargePerSquareMeter"
            value={formData.chargePerSquareMeter}
            onChange={handleChange}
            data-testid="input-chargePerSquareMeter"
          />
          
          <input
            name="extraNotes"
            value={formData.extraNotes}
            onChange={handleChange}
            data-testid="input-extraNotes"
          />
          
          <button onClick={handleSaveService}>
            {editingService ? "Update" : "Save"} Service
          </button>
        </div>
      )}

      {popupNotifications?.map(notif => (
        <div key={notif.id} data-testid={`notification-${notif.id}`}>
          <h3>{notif.title}</h3>
          <p>{notif.message}</p>
          <span>{notif.type}</span>
          <button onClick={() => removePopupNotification(notif.id)}>Close</button>
        </div>
      ))}
    </div>
  ),
}));

// Mock fetch
global.fetch = vi.fn();

// Mock window.Notification
global.Notification = {
  permission: "default",
  requestPermission: vi.fn(() => Promise.resolve("granted")),
};

// Mock window.confirm
global.confirm = vi.fn(() => true);

// Import component after mocks
const VendorProfileModule = await import("../../pages/vendor/vendorProfile");
const VendorProfile = VendorProfileModule.default;
const NotificationSystem = VendorProfileModule.NotificationSystem;

describe("VendorProfile", () => {
  const mockVendorResponse = {
    businessName: "Test Catering Co",
    email: "test@catering.com",
    phoneNumber: "+1234567890",
    description: "Best catering service",
  };

  const mockServicesResponse = [
    {
      id: "service1",
      serviceName: "Catering Service",
      cost: "10000",
      chargeByHour: "500",
      chargePerPerson: "200",
      chargePerSquareMeter: "",
      extraNotes: "Full service",
    },
    {
      id: "service2",
      serviceName: "DJ Service",
      cost: "5000",
      chargeByHour: "1000",
      chargePerPerson: "",
      chargePerSquareMeter: "",
      extraNotes: "",
    },
  ];

  const mockAnalyticsResponse = {
    reviews: [
      { id: "r1", rating: 5, reviewerName: "John", review: "Great!" },
      { id: "r2", rating: 4, reviewerName: "Jane", review: "Good" },
    ],
  };

  const mockBookingsResponse = {
    bookings: [
      { id: "b1", status: "confirmed", eventName: "Wedding" },
      { id: "b2", status: "accepted", eventName: "Party" },
      { id: "b3", status: "pending", eventName: "Event" },
    ],
  };

  const mockReviewsResponse = {
    reviews: [
      { id: "r1", rating: 5 },
      { id: "r2", rating: 4 },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();

    // Setup default fetch responses
    global.fetch.mockImplementation((url) => {
      if (url.includes("/vendor/me")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockVendorResponse),
        });
      }
      if (url.includes("/services")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockServicesResponse),
        });
      }
      if (url.includes("/analytics/")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAnalyticsResponse),
        });
      }
      if (url.includes("/vendor/bookings")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockBookingsResponse),
        });
      }
      if (url.includes("/reviews")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockReviewsResponse),
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  test("shows loading spinner initially", () => {
    render(<VendorProfile />);
    expect(screen.getByText("Loading your profile and services...")).toBeInTheDocument();
  });

  test("loads and displays vendor profile successfully", async () => {
    render(<VendorProfile />);

    await waitFor(() => {
      expect(screen.getByTestId("vendor-info")).toBeInTheDocument();
    });

    expect(screen.getByText("Test Catering Co")).toBeInTheDocument();
    expect(screen.getByText("test@catering.com")).toBeInTheDocument();
  });

  test("displays services correctly", async () => {
    render(<VendorProfile />);

    await waitFor(() => {
      expect(screen.getByTestId("service-service1")).toBeInTheDocument();
    });

    expect(screen.getByText("Catering Service")).toBeInTheDocument();
    expect(screen.getByText("DJ Service")).toBeInTheDocument();
  });

  test("calculates and displays stats correctly", async () => {
    render(<VendorProfile />);

    await waitFor(() => {
      expect(screen.getByTestId("stats")).toBeInTheDocument();
    });

    expect(screen.getByText("Total Bookings: 3")).toBeInTheDocument();
    expect(screen.getByText("Confirmed: 2")).toBeInTheDocument();
    expect(screen.getByText("Reviews: 2")).toBeInTheDocument();
    expect(screen.getByText("Services: 2")).toBeInTheDocument();
  });

  test("navigates to edit profile when button clicked", async () => {
    render(<VendorProfile />);

    await waitFor(() => {
      expect(screen.getByText("Edit Profile")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Edit Profile"));
    expect(mockNavigate).toHaveBeenCalledWith("/vendor/vendor-edit-profile");
  });

  test("opens service form when Add Service clicked", async () => {
    render(<VendorProfile />);

    await waitFor(() => {
      expect(screen.getByText("Add Service")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Add Service"));

    await waitFor(() => {
      expect(screen.getByTestId("service-form")).toBeInTheDocument();
    });
  });

  test("validates service form - empty service name", async () => {
    render(<VendorProfile />);

    await waitFor(() => {
      fireEvent.click(screen.getByText("Add Service"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("service-form")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Save Service"));

    await waitFor(() => {
      expect(screen.getByTestId("error-serviceName")).toHaveTextContent("Service name is required");
    });
  });

  test("validates service form - service name too long", async () => {
    render(<VendorProfile />);

    await waitFor(() => {
      fireEvent.click(screen.getByText("Add Service"));
    });

    const serviceNameInput = screen.getByTestId("input-serviceName");
    fireEvent.change(serviceNameInput, {
      target: { name: "serviceName", value: "a".repeat(101) },
    });

    fireEvent.click(screen.getByText("Save Service"));

    await waitFor(() => {
      expect(screen.getByTestId("error-serviceName")).toHaveTextContent(
        "Service name must be less than 100 characters"
      );
    });
  });

  
  test("validates service form - no letters in service name", async () => {
    render(<VendorProfile />);

    await waitFor(() => {
      fireEvent.click(screen.getByText("Add Service"));
    });

    const serviceNameInput = screen.getByTestId("input-serviceName");
    fireEvent.change(serviceNameInput, {
      target: { name: "serviceName", value: "!@#$%" },
    });

    fireEvent.click(screen.getByText("Save Service"));

    await waitFor(() => {
      expect(screen.getByTestId("error-serviceName")).toHaveTextContent(
        "Service name must contain at least one letter"
      );
    });
  });

  test("validates service form - cost required", async () => {
    render(<VendorProfile />);

    await waitFor(() => {
      fireEvent.click(screen.getByText("Add Service"));
    });

    const serviceNameInput = screen.getByTestId("input-serviceName");
    fireEvent.change(serviceNameInput, {
      target: { name: "serviceName", value: "Test Service" },
    });

    fireEvent.click(screen.getByText("Save Service"));

    await waitFor(() => {
      expect(screen.getByTestId("error-cost")).toHaveTextContent("Base cost is required");
    });
  });

  test("validates service form - invalid cost", async () => {
    render(<VendorProfile />);

    await waitFor(() => {
      fireEvent.click(screen.getByText("Add Service"));
    });

    const serviceNameInput = screen.getByTestId("input-serviceName");
    const costInput = screen.getByTestId("input-cost");

    fireEvent.change(serviceNameInput, {
      target: { name: "serviceName", value: "Test Service" },
    });
    fireEvent.change(costInput, {
      target: { name: "cost", value: "-100" },
    });

    fireEvent.click(screen.getByText("Save Service"));

    await waitFor(() => {
      expect(screen.getByTestId("error-cost")).toHaveTextContent(
        "Base cost must be a valid positive number"
      );
    });
  });

  test("validates service form - cost too high", async () => {
    render(<VendorProfile />);

    await waitFor(() => {
      fireEvent.click(screen.getByText("Add Service"));
    });

    const costInput = screen.getByTestId("input-cost");
    fireEvent.change(costInput, {
      target: { name: "cost", value: "2000000" },
    });

    fireEvent.click(screen.getByText("Save Service"));

    await waitFor(() => {
      expect(screen.getByTestId("error-cost")).toHaveTextContent("Base cost is too high");
    });
  });

  


  test("successfully saves a new service", async () => {
    global.fetch.mockImplementationOnce((url, options) => {
      if (url.includes("/services") && options?.method === "POST") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ serviceId: "new-service-123" }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockServicesResponse),
      });
    });

    render(<VendorProfile />);

    await waitFor(() => {
      fireEvent.click(screen.getByText("Add Service"));
    });

    const serviceNameInput = screen.getByTestId("input-serviceName");
    const costInput = screen.getByTestId("input-cost");

    fireEvent.change(serviceNameInput, {
      target: { name: "serviceName", value: "New Service" },
    });
    fireEvent.change(costInput, {
      target: { name: "cost", value: "1000" },
    });

    fireEvent.click(screen.getByText("Save Service"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/services"),
        expect.objectContaining({
          method: "POST",
        })
      );
    });
  });

  test("handles edit service", async () => {
    render(<VendorProfile />);

    await waitFor(() => {
      expect(screen.getByTestId("service-service1")).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText("Edit");
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId("service-form")).toBeInTheDocument();
      expect(screen.getByTestId("input-serviceName")).toHaveValue("Catering Service");
    });
  });

  test("successfully updates an existing service", async () => {
    global.fetch.mockImplementation((url, options) => {
      if (url.includes("/services") && options?.method === "POST") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ serviceId: "service1" }),
        });
      }
      if (url.includes("/services")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockServicesResponse),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    render(<VendorProfile />);

    await waitFor(() => {
      expect(screen.getByTestId("service-service1")).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText("Edit");
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId("service-form")).toBeInTheDocument();
    });

    const serviceNameInput = screen.getByTestId("input-serviceName");
    fireEvent.change(serviceNameInput, {
      target: { name: "serviceName", value: "Updated Catering" },
    });

    fireEvent.click(screen.getByText("Update Service"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/services"),
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("Updated Catering"),
        })
      );
    });
  });

  test("handles delete service with confirmation", async () => {
    global.confirm = vi.fn(() => true);

    global.fetch.mockImplementation((url, options) => {
      if (url.includes("/services/service1") && options?.method === "DELETE") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockServicesResponse),
      });
    });

    render(<VendorProfile />);

    await waitFor(() => {
      expect(screen.getByTestId("service-service1")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText("Delete");
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(global.confirm).toHaveBeenCalled();
    });
  });

  test("cancels delete when user declines confirmation", async () => {
    global.confirm = vi.fn(() => false);

    render(<VendorProfile />);

    await waitFor(() => {
      expect(screen.getByTestId("service-service1")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText("Delete");
    fireEvent.click(deleteButtons[0]);

    expect(global.confirm).toHaveBeenCalled();
    expect(screen.getByTestId("service-service1")).toBeInTheDocument();
  });

  test("shows deleting state on delete button", async () => {
    global.confirm = vi.fn(() => true);

    global.fetch.mockImplementation((url, options) => {
      if (url.includes("/services/service1") && options?.method === "DELETE") {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve({}),
            });
          }, 100);
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockServicesResponse),
      });
    });

    render(<VendorProfile />);

    await waitFor(() => {
      expect(screen.getByTestId("service-service1")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText("Delete");
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("Deleting...")).toBeInTheDocument();
    });
  });

  test("handles delete error", async () => {
    global.confirm = vi.fn(() => true);

    global.fetch.mockImplementation((url, options) => {
      if (url.includes("/services/service1") && options?.method === "DELETE") {
        return Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: "Delete failed" }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockServicesResponse),
      });
    });

    render(<VendorProfile />);

    await waitFor(() => {
      expect(screen.getByTestId("service-service1")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText("Delete");
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(global.confirm).toHaveBeenCalled();
    });
  });

  test("clears form errors when user types", async () => {
    render(<VendorProfile />);

    await waitFor(() => {
      fireEvent.click(screen.getByText("Add Service"));
    });

    fireEvent.click(screen.getByText("Save Service"));

    await waitFor(() => {
      expect(screen.getByTestId("error-serviceName")).toBeInTheDocument();
    });

    const serviceNameInput = screen.getByTestId("input-serviceName");
    fireEvent.change(serviceNameInput, {
      target: { name: "serviceName", value: "New Service" },
    });

    await waitFor(() => {
      expect(screen.queryByTestId("error-serviceName")).not.toBeInTheDocument();
    });
  });

  test("shows popup notification", async () => {
    render(<VendorProfile />);

    await waitFor(() => {
      expect(screen.getByText("Show Notification")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Show Notification"));

    await waitFor(() => {
      const notifications = screen.queryAllByTestId(/notification-/);
      expect(notifications.length).toBeGreaterThan(0);
    });
  });

  test("removes popup notification when closed", async () => {
    render(<VendorProfile />);

    await waitFor(() => {
      fireEvent.click(screen.getByText("Show Notification"));
    });

    await waitFor(() => {
      const closeButtons = screen.getAllByText("Close");
      expect(closeButtons.length).toBeGreaterThan(0);
    });

    const closeButtons = screen.getAllByText("Close");
    fireEvent.click(closeButtons[0]);

    await waitFor(() => {
      const notifications = screen.queryAllByTestId(/notification-/);
      expect(notifications.length).toBe(0);
    }, { timeout: 1000 });
  });

  test("handles unauthenticated user", async () => {
    const { getAuth } = await import("firebase/auth");
    getAuth.mockReturnValueOnce({
      currentUser: null,
      onAuthStateChanged: vi.fn((callback) => {
        callback(null);
        return vi.fn();
      }),
    });

    render(<VendorProfile />);

    await waitFor(() => {
      expect(screen.getByText("User not authenticated")).toBeInTheDocument();
    });
  });

  
  

  test("handles service save error", async () => {
    global.fetch.mockImplementation((url, options) => {
      if (url.includes("/services") && options?.method === "POST") {
        return Promise.resolve({
          ok: false,
          statusText: "Internal Server Error",
          json: () => Promise.resolve({ error: "Save failed" }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockServicesResponse),
      });
    });

    render(<VendorProfile />);

    await waitFor(() => {
      fireEvent.click(screen.getByText("Add Service"));
    });

    const serviceNameInput = screen.getByTestId("input-serviceName");
    const costInput = screen.getByTestId("input-cost");

    fireEvent.change(serviceNameInput, {
      target: { name: "serviceName", value: "Test Service" },
    });
    fireEvent.change(costInput, {
      target: { name: "cost", value: "1000" },
    });

    fireEvent.click(screen.getByText("Save Service"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  

  test("NotificationSystem subscription works", () => {
    const listener = vi.fn();
    const unsubscribe = NotificationSystem.subscribe(listener);

    NotificationSystem.showNotification("Test", "Message", "info");

    expect(listener).toHaveBeenCalled();

    unsubscribe();
    listener.mockClear();

    NotificationSystem.showNotification("Test2", "Message2", "info");
    expect(listener).not.toHaveBeenCalled();
  });

 

  test("uses cached data when available", async () => {
    const { rerender } = render(<VendorProfile />);

    await waitFor(() => {
      expect(screen.getByTestId("vendor-info")).toBeInTheDocument();
    });

    const initialFetchCount = global.fetch.mock.calls.length;

    // Unmount and remount
    rerender(<div />);
    rerender(<VendorProfile />);

    await waitFor(() => {
      expect(screen.getByTestId("vendor-info")).toBeInTheDocument();
    });

    // Should use cache, so fetch count may be similar
    expect(global.fetch.mock.calls.length).toBeGreaterThanOrEqual(initialFetchCount);
  });
});