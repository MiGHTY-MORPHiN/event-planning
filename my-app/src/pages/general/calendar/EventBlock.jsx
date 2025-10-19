import React from "react";
import { minutesToDurationString } from "./dateUtils.js";
import "./EventBlock.css";

/**
 * Renders an event as an absolutely positioned article.
 * Only semantic elements used (article, time, h5, p).
 */
// 1. Add onEventClick to the list of props
export default function EventBlock({ event, onEventClick, pxPerMinute = 2 }) {
	const top = event.startMin * pxPerMinute;
	const height = Math.max(6, event.durationMin * pxPerMinute);

	// This function will handle the click and stop it from bubbling up to the parent container
	const handleClick = (e) => {
		e.stopPropagation(); // Prevents the calendar day's click handler from firing
		if (onEventClick) {
			onEventClick(event); // Call the function passed in via props
		}
	};

	return (
		<article
			onClick={handleClick} // 2. Use the corrected handler
			className="event-block"
			style={{ top: `${top}px`, height: `${height}px` }}
			aria-label={`${event.title} from ${event.start} to ${event.end}`}
		>
			<header className="event-block__header">
				<h5 className="event-block__title">{event.title}</h5>
			</header>
			<p className="event-block__time">
				<time dateTime={event.start.toISOString()}>
					{event.start.toLocaleTimeString([], {
						hour: "2-digit",
						minute: "2-digit",
						hour12: false,
					})}
				</time>
				&nbsp;—&nbsp;
				{event.end && (
					<time dateTime={event.end.toISOString()}>
						{event.end.toLocaleTimeString([], {
							hour: "2-digit",
							minute: "2-digit",
							hour12: false,
						})}
					</time>
				)}
				&nbsp;({minutesToDurationString(event.durationMin)})
			</p>
		</article>
	);
}
