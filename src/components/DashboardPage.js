// src/components/DashboardPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css'; // Assuming you have relevant styles in this file

const DashboardPage = ({ totalItems }) => {  // Receive totalItems as prop
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const userName = "Admin"; // Replace with dynamic user data if available

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleLogout = () => {
    // Add your logout functionality here
    console.log('Logging out...');
  };

  return (
    <div className="dashboard">
      <main className="main-content">
        <header>
          <h2>Admin Dashboard</h2>
          <div className="search-and-profile">
            <input type="text" placeholder="Search..." className="search-input" />
            <div className="profile">
              <img src="userdashboard.png" alt="Profile Icon" className="profile-icon" />
              <span className="user-name">{userName}</span>
              <button className="dropdown-toggle" onClick={toggleDropdown}>
                &#9662;
              </button>
              {dropdownOpen && (
                <div className="dropdown-menu">
                  <Link to="/account-settings">Account Settings</Link>
                  <button onClick={handleLogout}>Logout</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <section className="cards">
          <div className="card">
            <h3>ITEMS</h3>
            <p>Total Items: {totalItems}</p> {/* Display total items */}
          </div>
          <div className="card">
            <h3>FOLDER</h3>
            <p>Placeholder for folders</p>
          </div>
          <div className="card">
            <h3>APPROVE PURCHASE REQUEST</h3>
            <p>Placeholder for approve purchase request</p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DashboardPage;
