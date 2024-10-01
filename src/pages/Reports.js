// src/pages/Reports.js
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase-config';
import './Reports.css'; // Ensure to create a CSS file for styling

const Reports = () => {
  const [items, setItems] = useState([]);
  const [groupBy, setGroupBy] = useState('college'); // Default grouping by college
  const [searchQuery, setSearchQuery] = useState(''); // State for search query
  const [visibleGroups, setVisibleGroups] = useState({}); // State for managing visible groups

  useEffect(() => {
    const fetchItems = async () => {
      const itemsCollection = collection(db, 'items');
      const unsubscribe = onSnapshot(itemsCollection, (snapshot) => {
        const fetchedItems = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setItems(fetchedItems);
      });

      return () => unsubscribe();
    };

    fetchItems();
  }, []);

  // Function to filter items based on the search query
  const filterItems = (items) => {
    return items.filter((item) => {
      const lowerCaseQuery = searchQuery.toLowerCase();
      return (
        item.text.toLowerCase().includes(lowerCaseQuery) ||
        item.college.toLowerCase().includes(lowerCaseQuery) ||
        item.itemType.toLowerCase().includes(lowerCaseQuery)
      );
    });
  };

  const groupItems = () => {
    const filteredItems = filterItems(items);
    const grouped = filteredItems.reduce((acc, item) => {
      const key = item[groupBy] || 'Unknown';

      if (!acc[key]) {
        acc[key] = [];
      }

      acc[key].push(item);
      return acc;
    }, {});

    return grouped;
  };

  const handleToggleGroup = (key) => {
    setVisibleGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const groupedItems = groupItems();

  return (
    <div className="reports-container">
      <h1>Items Report</h1>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by item, college, or category"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="group-by-selector">
        <label>
          Group by:
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
            <option value="college">College</option>
            <option value="date">Date</option>
            <option value="itemType">Category</option>
          </select>
        </label>
      </div>
      {Object.keys(groupedItems).map((key) => (
        <div key={key} className="report-section">
          <h2>
            <button onClick={() => handleToggleGroup(key)} className="toggle-button">
              {visibleGroups[key] ? 'Hide' : ''} {key}
            </button>
          </h2>
          {visibleGroups[key] && (
            <ul>
              {groupedItems[key].map((item) => (
                <li key={item.id}>
                  <div><strong>Item:</strong> {item.text}</div>
                  <div><strong>Quantity:</strong> {item.quantity}</div>
                  <div><strong>Amount:</strong> ${item.amount.toFixed(2)}</div>
                  <div><strong>Requested Date:</strong> {new Date(item.requestedDate.seconds * 1000).toLocaleDateString()}</div>
                  <div><strong>Supplier:</strong> {item.supplier}</div>
                  <div><strong>Type:</strong> {item.itemType}</div>
                  {item.image && <img src={item.image} alt="Item" className="report-image" />}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
};

export default Reports;
