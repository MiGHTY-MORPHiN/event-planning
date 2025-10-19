/**
 * @vitest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import DayView from "../../pages/general/calendar/DayView"; // Adjust path if needed
import * as dateUtilsActual from "../../pages/general/calendar/dateUtils"; // Import actual

// --- Mock Child Components ---
vi.mock("../../pages/general/calendar/EventBlock", () => ({
	default: ({ event, onEventClick, pxPerMinute }) => (
		<div
			data-testid={`event-block-${event.id}`}
			style={{
				position: "absolute",
				top: `${event.startMin * pxPerMinute}px`,
				height: `${event.durationMin * pxPerMinute}px`,
			}}
			onClick={() => onEventClick(event.raw)} // Pass RAW event data
			role="button"
			aria-label={`Mock event: ${event.title}`}
		>
			{event.title} ({event.id})
		</div>
	),
}));

// --- Mock dateUtils ---
// Define mocks INSIDE the factory function to avoid hoisting issues
vi.mock("../../pages/general/calendar/dateUtils", async () => {
	const actual = await vi.importActual(
		"../../pages/general/calendar/dateUtils"
	);
	// Define the mock functions within the factory scope
	const mockGetEventsForDay = vi.fn();
	const mockGetTodayKey = vi.fn();
	const mockFormatDateKey = vi.fn((date) => actual.formatDateKey(date)); // Use actual

	return {
		...actual, // Keep actual pad, etc.
		// Override with mocks defined above
		getEventsForDay: mockGetEventsForDay,
		getTodayKey: mockGetTodayKey,
		formatDateKey: mockFormatDateKey,
	};
});

// Import the mocked functions *after* setting up the mock
const {
	getEventsForDay: mockGetEventsForDay,
	getTodayKey: mockGetTodayKey,
	formatDateKey: mockFormatDateKey,
	pad,
} = await import("../../pages/general/calendar/dateUtils");

describe("DayView Component", () => {
	// --- Mock Callbacks ---
	const mockOnEventClick = vi.fn();

	// --- Test Data ---
	const selectedDate = new Date(2024, 6, 17); // Wednesday, July 17, 2024
	const todayDate = new Date(2024, 6, 17); // Make selected date = today
	const notTodayDate = new Date(2024, 6, 16); // Tuesday, July 16, 2024
	const todayKeyActual = dateUtilsActual.formatDateKey(todayDate); // "2024-07-17"

	// Raw event data as passed in props
	const mockRawEvents = [
		{
			id: "evt-day-1",
			name: "Morning Coffee",
			start: new Date(2024, 6, 17, 8, 30),
			end: new Date(2024, 6, 17, 9, 0),
		},
		{
			id: "evt-day-2",
			name: "Team Sync",
			start: new Date(2024, 6, 17, 11, 0),
		}, // No end time
	];

	// Processed events as getEventsForDay mock should return
	const processedEvent1 = {
		id: "evt-day-1",
		title: "Morning Coffee",
		start: new Date(2024, 6, 17, 8, 30),
		end: new Date(2024, 6, 17, 9, 0),
		startMin: 8 * 60 + 30,
		durationMin: 30,
		raw: mockRawEvents[0],
	};
	const processedEvent2 = {
		id: "evt-day-2",
		title: "Team Sync",
		start: new Date(2024, 6, 17, 11, 0),
		startMin: 11 * 60,
		durationMin: 60, // Default duration
		raw: mockRawEvents[1],
	};
	const mockProcessedEvents = [processedEvent1, processedEvent2];

	beforeEach(() => {
		// Reset mocks before each test
		vi.clearAllMocks(); // Clears call history etc. for mocks defined in vi.mock

		// Setup mock implementations for this test suite using the imported mock functions
		mockGetTodayKey.mockReturnValue(todayKeyActual);
		// getEventsForDay mock returns the processed events for the selected date
		mockGetEventsForDay.mockReturnValue(mockProcessedEvents);
		// mockFormatDateKey uses actual implementation via mock factory
	});

	it("renders the day header with the correct date string", () => {
		render(
			<DayView
				events={mockRawEvents} // Pass raw events
				selectedDate={selectedDate}
				onEventClick={mockOnEventClick}
			/>
		);
		// Check header text matches the selected date's string representation
		expect(
			screen.getByRole("heading", { name: selectedDate.toDateString() })
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { name: selectedDate.toDateString() })
		).toHaveClass("day__title");
	});

	it("shows the 'Today' badge when the selected date is today", () => {
		render(
			<DayView
				events={mockRawEvents}
				selectedDate={todayDate} // Use today date
				onEventClick={mockOnEventClick}
			/>
		);
		const badge = screen.getByText("Today");
		expect(badge).toBeInTheDocument();
		expect(badge).toHaveClass("day__today-badge");
		// Check associated <time> tag for semantics
		expect(badge).toHaveAttribute("dateTime", todayKeyActual);
	});

	it("does not show the 'Today' badge when the selected date is not today", () => {
		render(
			<DayView
				events={mockRawEvents}
				selectedDate={notTodayDate} // Use a different date
				onEventClick={mockOnEventClick}
			/>
		);
		expect(screen.queryByText("Today")).not.toBeInTheDocument();
	});

	it("renders the main day column with grid lines", () => {
		const { container } = render(
			<DayView
				events={mockRawEvents}
				selectedDate={selectedDate}
				onEventClick={mockOnEventClick}
			/>
		);

		const dayColumn = screen.getByRole("article", { name: "Day timeline" });
		expect(dayColumn).toBeInTheDocument();
		expect(dayColumn).toHaveClass("day__col");
		// Check height style
		const expectedHeight = 24 * 60 * 2; // pxPerMinute = 2
		expect(dayColumn).toHaveStyle(`height: ${expectedHeight}px`);

		// Check for grid rows using querySelectorAll on the container or dayColumn
		const gridRows = dayColumn.querySelectorAll(".day__grid-row");
		expect(gridRows.length).toBe(24);
		// Check style height based on default pxPerMinute=2
		expect(gridRows[0]).toHaveStyle("height: 120px"); // 2 * 60
		expect(gridRows[0]).toHaveClass("day__grid-row"); // Check class

		// Check internal structure (main > ul > li)
		expect(dayColumn.querySelector("main.day__grid")).toBeInTheDocument();
		expect(
			dayColumn.querySelector("ul.day__grid-rows")
		).toBeInTheDocument();
	});

	it("highlights time column and day column if selected date is today", () => {
		const { container } = render(
			<DayView
				events={mockRawEvents}
				selectedDate={todayDate} // Use today date
				onEventClick={mockOnEventClick}
			/>
		);
		const timeColumn = container.querySelector(".day__timecol");
		expect(timeColumn).toHaveClass("day__timecol--today");
		expect(
			screen.getByRole("article", { name: "Day timeline" })
		).toHaveClass("day__col--today");
	});

	it("does NOT highlight columns if selected date is not today", () => {
		const { container } = render(
			<DayView
				events={mockRawEvents}
				selectedDate={notTodayDate} // Use different date
				onEventClick={mockOnEventClick}
			/>
		);
		const timeColumn = container.querySelector(".day__timecol");
		expect(timeColumn).not.toHaveClass("day__timecol--today");
		expect(
			screen.getByRole("article", { name: "Day timeline" })
		).not.toHaveClass("day__col--today");
	});

	it("renders event blocks at the correct positions within the day column", () => {
		render(
			<DayView
				events={mockRawEvents} // Pass raw events
				selectedDate={selectedDate}
				onEventClick={mockOnEventClick}
			/>
		);

		// Find event blocks using their test IDs from the mock
		const event1 = screen.getByTestId("event-block-evt-day-1");
		const event2 = screen.getByTestId("event-block-evt-day-2");

		// Check Event 1: 8:30 - 9:00 (30 min)
		expect(event1).toBeInTheDocument();
		expect(event1).toHaveTextContent("Morning Coffee (evt-day-1)");
		// Use default pxPerMinute = 2
		expect(event1).toHaveStyle(`top: ${processedEvent1.startMin * 2}px`); // (8*60+30)*2 = 1020px
		expect(event1).toHaveStyle(
			`height: ${processedEvent1.durationMin * 2}px`
		); // 30*2 = 60px

		// Check Event 2: 11:00 - ? (default 60 min)
		expect(event2).toBeInTheDocument();
		expect(event2).toHaveTextContent("Team Sync (evt-day-2)");
		expect(event2).toHaveStyle(`top: ${processedEvent2.startMin * 2}px`); // (11*60)*2 = 1320px
		expect(event2).toHaveStyle(
			`height: ${processedEvent2.durationMin * 2}px`
		); // 60*2 = 120px

		// Verify mocks were called
		expect(mockGetEventsForDay).toHaveBeenCalledWith(
			mockRawEvents,
			selectedDate.getFullYear(),
			selectedDate.getMonth(),
			selectedDate.getDate()
		);
	});

	it("handles empty events array gracefully without rendering event blocks", () => {
		// Override mock getEventsForDay for this specific test
		mockGetEventsForDay.mockReturnValue([]);
		const { container } = render(
			<DayView
				events={[]} // Empty array passed as prop
				selectedDate={selectedDate}
				onEventClick={mockOnEventClick}
			/>
		);

		// Basic structure should still render
		expect(screen.getByRole("heading")).toBeInTheDocument();
		const timeColumn = container.querySelector(".day__timecol");
		expect(timeColumn).toBeInTheDocument();
		expect(
			screen.getByRole("article", { name: "Day timeline" })
		).toBeInTheDocument();

		// No event blocks should be found (using the mock's test id)
		expect(screen.queryByTestId(/event-block-/)).not.toBeInTheDocument();
		// The events layer section should be empty
		const eventsLayer = screen.getByLabelText("Events for today");
		expect(eventsLayer.children.length).toBe(0);
	});
});
