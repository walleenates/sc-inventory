import React, { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../firebase/firebase-config';
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import Webcam from 'react-webcam'; // For camera access
import { BrowserMultiFormatReader } from '@zxing/library'; // For barcode scanning
import './Scanner.css'; // Assuming you're using CSS for styling

const Scanner = () => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [quantityInput, setQuantityInput] = useState(1);
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState('');
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [devices, setDevices] = useState([]); // List of available cameras
  const [selectedDeviceId, setSelectedDeviceId] = useState(''); // Selected camera device
  const [showItems, setShowItems] = useState(false); // Toggle for showing items list
  const [searchResult, setSearchResult] = useState(null); // Store search result
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
      const updatedQuantity = item.quantity - quantityInput;
      if (updatedQuantity < 0) {
        setMessage('Quantity cannot be less than zero.');
        return;
      }

      const itemDoc = doc(db, 'items', item.id);
      await updateDoc(itemDoc, { quantity: updatedQuantity });

      if (updatedQuantity === 0) {
        await deleteItem(itemDoc);
        setMessage(`Successfully scanned and deleted item: ${item.text}.`);
      } else {
        setMessage(`Successfully scanned item: ${item.text}. Remaining quantity: ${updatedQuantity}`);
      }
    } else {
      setMessage('Item not found. Please check the barcode and try again.');
    }

    setBarcodeInput('');
    setQuantityInput(1);
    await fetchItems(); // Re-fetch items to update the list
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

  // Function to search for an item by barcode
  const handleSearchItem = () => {
    const item = items.find(item => item.barcode === barcodeInput);
    if (item) {
      setSearchResult(item);
      setMessage('');
    } else {
      setSearchResult(null);
      setMessage('Item not found.');
    }
  };

  // Toggle visibility of items list
  const toggleShowItems = () => {
    setShowItems(!showItems);
  };

  return (
    <div className="scanner-container">
      <h1>Scanner</h1>

      {/* Manual Barcode Input */}
      <form onSubmit={handleBarcodeSubmit} className="barcode-form">
        <input
          type="text"
          value={barcodeInput}
          onChange={(e) => setBarcodeInput(e.target.value)}
          placeholder="Enter barcode"
          required
        />
        <input
          type="number"
          value={quantityInput}
          onChange={(e) => setQuantityInput(Number(e.target.value))}
          placeholder="Quantity"
          min="1"
          required
        />
        <button type="submit" className="btn-scan">Delete Items</button>
        <button type="button" onClick={handleSearchItem} className="btn-search">Search Item</button> {/* Updated Button */}
      </form>

      {message && <p className="message">{message}</p>}

      {/* Toggle Camera */}
      <button onClick={() => setCameraEnabled(!cameraEnabled)} className="btn-toggle-camera">
        {cameraEnabled ? 'Stop Camera' : 'Scan Barcode with Camera'}
      </button>

      {/* Select Camera Dropdown */}
      {devices.length > 0 && (
        <div className="camera-select">
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
        <div className="camera-preview">
          <Webcam
            ref={webcamRef}
            width="300"
            height="200"
            videoConstraints={{ deviceId: selectedDeviceId }}
          />
        </div>
      )}

      {/* Search Result */}
      {searchResult && (
        <div className="search-result">
          <h2>Search Result</h2>
          <p>{searchResult.text} - Barcode: {searchResult.barcode} - Quantity: {searchResult.quantity}</p>
        </div>
      )}

      {/* Toggle Items List */}
      <button onClick={toggleShowItems} className="btn-toggle-items">
        {showItems ? 'Hide Items' : 'Show All Items'}
      </button>

      {/* Display All Items */}
      {showItems && (
        <div className="items-list">
          <h2>All Items</h2>
          <ul>
            {items.map(item => (
              <li key={item.id}>
                {item.text} - Barcode: {item.barcode} - Quantity: {item.quantity}
                <button onClick={() => navigator.clipboard.writeText(item.barcode)} className="btn-copy-barcode">
                  Copy Barcode
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Scanner;
