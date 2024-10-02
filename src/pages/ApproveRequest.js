import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db, storage } from '../firebase/firebase-config';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import Camera from '../components/Camera';
import emailjs from 'emailjs-com';
import './ApproveRequest.css';

const categories = ["Equipment", "Office Supplies", "Books", "Electrical Parts"];
const colleges = ["Engineering", "Business", "Arts", "Sciences"];

const ApproveRequest = () => {
  const [requestDetails, setRequestDetails] = useState({
    itemName: '',
    college: '',
    requestDate: '',
    imageUrl: '',
    category: '',
    uniqueId: '',
  });
  const [image, setImage] = useState(null);
  const [requests, setRequests] = useState([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [approvalDate, setApprovalDate] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRequestDetails((prev) => ({ ...prev, [name]: value }));
    setErrorMessage(''); // Clear error message on input change
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

    return () => unsubscribe();
  }, []);

  // Form submission handling (create or update request)
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check for unique request number
    const isDuplicate = requests.some(request => request.uniqueId === requestDetails.uniqueId && request.id !== editingRequest?.id);
    if (isDuplicate) {
      setErrorMessage('Error: Request Number (Unique ID) must be unique.');
      return;
    }

    let uploadedImageUrl = '';

    if (image) {
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
          submitRequest(uploadedImageUrl);
        }
      );
    } else {
      submitRequest();
    }
  };

  // Submitting the request (create or update)
  const submitRequest = async (uploadedImageUrl = '') => {
    try {
      if (editingRequest) {
        const requestRef = doc(db, 'requests', editingRequest.id);
        await updateDoc(requestRef, {
          ...requestDetails,
          imageUrl: uploadedImageUrl || requestDetails.imageUrl,
          requestDate: new Date(requestDetails.requestDate).getTime(),
        });
        setEditingRequest(null); // Reset after editing
      } else {
        await addDoc(collection(db, 'requests'), {
          ...requestDetails,
          imageUrl: uploadedImageUrl,
          requestDate: new Date(requestDetails.requestDate).getTime(),
          approved: false,
        });
      }
      resetForm();
    } catch (error) {
      console.error('Error submitting request:', error);
    }
  };

  // Reset form fields after submission
  const resetForm = () => {
    setRequestDetails({
      itemName: '',
      college: '',
      requestDate: '',
      imageUrl: '',
      category: '',
      uniqueId: '',
    });
    setImage(null);
    setEditingRequest(null);
    setErrorMessage(''); // Reset error message
  };

  // Sending email notification when the approval date is set
  const sendNotification = async (approvalDate, request) => {
    const templateParams = {
      unique_id: request.uniqueId, // Add this line to include Unique ID
      college_requesting: request.college,
      purpose_of_request: request.itemName,
      category: request.category,
      request_date: new Date(request.requestDate).toLocaleDateString(),
      approval_date: new Date(approvalDate).toLocaleDateString(),
    };
    try {
      await emailjs.send('service_bl8cece', 'template_2914ned', templateParams, 'BMRt6JigJjznZL-FA');
      console.log('Email sent successfully!');
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  };

  // Handle adding approval date
  const handleAddApprovalDate = async (requestId) => {
    const requestToUpdate = requests.find(req => req.id === requestId);
    
    try {
      const requestRef = doc(db, 'requests', requestId);
      await updateDoc(requestRef, {
        approvalDate: new Date(approvalDate).getTime(),
        approved: true,
      });

      // Send notification with the request details
      await sendNotification(approvalDate, requestToUpdate);
      setApprovalDate('');
    } catch (error) {
      console.error('Error updating approval date:', error);
    }
  };

  // Handle editing a request
  const handleEdit = (request) => {
    setEditingRequest(request);
    setRequestDetails({
      itemName: request.itemName,
      college: request.college,
      requestDate: new Date(request.requestDate).toISOString().substring(0, 10),
      imageUrl: request.imageUrl,
      category: request.category,
      uniqueId: request.uniqueId || '', // Populate uniqueId if available
    });
    setImage(null); // Clear image when editing
  };

  // Handle deleting a request
  const handleDelete = async (requestId) => {
    try {
      await deleteDoc(doc(db, 'requests', requestId));
      console.log('Request deleted successfully!');
    } catch (error) {
      console.error('Error deleting request:', error);
    }
  };

  const handleImageCapture = (capturedImage) => {
    if (capturedImage instanceof File || capturedImage instanceof Blob) {
      setImage(capturedImage); // Ensure capturedImage is a valid File or Blob
    } else {
      console.error('Captured image is not a valid File or Blob:', capturedImage);
    }
    setIsCameraOpen(false); // Close camera after capturing the image
  };
  
  // Handle image upload with proper type checking
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && (file instanceof File || file instanceof Blob)) {
      setImage(file); // Set image from file input
    } else {
      console.error('Uploaded image is not a valid File or Blob:', file);
    }
  };

  return (
    <div className="approve-request-container">
      <h1>{editingRequest ? 'Edit Purchase Request' : 'Submit Purchase Request'}</h1>
      {errorMessage && <p className="error-message">{errorMessage}</p>}
      <form className="approve-request-form" onSubmit={handleSubmit}>
        {/* Request Number Input */}
        <label>
          Request Number (Unique ID):
          <input
            type="text"
            name="uniqueId"
            value={requestDetails.uniqueId}
            onChange={handleInputChange}
            required
          />
        </label>

        {/* Item Name Input */}
        <label>
          Purpose of the Request Item:
          <input
            type="text"
            name="itemName"
            value={requestDetails.itemName}
            onChange={handleInputChange}
            required
          />
        </label>

        {/* College Selection */}
        <label>
          College:
          <select
            name="college"
            value={requestDetails.college}
            onChange={handleInputChange}
            required
          >
            <option value="">Select a college</option>
            {colleges.map((college, index) => (
              <option key={index} value={college}>{college}</option>
            ))}
          </select>
        </label>

        {/* Category Selection */}
        <label>
          Category:
          <select
            name="category"
            value={requestDetails.category}
            onChange={handleInputChange}
            required
          >
            <option value="">Select a category</option>
            {categories.map((category, index) => (
              <option key={index} value={category}>{category}</option>
            ))}
          </select>
        </label>

        {/* Request Date Input */}
        <label>
          Request Date:
          <input
            type="date"
            name="requestDate"
            value={requestDetails.requestDate}
            onChange={handleInputChange}
            required
          />
        </label>

        {/* Image Upload */}
        <label>
          Upload Image:
          <input type="file" accept="image/*" onChange={handleImageUpload} />
        </label>

        {/* Capture Image Button */}
        <button type="button" onClick={() => setIsCameraOpen(true)}>Capture Image</button>

        {/* Submit Button */}
        <button type="submit">{editingRequest ? 'Update Request' : 'Submit Request'}</button>
      </form>

      {/* Camera Component */}
      {isCameraOpen && (
        <Camera onCapture={handleImageCapture} />
      )}

      {/* Requests List */}
      <h2>Submitted Requests</h2>
      <ul>
        {requests.map((request) => (
          <li key={request.id}>
            <div>
              <h3>Request Number: {request.uniqueId}</h3> {/* Displaying Request Number */}
              <h3>{request.itemName}</h3>
              <p>College: {request.college}</p>
              <p>Category: {request.category}</p>
              <p>Request Date: {new Date(request.requestDate).toLocaleDateString()}</p>
              {request.imageUrl && <img src={request.imageUrl} alt="Request" />}
              {request.approved && <p>Approved on: {new Date(request.approvalDate).toLocaleDateString()}</p>}
              <button onClick={() => handleEdit(request)}>Edit</button>
              <button onClick={() => handleDelete(request.id)}>Delete</button>
              {!request.approved && (
                <div>
                  <input
                    type="date"
                    value={approvalDate}
                    onChange={(e) => setApprovalDate(e.target.value)}
                    placeholder="Approval Date"
                  />
                  <button onClick={() => handleAddApprovalDate(request.id)}>Set Approval Date</button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ApproveRequest;
