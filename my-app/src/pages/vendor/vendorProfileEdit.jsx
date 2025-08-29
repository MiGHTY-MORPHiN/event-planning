import React, { useState } from "react";
import { UploadCloud } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./vendorProfileEdit.css";

const VendorProfileEdit = () => {
    const navigate = useNavigate();

    const navProfile=()=>{
        navigate("/vendor-app");
    }

  const [profilePic, setProfilePic] = useState(null);
  const [description, setDescription] = useState(
    "We specialize in high-quality catering for corporate events and weddings with international cuisine and elegant presentation."
  );
  const [address, setAddress] = useState("123 Event Street, Johannesburg");
  const [phone, setPhone] = useState("+27 71 234 5678");
  const [email, setEmail] = useState("info@premiumcatering.co.za");

  const handleProfilePicChange = (e) => {
    if (e.target.files[0]) {
      setProfilePic(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
  
    alert("Profile updated!");
  };

  return (
    <section className="vendor-profile-edit">
        <button className="back-button" onClick={navProfile}>Back</button>
      <h1 className="edit-page-title">Edit Profile</h1>

      <form className="profile-edit-form" onSubmit={handleSubmit}>
        <div className="profile-pic-section">
          <img
            src={profilePic || "https://image.com"}
            className="profile-pic"
          />
          <label className="upload-btn">
            <UploadCloud size={18} />
            Upload Picture
            <input
              type="file"
              accept="image/*"
              onChange={handleProfilePicChange}
              className="file-input"
            />
          </label>
        </div>

        {/* Description */}
        <label>
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </label>

        {/* Address */}
        <label>
          Address
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </label>

        {/* Phone */}
        <label>
          Phone
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>

        {/* Email */}
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        {/* Submit */}
        <button type="submit" className="save-btn">
          Save Changes
        </button>
      </form>
    </section>
  );
};

export default VendorProfileEdit;
