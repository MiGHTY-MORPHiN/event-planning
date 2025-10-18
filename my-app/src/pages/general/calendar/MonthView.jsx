import React from "react";
import {
	generateMonthDays,
	getEventsForDay,
	getTodayKey,
	pad,
} from "./dateUtils";
import "./MonthView.css";

// 1. Accept the new props: events, onEventClick, onDateClick
export default function MonthView({
	month,
	year,
	selectedDate,
	onSelectDate,
	events,
	onEventClick,
	onDateClick,
}) {
	const days = generateMonthDays(year, month);
	const selectedKey = `${selectedDate.getFullYear()}-${pad(
		selectedDate.getMonth() + 1
	)}-${pad(selectedDate.getDate())}`;
	const todayKey = getTodayKey();

	// 2. This function will handle clicks on the entire cell
	const handleCellClick = (day) => {
		if (!day) return;
		const clickedDate = new Date(year, month, day);
		onSelectDate(clickedDate); // Always select the date

		// 3. Check if the day is empty and the handler exists
		const eventsForDay = getEventsForDay(events, year, month, day);
		if (eventsForDay.length === 0 && onDateClick) {
			onDateClick(clickedDate); // Trigger popup for a new event
		}
	};

	// 4. This function handles clicks specifically on an event
	const handleEventClick = (e, event) => {
		e.stopPropagation(); // Prevents handleCellClick from firing
		if (onEventClick) {
			onEventClick(event.raw); // Pass the original raw event data
		}
	};

	// The corrected weekday headers array
	const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

	return (
		<section className="month" aria-label="Month view">
			<table className="month__table">
				<thead>
					<tr>
						{weekdays.map((d) => (
							<th key={d} scope="col" className="month__weekday">
								{d}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{Array.from({ length: Math.ceil(days.length / 7) }).map(
						(_, rowIdx) => (
							<tr key={rowIdx}>
								{days
									.slice(rowIdx * 7, rowIdx * 7 + 7)
									.map((day, colIdx) => {
										const dateKey = day
											? `${year}-${pad(month + 1)}-${pad(
													day
											  )}`
											: null;
										const isToday = dateKey === todayKey;
										const isSelected =
											dateKey === selectedKey;

										// 5. Pass the full events array to the utility function
										const dayEvents = day
											? getEventsForDay(
													events,
													year,
													month,
													day
											  )
											: [];

										return (
											<td
												key={colIdx}
												className={`month__cell ${
													isToday
														? "month__cell--today"
														: ""
												} ${
													isSelected
														? "month__cell--selected"
														: ""
												}`}
												onClick={() =>
													handleCellClick(day)
												} // Use the new handler
												role={
													day ? "button" : undefined
												}
												tabIndex={day ? 0 : -1}
												aria-label={
													day
														? `Events for ${year}-${pad(
																month + 1
														  )}-${pad(day)}`
														: "Empty cell"
												}
											>
												<div className="month__cell-inner">
													{day && (
														<time
															className="month__date"
															dateTime={dateKey}
														>
															{day}
														</time>
													)}
													<ul className="month__events">
														{dayEvents.map((ev) => (
															<li
																key={ev.id}
																className="month__event"
																onClick={(e) =>
																	handleEventClick(
																		e,
																		ev
																	)
																} // Use event-specific handler
															>
																{ev.title}
															</li>
														))}
													</ul>
												</div>
											</td>
										);
									})}
							</tr>
						)
					)}
				</tbody>
			</table>
		</section>
	);
}
