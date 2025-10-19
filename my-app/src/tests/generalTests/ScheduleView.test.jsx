/**
 * @vitest-environment jsdom
 */

import React from "react";
import {
	render,
	screen,
	fireEvent,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import ScheduleView from "../../pages/general/calendar/ScheduleView"; // Adjust path if needed
import * as dateUtilsActual from "../../pages/general/calendar/dateUtils"; // Import actual

// --- Mock dateUtils ---
// We mock the functions ScheduleView relies on for data processing and date checking.
// Keep other utils like minutesToDurationString using their actual implementation for testing rendering.

// Define mocks INSIDE the factory function
vi.mock("../../pages/general/calendar/dateUtils", async () => {
	const actual = await vi.importActual(
		"../../pages/general/calendar/dateUtils"
	);
	// Define the mock functions within the factory scope
	const mockGetAllEventsSorted = vi.fn();
	const mockGetTodayKey = vi.fn();
	const mockFormatDateKey = vi.fn((date) => actual.formatDateKey(date)); // Use actual implementation

	return {
		...actual, // Keep actual minutesToDurationString, etc.
		// Override with mocks defined above
		getAllEventsSorted: mockGetAllEventsSorted,
		getTodayKey: mockGetTodayKey,
		formatDateKey: mockFormatDateKey,
	};
});

// Mock scrollIntoView globally
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Import the mocked functions *after* setting up the mock
// We need to access the mocks themselves, so import them from the mocked module
const {
	getAllEventsSorted: mockGetAllEventsSorted,
	getTodayKey: mockGetTodayKey,
	formatDateKey: mockFormatDateKey,
} = await import("../../pages/general/calendar/dateUtils");

describe("ScheduleView Component", () => {
	// --- Mock Callbacks ---
	const mockOnEventClick = vi.fn();

	// --- Test Data ---
	const today = new Date(2024, 9, 19); // Oct 19, 2024 (Sat)
	const todayKey = "2024-10-19";

	// Raw event data as passed in props
	const mockRawEventsInput = [
		{
			id: "evt-oct-20",
			name: "Sun Event",
			start: new Date(2024, 9, 20, 10, 0),
		}, // Tomorrow
		{
			id: "evt-oct-19-late",
			name: "Sat Late",
			start: new Date(2024, 9, 19, 14, 0),
			end: new Date(2024, 9, 19, 15, 30),
		}, // Today (Later)
		{
			id: "evt-oct-19-early",
			name: "Sat Early (No End)",
			start: new Date(2024, 9, 19, 9, 15),
		}, // Today (Earlier, No End)
		{
			id: "evt-oct-18",
			name: "Fri Event",
			start: new Date(2024, 9, 18, 11, 0),
		}, // Yesterday
	];

	// Processed & Sorted events as getAllEventsSorted mock should return them
	const mockSortedEvents = [
		{
			id: "evt-oct-18",
			title: "Fri Event",
			start: new Date(2024, 9, 18, 11, 0),
			end: undefined,
			raw: mockRawEventsInput[3],
		},
		{
			id: "evt-oct-19-early",
			title: "Sat Early (No End)",
			start: new Date(2024, 9, 19, 9, 15),
			end: undefined,
			raw: mockRawEventsInput[2],
		},
		{
			id: "evt-oct-19-late",
			title: "Sat Late",
			start: new Date(2024, 9, 19, 14, 0),
			end: new Date(2024, 9, 19, 15, 30),
			raw: mockRawEventsInput[1],
		},
		{
			id: "evt-oct-20",
			title: "Sun Event",
			start: new Date(2024, 9, 20, 10, 0),
			end: undefined,
			raw: mockRawEventsInput[0],
		},
	];

	beforeEach(() => {
		// Reset mocks before each test
		vi.clearAllMocks(); // Clears call history etc. for mocks defined in vi.mock
		window.HTMLElement.prototype.scrollIntoView.mockClear();

		// Setup mock implementations for this test suite using the imported mock functions
		mockGetAllEventsSorted.mockReturnValue(mockSortedEvents);
		mockGetTodayKey.mockReturnValue(todayKey);
		// mockFormatDateKey uses the actual implementation via its definition in the mock factory
	});

	afterEach(() => {
		// Clean up if necessary
	});

	it("renders a list of events sorted chronologically based on mock", () => {
		render(
			<ScheduleView
				events={mockRawEventsInput}
				onEventClick={mockOnEventClick}
			/>
		);

		expect(screen.getByRole("list")).toHaveClass("schedule__list");
		const listItems = screen.getAllByRole("listitem");
		expect(listItems).toHaveLength(mockSortedEvents.length);

		expect(within(listItems[0]).getByText("Fri Event")).toBeInTheDocument();
		expect(
			within(listItems[1]).getByText("Sat Early (No End)")
		).toBeInTheDocument();
		expect(within(listItems[2]).getByText("Sat Late")).toBeInTheDocument();
		expect(within(listItems[3]).getByText("Sun Event")).toBeInTheDocument();

		expect(mockGetAllEventsSorted).toHaveBeenCalledWith(mockRawEventsInput);
		expect(mockGetTodayKey).toHaveBeenCalled();
	});

	it("calls onEventClick with RAW event data when an event item is clicked", async () => {
		const user = userEvent.setup();
		render(
			<ScheduleView
				events={mockRawEventsInput}
				onEventClick={mockOnEventClick}
			/>
		);

		const eventItem = screen.getByText("Sat Late").closest("li");
		await user.click(eventItem);

		expect(mockOnEventClick).toHaveBeenCalledTimes(1);
		expect(mockOnEventClick).toHaveBeenCalledWith(mockRawEventsInput[1]);
	});

	it("handles empty events array gracefully without rendering list items", () => {
		mockGetAllEventsSorted.mockReturnValue([]);
		render(<ScheduleView events={[]} onEventClick={mockOnEventClick} />);

		expect(screen.getByRole("list")).toBeInTheDocument();
		expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
	});

	it("exposes scrollToToday via forwardRef and it scrolls to the first today event", async () => {
		const user = userEvent.setup();
		const ref = React.createRef();
		render(
			<ScheduleView
				events={mockRawEventsInput}
				onEventClick={mockOnEventClick}
				ref={ref}
			/>
		);

		await waitFor(() => expect(ref.current).not.toBeNull());
		expect(screen.getByText("Sat Early (No End)")).toBeInTheDocument(); // First 'today' event

		ref.current.scrollToToday();

		expect(
			window.HTMLElement.prototype.scrollIntoView
		).toHaveBeenCalledTimes(1);
		expect(
			window.HTMLElement.prototype.scrollIntoView
		).toHaveBeenCalledWith({
			behavior: "smooth",
			block: "center",
		});
	});

	it("scrollToToday does nothing if no events for today exist", () => {
		const eventsNotToday = [mockSortedEvents[0], mockSortedEvents[3]];
		mockGetAllEventsSorted.mockReturnValue(eventsNotToday);
		mockGetTodayKey.mockReturnValue("2024-10-21"); // Different day

		const ref = React.createRef();
		render(
			<ScheduleView
				events={mockRawEventsInput}
				onEventClick={mockOnEventClick}
				ref={ref}
			/>
		);

		expect(ref.current).not.toBeNull();
		ref.current.scrollToToday();
		expect(
			window.HTMLElement.prototype.scrollIntoView
		).not.toHaveBeenCalled();
	});

	it("renders list items with correct id attribute", () => {
		render(
			<ScheduleView
				events={mockRawEventsInput}
				onEventClick={mockOnEventClick}
			/>
		);
		const listItems = screen.getAllByRole("listitem");

		expect(listItems[0]).toHaveAttribute(
			"id",
			`schedule-item-${mockSortedEvents[0].id}`
		);
		expect(listItems[1]).toHaveAttribute(
			"id",
			`schedule-item-${mockSortedEvents[1].id}`
		);
		expect(listItems[2]).toHaveAttribute(
			"id",
			`schedule-item-${mockSortedEvents[2].id}`
		);
		expect(listItems[3]).toHaveAttribute(
			"id",
			`schedule-item-${mockSortedEvents[3].id}`
		);
	});
});
