import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db, storage } from '../firebase/firebase-config';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import Camera from '../components/Camera'; // Ensure this component is created
import emailjs from 'emailjs-com'; // Import EmailJS
import './ApproveRequest.css';

const categories = ["Equipment", "Office Supplies", "Books", "Electrical Parts"];

const ApproveRequest = () => {
  const [requestDetails, setRequestDetails] = useState({
    itemName: '',
    itemCount: 1,
    college: '',
    requestDate: '',
    imageUrl: '',
    category: '',
    requestorEmail: '', // Add a field for the requestor's email
  });
  const [image, setImage] = useState(null);
  const [requests, setRequests] = useState([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [approvalDate, setApprovalDate] = useState(''); // State for approval date

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

          // Store the request in Firestore
          if (editingRequest) {
            // Update existing request
            const requestRef = doc(db, 'requests', editingRequest.id);
            await updateDoc(requestRef, {
              ...requestDetails,
              imageUrl: uploadedImageUrl,
              requestDate: new Date(requestDetails.requestDate).getTime(),
            });
          } else {
            // Add new request
            await addDoc(collection(db, 'requests'), {
              ...requestDetails,
              imageUrl: uploadedImageUrl,
              requestDate: new Date(requestDetails.requestDate).getTime(),
              approved: false, // Initially not approved
            });
          }

          resetForm();
        }
      );
    } else {
      // If no image, submit request directly
      if (editingRequest) {
        // Update existing request
        const requestRef = doc(db, 'requests', editingRequest.id);
        await updateDoc(requestRef, {
          ...requestDetails,
          requestDate: new Date(requestDetails.requestDate).getTime(),
        });
      } else {
        // Add new request
        await addDoc(collection(db, 'requests'), {
          ...requestDetails,
          requestDate: new Date(requestDetails.requestDate).getTime(),
          approved: false, // Initially not approved
        });
      }

      resetForm();
    }
  };

  const resetForm = () => {
    setRequestDetails({
      itemName: '',
      itemCount: 1,
      college: '',
      requestDate: '',
      imageUrl: '',
      category: '',
      requestorEmail: '', // Reset the requestor's email
    });
    setImage(null);
    setEditingRequest(null);
  };

  const handleCameraCapture = async (imageUrl) => {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const storageRef = ref(storage, `requests/${Date.now()}.png`);

    try {
      await uploadBytesResumable(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      setRequestDetails((prev) => ({ ...prev, imageUrl: downloadURL }));
      setIsCameraOpen(false);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleEdit = (request) => {
    setRequestDetails({
      itemName: request.itemName,
      itemCount: request.itemCount,
      college: request.college,
      requestDate: new Date(request.requestDate).toISOString().substring(0, 10),
      imageUrl: request.imageUrl,
      category: request.category,
      requestorEmail: request.requestorEmail, // Set the email for editing
    });
    setEditingRequest(request);
  };

  const handleDelete = async (requestId) => {
    try {
      await deleteDoc(doc(db, 'requests', requestId));
    } catch (error) {
      console.error('Error deleting request:', error);
    }
  };

  const handleApprovalDateChange = (e) => {
    setApprovalDate(e.target.value);
  };

  const handleAddApprovalDate = async (requestId) => {
    try {
      const requestRef = doc(db, 'requests', requestId);
      await updateDoc(requestRef, {
        approvalDate: new Date(approvalDate).getTime(), // Add approval date
        approved: true, // Mark as approved
      });

      // Send email notification to requestor
      await sendNotification(requestDetails.requestorEmail, approvalDate);

      setApprovalDate(''); // Clear the approval date input
    } catch (error) {
      console.error('Error updating approval date:', error);
    }
  };

  const sendNotification = (email, approvalDate) => {
    const templateParams = {
      to_email: email,
      approval_date: approvalDate,
    };

    return emailjs.send('service_4nqmnnj', 'template_1yw0w9s', templateParams, 'r_Gc_TmxGbWOvqOYj')
      .then((response) => {
        console.log('Email sent successfully!', response.status, response.text);
      })
      .catch((error) => {
        console.error('Failed to send email:', error);
      });
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
            <option value="Engineering">Engineering</option>
            <option value="Business">Business</option>
            <option value="Arts">Arts</option>
            <option value="Sciences">Sciences</option>
            {/* Add more colleges as needed */}
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
          Requestor's Email:
          <input
            type="email"
            name="requestorEmail"
            value={requestDetails.requestorEmail}
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
                <h3>{request.itemName}</h3>
                <p>Requested on: {new Date(request.requestDate).toLocaleDateString()}</p>
                {request.approved && (
                  <div>
                    <p>Approved on: {new Date(request.approvalDate).toLocaleDateString()}</p>
                  </div>
                )}
                {!request.approved && (
                  <div>
                    <label>
                      Approval Date:
                      <input
                        type="date"
                        value={approvalDate}
                        onChange={handleApprovalDateChange}
                      />
                    </label>
                    <button onClick={() => handleAddApprovalDate(request.id)}>Add Approval Date</button>
                  </div>
                )}
                <button onClick={() => handleEdit(request)}>Edit</button>
                <button onClick={() => handleDelete(request.id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Camera Component */}
      {isCameraOpen && <Camera onCapture={handleCameraCapture} />}
    </div>
  );
};

export default ApproveRequest;
