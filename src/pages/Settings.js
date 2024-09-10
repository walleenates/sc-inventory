import React, { useState } from 'react';
import { updateProfile, deleteUser, sendPasswordResetEmail } from 'firebase/auth';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/firebase-config'; // Adjust the import path as needed
import './Settings.css'; // Ensure you have relevant styles in this file
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const [newName, setNewName] = useState('');
  const [emailForPasswordReset, setEmailForPasswordReset] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate(); // Hook to navigate programmatically

  const handleChangeName = async () => {
    try {
      await updateProfile(auth.currentUser, { displayName: newName });
      setSuccess('Name updated successfully');
      setError('');
    } catch (error) {
      setError('Error updating name');
      setSuccess('');
    }
  };

  const handleResetPassword = async () => {
    try {
      await sendPasswordResetEmail(auth, emailForPasswordReset);
      setSuccess('Password reset email sent');
      setError('');
    } catch (error) {
      setError('Error sending password reset email');
      setSuccess('');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        // Delete the user account
        await deleteUser(auth.currentUser);

        // Sign out the user
        await signOut(auth);

        // Redirect to the sign-in page
        navigate('/sign-in');

        // Optionally, you could display a success message or handle further logic here
      } catch (error) {
        setError('Error deleting account');
        setSuccess('');
      }
    }
  };

  return (
    <div className="settings">
      <h2>Account Settings</h2>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      
      <div className="setting-section">
        <h3>Change Name</h3>
        <input
          type="text"
          placeholder="New Name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button onClick={handleChangeName}>Change Name</button>
      </div>

      <div className="setting-section">
        <h3>Reset Password</h3>
        <input
          type="email"
          placeholder="Enter email for password reset"
          value={emailForPasswordReset}
          onChange={(e) => setEmailForPasswordReset(e.target.value)}
        />
        <button onClick={handleResetPassword}>Send Reset Email</button>
      </div>

      <div className="setting-section">
        <h3>Delete Account</h3>
        <button onClick={handleDeleteAccount}>Delete Account</button>
      </div>
    </div>
  );
};

export default Settings;
