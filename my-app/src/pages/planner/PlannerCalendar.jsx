import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";

// Import your existing components
import Calendar from "../general/calendar/Calendar";
import Popup from "../general/popup/Popup";
import PlannerViewEvent from "./PlannerViewEvent";
import NewEvent from "./NewEvent";
import PlannerAllEvents from "./PlannerAllEvents";

import "./PlannerCalendar.css";

export default function PlannerCalender({ setActivePage, onSelectEvent }) {
	const [events, setEvents] = useState([]);
	const [isPopupOpen, setIsPopupOpen] = useState(false);
	const [selectedEvent, setSelectedEvent] = useState(null);
	const [activeTab, setActiveTab] = useState("calendar");


	// **NEW**: State to control the "Create New Event" popup's visibility
	const [isCreatePopupOpen, setIsCreatePopupOpen] = useState(false);
	// Fetch and format event data when the component mounts
	useEffect(() => {
		const fetchAndFormatEvents = async () => {
			try {
				const auth = getAuth();
				const user = auth.currentUser;
				if (!user) return;

				const token = await user.getIdToken(true);
				const response = await fetch(
					"https://us-central1-planit-sdp.cloudfunctions.net/api/planner/me/events",
					{
						headers: { Authorization: `Bearer ${token}` },
					}
				);

				if (!response.ok) throw new Error("Failed to fetch events");

				const data = await response.json();

				// **CRITICAL**: Transform the raw API data for the calendar
				const formattedEvents = (data.events || []).map((event) => {
					const startDate = event.date?._seconds
						? new Date(event.date._seconds * 1000)
						: new Date();
					const endDate = event.duration
						? new Date(
								startDate.getTime() +
									parseInt(event.duration, 10) * 3600 * 1000
						  )
						: null;

					return {
						id: event.id,
						title: event.name,
						start: startDate,
						end: endDate,
						raw: event, // Keep original data for the popup
					};
				});

				setEvents(formattedEvents);
			} catch (error) {
				console.error("Error fetching or formatting events:", error);
			}
		};

		fetchAndFormatEvents();
	}, []);

	// Called when an event is clicked on the calendar
	const handleEventClick = (event) => {
		setSelectedEvent(event); // Set the clicked event
		setIsPopupOpen(true); // Open the popup
	};

	const handleDateClick = (date) => {
		setSelectedDate(date);
		setIsCreatePopupOpen(true);
	};

	// **NEW**: Handlers for the "Create Event" popup
	const handleOpenCreatePopup = () => {
		setIsCreatePopupOpen(true);
	};

	const handleSaveNewEvent = async (newEventData) => {
		// Here you would add the logic to send the new event to your API
		console.log("New event saved:", newEventData);
		// After saving, close the popup
		handleCloseCreatePopup();
		// You should also refetch your events or add the new event to the state
		// so the calendar updates immediately.
	};

	const handleCloseCreatePopup = () => {
		setIsCreatePopupOpen(false);
	};

	// Closes the popup
	const handleClosePopup = () => {
		setIsPopupOpen(false);
		setSelectedEvent(null);
	};

	return (
		<section data-testid="planner-all-events" className="events-list">

            <section className="tabs-container">
                <section className="tabs">
                    <button 
                        className={`tab-btn ${activeTab === "calendar" ? "active" : ""}`}
                        onClick={() => setActiveTab("calendar")}
                    >
                        Calendar View
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === "list" ? "active" : ""}`}
                        onClick={() => setActiveTab("list")}
                    >
                        List View
                    </button>
                </section>    
            </section>

            <section className="tab-content">
                {activeTab === "calendar" && (
                    <section className="calendar-view">
						<header className="all-events-header">
							<h2>My Events Calendar</h2>
							<button onClick={handleOpenCreatePopup}>
								+ Create New Event
							</button>
						</header>

						<Calendar
							events={events}
							onEventClick={handleEventClick}
							onDateClick={handleDateClick}
						/>

						{/* When an event is selected, render your general Popup component */}
						{selectedEvent && (
							<Popup isOpen={isPopupOpen} onClose={handleClosePopup}>
								{/* Render PlannerViewEvent directly inside the popup */}
								<PlannerViewEvent
									event={selectedEvent}
									setActivePage={handleClosePopup} // The "Back" button will now close the popup
								/>
							</Popup>
						)}

						{/* **NEW**: Popup for creating a new event */}
						<Popup isOpen={isCreatePopupOpen} onClose={handleCloseCreatePopup}>
							<NewEvent
								onSave={handleSaveNewEvent}
								onClose={handleCloseCreatePopup}
							/>
						</Popup>
					</section>
                )}
			</section>
			<section className="tab-content">
				{activeTab === "list" && (
					<>
						{localStorage.setItem("activePage", "PlannerAllEvents")}
						<PlannerAllEvents 
						setActivePage={setActivePage}
						onSelectEvent={onSelectEvent}
						/>
					</>
				)}

			</section>
			
		</section>
	);
}
