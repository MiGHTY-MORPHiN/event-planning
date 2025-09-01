import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import VendorDashboard from "../pages/vendor/VendorDashboard";

describe("VendorDashboard", () => {
  let mockSetActivePage;

  beforeEach(() => {
    mockSetActivePage = vi.fn();
    render(<VendorDashboard setActivePage={mockSetActivePage} />);
  });

  test("renders dashboard overview", () => {
    expect(screen.getByText("Dashboard Overview")).toBeInTheDocument();
    expect(screen.getByText("Welcome back! Here's what's happening with your business.")).toBeInTheDocument();
  });

  test("renders summary cards", () => {
    expect(screen.getByText("Total Bookings")).toBeInTheDocument();
    expect(screen.getByText("Revenue (MTD)")).toBeInTheDocument();
    expect(screen.getByText("Avg Rating")).toBeInTheDocument();
    expect(screen.getByText("Active Contracts")).toBeInTheDocument();
  });

  test("renders quick action buttons", () => {
    expect(screen.getByTestId("quick-action-update-profile")).toBeInTheDocument();
    expect(screen.getByTestId("quick-action-new-booking")).toBeInTheDocument();
    expect(screen.getByTestId("quick-action-review-contracts")).toBeInTheDocument();
    expect(screen.getByTestId("quick-action-manage-venues")).toBeInTheDocument();
  });

  test("calls setActivePage when quick action buttons are clicked", () => {
    fireEvent.click(screen.getByTestId("quick-action-update-profile"));
    expect(mockSetActivePage).toHaveBeenCalledWith("profile");

    fireEvent.click(screen.getByTestId("quick-action-new-booking"));
    expect(mockSetActivePage).toHaveBeenCalledWith("bookings");

    fireEvent.click(screen.getByTestId("quick-action-review-contracts"));
    expect(mockSetActivePage).toHaveBeenCalledWith("contracts");

    fireEvent.click(screen.getByTestId("quick-action-manage-venues"));
    expect(mockSetActivePage).toHaveBeenCalledWith("floorplan");
  });

  test("renders recent bookings and reviews", () => {
    expect(screen.getByText("Recent Bookings")).toBeInTheDocument();
    expect(screen.getByText("Recent Reviews")).toBeInTheDocument();
  });

  test("renders pending contracts and venue status", () => {
    expect(screen.getByText("Pending Contracts")).toBeInTheDocument();
    expect(screen.getByText("Venue Status")).toBeInTheDocument();
  });
});
