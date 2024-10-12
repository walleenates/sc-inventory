import React, { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../firebase/firebase-config';
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import Webcam from 'react-webcam';
import { BrowserMultiFormatReader } from '@zxing/library';
import JsBarcode from 'jsbarcode'; // Import JsBarcode for generating barcodes
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

  const fetchItems = async () => {
    const itemsCollection = collection(db, 'items');
    const itemSnapshot = await getDocs(itemsCollection);
    const itemList = itemSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setItems(itemList);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const getAvailableDevices = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    setDevices(videoDevices);
    if (videoDevices.length > 0) {
      setSelectedDeviceId(videoDevices[0].deviceId);
    }
  };

  useEffect(() => {
    getAvailableDevices();
  }, []);

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
    await fetchItems();
  };

  const deleteItem = async (itemDoc) => {
    await deleteDoc(itemDoc);
  };

  const handleScanFromCamera = useCallback(() => {
    if (webcamRef.current) {
      codeReader.current.decodeFromVideoDevice(selectedDeviceId, webcamRef.current.video, (result, err) => {
        if (result) {
          setBarcodeInput(result.text);
          setCameraEnabled(false);
        }
        if (err) {
          console.log(err);
        }
      });
    }
  }, [selectedDeviceId, webcamRef]);

  useEffect(() => {
    if (cameraEnabled) {
      handleScanFromCamera();
    } else {
      codeReader.current.reset();
    }
  }, [cameraEnabled, handleScanFromCamera]);

  // Function to render barcodes using JsBarcode
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

  useEffect(() => {
    items.forEach(item => {
      renderBarcode(item.barcode, `barcode-${item.id}`);
    });
  }, [items]);

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
            <svg id={`barcode-${item.id}`}></svg> {/* Barcode image element */}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Scanner;
