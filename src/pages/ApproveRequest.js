import React, { useState, useEffect } from 'react';
import { collection, addDoc, Timestamp, onSnapshot } from 'firebase/firestore';
import { db, storage } from '../firebase/firebase-config'; // Adjust the import path as needed
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'; // For image upload
import './ApproveRequest.css'; // Ensure to create a CSS file for styling

const ApproveRequest = () => {
  const [requestDetails, setRequestDetails] = useState({
    itemName: '',
    itemCount: 1,
    college: '',
    dateRequested: Timestamp.now(),
    imageUrl: '',
  });
  const [image, setImage] = useState(null);
  const [requests, setRequests] = useState([]); // Track all submitted requests

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRequestDetails((prev) => ({ ...prev, [name]: value }));
  };

  // Handle image selection
  const handleImageUpload = (e) => {
    setImage(e.target.files[0]);
  };

  // Fetch submitted requests from Firestore
  useEffect(() => {
    const requestCollection = collection(db, 'requests');
    const unsubscribe = onSnapshot(requestCollection, (snapshot) => {
      const fetchedRequests = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRequests(fetchedRequests);
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, []);

  // Form submission handling
  const handleSubmit = async (e) => {
    e.preventDefault();

    let uploadedImageUrl = '';

    if (image) {
      // Upload image to Firebase Storage
      const storageRef = ref(storage, `requests/${image.name}`);
      const uploadTask = uploadBytesResumable(storageRef, image);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% done`);
        },
        (error) => {
          console.error('Error uploading image:', error);
        },
        async () => {
          uploadedImageUrl = await getDownloadURL(uploadTask.snapshot.ref);

          // Store the request in Firestore with the image URL and approved status
          await addDoc(collection(db, 'requests'), {
            ...requestDetails,
            imageUrl: uploadedImageUrl,
            dateRequested: Timestamp.now(),
            approved: true, // Automatically approve the request
          });

          resetForm();
        }
      );
    } else {
      // If no image, submit request directly
      await addDoc(collection(db, 'requests'), {
        ...requestDetails,
        dateRequested: Timestamp.now(),
        approved: true, // Automatically approve the request
      });

      resetForm();
    }
  };

  const resetForm = () => {
    // Reset the form after successful submission
    setRequestDetails({
      itemName: '',
      itemCount: 1,
      college: '',
      dateRequested: Timestamp.now(),
      imageUrl: '',
    });
    setImage(null);
  };

  return (
    <div className="approve-request-container">
      <h1>Submit Purchase Request</h1>
      <form className="approve-request-form" onSubmit={handleSubmit}>
        {/* Form Fields */}
        <label>
          Item Name:
          <input
            type="text"
            name="itemName"
            value={requestDetails.itemName}
            onChange={handleInputChange}
            required
          />
        </label>

        <label>
          Number of Items:
          <input
            type="number"
            name="itemCount"
            min="1"
            value={requestDetails.itemCount}
            onChange={handleInputChange}
            required
          />
        </label>

        <label>
          College Requesting:
          <select
            name="college"
            value={requestDetails.college}
            onChange={handleInputChange}
            required
          >
            <option value="">Select College</option>
            <option value="Engineering">Engineering</option>
            <option value="Business">Business</option>
            <option value="Arts">Arts</option>
            <option value="Sciences">Sciences</option>
            {/* Add more colleges as needed */}
          </select>
        </label>

        <label>
          Upload Image (Optional):
          <input type="file" onChange={handleImageUpload} />
        </label>

        <button type="submit">Submit Request</button>
      </form>

      {/* Display Submitted Requests */}
      <div className="submitted-requests">
        <h2>Submitted Requests</h2>
        <ul>
          {requests.map((request) => (
            <li key={request.id}>
              <div><strong>Item:</strong> {request.itemName} ({request.itemCount})</div>
              <div><strong>College:</strong> {request.college}</div>
              <div><strong>Date Requested:</strong> {new Date(request.dateRequested.seconds * 1000).toLocaleDateString()}</div>
              {request.imageUrl && (
                <div>
                  <strong>Image:</strong>
                  <img src={request.imageUrl} alt="Request item" className="request-image" />
                </div>
              )}
              <div><strong>Status:</strong> {request.approved ? 'Approved' : 'Pending'}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ApproveRequest;
