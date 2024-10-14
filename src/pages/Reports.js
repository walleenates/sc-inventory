import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase-config';
import './Reports.css'; // Ensure to create a CSS file for styling
import { FaFolder } from 'react-icons/fa'; // Importing folder icon from react-icons

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
      const collegeKey = item.college || 'Unknown';
      const categoryKey = item.itemType || 'Unknown Category';

      if (!acc[collegeKey]) {
        acc[collegeKey] = {};
      }

      if (!acc[collegeKey][categoryKey]) {
        acc[collegeKey][categoryKey] = [];
      }

      acc[collegeKey][categoryKey].push(item);
      return acc;
    }, {});

    return grouped;
  };

  const handleToggleGroup = (collegeKey, categoryKey) => {
    setVisibleGroups((prev) => ({
      ...prev,
      [`${collegeKey}-${categoryKey}`]: !prev[`${collegeKey}-${categoryKey}`],
    }));
  };

  // Function to download report summary as a Word document
  const downloadReport = (college) => {
    const reportSummary = generateReportSummary(college);
    const blob = new Blob([reportSummary], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${college}-report-summary.docx`; // Change file extension to .docx
    a.click();
    URL.revokeObjectURL(url); // Free up memory
  };

  // Function to generate report summary
  const generateReportSummary = (college) => {
    const groupedItems = groupItems();
    let summary = `<h2>Report Summary for ${college}</h2><br/>`;

    // Check if groupedItems has the college key
    if (groupedItems.hasOwnProperty(college)) {
      for (const category in groupedItems[college]) {
        summary += `<h3>Category: ${category}</h3><ul>`;
        
        // Generate item details for this category
        summary += generateItemsSummary(groupedItems[college][category]);
        summary += '</ul>';
      }
    } else {
      summary += '<p>No items found for this college.</p>';
    }

    return summary;
  };

  // Helper function to generate summary for items in a category
  const generateItemsSummary = (items) => {
    return items.map(item => `
      <li>
        <strong>Item:</strong> ${item.text}, 
        <strong>Quantity:</strong> ${item.quantity}, 
        <strong>Amount:</strong> $${item.amount.toFixed(2)}, 
        <strong>Requested Date:</strong> ${new Date(item.requestedDate.seconds * 1000).toLocaleDateString()}
      </li>
    `).join('');
  };

  const groupedItems = groupItems();

  return (
    <div className="reports-container">
      <h1>
        <FaFolder className="folder-icon" /> Items Report
      </h1>
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
      {Object.keys(groupedItems).map((collegeKey) => (
        <div key={collegeKey} className="report-section" id={collegeKey}>
          <h2>{collegeKey}</h2>
          <div className="report-actions">
            <button onClick={() => downloadReport(collegeKey)} className="action-button">Download Summary</button>
          </div>
          {Object.keys(groupedItems[collegeKey]).map((categoryKey) => (
            <div key={categoryKey}>
              <h3>
                <button onClick={() => handleToggleGroup(collegeKey, categoryKey)} className="toggle-button">
                  {visibleGroups[`${collegeKey}-${categoryKey}`] ? 'Hide' : ''} {categoryKey}
                </button>
              </h3>
              {visibleGroups[`${collegeKey}-${categoryKey}`] && (
                <ul>
                  {groupedItems[collegeKey][categoryKey].map((item) => (
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
      ))}
    </div>
  );
};

export default Reports;
