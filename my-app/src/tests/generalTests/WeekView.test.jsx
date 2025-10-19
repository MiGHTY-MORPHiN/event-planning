/**
 * @vitest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import WeekView from "../../pages/general/calendar/WeekView"; // Adjust path if needed
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
			onClick={() => onEventClick(event.raw)}
			role="button"
			aria-label={`Mock event: ${event.title}`}
		>
			{event.title} ({event.id})
		</div>
	),
}));

// --- Mock dateUtils ---
// Use actual implementations but allow specific functions to be mocked/spied if needed later
// For this test, we mock the ones WeekView *relies on* for its logic.
vi.mock("../../pages/general/calendar/dateUtils", async () => {
	const actual = await vi.importActual(
		"../../pages/general/calendar/dateUtils"
	);
	return {
		...actual, // Keep original pad, formatDateKey etc. by default
		// Mock the ones WeekView relies on
		getWeekDaysFromDate: vi.fn(),
		getEventsForDay: vi.fn(),
		getTodayKey: vi.fn(),
	};
});
// Import mocked functions *after* setting up the mock
const { getWeekDaysFromDate, getEventsForDay, getTodayKey, formatDateKey } =
	await import("../../pages/general/calendar/dateUtils");

describe("WeekView Component", () => {
	const mockOnEventClick = vi.fn();

	// Use consistent dates for testing
	const selectedDate = new Date(2023, 9, 26); // Thursday, Oct 26, 2023
	const today = new Date(2023, 9, 25); // Wednesday, Oct 25, 2023
	const todayKeyActual = formatDateKey(today); // Use actual function for mock setup

	// Mock return value for getWeekDaysFromDate (Week starting Mon Oct 23)
	const mockWeekDays = [
		new Date(2023, 9, 23), // Mon
		new Date(2023, 9, 24), // Tue
		new Date(2023, 9, 25), // Wed (Today)
		new Date(2023, 9, 26), // Thu (Selected)
		new Date(2023, 9, 27), // Fri
		new Date(2023, 9, 28), // Sat
		new Date(2023, 9, 29), // Sun
	];

	// Raw event data
	const mockRawEvents = [
		{
			id: "evt1",
			name: "Event on Wed",
			start: new Date(2023, 9, 25, 9, 0),
		},
		{
			id: "evt2",
			name: "Event on Thu",
			start: new Date(2023, 9, 26, 14, 0),
			end: new Date(2023, 9, 26, 15, 30),
		},
	];

	// Corresponding processed events
	const processedEvent1 = {
		id: "evt1",
		title: "Event on Wed",
		start: new Date(2023, 9, 25, 9, 0),
		startMin: 9 * 60,
		durationMin: 60,
		raw: mockRawEvents[0],
	};
	const processedEvent2 = {
		id: "evt2",
		title: "Event on Thu",
		start: new Date(2023, 9, 26, 14, 0),
		end: new Date(2023, 9, 26, 15, 30),
		startMin: 14 * 60,
		durationMin: 90,
		raw: mockRawEvents[1],
	};

	beforeEach(() => {
		vi.clearAllMocks();
		// Setup mocks
		getWeekDaysFromDate.mockReturnValue(mockWeekDays);
		getTodayKey.mockReturnValue(todayKeyActual);
		getEventsForDay.mockImplementation((events, y, m, d) => {
			const targetDate = new Date(y, m, d);
			if (targetDate.toDateString() === today.toDateString())
				return [processedEvent1];
			if (targetDate.toDateString() === selectedDate.toDateString())
				return [processedEvent2];
			return [];
		});
	});

	it("renders the week header with correct days, dates, and today highlight", () => {
		render(
			<WeekView
				events={mockRawEvents}
				selectedDate={selectedDate}
				onEventClick={mockOnEventClick}
			/>
		);

		const header = screen.getByRole("banner");
		expect(header).toHaveClass("week__header");

		// Corrected: Match the full aria-label format "Day DayName Month Day Year"
		const dayHeaders = screen.getAllByLabelText(
			/^Day \w{3} \w{3} \d{1,2} \d{4}$/
		);
		expect(dayHeaders).toHaveLength(7);

		// Check content
		expect(within(dayHeaders[0]).getByText("Mon")).toBeInTheDocument();
		expect(within(dayHeaders[0]).getByText("23")).toBeInTheDocument();
		expect(within(dayHeaders[6]).getByText("Sun")).toBeInTheDocument();
		expect(within(dayHeaders[6]).getByText("29")).toBeInTheDocument();

		// Check today's highlight (Wednesday 25th is index 2)
		expect(dayHeaders[2]).toHaveClass("week__day-head--today");
		expect(within(dayHeaders[2]).getByText("25")).toHaveClass(
			"week__day-number"
		);

		// Check non-today
		expect(dayHeaders[0]).not.toHaveClass("week__day-head--today");
	});

	it("highlights today's header", () => {
		render(
			<WeekView
				events={mockRawEvents}
				selectedDate={selectedDate}
				onEventClick={mockOnEventClick}
			/>
		);
		const todayHeader = screen.getByText("25").closest(".week__day-head");
		expect(todayHeader).toHaveClass("week__day-head--today");
	});

	it("renders day columns with grid lines", () => {
		render(
			<WeekView
				events={mockRawEvents}
				selectedDate={selectedDate}
				onEventClick={mockOnEventClick}
			/>
		);

		// Articles have specific aria-labels
		const dayColumns = screen.getAllByLabelText(
			/^Events for \w{3} \w{3} \d{1,2} \d{4}$/
		);
		expect(dayColumns).toHaveLength(7);
		expect(dayColumns[0]).toHaveClass("week__daycol");

		// Check grid rows within the first column
		const gridRows = dayColumns[0].querySelectorAll(".week__grid-row");
		expect(gridRows.length).toBe(24);
	});

	it("highlights today's day column", () => {
		render(
			<WeekView
				events={mockRawEvents}
				selectedDate={selectedDate}
				onEventClick={mockOnEventClick}
			/>
		);
		const dayColumns = screen.getAllByRole("article");
		expect(dayColumns[2]).toHaveClass("week__daycol--today"); // Wednesday index 2
	});

	it("renders events in the correct day columns and positions", () => {
		render(
			<WeekView
				events={mockRawEvents}
				selectedDate={selectedDate}
				onEventClick={mockOnEventClick}
			/>
		);

		// Use more specific aria-labels to find columns
		const wedCol = screen.getByLabelText("Events for Wed Oct 25 2023");
		const thuCol = screen.getByLabelText("Events for Thu Oct 26 2023");
		const monCol = screen.getByLabelText("Events for Mon Oct 23 2023");

		// Check Event on Wed (index 2)
		const eventWed = within(wedCol).getByTestId("event-block-evt1");
		expect(eventWed).toBeInTheDocument();
		expect(eventWed).toHaveTextContent("Event on Wed (evt1)");
		expect(eventWed).toHaveStyle("top: 1080px"); // 9 * 60 * 2

		// Check Event on Thu (index 3)
		const eventThu = within(thuCol).getByTestId("event-block-evt2");
		expect(eventThu).toBeInTheDocument();
		expect(eventThu).toHaveTextContent("Event on Thu (evt2)");
		expect(eventThu).toHaveStyle("top: 1680px"); // 14 * 60 * 2

		// Check Monday (Empty)
		expect(
			within(monCol).queryByTestId(/event-block-/)
		).not.toBeInTheDocument();
	});

	it("calls onEventClick with RAW event data when an event is clicked", () => {
		render(
			<WeekView
				events={mockRawEvents}
				selectedDate={selectedDate}
				onEventClick={mockOnEventClick}
			/>
		);

		const eventElement = screen.getByTestId("event-block-evt2");
		fireEvent.click(eventElement);

		expect(mockOnEventClick).toHaveBeenCalledTimes(1);
		// Check the mock EventBlock passes the raw data
		expect(mockOnEventClick).toHaveBeenCalledWith(mockRawEvents[1]); // raw evt2
	});

	it("handles empty events array gracefully", () => {
		// Override mock for this test
		getEventsForDay.mockReturnValue([]);
		const { container } = render(
			// Destructure container
			<WeekView
				events={[]}
				selectedDate={selectedDate}
				onEventClick={mockOnEventClick}
			/>
		);

		// Check structure exists
		expect(screen.getByRole("banner")).toBeInTheDocument(); // Header
		// Corrected: Use querySelector for the time column
		const timeColumn = container.querySelector(".week__timecol");
		expect(timeColumn).toBeInTheDocument();
		expect(screen.getAllByRole("article")).toHaveLength(7); // Day cols

		// No events should be found
		expect(screen.queryByTestId(/event-block-/)).not.toBeInTheDocument();
	});
});
