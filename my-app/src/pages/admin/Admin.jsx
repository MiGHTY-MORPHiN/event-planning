import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Calendar,
  ArrowLeft,
  Building2,
  BarChart3,
  House
} from "lucide-react";
import AdminHome from "./AdminHome.jsx";
import "./Admin.css";
import Reports from  "./Reports.jsx"

const Admin = () => {
    
  //USing to page to the selected tab
  const [activePage, setActivePage] = useState("home");

  const navigate = useNavigate();
    
  const navigationItems = [
        {id: 'home', label: 'Home', icon: House},
        {id: 'event-management', label: 'Event Management', icon: Calendar},
        {id: 'planner-management', label: 'Planner Management', icon: Users},
        {id: 'vendor-management', label: 'Vendor Management', icon: Users},
        {id: 'reports', label: 'Reports & Detailed Analytics', icon: BarChart3},
    ];

  const renderPlaceholderPage = (pageTitle) => (
    <section className="placeholder-page">
      <section className="placeholder-content">
        <section className="placeholder-icon">
          {navigationItems.find(item => item.id === activePage)?.icon && 
            React.createElement(navigationItems.find(item => item.id === activePage).icon, { size: 32 })
          }
        </section>
        <h1 className="placeholder-title">{pageTitle}</h1>
        <p className="placeholder-text">This page is coming soon. All the functionality will be built here.</p>
        <button 
          onClick={() => setActivePage("home")}
          className="back-to-home-btn"
        >
          Back to Dashboard
        </button>
      </section>
    </section>
  );

  const renderCurrentPage = () => {
    switch (activePage) {
      case "home":
        return <AdminHome setActivePage={setActivePage} />;
      case "event-management":
        return renderPlaceholderPage("Event Management");
      case "planner-management":
        return renderPlaceholderPage("Planner Management");
      case "vendor-management":
        return renderPlaceholderPage("vendor Management");
      case "reports":
        return <Reports setActivePage={setActivePage} />;
      default:
        return <AdminHome setActivePage={setActivePage} />;
    }
  };

  return (
    <section className="admin-app">
      {/* Navigation Bar */}
      <nav className="admin-navbar">
        <section className="navbar-container">
          <section className="navbar-content">
            <section className="navbar-left">
              <button className="home-btn" onClick={() =>  navigate("/home")}>
                <ArrowLeft size={20} />
                <section>Home</section>
              </button>
              
              <section className="vendor-logo">
                <Building2 size={24} />
                <section className="logo-text">Admin Home</section>
              </section>
            </section>

            <section className="navbar-right">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    className={`nav-btn ${activePage === item.id ? "active" : ""}`}
                    onClick={() => setActivePage(item.id)}
                  >
                    <Icon size={18} />
                    {item.label}
                  </button>
                );
              })}
            </section>
          </section>
        </section>
      </nav>

      {/* Main Content */}
      <main className="admin-main">
        {renderCurrentPage()}
      </main>
    </section>
  );
};

export default Admin;