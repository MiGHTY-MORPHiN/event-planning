/**
 * @vitest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import EventBlock from "../../pages/general/calendar/EventBlock.jsx";

// Mock dateUtils
vi.mock("../../pages/general/calendar/dateUtils.js", async (importOriginal) => {
	const actual = await importOriginal();
	return {
		...actual,
		minutesToDurationString: vi.fn((min) =>
			actual.minutesToDurationString(min)
		),
	};
});

// Import the mocked module after mocking
import {
	minutesToDurationString,
	parseTimeToMinutes,
} from "../../pages/general/calendar/dateUtils.js";

describe("EventBlock Component", () => {
	const baseEvent = {
		id: "evt123",
		title: "Sample Event Title Long Enough To Ellipsis Maybe",
		start: new Date(2024, 6, 15, 10, 30),
		end: new Date(2024, 6, 15, 12, 0),
		startMin: parseTimeToMinutes("10:30"),
		durationMin: 90,
	};

	const mockOnEventClick = vi.fn();

	beforeEach(() => {
		mockOnEventClick.mockClear();
		minutesToDurationString.mockClear();
	});

	it("renders event details: title, start time, end time, duration", () => {
		const { container } = render(
			<EventBlock
				event={baseEvent}
				onEventClick={mockOnEventClick}
				pxPerMinute={2}
			/>
		);

		const article = screen.getByRole("article", {
			name: /Sample Event Title.*from.*10:30.*to.*12:00/i,
		});
		expect(article).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { name: baseEvent.title, level: 5 })
		).toBeInTheDocument();
		expect(screen.getByText("10:30")).toBeInTheDocument();
		expect(screen.getByText("12:00")).toBeInTheDocument();
		expect(minutesToDurationString).toHaveBeenCalledWith(90);

		const timeParagraph = screen.getByText(/10:30/).closest("p");
		expect(timeParagraph).toHaveTextContent("10:30 — 12:00 (1h 30m)");

		const timeElements = container.querySelectorAll("time");
		expect(timeElements.length).toBe(2);
		expect(timeElements[0]).toHaveAttribute(
			"dateTime",
			baseEvent.start.toISOString()
		);
		expect(timeElements[1]).toHaveAttribute(
			"dateTime",
			baseEvent.end.toISOString()
		);
	});

	it("calculates and applies correct 'top' and 'height' styles based on pxPerMinute", () => {
		const pxPerMinute = 3;
		render(
			<EventBlock
				event={baseEvent}
				onEventClick={mockOnEventClick}
				pxPerMinute={pxPerMinute}
			/>
		);

		const article = screen.getByRole("article");
		const expectedTop = baseEvent.startMin * pxPerMinute;
		const expectedHeight = Math.max(6, baseEvent.durationMin * pxPerMinute);

		expect(article).toHaveStyle(`top: ${expectedTop}px`);
		expect(article).toHaveStyle(`height: ${expectedHeight}px`);
	});

	it("uses default pxPerMinute=2 if prop is not provided", () => {
		render(
			<EventBlock event={baseEvent} onEventClick={mockOnEventClick} />
		);

		const article = screen.getByRole("article");
		const expectedTop = baseEvent.startMin * 2;
		const expectedHeight = Math.max(6, baseEvent.durationMin * 2);

		expect(article).toHaveStyle(`top: ${expectedTop}px`);
		expect(article).toHaveStyle(`height: ${expectedHeight}px`);
	});

	it("applies minimum height of 6px for very short durations", () => {
		const shortEvent = {
			...baseEvent,
			end: new Date(2024, 6, 15, 10, 31),
			durationMin: 1,
		};
		const pxPerMinute = 3;
		render(
			<EventBlock
				event={shortEvent}
				onEventClick={mockOnEventClick}
				pxPerMinute={pxPerMinute}
			/>
		);
		const article = screen.getByRole("article");
		expect(article).toHaveStyle(`height: 6px`);
	});

	it("calls onEventClick handler with the full event object when clicked", () => {
		render(
			<EventBlock
				event={baseEvent}
				onEventClick={mockOnEventClick}
				pxPerMinute={2}
			/>
		);

		fireEvent.click(screen.getByRole("article"));

		expect(mockOnEventClick).toHaveBeenCalledTimes(1);
		expect(mockOnEventClick).toHaveBeenCalledWith(baseEvent);
	});

	it("stops event propagation when clicked, preventing parent handlers", () => {
		const parentClickHandler = vi.fn();
		render(
			<div onClick={parentClickHandler} data-testid="parent-container">
				<EventBlock
					event={baseEvent}
					onEventClick={mockOnEventClick}
					pxPerMinute={2}
				/>
			</div>
		);

		fireEvent.click(screen.getByRole("article"));

		expect(mockOnEventClick).toHaveBeenCalledTimes(1);
		expect(parentClickHandler).not.toHaveBeenCalled();
	});

	it("renders correctly when event.end is missing (uses default duration)", () => {
		const eventNoEnd = {
			id: "evt456",
			title: "Event Without End Time",
			start: new Date(2024, 6, 15, 14, 0),
			startMin: parseTimeToMinutes("14:00"),
			durationMin: 60,
		};

		const { container } = render(
			<EventBlock
				event={eventNoEnd}
				onEventClick={mockOnEventClick}
				pxPerMinute={2}
			/>
		);

		expect(
			screen.getByRole("heading", { name: "Event Without End Time" })
		).toBeInTheDocument();
		expect(screen.getByText("14:00", { exact: false })).toBeInTheDocument();

		const timeParagraph = screen.getByText(/14:00/).closest("p");
		expect(timeParagraph.textContent).not.toMatch(/—\s*\d{2}:\d{2}/);

		const timeElements = container.querySelectorAll("time");
		expect(timeElements.length).toBe(1);
		expect(timeElements[0]).toHaveAttribute(
			"dateTime",
			eventNoEnd.start.toISOString()
		);

		// Use the mocked function directly, not the separate spy
		expect(minutesToDurationString).toHaveBeenCalledWith(60);
		expect(timeParagraph).toHaveTextContent("(1h)");

		const article = screen.getByRole("article");
		const expectedTop = eventNoEnd.startMin * 2;
		const expectedHeight = Math.max(6, eventNoEnd.durationMin * 2);
		expect(article).toHaveStyle(`top: ${expectedTop}px`);
		expect(article).toHaveStyle(`height: ${expectedHeight}px`);
	});

	it("applies correct CSS classes for structure and styling", () => {
		render(
			<EventBlock event={baseEvent} onEventClick={mockOnEventClick} />
		);
		const article = screen.getByRole("article");
		expect(article).toHaveClass("event-block");
		expect(article.querySelector("header")).toHaveClass(
			"event-block__header"
		);
		expect(screen.getByRole("heading", { level: 5 })).toHaveClass(
			"event-block__title"
		);
		const timeParagraph = screen.getByText(/10:30/).closest("p");
		expect(timeParagraph).toHaveClass("event-block__time");
	});
});
