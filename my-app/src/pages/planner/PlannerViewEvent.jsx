import { useEffect, useState } from 'react';
import "./PlannerViewEvent.css";
import { getAuth } from 'firebase/auth';

function GuestRSVPSummary({guests}) {
    const totalGuests = guests.length;
    const confirmedGuests = guests.filter(g => g.rsvpStatus === 'attending').length;
    const pendingGuests = guests.filter(g => g.rsvpStatus === 'pending').length;
    const declinedGuests = guests.filter(g => g.rsvpStatus === 'not_attending').length;

    return(
        <section className="rsvp-summary">
            <h4>RSVP Status</h4>
            <section className="rsvp-stats">
                <section className="rsvp-stat confirmed">
                    <span className="rsvp-number">{confirmedGuests}</span>
                    <span className="rsvp-label">Confirmed</span>
                </section>
                <section className="rsvp-stat pending">
                    <span className="rsvp-number">{pendingGuests}</span>
                    <span className="rsvp-label">Pending</span>
                </section>
                <section className="rsvp-stat declined">
                    <span className="rsvp-number">{declinedGuests}</span>
                    <span className="rsvp-label">Declined</span>
                </section>
            </section>
            <section className="rsvp-progress">
                <section 
                    className="rsvp-progress-bar"
                    style={{width: `${totalGuests > 0 ? (confirmedGuests / totalGuests) * 100 : 0}%`}}
                ></section>
            </section>
            <p className="rsvp-percentage">
                {totalGuests > 0 ? Math.round((confirmedGuests / totalGuests) * 100) : 0}% confirmed
            </p>
        </section>
    );
}

function VendorItem({vendor}) {
    return(
        <section className="vendor-item">
            <section className="vendor-info">
                <h4>{vendor.name}</h4>
                <p>{vendor.category}</p>
            </section>
            <section className="vendor-cost">
                <h4>Current total cost: </h4>
                <p>{vendor.cost}</p>
            </section>
            <section className="vendor-actions">
                <button className="contact-btn">Contact</button>
                <button className="remove-btn">Remove</button>
            </section>
        </section>
    );
}

function TaskItem({taskName, taskStatus, onToggle}) {
    const isCompleted = taskStatus === true;
    
    return(
        <section className="task-item">
            <section className="task-checkbox">
                <input 
                    type="checkbox" 
                    checked={isCompleted}
                    onChange={() => onToggle(taskName)}
                />
            </section>
            <section className="task-content">
                <h4 className={isCompleted ? "completed" : ""}>{taskName}</h4>
            </section>
        </section>
    );
}


