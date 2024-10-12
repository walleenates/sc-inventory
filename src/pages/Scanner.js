import React, { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../firebase/firebase-config';
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import Webcam from 'react-webcam';
import { BrowserMultiFormatReader } from '@zxing/library';
import JsBarcode from 'jsbarcode';
import './Scanner.css';

const Scanner = () => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [quantityInput, setQuantityInput] = useState(1);
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState('');
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const webcamRef = useRef(null);
  const codeReader = useRef(new BrowserMultiFormatReader());

  // Fetch items from Firestore
  const fetchItems = async () => {
    const itemsCollection = collection(db, 'items');
    const itemSnapshot = await getDocs(itemsCollection);
    const itemList = itemSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setItems(itemList);
  };

  // Get camera devices on mount
  useEffect(() => {
    const getDevices = async () => {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);

      if (videoDevices.length > 0) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    };

    getDevices();
  }, []);

  // Fetch items when component mounts
  useEffect(() => {
    fetchItems();
  }, []);

  // Handle barcode scan and update/delete item based on quantity
  const handleBarcodeScan = useCallback(async (barcode) => {
    const item = items.find(item => item.barcode === barcode);
    if (item) {
      const updatedQuantity = item.quantity - quantityInput;
      const itemDoc = doc(db, 'items', item.id);

      if (updatedQuantity <= 0) {
        await deleteDoc(itemDoc);
        setMessage(`Item '${item.text}' deleted as quantity is now zero.`);
      } else {
        await updateDoc(itemDoc, { quantity: updatedQuantity });
        setMessage(`Updated item '${item.text}'. New quantity: ${updatedQuantity}.`);
      }
      await fetchItems(); // Refresh the item list
    } else {
      setMessage('Item not found. Please check the barcode and try again.');
    }
  }, [items, quantityInput]);

  // Handle scanning from the camera
  const handleScanFromCamera = useCallback(() => {
    if (webcamRef.current) {
      codeReader.current.decodeFromVideoDevice(selectedDeviceId, webcamRef.current.video, (result, err) => {
        if (result) {
          handleBarcodeScan(result.text);
          setCameraEnabled(false); // Stop the camera after a successful scan
        }
        if (err) {
          console.error(err);
        }
      });
    }
  }, [selectedDeviceId, handleBarcodeScan]);

  // Start or stop camera scanning
  useEffect(() => {
    if (cameraEnabled) {
      handleScanFromCamera();
    } else {
      codeReader.current.reset();
    }
  }, [cameraEnabled, handleScanFromCamera]);

  // Render barcode for each item
  const renderBarcode = (barcode, elementId) => {
    if (barcode) {
      JsBarcode(`#${elementId}`, barcode, {
        format: "CODE128",
        lineColor: "#000",
        width: 2,
        height: 50,
        displayValue: false
      });
    }
  };

  // Generate barcodes for items
  useEffect(() => {
    items.forEach(item => {
      renderBarcode(item.barcode, `barcode-${item.id}`);
    });
  }, [items]);

  // Handle barcode submission
  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    await handleBarcodeScan(barcodeInput);
    setBarcodeInput(''); // Clear input field
    setQuantityInput(1); // Reset quantity input
  };

  return (
    <div>
      <h1>Scanner</h1>
      <form onSubmit={handleBarcodeSubmit}>
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
        <button type="submit">Submit</button>
      </form>

      {message && <p className="message">{message}</p>}

      <button onClick={() => setCameraEnabled(!cameraEnabled)}>
        {cameraEnabled ? 'Stop Camera' : 'Scan Barcode with Camera'}
      </button>

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

      {cameraEnabled && (
        <div>
          <Webcam ref={webcamRef} width="300" height="200" videoConstraints={{ deviceId: selectedDeviceId }} />
        </div>
      )}

      <h2>All Items</h2>
      <ul>
        {items.map(item => (
          <li key={item.id}>
            {item.text} - Barcode: {item.barcode} - Quantity: {item.quantity} - College: {item.college} - Category: {item.category}
            <svg id={`barcode-${item.id}`} style={{ cursor: 'pointer' }}></svg>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Scanner;
