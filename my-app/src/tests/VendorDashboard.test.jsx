import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
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

  test("renders header action buttons", () => {
    // Use getAllByText to handle multiple "New Booking" occurrences
    const newBookingButtons = screen.getAllByText("New Booking");
    expect(newBookingButtons).toHaveLength(2); // Header and Quick Actions
    expect(screen.getByText("Analytics")).toBeInTheDocument();
  });

  test("renders summary cards", () => {
    expect(screen.getByText("Total Bookings")).toBeInTheDocument();
    expect(screen.getByText("Revenue (MTD)")).toBeInTheDocument();
    expect(screen.getByText("Avg Rating")).toBeInTheDocument();
    expect(screen.getByText("Active Contracts")).toBeInTheDocument();
    
    // Test card values
    expect(screen.getByText("28")).toBeInTheDocument();
    expect(screen.getByText("R85k")).toBeInTheDocument();
    expect(screen.getByText("4.8")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
  });

  test("renders summary card details", () => {
    expect(screen.getByText("This month")).toBeInTheDocument();
    expect(screen.getByText("Monthly target: R100k")).toBeInTheDocument();
    expect(screen.getByText("120 reviews")).toBeInTheDocument();
    expect(screen.getByText("Worth R180k")).toBeInTheDocument();
  });

  test("renders summary card percentage changes", () => {
    expect(screen.getByText("+12%")).toBeInTheDocument();
    expect(screen.getByText("+15%")).toBeInTheDocument();
    expect(screen.getByText("+0.2")).toBeInTheDocument();
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  test("renders quick action buttons", () => {
    expect(screen.getByText("Update Profile")).toBeInTheDocument();
    // Use getAllByText for "New Booking" since it appears twice
    const newBookingButtons = screen.getAllByText("New Booking");
    expect(newBookingButtons).toHaveLength(2);
    expect(screen.getByText("Review Contracts")).toBeInTheDocument();
    expect(screen.getByText("Manage Venues")).toBeInTheDocument();
  });

  test("calls setActivePage when quick action buttons are clicked", () => {
    // Get buttons by their text content in the Quick Actions section
    const quickActionsButtons = screen.getAllByRole("button");
    
    // Find specific buttons by their text content
    const updateProfileBtn = quickActionsButtons.find(btn => 
      btn.textContent === "Update Profile"
    );
    const reviewContractsBtn = quickActionsButtons.find(btn => 
      btn.textContent === "Review Contracts"
    );
    const manageVenuesBtn = quickActionsButtons.find(btn => 
      btn.textContent === "Manage Venues"
    );

    fireEvent.click(updateProfileBtn);
    expect(mockSetActivePage).toHaveBeenCalledWith("profile");

    fireEvent.click(reviewContractsBtn);
    expect(mockSetActivePage).toHaveBeenCalledWith("contracts");

    fireEvent.click(manageVenuesBtn);
    expect(mockSetActivePage).toHaveBeenCalledWith("floorplan");
  });

  test("calls setActivePage when View All buttons are clicked", () => {
    const viewAllButtons = screen.getAllByText("View All");
    
    // Test bookings view all
    fireEvent.click(viewAllButtons[0]); // Recent Bookings View All
    expect(mockSetActivePage).toHaveBeenCalledWith("bookings");

    // Test reviews view all
    fireEvent.click(viewAllButtons[1]); // Recent Reviews View All
    expect(mockSetActivePage).toHaveBeenCalledWith("reviews");

    // Test contracts view all
    fireEvent.click(viewAllButtons[2]); // Pending Contracts View All
    expect(mockSetActivePage).toHaveBeenCalledWith("contracts");
  });

  test("calls setActivePage when View Plan button is clicked", () => {
    const viewPlanButton = screen.getByText("View Plan");
    fireEvent.click(viewPlanButton);
    expect(mockSetActivePage).toHaveBeenCalledWith("floorplan");
  });

  test("renders recent bookings", () => {
    expect(screen.getByText("Recent Bookings")).toBeInTheDocument();
    expect(screen.getByText("Corporate Lunch")).toBeInTheDocument();
    expect(screen.getByText("Wedding Reception")).toBeInTheDocument();
    expect(screen.getByText("Birthday Party")).toBeInTheDocument();
    
    // Test booking details
    expect(screen.getByText("Aug 20")).toBeInTheDocument();
    expect(screen.getByText("Aug 25")).toBeInTheDocument();
    expect(screen.getByText("Aug 30")).toBeInTheDocument();
    expect(screen.getByText("R15,000")).toBeInTheDocument();
    
    // Use getAllByText for R45,000 since it appears in both bookings and contracts
    const r45000Elements = screen.getAllByText("R45,000");
    expect(r45000Elements).toHaveLength(2); // One in bookings, one in contracts
    
    expect(screen.getByText("R8,500")).toBeInTheDocument();
  });

  test("renders booking status badges", () => {
    const confirmedBadges = screen.getAllByText("confirmed");
    const pendingBadges = screen.getAllByText("pending");
    
    expect(confirmedBadges).toHaveLength(2);
    // "pending" appears in both bookings (1) and contracts (1), so expect 2
    expect(pendingBadges).toHaveLength(2);
  });

  test("renders recent reviews", () => {
    expect(screen.getByText("Recent Reviews")).toBeInTheDocument();
    expect(screen.getByText("Sarah M.")).toBeInTheDocument();
    expect(screen.getByText("John D.")).toBeInTheDocument();
    expect(screen.getByText("Exceptional service and delicious food!")).toBeInTheDocument();
    expect(screen.getByText("Great presentation and timely delivery.")).toBeInTheDocument();
    expect(screen.getByText("2 days ago")).toBeInTheDocument();
    expect(screen.getByText("1 week ago")).toBeInTheDocument();
  });

  test("renders star ratings in reviews", () => {
    // Test that star components are rendered
    const starElements = document.querySelectorAll('.star');
    expect(starElements.length).toBeGreaterThan(0);
  });

  test("renders pending contracts", () => {
    expect(screen.getByText("Pending Contracts")).toBeInTheDocument();
    expect(screen.getByText("ABC Corp")).toBeInTheDocument();
    expect(screen.getByText("Smith Wedding")).toBeInTheDocument();
    expect(screen.getByText("Annual Gala")).toBeInTheDocument();
    expect(screen.getByText("Reception")).toBeInTheDocument();
    expect(screen.getByText("R75,000")).toBeInTheDocument();
    expect(screen.getByText("review")).toBeInTheDocument();
  });

  test("renders venue status", () => {
    expect(screen.getByText("Venue Status")).toBeInTheDocument();
    expect(screen.getByText("Main Hall")).toBeInTheDocument();
    expect(screen.getByText("Garden Area")).toBeInTheDocument();
    expect(screen.getByText("VIP Lounge")).toBeInTheDocument();
    expect(screen.getByText("Available - 200 capacity")).toBeInTheDocument();
    expect(screen.getByText("Booked Aug 25")).toBeInTheDocument();
    expect(screen.getByText("Available - 50 capacity")).toBeInTheDocument();
  });

  test("renders venue status icons", () => {
    // Test that venue icons are rendered
    const checkCircleIcons = document.querySelectorAll('.venue-icon.available');
    const alertCircleIcons = document.querySelectorAll('.venue-icon.booked');
    
    expect(checkCircleIcons).toHaveLength(2); // Main Hall and VIP Lounge
    expect(alertCircleIcons).toHaveLength(1); // Garden Area
  });

  test("renders all card sections", () => {
    expect(screen.getByText("Recent Bookings")).toBeInTheDocument();
    expect(screen.getByText("Recent Reviews")).toBeInTheDocument();
    expect(screen.getByText("Pending Contracts")).toBeInTheDocument();
    expect(screen.getByText("Venue Status")).toBeInTheDocument();
    expect(screen.getByText("Quick Actions")).toBeInTheDocument();
  });

  test("renders correct CSS classes", () => {
    expect(document.querySelector('.vendor-dashboard')).toBeInTheDocument();
    expect(document.querySelector('.dashboard-header')).toBeInTheDocument();
    expect(document.querySelector('.summary-grid')).toBeInTheDocument();
    expect(document.querySelector('.dashboard-grid')).toBeInTheDocument();
    expect(document.querySelector('.quick-actions')).toBeInTheDocument();
  });

  test("renders summary card colors", () => {
    expect(document.querySelector('.summary-card.blue')).toBeInTheDocument();
    expect(document.querySelector('.summary-card.green')).toBeInTheDocument();
    expect(document.querySelector('.summary-card.yellow')).toBeInTheDocument();
    expect(document.querySelector('.summary-card.purple')).toBeInTheDocument();
  });

  test("renders action card colors", () => {
    expect(document.querySelector('.action-card.blue')).toBeInTheDocument();
    expect(document.querySelector('.action-card.green')).toBeInTheDocument();
    expect(document.querySelector('.action-card.purple')).toBeInTheDocument();
    expect(document.querySelector('.action-card.orange')).toBeInTheDocument();
  });

  test("renders lucide icons", () => {
    // Test that various lucide icons are rendered
    const svgElements = document.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThan(0);
    
    // Test for specific lucide classes
    expect(document.querySelector('.lucide-plus')).toBeInTheDocument();
    expect(document.querySelector('.lucide-eye')).toBeInTheDocument();
    expect(document.querySelector('.lucide-calendar')).toBeInTheDocument();
    expect(document.querySelector('.lucide-dollar-sign')).toBeInTheDocument();
    expect(document.querySelector('.lucide-star')).toBeInTheDocument();
    expect(document.querySelector('.lucide-file-text')).toBeInTheDocument();
  });

  test("handles multiple New Booking buttons correctly", () => {
    // There are two "New Booking" buttons - one in header actions and one in quick actions
    const newBookingButtons = screen.getAllByText("New Booking");
    expect(newBookingButtons).toHaveLength(2);
    
    // Click the quick action "New Booking" button (should be the second one)
    const quickActionNewBooking = newBookingButtons.find(btn => 
      btn.closest('.action-card')
    );
    fireEvent.click(quickActionNewBooking);
    expect(mockSetActivePage).toHaveBeenCalledWith("bookings");
  });

  test("renders booking items with correct structure", () => {
    // Test booking item classes
    const bookingItems = document.querySelectorAll('.booking-item');
    expect(bookingItems).toHaveLength(3);
    
    // Test booking headers and footers
    const bookingHeaders = document.querySelectorAll('.booking-header');
    const bookingFooters = document.querySelectorAll('.booking-footer');
    expect(bookingHeaders).toHaveLength(3);
    expect(bookingFooters).toHaveLength(3);
  });

  test("renders review items with correct structure", () => {
    // Test review item classes
    const reviewItems = document.querySelectorAll('.review-item');
    expect(reviewItems).toHaveLength(2);
    
    // Test review headers
    const reviewHeaders = document.querySelectorAll('.review-header');
    expect(reviewHeaders).toHaveLength(2);
    
    // Test rating components
    const ratings = document.querySelectorAll('.rating');
    expect(ratings).toHaveLength(2);
  });

  test("renders contract items with correct structure", () => {
    // Test contract item classes
    const contractItems = document.querySelectorAll('.contract-item');
    expect(contractItems).toHaveLength(2);
    
    // Test contract details
    const contractDetails = document.querySelectorAll('.contract-details');
    expect(contractDetails).toHaveLength(2);
  });

  test("renders venue items with correct structure", () => {
    // Test venue item classes
    const venueItems = document.querySelectorAll('.venue-item');
    expect(venueItems).toHaveLength(3);
    
    // Test venue names and details
    const venueNames = document.querySelectorAll('.venue-name');
    const venueDetails = document.querySelectorAll('.venue-details');
    expect(venueNames).toHaveLength(3);
    expect(venueDetails).toHaveLength(3);
  });

  test("renders status badges with correct classes", () => {
    // Test status badge classes
    const statusBadges = document.querySelectorAll('.status-badge');
    expect(statusBadges.length).toBeGreaterThan(0);
    
    // Test specific status classes
    const confirmedBadges = document.querySelectorAll('.status-badge.confirmed');
    const pendingBadges = document.querySelectorAll('.status-badge.pending');
    const reviewBadges = document.querySelectorAll('.status-badge.review');
    
    expect(confirmedBadges).toHaveLength(2);
    expect(pendingBadges).toHaveLength(2);
    expect(reviewBadges).toHaveLength(1);
  });
});