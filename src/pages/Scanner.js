import React, { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../firebase/firebase-config';
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import Webcam from 'react-webcam'; // For camera access
import { BrowserMultiFormatReader } from '@zxing/library'; // For barcode scanning

const Scanner = () => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [quantityInput, setQuantityInput] = useState(1);
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState('');
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [devices, setDevices] = useState([]); // List of available cameras
  const [selectedDeviceId, setSelectedDeviceId] = useState(''); // Selected camera device
  const [mode, setMode] = useState('delete'); // Mode toggle (delete or search)
  const [searchedItem, setSearchedItem] = useState(null); // Store searched item

  const webcamRef = useRef(null);
  const codeReader = useRef(new BrowserMultiFormatReader());

  // Fetch items from Firestore
  const fetchItems = async () => {
    const itemsCollection = collection(db, 'items');
    const itemSnapshot = await getDocs(itemsCollection);
    const itemList = itemSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setItems(itemList);
  };

  useEffect(() => {
    fetchItems(); // Fetch items when the component mounts
  }, []);

  // Fetch available cameras
  const getAvailableDevices = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    setDevices(videoDevices);
    if (videoDevices.length > 0) {
      setSelectedDeviceId(videoDevices[0].deviceId); // Default to the first camera
    }
  };

  useEffect(() => {
    getAvailableDevices(); // Fetch available cameras on component mount
  }, []);

  // Handle barcode submission manually
  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    const item = items.find(item => item.barcode === barcodeInput);

    if (item) {
      if (mode === 'delete') {
        // Delete Mode: Update or delete the item
        const updatedQuantity = item.quantity - quantityInput;
        if (updatedQuantity < 0) {
          setMessage('Quantity cannot be less than zero.');
          return;
        }

        const itemDoc = doc(db, 'items', item.id);
        if (updatedQuantity === 0) {
          await deleteItem(itemDoc);
          setItems(prevItems => prevItems.filter(i => i.id !== item.id)); // Remove from state
          setMessage(`Successfully scanned and deleted item: ${item.text}.`);
        } else {
          await updateDoc(itemDoc, { quantity: updatedQuantity });
          setItems(prevItems => prevItems.map(i => i.id === item.id ? { ...i, quantity: updatedQuantity } : i)); // Update state
          setMessage(`Successfully scanned item: ${item.text}. Remaining quantity: ${updatedQuantity}`);
        }
      } else if (mode === 'search') {
        // Search Mode: Find and display the item
        setSearchedItem(item);
        setMessage(`Item found: ${item.text}. Quantity: ${item.quantity}`);
      }
    } else {
      setMessage('Item not found. Please check the barcode and try again.');
    }

    setBarcodeInput('');
    setQuantityInput(1);
  };

  // Function to delete an item from the database
  const deleteItem = async (itemDoc) => {
    await deleteDoc(itemDoc);
  };

  // Handle barcode scanning from the camera
  const handleScanFromCamera = useCallback(() => {
    if (webcamRef.current && cameraEnabled) {
      // Start scanning from the camera
      codeReader.current.decodeFromVideoDevice(selectedDeviceId, webcamRef.current.video, (result, err) => {
        if (result) {
          setBarcodeInput(result.text);
          setMessage(`Scanned Barcode: ${result.text}`);
          setCameraEnabled(false); // Stop the camera after successful scan
        } else if (err && err.name !== 'NotFoundException') {
          setMessage('Error scanning barcode. Please try again.');
          console.error(err); // Log errors except "NotFoundException"
        }
      });
    }
  }, [selectedDeviceId, cameraEnabled]);

  useEffect(() => {
    if (cameraEnabled) {
      handleScanFromCamera();
    } else {
      codeReader.current.reset(); // Stop barcode scanning if camera is disabled
    }
  }, [cameraEnabled, handleScanFromCamera]);

  // Function to copy barcode to clipboard
  const handleCopyBarcode = (barcode) => {
    navigator.clipboard.writeText(barcode)
      .then(() => setMessage(`Barcode ${barcode} copied to clipboard.`))
      .catch(() => setMessage('Failed to copy barcode.'));
  };

  // Toggle between delete and search mode
  const toggleMode = () => {
    setMode(mode === 'delete' ? 'search' : 'delete');
    setMessage(`Switched to ${mode === 'delete' ? 'Search' : 'Delete'} Mode.`);
    setSearchedItem(null); // Clear searched item when switching modes
  };

  return (
    <div>
      <h1>Scanner</h1>

      {/* Toggle between Delete and Search modes */}
      <button onClick={toggleMode}>
        {mode === 'delete' ? 'Switch to Search Mode' : 'Switch to Delete Mode'}
      </button>

      {/* Manual Barcode Input */}
      <form onSubmit={handleBarcodeSubmit}>
        <input
          type="text"
          value={barcodeInput}
          onChange={(e) => setBarcodeInput(e.target.value)}
          placeholder="Enter barcode"
          required
        />
        {mode === 'delete' && (
          <input
            type="number"
            value={quantityInput}
            onChange={(e) => setQuantityInput(Number(e.target.value))}
            placeholder="Quantity"
            min="1"
            required
          />
        )}
        <button type="submit">Submit</button>
      </form>

      {message && <p>{message}</p>}

      {/* Toggle Camera */}
      <button onClick={() => setCameraEnabled(!cameraEnabled)}>
        {cameraEnabled ? 'Stop Camera' : 'Scan Barcode with Camera'}
      </button>

      {/* Select Camera Dropdown */}
      {devices.length > 0 && (
        <div>
          <label>Select Camera: </label>
          <select
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
          >
            {devices.map(device => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${device.deviceId}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Camera Preview */}
      {cameraEnabled && (
        <div>
          <Webcam
            ref={webcamRef}
            width="300"
            height="200"
            videoConstraints={{ deviceId: selectedDeviceId }}
          />
        </div>
      )}

      {/* Display Searched Item */}
      {searchedItem && mode === 'search' && (
        <div>
          <h2>Searched Item</h2>
          <p>{searchedItem.text} - Barcode: {searchedItem.barcode} - Quantity: {searchedItem.quantity}</p>
        </div>
      )}

      {/* Display All Items */}
      <h2>All Items</h2>
      <ul>
        {items.map(item => (
          <li key={item.id}>
            {item.text} - Barcode: {item.barcode} - Quantity: {item.quantity}
            <button onClick={() => handleCopyBarcode(item.barcode)}>Copy Barcode</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Scanner;
