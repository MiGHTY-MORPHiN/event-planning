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
  const [profilePreview, setProfilePreview] = useState(null); // NEW: for preview
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const categories = [
    "Catering",
    "Decorating",
    "Photography",
    "Entertainment",
    "Florist",
    "Music & DJ",
    "Event Planning",
    "Venue Rentals",
    "Lighting & AV",
    "Transportation",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!auth.currentUser) {
      setError("You must be logged in to apply");
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

      setSuccess("Application submitted successfully!");
      navigate("/vendor/waiting");
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  // NEW: handle image selection and preview
  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    setProfilePic(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setProfilePreview(null);
    }
  };

  return (
    <main className="vendor-apply-page">
      <section className="vendor-apply-card">
        <button onClick={() => navigate(-1)}>Back</button>
        <h1>Apply as a Vendor</h1>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}

        <form onSubmit={handleSubmit} className="vendor-apply-form">
          <label>
            Business Name
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
            />
          </label>

          <label>
            Phone Number
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </label>

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label>
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
            />
          </label>

          <label>
            Category
            <input
              list="vendor-categories"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Select or type category"
              required
            />
            <datalist id="vendor-categories">
              {categories.map((c, idx) => (
                <option key={idx} value={c} />
              ))}
            </datalist>
          </label>

          <label>
            Address (optional)
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </label>

          <label>
            Profile Picture
            <input
              type="file"
              accept="image/*"
              onChange={handleProfilePicChange} // UPDATED
            />
          </label>

          {/* NEW: preview */}
          {profilePreview && (
            <div className="profile-preview">
              <img src={profilePreview} alt="Profile Preview" />
            </div>
          )}

          <button type="submit" className="btn primary">
            Submit Application
          </button>
        </form>
      </section>
    </main>
  );
}
