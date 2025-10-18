import React, { useState } from "react";
import { getAuth } from "firebase/auth";
import "./PlannerReviewVendor.css";

const API_BASE = "https://us-central1-planit-sdp.cloudfunctions.net/api";
const API_TEST = "http://127.0.0.1:5001/planit-sdp/us-central1/api";

export default function PlannerReviewVendor({ 
  vendorId, 
  vendorName, 
  eventId, 
  serviceName,
  onClose, 
  onReviewSubmitted 
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }
    
    if (reviewText.trim().length < 10) {
      setError("Review must be at least 10 characters");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const auth = getAuth();
      const token = await auth.currentUser.getIdToken();

      const response = await fetch(
        `${API_BASE}/planner/vendors/${vendorId}/reviews`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rating,
            review: reviewText,
            eventId,
            serviceName
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to submit review");
      }

      const result = await response.json();
      
      if (onReviewSubmitted) {
        onReviewSubmitted(result.review);
      }
      
      alert("Review submitted successfully!");
      onClose();
    } catch (err) {
      console.error("Error submitting review:", err);
      setError("Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="review-vendor-overlay" onClick={onClose}>
      <section 
        className="review-vendor-modal" 
        onClick={(e) => e.stopPropagation()}
      >
        <section className="review-modal-header">
          <h2>Review Vendor</h2>
          <button className="review-close-btn" onClick={onClose}>
            ×
          </button>
        </section>

        <section className="review-modal-body">
          <section className="vendor-review-info">
            <h3>{vendorName}</h3>
            {serviceName && <p className="service-name">{serviceName}</p>}
          </section>

          <form onSubmit={handleSubmit} className="review-form">
            <section className="rating-section">
              <label>Your Rating *</label>
              <section className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star ${
                      star <= (hoverRating || rating) ? "filled" : ""
                    }`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    ★
                  </button>
                ))}
              </section>
              <p className="rating-text">
                {rating === 0 && "Select a rating"}
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
              </p>
            </section>

            <section className="review-text-section">
              <label>Your Review *</label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your experience with this vendor... (minimum 10 characters)"
                rows="6"
                required
                minLength="10"
              />
              <p className="char-count">
                {reviewText.length} characters
              </p>
            </section>

            {error && <p className="review-error">{error}</p>}

            <section className="review-actions">
              <button
                type="button"
                className="cancel-review-btn"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="submit-review-btn"
                disabled={isSubmitting || rating === 0}
              >
                {isSubmitting ? "Submitting..." : "Submit Review"}
              </button>
            </section>
          </form>
        </section>
      </section>
    </section>
  );
}