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
    itemCount: 1,
    college: '',
    requestDate: '',
    imageUrl: '',
    category: '',
  });
  const [image, setImage] = useState(null);
  const [requests, setRequests] = useState([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [approvalDate, setApprovalDate] = useState('');

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

    return () => unsubscribe();
  }, []);

  // Form submission handling (create or update request)
  const handleSubmit = async (e) => {
    e.preventDefault();

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
      itemCount: 1,
      college: '',
      requestDate: '',
      imageUrl: '',
      category: '',
    });
    setImage(null);
    setEditingRequest(null);
  };

  // Sending email notification when the approval date is set
  const sendNotification = async (approvalDate, request) => {
    const templateParams = {
      college_requesting: request.college,
      purpose_of_request: request.itemName,
      number_of_items: request.itemCount,
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
      itemCount: request.itemCount,
      college: request.college,
      requestDate: new Date(request.requestDate).toISOString().substring(0, 10),
      imageUrl: request.imageUrl,
      category: request.category,
    });
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

  return (
    <div className="approve-request-container">
      <h1>{editingRequest ? 'Edit Purchase Request' : 'Submit Purchase Request'}</h1>
      <form className="approve-request-form" onSubmit={handleSubmit}>
        {/* Form Fields */}
        <label>
          Purpose of the Request:
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
            {colleges.map((college) => (
              <option key={college} value={college}>
                {college}
              </option>
            ))}
          </select>
        </label>

        <label>
          Category:
          <select
            name="category"
            value={requestDetails.category}
            onChange={handleInputChange}
            required
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </label>

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

        <label>
          Upload Image (Optional):
          <input type="file" onChange={handleImageUpload} />
          <button type="button" onClick={() => setIsCameraOpen(true)}>
            Capture Image
          </button>
        </label>

        <button type="submit">{editingRequest ? 'Update Request' : 'Submit Request'}</button>
      </form>

      <div className="submitted-requests">
        <h2>Submitted Requests</h2>
        <ul>
          {requests.map((request) => (
            <li key={request.id}>
              <div>
                <p>Purpose: {request.itemName}</p>
                <p>Requested on: {new Date(request.requestDate).toLocaleDateString()}</p>
                <p>Category: {request.category}</p>
                <p>College: {request.college}</p>
                <p>Items: {request.itemCount}</p>
                <p>
                  Approved on:{' '}
                  {request.approvalDate
                    ? new Date(request.approvalDate).toLocaleDateString()
                    : 'Not approved yet'}
                </p>
                <img src={request.imageUrl} alt={request.itemName} />

                <button onClick={() => handleEdit(request)}>Edit</button>
                <button onClick={() => handleDelete(request.id)}>Delete</button>

                {!request.approved && (
                  <div>
                    <label>Approval Date:</label>
                    <input
                      type="date"
                      value={approvalDate}
                      onChange={(e) => setApprovalDate(e.target.value)}
                    />
                    <button onClick={() => handleAddApprovalDate(request.id)}>Set Approval Date</button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {isCameraOpen && (
        <Camera onCapture={(imageSrc) => {
          setImage(imageSrc);
          setIsCameraOpen(false);
        }} onClose={() => setIsCameraOpen(false)} />
      )}
    </div>
  );
};

export default ApproveRequest;
