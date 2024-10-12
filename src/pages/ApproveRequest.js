import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db, storage } from '../firebase/firebase-config';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import Camera from '../components/Camera';
import emailjs from 'emailjs-com';
import './ApproveRequest.css';

const categories = ["Equipment", "Office Supplies", "Books", "Electrical Parts"];
const colleges = ["CCS", "COC", "CED", "CBA", "BED", "COE"]; // Updated college options

const ApproveRequest = () => {
  const [requestDetails, setRequestDetails] = useState({
    itemName: '',
    college: '',
    requestDate: '',
    imageUrl: '',
    category: '',
    uniqueId: '',
    quantity: 0,
  });
  const [image, setImage] = useState(null);
  const [requests, setRequests] = useState([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [approvalDate, setApprovalDate] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRequestDetails((prev) => ({ ...prev, [name]: value }));
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isDuplicate = requests.some(request => request.uniqueId === requestDetails.uniqueId && request.id !== editingRequest?.id);
    if (isDuplicate) {
      setErrorMessage('Error: Request Number (Unique ID) must be unique.');
      return;
    }
    if (image) {
      const storageRef = ref(storage, `requests/${image.name}`);
      const uploadTask = uploadBytesResumable(storageRef, image);
      uploadTask.on(
        'state_changed',
        null,
        (error) => setErrorMessage('Error uploading image. Please try again.'),
        async () => {
          const uploadedImageUrl = await getDownloadURL(uploadTask.snapshot.ref);
          submitRequest(uploadedImageUrl);
        }
      );
    } else {
      submitRequest();
    }
  };

  const submitRequest = async (uploadedImageUrl = '') => {
    try {
      if (editingRequest) {
        const requestRef = doc(db, 'requests', editingRequest.id);
        await updateDoc(requestRef, {
          ...requestDetails,
          imageUrl: uploadedImageUrl || requestDetails.imageUrl,
          requestDate: new Date(requestDetails.requestDate).getTime(),
        });
        setEditingRequest(null);
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
      setErrorMessage('Error submitting request.');
    }
  };

  const resetForm = () => {
    setRequestDetails({
      itemName: '',
      college: '',
      requestDate: '',
      imageUrl: '',
      category: '',
      uniqueId: '',
      quantity: 0,
    });
    setImage(null);
    setEditingRequest(null);
    setErrorMessage('');
  };

  const sendNotification = async (approvalDate, request) => {
    const templateParams = {
      unique_id: request.uniqueId,
      college_requesting: request.college,
      purpose_of_request: request.itemName,
      category: request.category,
      request_date: new Date(request.requestDate).toLocaleDateString(),
      approval_date: new Date(approvalDate).toLocaleDateString(),
    };
    try {
      await emailjs.send('service_bl8cece', 'template_2914ned', templateParams, 'BMRt6JigJjznZL-FA');
    } catch (error) {
      setErrorMessage('Failed to send email notification.');
    }
  };

  const handleAddApprovalDate = async (requestId) => {
    const requestToUpdate = requests.find(req => req.id === requestId);
    try {
      const requestRef = doc(db, 'requests', requestId);
      await updateDoc(requestRef, {
        approvalDate: new Date(approvalDate).getTime(),
        approved: true,
      });
      await sendNotification(approvalDate, requestToUpdate);
      setApprovalDate('');
    } catch (error) {
      setErrorMessage('Error updating approval date.');
    }
  };

  const handleEdit = (request) => {
    setEditingRequest(request);
    setRequestDetails({
      itemName: request.itemName,
      college: request.college,
      requestDate: new Date(request.requestDate).toISOString().substring(0, 10),
      imageUrl: request.imageUrl,
      category: request.category,
      uniqueId: request.uniqueId || '',
      quantity: request.quantity || 0,
    });
    setImage(null);
  };

  const handleDelete = async (requestId) => {
    try {
      await deleteDoc(doc(db, 'requests', requestId));
    } catch (error) {
      setErrorMessage('Error deleting request.');
    }
  };

  const handleImageCapture = (capturedImage) => {
    if (capturedImage instanceof File || capturedImage instanceof Blob) {
      setImage(capturedImage);
    } else {
      setErrorMessage('Invalid image format.');
    }
    setIsCameraOpen(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && (file instanceof File || file instanceof Blob)) {
      setImage(file);
    } else {
      setErrorMessage('Invalid image format.');
    }
  };

  return (
    <div className="approve-request-container">
      <h1>{editingRequest ? 'Edit Purchase Request' : 'Submit Purchase Request'}</h1>
      {errorMessage && <p className="error-message">{errorMessage}</p>}
      <form className="approve-request-form" onSubmit={handleSubmit}>
        <label>
          Request Number (Unique ID):
          <input type="text" name="uniqueId" value={requestDetails.uniqueId} onChange={handleInputChange} required />
        </label>
        <label>
          Purpose of the Request Item:
          <input type="text" name="itemName" value={requestDetails.itemName} onChange={handleInputChange} required />
        </label>
        <label>
          College:
          <select name="college" value={requestDetails.college} onChange={handleInputChange} required>
            <option value="">Select a college</option>
            {colleges.map((college, index) => (
              <option key={index} value={college}>{college}</option>
            ))}
          </select>
        </label>
        <label>
          Category:
          <select name="category" value={requestDetails.category} onChange={handleInputChange} required>
            <option value="">Select a category</option>
            {categories.map((category, index) => (
              <option key={index} value={category}>{category}</option>
            ))}
          </select>
        </label>
        <label>
          Quantity:
          <input type="number" name="quantity" value={requestDetails.quantity} onChange={handleInputChange} required min="1" />
        </label>
        <label>
          Request Date:
          <input type="date" name="requestDate" value={requestDetails.requestDate} onChange={handleInputChange} required />
        </label>
        <label>
          Upload Image:
          <input type="file" accept="image/*" onChange={handleImageUpload} />
        </label>
        <button type="button" onClick={() => setIsCameraOpen(true)}>Capture Image</button>
        <button type="submit">{editingRequest ? 'Update Request' : 'Submit Request'}</button>
      </form>

      {isCameraOpen && <Camera onCapture={handleImageCapture} />}

      <h2>Submitted Requests</h2>
      <ul>
        {requests.map((request) => (
          <li key={request.id}>
            <p><strong>Unique ID:</strong> {request.uniqueId}</p>
            <p><strong>Purpose:</strong> {request.itemName}</p>
            <p><strong>College:</strong> {request.college}</p>
            <p><strong>Category:</strong> {request.category}</p>
            <p><strong>Quantity:</strong> {request.quantity}</p>
            <p><strong>Request Date:</strong> {new Date(request.requestDate).toLocaleDateString()}</p>
            <p><strong>Approval Date:</strong> {request.approvalDate ? new Date(request.approvalDate).toLocaleDateString() : 'Not approved'}</p>
            {request.imageUrl && <img src={request.imageUrl} alt="Request" className="request-image" />}
            <button onClick={() => handleEdit(request)}>Edit</button>
            <button onClick={() => handleDelete(request.id)}>Delete</button>
            {!request.approved && (
              <div>
                <label>
                  Set Approval Date:
                  <input type="date" value={approvalDate} onChange={(e) => setApprovalDate(e.target.value)} required />
                </label>
                <button onClick={() => handleAddApprovalDate(request.id)}>Approve</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ApproveRequest;