export default function PlannerViewEvent({event, setActivePage}) {

    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");
    const [guests, setGuests] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [eventData, setEventData] = useState(event);

    const [editForm, setEditForm] = useState({...eventData});

    const eventId = event.id;

    const fetchGuests = async () => {
    
        const auth = getAuth();
        const user = auth.currentUser;
        const token = await user.getIdToken(true);
    
        const res = await fetch(`http://127.0.0.1:5001/planit-sdp/us-central1/api/planner/${eventId}/guests`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        if (!res.ok) return []; 
    
        const data = await res.json();
        return data.guests || [];
    };

    const fetchVendors = async () => {
        const auth = getAuth();
        const user = auth.currentUser;
        const token = await user.getIdToken(true);
    
        const res = await fetch(`http://127.0.0.1:5001/planit-sdp/us-central1/api/planner/${eventId}/vendors`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        if (!res.ok) return []; 
    
        const data = await res.json();
        return data.vendors || [];
    };
    
    useEffect(() => {
        async function loadGuests() {
            const guests = await fetchGuests();
            setGuests(guests);
            console.log(guests);
            const vendors = await fetchVendors();
            setVendors(vendors);
        }
        loadGuests();
    }, []);

    const handleSave = () => {
        setEventData({...editForm});
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditForm({...eventData});
        setIsEditing(false);
    };

    const handleTaskToggle = (taskName) => {
        setEventData((prev) => ({
            ...prev,
            tasks: {
            ...prev.tasks,
            [taskName]: !prev.tasks[taskName],
            },
        }));
    };

    const formatDate = (timestamp) => {
        console.log(typeof timestamp);
        if(!timestamp) return "No date";
        const date = new Date(timestamp._seconds*1000);
        return date.toLocaleString();
    };

    return(
        <section className="event-view-edit">
            <section className="event-header">
                
                <section className="header-top">
                    <button 
                        className="back-btn"
                        onClick={() => setActivePage && setActivePage('events-list')}
                    >
                        ← Back to Events
                    </button>
                    <section className="header-actions">
                        {!isEditing ? (
                            <button 
                                className="edit-btn"
                                onClick={() => setIsEditing(true)}
                            >
                                Edit Event
                            </button>
                        ) : (
                            <section className="edit-actions">
                                <button className="save-btn" onClick={handleSave}>Save Changes</button>
                                <button className="cancel-btn" onClick={handleCancel}>Cancel</button>
                            </section>
                        )}
                    </section>
                </section>

                <section className="header-main">
                    {!isEditing ? (
                        <section className="event-title-info">
                            <h1>{eventData.name}</h1>
                        </section>
                    ) : (
                        <section className="edit-title-section">
                            <input 
                                type="text"
                                value={editForm.name}
                                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                className="edit-title-input"
                                placeholder="Event name"
                            />
                        </section>
                    )}
                </section>
            </section>

            <section className="tabs-container">
                <section className="tabs">
                    <button 
                        className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
                        onClick={() => setActiveTab("overview")}
                    >
                        Overview
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === "guests" ? "active" : ""}`}
                        onClick={() => setActiveTab("guests")}
                    >
                        Guests & RSVP
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === "vendors" ? "active" : ""}`}
                        onClick={() => setActiveTab("vendors")}
                    >
                        Vendors
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === "tasks" ? "active" : ""}`}
                        onClick={() => setActiveTab("tasks")}
                    >
                        Tasks
                    </button>
                </section>

                <section className="tab-content">
                    {activeTab === "overview" && (
                        <section className="overview-content">
                            <section className="overview-grid">
                                <section className="detail-card">
                                    <h3>Event Details</h3>
                                    {!isEditing ? (
                                        <section className="detail-info">
                                            <p><strong>Location:</strong> {eventData.location}</p>
                                            <p><strong>Date:</strong> {formatDate(eventData.date)}</p>
                                            <p><strong>Duration: </strong> {eventData.duration} hrs </p>
                                            <p><strong>Expected Attendees:</strong> {eventData.expectedGuestCount}</p>
                                            <p><strong>Category:</strong> {eventData.eventCategory}</p>
                                        </section>
                                    ) : (
                                        <section className="edit-form">
                                            <label>
                                                Location:
                                                <input 
                                                    type="text"
                                                    value={editForm.location}
                                                    onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                                                />
                                            </label>
                                            <label>
                                                Date:
                                                <input 
                                                    type="datetime-local"
                                                    value={editForm.date}
                                                    onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                                                />
                                            </label>
                                            <label>
                                                Expected Attendees:
                                                <input 
                                                    type="number"
                                                    value={editForm.expectedGuestCount}
                                                    onChange={(e) => setEditForm({...editForm, expectedGuestCount: parseInt(e.target.value)})}
                                                />
                                            </label>
                                            <label>
                                                Category:
                                                <input 
                                                    type="text"
                                                    value={editForm.eventCategory}
                                                    onChange={(e) => setEditForm({...editForm, eventCategory: e.target.value})}
                                                />
                                            </label>
                                        </section>
                                    )}
                                </section>
                            </section>
                        </section>
                    )}

                    {activeTab === "guests" && (
                        <section className="guests-content">

                            <GuestRSVPSummary guests={guests} />
                            
                            <section className="guests-section">
                                <section className="guests-header">
                                    <h3>Guest List</h3>
                                    <button className="add-guest-btn">+ Add Guest</button>
                                </section>
                                
                                <section className="guests-list">
                                    {guests.length > 0 ? guests.map((guest) => (
                                        <section key={guest.id} className="guest-item">
                                            <section className="guest-info">
                                                <h4>{guest.firstname} {guest.lastname}</h4>
                                                <p>{guest.email}</p>
                                                <p>{guest.plusOne ? "Plus One: Yes" : "Plus One: No"}</p>
                                            </section>
                                            <section className="guest-rsvp">
                                                <span className={`rsvp-badge ${guest.rsvpStatus}`}>
                                                    {guest.rsvpStatus === 'attending' ? 'Confirmed' : 
                                                     guest.rsvpStatus === 'not_attending' ? 'Declined' : 
                                                     'Pending'}
                                                </span>
                                            </section>
                                            <section className="guest-actions">
                                                <button className="send-reminder-btn">Send Reminder</button>
                                                <button className="edit-guest-btn">Edit</button>
                                            </section>
                                        </section>
                                    )) : (
                                        <section className="empty-state">
                                            <p>No guests added yet. Click "Add Guest" to invite people to your event.</p>
                                        </section>
                                    )}
                                </section>
                            </section>
                        </section>
                    )}

                    {activeTab === "vendors" && (
                        <section className="vendors-content">
                            <section className="vendors-header">
                                <h3>Event Vendors</h3>
                                <button className="add-vendor-btn">+ Add Vendor</button>
                            </section>
                            <section className="vendors-list">
                                {vendors && vendors.length > 0 ? vendors.map((vendor) => (
                                    <VendorItem key={vendor.id} vendor={vendor} />
                                )) : (
                                    <section className="empty-state">
                                        <p>No vendors added yet. Click "Add Vendor" to start building your vendor list.</p>
                                    </section>
                                )}
                            </section>
                        </section>
                    )}

                     {activeTab === "tasks" && (
                        <section className="tasks-content">
                            <section className="tasks-header">
                                <h3>Event Tasks</h3>
                                <button className="add-task-btn">+ Add Task</button>
                            </section>
                                <section className="tasks-list">
                                    {eventData.tasks && Object.keys(eventData.tasks).length > 0 ? (
                                       Object.entries(eventData.tasks).map(([taskName, completed], i) => (
                                            <TaskItem
                                            key={`${taskName}-${i}`}
                                            taskName={taskName}
                                            taskStatus={completed}
                                            onToggle={handleTaskToggle}
                                            />
                                        ))
                                    ) : (
                                        <section className="empty-state">
                                        <p>No tasks added yet. Click "Add Task" to start organizing your event planning.</p>
                                        </section>
                                    )}
                                </section>
                        </section>
                    )}

                </section>
            </section>
        </section>
    );
}