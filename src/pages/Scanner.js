import React, { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../firebase/firebase-config';
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import Webcam from 'react-webcam';
import { BrowserMultiFormatReader } from '@zxing/library';
import JsBarcode from 'jsbarcode';
import './Scanner.css';

const Scanner = () => {
  const [quantityInput, setQuantityInput] = useState(1);
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState('');
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [searchMode, setSearchMode] = useState(false); // New state to track search mode
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

  // Handle barcode scan to update/delete or search item based on quantity
  const handleBarcodeScan = useCallback(async (barcode) => {
    const item = items.find(item => item.barcode === barcode);
    if (item) {
      if (searchMode) {
        // Display message if in search mode
        setMessage(`Found item: '${item.text}' - Quantity: ${item.quantity}`);
      } else {
        // Handle update/delete logic
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
      }
    } else {
      setMessage('Item not found. Please check the barcode and try again.');
    }
  }, [items, quantityInput, searchMode]);

  // Handle scanning from the camera for updating/deleting or searching for items
  const handleScanFromCamera = useCallback(() => {
    if (webcamRef.current) {
      codeReader.current.decodeFromVideoDevice(selectedDeviceId, webcamRef.current.video, (result, err) => {
        if (result) {
          handleBarcodeScan(result.text); // Search or update/delete item based on mode
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

  // Render barcode for each item and return the canvas element
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

  // Handle barcode submission for update/delete
  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    setCameraEnabled(true); // Enable the camera for scanning
  };

  // Function to save barcode image
  const saveBarcodeImage = (barcode, college) => {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, barcode, {
      format: "CODE128",
      lineColor: "#000",
      width: 2,
      height: 50,
      displayValue: false
    });

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `${college}_barcode_${barcode}.png`; // Filename includes college name
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setMessage(`Saved barcode for ${college}: ${barcode}`);
  };

  return (
    <div>
      <h1>Scanner</h1>
      <form onSubmit={handleBarcodeSubmit}>
        <input
          type="number"
          value={quantityInput}
          onChange={(e) => setQuantityInput(Number(e.target.value))}
          placeholder="Quantity"
          min="1"
          required
        />
        <button type="submit">Update/Delete Item</button>
      </form>

      <button onClick={() => {
        setSearchMode(true); // Set search mode
        setCameraEnabled(true); // Enable the camera for scanning
      }}>
        Search Item through Scan
      </button>

      {message && <p className="message">{message}</p>}

      {cameraEnabled && (
        <div>
          <Webcam ref={webcamRef} width="300" height="200" videoConstraints={{ deviceId: selectedDeviceId }} />
          <button onClick={() => setCameraEnabled(false)}>Stop Camera</button>
        </div>
      )}

      <h2>All Items</h2>
      <ul>
        {items.map(item => (
          <li key={item.id}>
            {item.text} - Barcode: {item.barcode} - Quantity: {item.quantity} - College: {item.college} - Category: {item.category}
            <svg id={`barcode-${item.id}`} style={{ cursor: 'pointer' }}></svg>
            <button onClick={() => saveBarcodeImage(item.barcode, item.college)}>Save Barcode Image</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Scanner;
