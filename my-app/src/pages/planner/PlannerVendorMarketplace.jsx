import { useState } from 'react';

import "./PlannerVendorMarketplace.css";

function VendorCard({vendor}){
    return(
        <section className="vendor-card">
            <img src={vendor.logoUrl} alt={vendor.name} className="vendor-image"/>
            <h3>{vendor.name}</h3>
            <section className="vendor-info">
                <p className="vendor-category">{vendor.category}</p>
                <section className="rating-location">
                    <p className="vendor-rating">{vendor.rating}</p>
                    <p className="vendor-location">{vendor.location}</p>
                </section>
            </section>
            <section className="vendor-buttons">
                <button className="add-btn">Add Vendor</button>
                <button className="view-btn">View More</button>
            </section>
        </section>
    );
}

export default function PlannerVendorMarketplace({setActivePage}){
    const [showAllEvents, setShowAllEvents] = useState(true);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All");

    const dummyVendors = [
        { id: 1, name: "Sweet Treats Catering", category: "Catering", rating: 4.7, location: "Cape Town", logoUrl: "https://picsum.photos/100?random=1" },
        { id: 2, name: "Elite Sound Systems", category: "Entertainment", rating: 4.5, location: "Johannesburg", logoUrl: "https://picsum.photos/100?random=2" },
        { id: 3, name: "Glam Decor", category: "Decor", rating: 4.8, location: "Durban", logoUrl: "https://picsum.photos/100?random=3" },
        { id: 4, name: "Bright Lights Photography", category: "Photography", rating: 4.9, location: "Pretoria", logoUrl: "https://picsum.photos/100?random=4" },
        { id: 5, name: "Floral Dreams", category: "Decor", rating: 4.6, location: "Cape Town", logoUrl: "https://picsum.photos/100?random=5" },
        { id: 6, name: "DJ Masters", category: "Entertainment", rating: 4.3, location: "Durban", logoUrl: "https://picsum.photos/100?random=6" }
    ];

    const filteredVendors = dummyVendors.filter(v => 
        (v.name.toLowerCase().includes(search.toLowerCase()) || v.category.toLowerCase().includes(search.toLowerCase())) &&
        (categoryFilter === "All" || v.category === categoryFilter)
    );

    return(
        <section className="vendormarketplace">
            <section className="vendormarketplace-header">
                <h2>Vendor Marketplace</h2>
                <p className="marketplace-subtitle">Discover and connect with top-rated event vendors</p>
            </section>

            <section className="toggle">
                <button className={`toggle-btn ${showAllEvents ? "active" : ""}`} onClick={() => setShowAllEvents(true)}>
                    All Events
                </button>
                <button className={`toggle-btn ${!showAllEvents ? "active" : ""}`} onClick={() => setShowAllEvents(false)}>
                    Event Specific
                </button>
            </section>

            <section className="filters">
                <input type="text" placeholder="Search vendors..." value={search} onChange={(e) => setSearch(e.target.value)}className="search-bar"/>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="filter-select">
                    <option value="All">All Categories</option>
                    <option value="Catering">Catering</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Decor">Decor</option>
                    <option value="Photography">Photography</option>
                </select>
            </section>

            <section className="vendor-grid">
                {filteredVendors.map((vendor) => (
                    <VendorCard key={vendor.id} vendor={vendor}/>
                ))}
            </section>
        </section>
    );
}

