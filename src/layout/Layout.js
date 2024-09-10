// src/components/Layout.js
import React from 'react';
import { Link } from 'react-router-dom';
import './Layout.css'; // Add your sidebar styles here

const Layout = ({ children }) => {
  return (
    <div className="layout-container">
      <nav className="sidebar-nav">
        <Link to="/dashboard" className="nav-link">Dashboard</Link>
        <Link to="/manage-item" className="nav-link">Manage Item</Link>
        <Link to="/approve-request" className="nav-link">Approved Purchased Request</Link>
        <Link to="/reports" className="nav-link">Reports</Link>
        <Link to="/scanner" className="nav-link">Scanner</Link>
        <Link to="/settings" className="nav-link">Settings</Link>
      </nav>
      <div className="content">
        {children}
      </div>
    </div>
  );
};

export default Layout;
