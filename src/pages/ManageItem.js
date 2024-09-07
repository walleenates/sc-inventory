import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebase-config'; // Adjust the import path as needed
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore'; // Import Timestamp

const colleges = ["CCS", "COC", "CED", "CBA", "BED", "COE"];

const ManageItem = () => {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [editItem, setEditItem] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editCollege, setEditCollege] = useState('');
  const [editQuantity, setEditQuantity] = useState(1);

  // State for handling folder visibility
  const [visibleColleges, setVisibleColleges] = useState({});

  useEffect(() => {
    const itemsCollection = collection(db, 'items');
    const unsubscribe = onSnapshot(itemsCollection, (snapshot) => {
      const fetchedItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setItems(fetchedItems);
    });

    return () => unsubscribe();
  }, []);

  const handleAddItem = async () => {
    if (newItem.trim() && selectedCollege && quantity > 0) {
      try {
        await addDoc(collection(db, 'items'), {
          text: newItem.trim(),
          college: selectedCollege,
          quantity,
          createdAt: Timestamp.now(), // Add timestamp for creation
          updatedAt: Timestamp.now()  // Add timestamp for last update
        });
        setNewItem('');
        setSelectedCollege('');
        setQuantity(1);
      } catch (error) {
        console.error('Error adding document: ', error);
      }
    }
  };

  const handleEditItem = (item) => {
    setEditItem(item);
    setEditValue(item.text);
    setEditCollege(item.college);
    setEditQuantity(item.quantity);
  };

  const handleSaveEdit = async () => {
    if (editItem && editValue.trim() && editCollege && editQuantity > 0) {
      try {
        const itemDoc = doc(db, 'items', editItem.id);
        await updateDoc(itemDoc, {
          text: editValue.trim(),
          college: editCollege,
          quantity: editQuantity,
          updatedAt: Timestamp.now() // Update timestamp
        });
        setEditItem(null);
        setEditValue('');
        setEditCollege('');
        setEditQuantity(1);
      } catch (error) {
        console.error('Error updating document: ', error);
      }
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      const itemDoc = doc(db, 'items', id);
      await deleteDoc(itemDoc);
    } catch (error) {
      console.error('Error deleting document: ', error);
    }
  };

  // Toggle visibility of items in a folder
  const toggleFolderVisibility = (college) => {
    setVisibleColleges((prevState) => ({
      ...prevState,
      [college]: !prevState[college]
    }));
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Admin';
    const date = timestamp.toDate();
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  // Group items by college
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.college]) {
      acc[item.college] = [];
    }
    acc[item.college].push(item);
    return acc;
  }, {});

  return (
    <div>
      <h1>Manage Items</h1>
      <div>
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Add new item"
        />
        <select
          value={selectedCollege}
          onChange={(e) => setSelectedCollege(e.target.value)}
        >
          <option value="">Select College</option>
          {colleges.map(college => (
            <option key={college} value={college}>{college}</option>
          ))}
        </select>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value))}
          placeholder="Quantity"
        />
        <button onClick={handleAddItem}>Add Item</button>
      </div>
      <div>
        {editItem && (
          <div>
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="Edit item"
            />
            <select
              value={editCollege}
              onChange={(e) => setEditCollege(e.target.value)}
            >
              <option value="">Select College</option>
              {colleges.map(college => (
                <option key={college} value={college}>{college}</option>
              ))}
            </select>
            <input
              type="number"
              value={editQuantity}
              onChange={(e) => setEditQuantity(parseInt(e.target.value))}
              placeholder="Quantity"
            />
            <button onClick={handleSaveEdit}>Save</button>
            <button onClick={() => setEditItem(null)}>Done</button>
          </div>
        )}
      </div>
      <div>
        {Object.keys(groupedItems).length > 0 ? (
          Object.keys(groupedItems).map(college => (
            <div key={college}>
              <h2 onClick={() => toggleFolderVisibility(college)} style={{ cursor: 'pointer' }}>
                {college} ({groupedItems[college].length})
              </h2>
              {visibleColleges[college] && (
                <ul>
                  {groupedItems[college].map(item => (
                    <li key={item.id}>
                      <span>{item.text}</span>
                      <span> (Quantity: {item.quantity})</span>
                      <div>
                        <span>Created: {formatTimestamp(item.createdAt)}</span>
                        <span> | Updated: {formatTimestamp(item.updatedAt)}</span>
                      </div>
                      <button onClick={() => handleEditItem(item)}>Edit</button>
                      <button onClick={() => handleDeleteItem(item.id)}>Delete</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))
        ) : (
          <p>No items to display</p>
        )}
      </div>
    </div>
  );
};

export default ManageItem;
