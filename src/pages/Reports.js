import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase-config'; // Update the path as needed
import './Reports.css'; // Ensure to use your CSS for styling

const Reports = () => {
  const [collegeFilter, setCollegeFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [reportData, setReportData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      let itemsQuery = collection(db, 'items'); // Assumes your items are stored in the 'items' collection

      // Apply college filter if selected
      if (collegeFilter) {
        itemsQuery = query(itemsQuery, where('college', '==', collegeFilter));
      }

      // Apply date range filter if both start and end dates are selected
      if (startDateFilter && endDateFilter) {
        itemsQuery = query(
          itemsQuery,
          where('dateRequested', '>=', new Date(startDateFilter)),
          where('dateRequested', '<=', new Date(endDateFilter))
        );
      }

      const unsubscribe = onSnapshot(itemsQuery, (snapshot) => {
        const fetchedData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setReportData(fetchedData);
      });

      return () => unsubscribe();
    };

    fetchData();
  }, [collegeFilter, startDateFilter, endDateFilter]);

  return (
    <div className="report-page">
      <h1>Reports</h1>
      <div className="filter-section">
        <select
          value={collegeFilter}
          onChange={(e) => setCollegeFilter(e.target.value)}
        >
          <option value="">All Colleges</option>
          <option value="CCS">CCS</option>
          <option value="COC">COC</option>
          <option value="CED">CED</option>
          <option value="CBA">CBA</option>
          <option value="BED">BED</option>
          <option value="COE">COE</option>
        </select>

        <input
          type="date"
          value={startDateFilter}
          onChange={(e) => setStartDateFilter(e.target.value)}
          placeholder="Start Date"
        />

        <input
          type="date"
          value={endDateFilter}
          onChange={(e) => setEndDateFilter(e.target.value)}
          placeholder="End Date"
        />

        <button onClick={() => { setCollegeFilter(''); setStartDateFilter(''); setEndDateFilter(''); }}>
          Reset Filters
        </button>
      </div>

      <table className="report-table">
        <thead>
          <tr>
            <th>Item Name</th>
            <th>College</th>
            <th>Quantity</th>
            <th>Date Requested</th>
          </tr>
        </thead>
        <tbody>
          {reportData.length > 0 ? (
            reportData.map((item) => (
              <tr key={item.id}>
                <td>{item.itemName || 'N/A'}</td>
                <td>{item.college || 'N/A'}</td>
                <td>{item.quantity || 'N/A'}</td>
                <td>{item.dateRequested ? new Date(item.dateRequested.toDate()).toLocaleDateString() : 'N/A'}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4">No data available</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Reports;
