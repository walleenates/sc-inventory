import React, { useState, useEffect, useRef } from "react";
import { db } from "../firebase/firebase-config"; // Adjust the import path as needed
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { Timestamp } from "firebase/firestore"; // Import Timestamp
import JsBarcode from "jsbarcode"; // Import JsBarcode for barcode generation
import "./ManageItem.css";

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
  const [requestedDate, setRequestedDate] = useState("");
  const [supplier, setSupplier] = useState("");
  const [itemType, setItemType] = useState("Equipment");
  const [editItem, setEditItem] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editCollege, setEditCollege] = useState("");
  const [editQuantity, setEditQuantity] = useState(1);
  const [editRequestedDate, setEditRequestedDate] = useState("");
  const [editSupplier, setEditSupplier] = useState("");
  const [editItemType, setEditItemType] = useState("Equipment");
  const [image, setImage] = useState(null); // State to store image file
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
    return `ITEM-${Math.random().toString(36).substr(2, 9)}`; // Example barcode generation
  };

  const handleAddItem = async () => {
    if (
      newItem.trim() &&
      selectedCollege &&
      quantity > 0 &&
      requestedDate &&
      supplier &&
      itemType
    ) {
      const newBarcode = generateBarcode(); // Generate a new barcode
      try {
        await addDoc(collection(db, "items"), {
          text: newItem.trim(),
          college: selectedCollege,
          quantity,
          requestedDate: new Date(requestedDate),
          supplier,
          itemType,
          barcode: newBarcode, // Add barcode
          image: image, // Add image URL
          createdAt: Timestamp.now(), // Add timestamp for creation
          updatedAt: Timestamp.now(), // Add timestamp for last update
        });
        setNewItem("");
        setSelectedCollege("");
        setQuantity(1);
        setRequestedDate("");
        setSupplier("");
        setItemType("Equipment");
        setImage(null); // Reset image state
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
    setEditRequestedDate(
      item.requestedDate.toDate().toISOString().substr(0, 10)
    );
    setEditSupplier(item.supplier);
    setEditItemType(item.itemType);
    setImage(item.image); // Set image URL for editing
  };

  const handleSaveEdit = async () => {
    if (
      editItem &&
      editValue.trim() &&
      editCollege &&
      editQuantity > 0 &&
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
          requestedDate: new Date(editRequestedDate),
          supplier: editSupplier,
          itemType: editItemType,
          image: image, // Update image URL
          updatedAt: Timestamp.now(), // Update timestamp
        });
        setEditItem(null);
        setEditValue("");
        setEditCollege("");
        setEditQuantity(1);
        setEditRequestedDate("");
        setEditSupplier("");
        setEditItemType("Equipment");
        setImage(null); // Reset image state
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
      setImage(URL.createObjectURL(file)); // Create a local URL for the image
    }
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
          onChange={(e) => setQuantity(parseInt(e.target.value))}
          placeholder="Quantity"
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
              <option value="">Select College</option>
              {colleges.map((college) => (
                <option key={college} value={college}>
                  {college}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={editQuantity}
              onChange={(e) => setEditQuantity(parseInt(e.target.value))}
              placeholder="Quantity"
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
            <button onClick={() => setEditItem(null)}>Done</button>
          </div>
        )}
      </div>
      <div className="item-list">
        {Object.keys(groupedItems).length > 0 ? (
          Object.keys(groupedItems).map((college) => (
            <div key={college}>
              <h2
                className="folder-header"
                onClick={() => toggleFolderVisibility(college)}
              >
                {college} ({groupedItems[college].length})
              </h2>
              {visibleColleges[college] && (
                <ul>
                  {groupedItems[college].map((item) => (
                    <li key={item.id} className="item">
                      <div className="item-details">
                        <span>{item.text}</span>
                        <span> (Quantity: {item.quantity})</span>
                        <span>
                          {" "}
                          (Requested Date:{" "}
                          {new Date(
                            item.requestedDate.seconds * 1000
                          ).toLocaleDateString()}
                          )
                        </span>
                        <span> (Supplier: {item.supplier})</span>
                        <span> (Type: {item.itemType})</span>
                        <div>
                          <span>
                            Created: {formatTimestamp(item.createdAt)}
                          </span>
                          <span>
                            {" "}
                            | Updated: {formatTimestamp(item.updatedAt)}
                          </span>
                        </div>
                        <div>
                          <span>Barcode: {item.barcode}</span>
                          <Barcode value={item.barcode} />{" "}
                          {/* Render the barcode */}
                        </div>
                        {item.image && (
                          <div>
                            <img src={item.image} alt="Item" />
                          </div>
                        )}
                      </div>
                      <button
                        className="edit-item-button"
                        onClick={() => handleEditItem(item)}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-item-button"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        Delete
                      </button>
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
