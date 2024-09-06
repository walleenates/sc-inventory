// src/pages/ManageItem.js
import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebase-config'; // Import Firestore
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import './ManageItem.css'; // Ensure you have the CSS file for styling

const ManageItem = () => {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('');
  const [showList, setShowList] = useState(true);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editValue, setEditValue] = useState('');

  // Fetch items from Firestore
  useEffect(() => {
    const itemsCollection = collection(db, 'items');
    const unsubscribe = onSnapshot(itemsCollection, (snapshot) => {
      const fetchedItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(fetchedItems);
    });

    return () => unsubscribe();
  }, []);

  const handleAddItem = async () => {
    if (newItem.trim() && selectedCollege) {
      try {
        await addDoc(collection(db, 'items'), { text: newItem.trim(), college: selectedCollege });
        setNewItem('');
        setSelectedCollege('');
      } catch (error) {
        console.error('Error adding document: ', error);
      }
    }
  };

  const handleEditItem = (id) => {
    const item = items.find(item => item.id === id);
    setEditingItemId(id);
    setEditValue(item.text);
  };

  const handleSaveEdit = async () => {
    if (editValue.trim() && editingItemId) {
      try {
        const itemDoc = doc(db, 'items', editingItemId);
        await updateDoc(itemDoc, { text: editValue.trim() });
        setEditingItemId(null);
        setEditValue('');
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

  const toggleListVisibility = () => {
    setShowList(!showList);
  };

  return (
    <div className="manage-item-container">
      <h1>Manage Items</h1>
      <div className="add-item">
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
          <option value="CCS">CCS</option>
          <option value="COC">COC</option>
          <option value="CED">CED</option>
          <option value="CBA">CBA</option>
          <option value="BED">BED</option>
          <option value="COE">COE</option>
        </select>
        <button onClick={handleAddItem} className="add-button">Add Item</button>
      </div>
      <button onClick={toggleListVisibility} className="toggle-button">
        {showList ? 'Hide List' : 'Show List'}
      </button>
      {showList && (
        <ul className="item-list">
          {items.length > 0 ? (
            items.map((item) => (
              <li key={item.id} className="item">
                {editingItemId === item.id ? (
                  <div className="edit-container">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                    />
                    <button onClick={handleSaveEdit} className="save-button">Save</button>
                    <button onClick={() => setEditingItemId(null)} className="cancel-button">Cancel</button>
                  </div>
                ) : (
                  <>
                    <span className="item-text">{item.text}</span>
                    <span className="item-college">({item.college})</span>
                    <div className="item-actions">
                      <button onClick={() => handleEditItem(item.id)} className="edit-button">Edit</button>
                      <button onClick={() => handleDeleteItem(item.id)} className="delete-button">Delete</button>
                    </div>
                  </>
                )}
              </li>
            ))
          ) : (
            <p>No items to display</p>
          )}
        </ul>
      )}
    </div>
  );
};

export default ManageItem;
