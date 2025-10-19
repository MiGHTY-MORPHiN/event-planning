import React, { useRef, useState } from "react";
import MonthView from "./MonthView";
import WeekView from "./WeekView";
import DayView from "./DayView";
import ScheduleView from "./ScheduleView";
import { getMonthName } from "./dateUtils.js";
import "./Calendar.css";

export default function Calendar({ events, onEventClick, onDateClick }) {
	const today = new Date();
	const [view, setView] = useState("month");
	const [month, setMonth] = useState(today.getMonth());
	const [year, setYear] = useState(today.getFullYear());
	const [selectedDate, setSelectedDate] = useState(today);

	const scheduleRef = useRef(null);

	const prev = () => {
		if (view === "month") {
			if (month === 0) {
				setMonth(11);
				setYear((y) => y - 1);
			} else setMonth((m) => m - 1);
		} else if (view === "week") {
			const d = new Date(selectedDate);
			d.setDate(d.getDate() - 7);
			setSelectedDate(d);
		} else if (view === "day") {
			const d = new Date(selectedDate);
			d.setDate(d.getDate() - 1);
			setSelectedDate(d);
		}
	};

	const next = () => {
		if (view === "month") {
			if (month === 11) {
				setMonth(0);
				setYear((y) => y + 1);
			} else setMonth((m) => m + 1);
		} else if (view === "week") {
			const d = new Date(selectedDate);
			d.setDate(d.getDate() + 7);
			setSelectedDate(d);
		} else if (view === "day") {
			const d = new Date(selectedDate);
			d.setDate(d.getDate() + 1);
			setSelectedDate(d);
		}
	};

	const goToday = () => {
		const now = new Date();
		setSelectedDate(now);
		setMonth(now.getMonth());
		setYear(now.getFullYear());
		if (view === "schedule" && scheduleRef.current?.scrollToToday) {
			scheduleRef.current.scrollToToday();
		}
	};

	return (
		<section className="cal__container" aria-label="Calendar">
			<header className="cal__header">
				<nav className="cal__nav" aria-label="Calendar navigation">
					<div className="cal__nav-controls" role="group">
						<button className="cal__nav-btn" onClick={prev}>
							‹
						</button>
						<button
							className="cal__nav-btn cal__today-btn"
							onClick={goToday}
						>
							Today
						</button>
						<button className="cal__nav-btn" onClick={next}>
							›
						</button>
					</div>
					<h2 className="cal__title" aria-live="polite">
						{view === "month" && `${getMonthName(month)} ${year}`}
						{view === "week" &&
							`Week of ${selectedDate.toDateString()}`}
						{view === "day" && selectedDate.toDateString()}
						{view === "schedule" && "Schedule"}
					</h2>
				</nav>
				<nav className="cal__view-switch" aria-label="View switch">
					{["month", "week", "day", "schedule"].map((v) => (
						<button
							key={v}
							className={`cal__view-btn ${
								view === v ? "is-active" : ""
							}`}
							onClick={() => setView(v)}
							aria-pressed={view === v}
						>
							{v.charAt(0).toUpperCase() + v.slice(1)}
						</button>
					))}
				</nav>
			</header>

			<main className="cal__body">
				{view === "month" && (
					<MonthView
						month={month}
						year={year}
						selectedDate={selectedDate}
						onSelectDate={setSelectedDate}
						events={events}
						onEventClick={onEventClick}
						onDateClick={onDateClick} // Pass down the new prop
					/>
				)}
				{view === "week" && (
					<WeekView
						selectedDate={selectedDate}
						events={events}
						onEventClick={onEventClick}
						onEmptySlotClick={(start) => onDateClick(start)}
					/>
				)}
				{view === "day" && (
					<DayView
						selectedDate={selectedDate}
						events={events}
						onEventClick={onEventClick}
						onEmptySlotClick={(start) => onDateClick(start)}
					/>
				)}
				{view === "schedule" && (
					<ScheduleView
						ref={scheduleRef}
						selectedDate={selectedDate}
						events={events}
						onEventClick={onEventClick}
					/>
				)}
			</main>
		</section>
	);
}
