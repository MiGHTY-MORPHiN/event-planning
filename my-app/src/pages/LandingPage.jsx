import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Smooth scrolling for navigation links
    const handleSmoothScroll = (e) => {
      if (e.target.matches('a[href^="#"]')) {
        e.preventDefault();
        const href = e.target.getAttribute('href');
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth'
          });
        }
      }
    };

    // Add scroll effect to navbar
    const handleScroll = () => {
      const navbar = document.querySelector('.navbar');
      if (navbar) {
        if (window.scrollY > 100) {
          navbar.style.background = 'rgba(248, 250, 252, 0.98)';
        } else {
          navbar.style.background = 'rgba(248, 250, 252, 0.95)';
        }
      }
    };

    // Add event listeners
    document.addEventListener('click', handleSmoothScroll);
    window.addEventListener('scroll', handleScroll);

    // Cleanup
    return () => {
      document.removeEventListener('click', handleSmoothScroll);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Function to handle navigation to login
  const navigateToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="logo">PLANit</div>
          <ul className="nav-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#contact">Contact</a></li>
            <li><a href="#documentation">Documentation</a></li>
            <li><button onClick={navigateToLogin} style={{background: 'none', border: 'none', color: 'var(--text-dark)', fontWeight: '500', cursor: 'pointer', fontSize: 'inherit'}}>Sign In</button></li>
            <li><button onClick={navigateToLogin} className="get-started-btn">Get Started</button></li>
          </ul>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="rotating-triangle">
          <div className="triangle"></div>
        </div>
        <div className="hero-content">
          <h1 className="hero-title">Plan Perfect Events</h1>
          <p className="hero-subtitle">
            Connect vendors, administrators, and event planners in one elegant platform. Create unforgettable experiences with cutting-edge tools and seamless collaboration.
          </p>
          <div className="hero-buttons">
            <button onClick={navigateToLogin} className="btn-primary">Start Planning</button>
            <a href="#learn" className="btn-secondary">Learn More</a>
          </div>
          <div className="scroll-indicator">
            ↓ Scroll to explore more
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="roles-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Built For Every Role</h2>
            <p className="section-subtitle">
              Whether you're planning events, providing services, or managing the platform, we have the perfect tools crafted specifically for you.
            </p>
          </div>
          
          <div className="cards-grid">
            {/* Event Planners Card */}
            <div className="role-card">
              <div className="card-icon planner">EP</div>
              <h3 className="card-title">Event Planners</h3>
              <p className="card-description">
                Organize spectacular events with our comprehensive planning tools. Manage timelines, budgets, and coordinate with vendors seamlessly.
              </p>
              <ul className="card-features">
                <li>Project management tools</li>
                <li>Vendor coordination</li>
                <li>Budget tracking</li>
                <li>Timeline management</li>
              </ul>
              <button onClick={navigateToLogin} className="card-btn">Get Started as an Event Planner</button>
            </div>

            {/* Vendors Card */}
            <div className="role-card">
              <div className="card-icon vendor">V</div>
              <h3 className="card-title">Vendors</h3>
              <p className="card-description">
                Showcase your services and connect with event planners. Manage bookings, display portfolios, and grow your business.
              </p>
              <ul className="card-features">
                <li>Service showcasing</li>
                <li>Booking management</li>
                <li>Portfolio display</li>
                <li>Client communication</li>
              </ul>
              <button onClick={navigateToLogin} className="card-btn">Get Started as a Vendor</button>
            </div>

            {/* Administrators Card */}
            <div className="role-card">
              <div className="card-icon admin">A</div>
              <h3 className="card-title">Administrators</h3>
              <p className="card-description">
                Oversee platform operations with powerful admin tools. Monitor activities, manage users, and ensure smooth operations.
              </p>
              <ul className="card-features">
                <li>User management</li>
                <li>Platform monitoring</li>
                <li>Analytics dashboard</li>
                <li>System configuration</li>
              </ul>
              <button onClick={navigateToLogin} className="card-btn">Get Started as an Administrator</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;