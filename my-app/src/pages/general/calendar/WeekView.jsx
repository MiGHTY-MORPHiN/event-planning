import React from "react";
import {
	getWeekDaysFromDate,
	getEventsForDay,
	getTodayKey,
	pad,
} from "./dateUtils";
import EventBlock from "./EventBlock";
import "./WeekView.css";

export default function WeekView({ events, selectedDate, onEventClick }) {
	const days = getWeekDaysFromDate(selectedDate);
	const todayKey = getTodayKey();
	const pxPerMinute = 2;
	const dayHeight = 24 * 60 * pxPerMinute;

	// Helper to format the day header
	const DayHeader = ({ day }) => {
		const key = `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(
			day.getDate()
		)}`;
		const isToday = key === todayKey;
		const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
			day.getDay()
		];

		return (
			<div
				className={`week__day-head ${
					isToday ? "week__day-head--today" : ""
				}`}
				aria-label={`Day ${day.toDateString()}`}
			>
				<span className="week__day-name">{dayName}</span>
				<span className="week__day-number">{day.getDate()}</span>
			</div>
		);
	};

	return (
		<section className="week" aria-label="Week view">
			{/* --- Header Section (Non-scrolling part) --- */}
			<header className="week__header">
				<div className="week__header-time-gutter"></div>{" "}
				{/* Top-left corner */}
				{days.map((d) => (
					<DayHeader key={d.toISOString()} day={d} />
				))}
			</header>

			{/* --- Main Scrolling Container --- */}
			<div className="week__scroll-container">
				<div className="week__body" style={{ height: dayHeight }}>
					{/* Time Column (Sticks to the left) */}
					<aside className="week__timecol" aria-hidden="true">
						<ul className="week__hours">
							{Array.from({ length: 24 }).map((_, h) => (
								<li
									key={h}
									className="week__hour"
									style={{ height: pxPerMinute * 60 }}
								>
									<span>{h === 0 ? "" : `${pad(h)}:00`}</span>
								</li>
							))}
						</ul>
					</aside>

					{/* Day Columns for events */}
					{days.map((d) => {
						const key = `${d.getFullYear()}-${pad(
							d.getMonth() + 1
						)}-${pad(d.getDate())}`;
						const isToday = key === todayKey;
						const dayEvents = getEventsForDay(
							events,
							d.getFullYear(),
							d.getMonth(),
							d.getDate()
						);

						return (
							<article
								key={d.toISOString()}
								className={`week__daycol ${
									isToday ? "week__daycol--today" : ""
								}`}
								aria-label={`Events for ${d.toDateString()}`}
							>
								{/* Grid lines for background */}
								<div className="week__grid-rows">
									{Array.from({ length: 24 }).map((_, h) => (
										<div
											key={h}
											className="week__grid-row"
											style={{ height: pxPerMinute * 60 }}
										/>
									))}
								</div>

								{/* Events layer */}
								<section
									className="week__events-layer"
									aria-live="polite"
								>
									{dayEvents.map((ev) => (
										<EventBlock
											key={ev.id}
											event={ev}
											pxPerMinute={pxPerMinute}
											onEventClick={onEventClick}
										/>
									))}
								</section>
							</article>
						);
					})}
				</div>
			</div>
		</section>
	);
}
