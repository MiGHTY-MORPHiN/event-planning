import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import './NewEvent.css';

export default function NewEvent({ setActivePage }) {
  const [inputs, setInputs] = useState({
    name: "",
    description: "",
    theme: "",
    location: "",
    budget: 0,
    expectedGuestCount: 0,
    duration: 0,
    eventCategory: "",
    notes: "",
    specialRequirements: [],
    style: [],
    tasks: [],
    vendoringCategoriesNeeded: [],
    files: null,
    schedules: null,
    services: null
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const auth = getAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs(values => ({ ...values, [name]: value }));
  };

  const handleArrayChange = (field, value) => {
    setInputs(values => ({ ...values, [field]: value.split(',').map(v => v.trim()) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!auth.currentUser) {
      setError("You must be logged in to create an event");
      return;
    }

    try {
      const token = await auth.currentUser.getIdToken();

      const res = await fetch("https://us-central1-planit-sdp.cloudfunctions.net/api/event/apply", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...inputs,
          plannerId: auth.currentUser.uid,
          date: inputs.startTime
        })
      });

      if (!res.ok) throw new Error("Failed to create event");

      setSuccess("Event created successfully!");
      navigate("/planner-dashboard");
    } catch (err) {


      
      console.error(err);
      setError(err.message);
    }
  };

  return (
    <section className="page-container">
      <section className="intro">
        <h1 className="title">New Event</h1>
        <p className="dashboard-subtitle">Input your event's details</p>
      </section>

      <form className="main-content" onSubmit={handleSubmit}>
        <input type="text" name="name" placeholder="Event Name" value={inputs.name} onChange={handleChange} />
        <textarea name="description" placeholder="Description" value={inputs.description} onChange={handleChange} />
        <input type="text" name="theme" placeholder="Theme" value={inputs.theme} onChange={handleChange} />
        <input type="number" name="expectedGuestCount" placeholder="Attendees" value={inputs.expectedGuestCount} onChange={handleChange} />
        <input type="text" name="location" placeholder="Location" value={inputs.location} onChange={handleChange} />
        <input type="number" name="budget" placeholder="Budget (R)" value={inputs.budget} onChange={handleChange} />
        <input type="number" name="duration" placeholder="Duration (hours)" value={inputs.duration} onChange={handleChange} />
        <input type="text" name="eventCategory" placeholder="Category" value={inputs.eventCategory} onChange={handleChange} />
        <textarea name="notes" placeholder="Notes" value={inputs.notes} onChange={handleChange} />

        <input type="text" placeholder="Special Requirements (comma separated)" onChange={e => handleArrayChange('specialRequirements', e.target.value)} />
        <input type="text" placeholder="Style (comma separated)" onChange={e => handleArrayChange('style', e.target.value)} />
        <input type="text" placeholder="Tasks (comma separated)" onChange={e => handleArrayChange('tasks', e.target.value)} />
        <input type="text" placeholder="Vendoring Categories Needed (comma separated)" onChange={e => handleArrayChange('vendoringCategoriesNeeded', e.target.value)} />

        <input type="datetime-local" name="startTime" value={inputs.startTime || ""} onChange={handleChange} />

        <button type="submit" className="page-button">Save Event</button>
      </form>

      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
    </section>
  );
}
