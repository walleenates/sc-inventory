// src/pages/Camera.js
import React, { useRef, useEffect, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';

const Camera = () => {
  const videoRef = useRef(null);
  const [scanner, setScanner] = useState(null);
  const [barcode, setBarcode] = useState('');

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
      }
    };

    startCamera();

    const newScanner = new BrowserMultiFormatReader();
    setScanner(newScanner);

    // Cleanup function to stop the camera when the component unmounts
    return () => {
      // Store the current video element in a local variable
      const currentVideoRef = videoRef.current;
      if (currentVideoRef && currentVideoRef.srcObject) {
        const stream = currentVideoRef.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
      if (newScanner) {
        newScanner.reset();
      }
    };
  }, []);

  useEffect(() => {
    if (scanner && videoRef.current) {
      const codeReader = scanner;

      const scan = () => {
        codeReader.decodeFromVideoDevice(null, videoRef.current, (result, error) => {
          if (result) {
            setBarcode(result.text);
            // Register the barcode (you can replace this with your own registration logic)
            console.log('Scanned Barcode:', result.text);
          }
          if (error) {
            console.error('Scanning error:', error);
          }
        });
      };

      scan();

      return () => {
        codeReader.reset();
      };
    }
  }, [scanner]);

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Barcode Scanner</h2>
      <video
        ref={videoRef}
        autoPlay
        style={{ width: '100%', height: 'auto', border: '1px solid #ccc' }}
      />
      {barcode && (
        <div>
          <h3>Scanned Barcode: {barcode}</h3>
          {/* You can add your registration logic here */}
        </div>
      )}
    </div>
  );
};

export default Camera;
