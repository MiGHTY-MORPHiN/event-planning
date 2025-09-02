import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase";
import "./vendorApply.css";

export default function VendorApply() {
  const navigate = useNavigate();
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [address, setAddress] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const eventCategories = [
    { value: "", label: "Select a category" },
    { value: "wedding-planning", label: "Wedding Planning" },
    { value: "photography", label: "Photography & Videography" },
    { value: "catering", label: "Catering Services" },
    { value: "decoration", label: "Decoration & Florals" },
    { value: "entertainment", label: "Entertainment & Music" },
    { value: "venue", label: "Venue & Location" },
    { value: "transportation", label: "Transportation" },
    { value: "lighting-sound", label: "Lighting & Sound" },
    { value: "makeup-beauty", label: "Makeup & Beauty" },
    { value: "event-coordination", label: "Event Coordination" },
    { value: "rental-equipment", label: "Rental Equipment" },
    { value: "stationery", label: "Stationery & Invitations" }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    if (!auth.currentUser) {
      setError("You must be logged in to apply");
      setIsSubmitting(false);
      return;
    }

    // Basic validation
    if (!businessName || !phone || !email || !description || !category) {
      setError("Please fill in all required fields");
      setIsSubmitting(false);
      return;
    }

    try {
      const token = await auth.currentUser.getIdToken();

      let profilePicBase64 = "";
      if (profilePic) {
        const reader = new FileReader();
        profilePicBase64 = await new Promise((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result.split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(profilePic);
        });
      }

      const body = {
        businessName,
        phone,
        email,
        description,
        category,
        address: address || "None",
        profilePic: profilePicBase64,
      };

      const res = await fetch(
        "https://us-central1-planit-sdp.cloudfunctions.net/api/vendor/apply",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit");

      setSuccess("🎉 Application submitted successfully! We'll review your application and get back to you soon.");
      
      // Reset form after success
      setTimeout(() => {
        setBusinessName("");
        setPhone("");
        setEmail("");
        setDescription("");
        setCategory("");
        setAddress("");
        setProfilePic(null);
        setSuccess("");
        navigate("/vendor-app");
      }, 2000);
      
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="vendor-apply-page">
      {/* Animated Background Elements */}
      <div className="background-elements">
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
      </div>

      <div className="vendor-apply-card">
        {/* Enhanced Header */}
        <div className="card-header">
          <div className="header-overlay"></div>
          <div className="header-content">
            <div className="header-icon">
              <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6.5M16 6H8m0 0v-.5A2.5 2.5 0 0110.5 3h3A2.5 2.5 0 0116 5.5V6M8 6v10.5A2.5 2.5 0 0010.5 19h3a2.5 2.5 0 002.5-2.5V6" />
              </svg>
            </div>
            <h1 className="header-title">Apply as a Vendor</h1>
            <p className="header-subtitle">Join our network of trusted event professionals</p>
          </div>
        </div>

        <div className="card-body">
          {/* Enhanced Error and Success Messages */}
          {error && (
            <div className="message-container error-message">
              <div className="message-content">
                <svg className="message-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="message-text">{error}</p>
              </div>
            </div>
          )}
          
          {success && (
            <div className="message-container success-message">
              <div className="message-content">
                <svg className="message-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="message-text">{success}</p>
              </div>
            </div>
          )}

          <form className="vendor-form" onSubmit={handleSubmit}>
            {/* Enhanced 2x2 Grid */}
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  <div className="label-left">
                    <span className="label-dot dot-indigo"></span>
                    Business Name
                  </div>
                </label>
                <div className="input-container">
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                    className="form-input"
                    placeholder="Enter your business name"
                  />
                  <div className="input-overlay overlay-indigo"></div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <div className="label-left">
                    <span className="label-dot dot-purple"></span>
                    Phone Number
                  </div>
                </label>
                <div className="input-container">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="form-input"
                    placeholder="Your contact number"
                  />
                  <div className="input-overlay overlay-purple"></div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <div className="label-left">
                    <span className="label-dot dot-blue"></span>
                    Email Address
                  </div>
                </label>
                <div className="input-container">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="form-input"
                    placeholder="your@email.com"
                  />
                  <div className="input-overlay overlay-blue"></div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <div className="label-left">
                    <span className="label-dot dot-indigo"></span>
                    Service Category
                  </div>
                </label>
                <div className="input-container">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    className="form-select"
                  >
                    {eventCategories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                  <div className="select-arrow">
                    <svg className="arrow-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <div className="input-overlay overlay-indigo"></div>
                </div>
              </div>
            </div>

            {/* Enhanced Description Field */}
            <div className="form-group description-group">
              <label className="form-label">
                <div className="label-left">
                  <span className="label-dot dot-gradient"></span>
                  Business Description
                </div>
                <span className="optional-badge">Tell your story</span>
              </label>
              <div className="input-container">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  required
                  className="form-textarea"
                  placeholder="Tell us about your business, services offered, experience, and what makes you unique. Share your passion for creating memorable events..."
                />
                <div className="input-overlay overlay-gradient"></div>
              </div>
            </div>

            {/* Enhanced Bottom Fields */}
            <div className="form-grid bottom-grid">
              <div className="form-group">
                <label className="form-label">
                  <div className="label-left">
                    <span className="label-dot dot-blue"></span>
                    Business Address
                  </div>
                  <span className="optional-badge">Optional</span>
                </label>
                <div className="input-container">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="form-input"
                    placeholder="Your business address"
                  />
                  <div className="input-overlay overlay-blue"></div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <div className="label-left">
                    <span className="label-dot dot-indigo"></span>
                    Profile Picture
                  </div>
                  <span className="optional-badge">Optional</span>
                </label>
                <div className="input-container">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProfilePic(e.target.files[0])}
                    className="form-file"
                  />
                  <div className="input-overlay overlay-indigo"></div>
                </div>
              </div>
            </div>

            {/* Enhanced Submit Button */}
            <div className="submit-container">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`submit-button ${isSubmitting ? 'submitting' : ''}`}
              >
                <div className="button-overlay"></div>
                <div className="button-content">
                  {isSubmitting ? (
                    <>
                      <svg className="loading-spinner" fill="none" viewBox="0 0 24 24">
                        <circle className="spinner-track" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="spinner-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="button-text">Processing Application...</span>
                    </>
                  ) : (
                    <>
                      <span className="button-text">Submit Application</span>
                      <svg className="button-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </div>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
