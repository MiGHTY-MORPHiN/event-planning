
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Calendar,
  MapPin,
  Star,
  FileText,
  ArrowLeft,
  Building2,
  Activity
} from "lucide-react";
import VendorDashboard from "./VendorDashboard";
import VendorProfile from "./vendorProfile";
import VendorBooking from "./vendorBooking";
import "./vendorApp.css";
import VendorReviews from "./vendorReviews";
import VendorContract from "./VendorContract";


const VendorApp = () => {
  const [activePage, setActivePage] = useState("dashboard");
 const navigate = useNavigate();
  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: Activity },
    { id: "profile", label: "Profile", icon: Users },
    { id: "bookings", label: "Bookings", icon: Calendar },
    { id: "floorplan", label: "Floorplan View", icon: MapPin },
    { id: "reviews", label: "Reviews", icon: Star },
    { id: "contracts", label: "Contracts", icon: FileText },
  ];

  const renderPlaceholderPage = (pageTitle) => (
    <div className="placeholder-page">
      <div className="placeholder-content">
        <div className="placeholder-icon">  


          {navigationItems.find(item => item.id === activePage)?.icon && 
            React.createElement(navigationItems.find(item => item.id === activePage).icon, { size: 32 })
          }
        </div>
        <h1 className="placeholder-title">{pageTitle}</h1>
        <p className="placeholder-text">This page is coming soon. All the functionality will be built here.</p>
        <button 
          onClick={() => setActivePage("dashboard")}
          className="back-to-dashboard-btn"    


        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );

  const renderCurrentPage = () => {
    switch (activePage) {
      case "dashboard":
        return <VendorDashboard setActivePage={setActivePage} />;
      case "profile":
        return <VendorProfile />;
      case "bookings":
        return <VendorBooking setActivePage={setActivePage}/>;
      case "floorplan":
        return  "floorplan";
      case "reviews":
        return <VendorReviews setActivePage={setActivePage}/>;
      case "contracts":
        return <VendorContract setActivePage={setActivePage} />;
      default:
        return <VendorDashboard setActivePage={setActivePage} />;
    }
  };

  return (
    <div className="vendor-app">
      {/* Navigation Bar */}
      <nav className="vendor-navbar">
        <div className="navbar-container">
          <div className="navbar-content">
            <div className="navbar-left">
              <button className="home-btn" onClick={() =>  navigate("/home")}>
                <ArrowLeft size={20} />
                <span>Home</span>
              </button>
              
              <div className="vendor-logo">
                <Building2 size={24} />
                <span className="logo-text">VendorHub</span>
              </div>
            </div>

            <div className="navbar-right">
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
            </div>
          </div>
        </div>
      </nav>

   
      <main className="vendor-main">
        {renderCurrentPage()}
      </main>
    </div>
  );
};

export default VendorApp;