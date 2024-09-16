// src/pages/ManageItem.js
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase/firebase-config';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import JsBarcode from 'jsbarcode';
import Camera from './Camera'; // Import the Camera component
import './ManageItem.css';

const colleges = ["CCS", "COC", "CED", "CBA", "BED", "COE"];
const itemTypes = ["Equipment", "Office Supplies", "Books", "Electrical Parts"];

// Barcode Component
const Barcode = ({ value }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (svgRef.current) {
      JsBarcode(svgRef.current, value, {
        format: "CODE128",
        lineColor: "#000",
        width: 2,
        height: 50,
        displayValue: true,
      });
    }
  }, [value]);

  return <svg ref={svgRef}></svg>;
};

const ManageItem = () => {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState("");
  const [selectedCollege, setSelectedCollege] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [amount, setAmount] = useState(0);
  const [requestedDate, setRequestedDate] = useState("");
  const [supplier, setSupplier] = useState("");
  const [itemType, setItemType] = useState("Equipment");
  const [editItem, setEditItem] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editCollege, setEditCollege] = useState("");
  const [editQuantity, setEditQuantity] = useState(1);
  const [editAmount, setEditAmount] = useState(0);
  const [editRequestedDate, setEditRequestedDate] = useState("");
  const [editSupplier, setEditSupplier] = useState("");
  const [editItemType, setEditItemType] = useState("Equipment");
  const [image, setImage] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [visibleColleges, setVisibleColleges] = useState({});

  useEffect(() => {
    const itemsCollection = collection(db, "items");
    const unsubscribe = onSnapshot(itemsCollection, (snapshot) => {
      const fetchedItems = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setItems(fetchedItems);
    });

    return () => unsubscribe();
  }, []);

  const generateBarcode = () => {
    return `ITEM-${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleAddItem = async () => {
    if (
      newItem.trim() &&
      selectedCollege &&
      quantity > 0 &&
      amount >= 0 &&
      requestedDate &&
      supplier &&
      itemType
    ) {
      const newBarcode = generateBarcode();
      try {
        await addDoc(collection(db, "items"), {
          text: newItem.trim(),
          college: selectedCollege,
          quantity,
          amount,
          requestedDate: new Date(requestedDate),
          supplier,
          itemType,
          barcode: newBarcode,
          image,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        setNewItem("");
        setSelectedCollege("");
        setQuantity(1);
        setAmount(0);
        setRequestedDate("");
        setSupplier("");
        setItemType("Equipment");
        setImage(null);
      } catch (error) {
        console.error("Error adding document: ", error);
      }
    }
  };

  const handleEditItem = (item) => {
    setEditItem(item);
    setEditValue(item.text);
    setEditCollege(item.college);
    setEditQuantity(item.quantity);
    setEditAmount(item.amount);
    setEditRequestedDate(item.requestedDate.toDate().toISOString().substr(0, 10));
    setEditSupplier(item.supplier);
    setEditItemType(item.itemType);
    setImage(item.image);
  };

  const handleSaveEdit = async () => {
    if (
      editItem &&
      editValue.trim() &&
      editCollege &&
      editQuantity > 0 &&
      editAmount >= 0 &&
      editRequestedDate &&
      editSupplier &&
      editItemType
    ) {
      try {
        const itemDoc = doc(db, "items", editItem.id);
        await updateDoc(itemDoc, {
          text: editValue.trim(),
          college: editCollege,
          quantity: editQuantity,
          amount: editAmount,
          requestedDate: new Date(editRequestedDate),
          supplier: editSupplier,
          itemType: editItemType,
          image,
          updatedAt: Timestamp.now(),
        });
        setEditItem(null);
        setEditValue("");
        setEditCollege("");
        setEditQuantity(1);
        setEditAmount(0);
        setEditRequestedDate("");
        setEditSupplier("");
        setEditItemType("Equipment");
        setImage(null);
      } catch (error) {
        console.error("Error updating document: ", error);
      }
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      const itemDoc = doc(db, "items", id);
      await deleteDoc(itemDoc);
    } catch (error) {
      console.error("Error deleting document: ", error);
    }
  };

  const toggleFolderVisibility = (college) => {
    setVisibleColleges((prevState) => ({
      ...prevState,
      [college]: !prevState[college],
    }));
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Admin";
    const date = timestamp.toDate();
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.college]) {
      acc[item.college] = [];
    }
    acc[item.college].push(item);
    return acc;
  }, {});

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
    }
  };

  const handleCameraCapture = (imageUrl) => {
    setImage(imageUrl);
    setIsCameraOpen(false); // Close the camera after capturing
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
          {colleges.map((college) => (
            <option key={college} value={college}>
              {college}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={quantity}
          min="1"
          onChange={(e) => setQuantity(parseInt(e.target.value))}
          placeholder="Quantity"
        />
        <input
          type="number"
          value={amount}
          min="0"
          onChange={(e) => setAmount(parseFloat(e.target.value))}
          placeholder="Amount"
        />
        <input
          type="date"
          value={requestedDate}
          onChange={(e) => setRequestedDate(e.target.value)}
        />
        <input
          type="text"
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
          placeholder="Supplier"
        />
        <select value={itemType} onChange={(e) => setItemType(e.target.value)}>
          {itemTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        <button onClick={() => setIsCameraOpen(true)}>Open Camera</button>
        <button onClick={handleAddItem}>Add Item</button>
      </div>
      <div>
        {editItem && (
          <div className="edit-item">
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
              {colleges.map((college) => (
                <option key={college} value={college}>
                  {college}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={editQuantity}
              min="1"
              onChange={(e) => setEditQuantity(parseInt(e.target.value))}
              placeholder="Quantity"
            />
            <input
              type="number"
              value={editAmount}
              min="0"
              onChange={(e) => setEditAmount(parseFloat(e.target.value))}
              placeholder="Amount"
            />
            <input
              type="date"
              value={editRequestedDate}
              onChange={(e) => setEditRequestedDate(e.target.value)}
            />
            <input
              type="text"
              value={editSupplier}
              onChange={(e) => setEditSupplier(e.target.value)}
              placeholder="Supplier"
            />
            <select
              value={editItemType}
              onChange={(e) => setEditItemType(e.target.value)}
            >
              {itemTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <input type="file" accept="image/*" onChange={handleImageUpload} />
            <button onClick={handleSaveEdit}>Save</button>
            <button onClick={() => setEditItem(null)}>Cancel</button>
          </div>
        )}
      </div>
      {Object.keys(groupedItems).map((college) => (
        <div key={college}>
          <h2 onClick={() => toggleFolderVisibility(college)}>
            {college} ({groupedItems[college].length} items)
          </h2>
          {visibleColleges[college] &&
            groupedItems[college].map((item) => (
              <div key={item.id}>
                <h3>
                  {item.text} (Quantity: {item.quantity}, Amount: {item.amount})
                </h3>
                <p>
                  Requested Date: {item.requestedDate ? new Date(item.requestedDate.seconds * 1000).toDateString() : "N/A"}
                </p>
                <p>Supplier: {item.supplier}</p>
                <p>Type: {item.itemType}</p>
                {item.barcode && <Barcode value={item.barcode} />}
                {item.image && <img src={item.image} alt="Item" />}
                <button onClick={() => handleEditItem(item)}>Edit</button>
                <button onClick={() => handleDeleteItem(item.id)}>Delete</button>
                <p>Created: {formatTimestamp(item.createdAt)}</p>
                <p>Updated: {formatTimestamp(item.updatedAt)}</p>
              </div>
            ))}
        </div>
      ))}
      {isCameraOpen && <Camera onCapture={handleCameraCapture} onClose={() => setIsCameraOpen(false)} />}
    </div>
  );
};

export default ManageItem;
