import React, { useState } from 'react';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, facebookProvider } from '../firebase/firebase-config';
import { useNavigate } from 'react-router-dom';

const SignInPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard'); // Redirect after sign-in
    } catch (error) {
      setError(error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/dashboard');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleFacebookSignIn = async () => {
    try {
      await signInWithPopup(auth, facebookProvider);
      navigate('/dashboard');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div style={styles.signinContainer}>
      <div style={styles.signinLeft}>
        <div style={styles.logoContainer}>
          <img src="spclogofinal.png" alt="Logo" style={styles.logo} />
          <div style={styles.systemName}>SIMS</div>
        </div>
      </div>
      <div style={styles.signinRight}>
        <h2 style={styles.title}>Sign In</h2>
        <form style={styles.signinForm} onSubmit={handleSignIn}>
          <div style={styles.formGroup}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.inputField}
              required
            />
          </div>
          <div style={styles.formGroup}>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.inputField}
              required
            />
          </div>
          <div style={styles.formActions}>
            <a href="/forgot-password" style={styles.forgotPassword}>Forgot Password?</a>
          </div>
          <button type="submit" style={styles.loginButton}>Sign In</button>
          <div style={styles.orContainer}>
            <span>or</span>
          </div>
          <div style={styles.otherLoginOptions}>
            <button type="button" style={styles.googleSignin} onClick={handleGoogleSignIn}>
              <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google Logo" style={styles.icon} />
              Sign in with Google
            </button>
            <button type="button" style={styles.facebookSignin} onClick={handleFacebookSignIn}>
              <img src="https://www.facebook.com/images/fb_icon_325x325.png" alt="Facebook Logo" style={styles.icon} />
              Sign in with Facebook
            </button>
          </div>
          <div style={styles.newAccount}>
            <span>New here? </span><a href="/create-account" style={styles.createAccount}>Create an account</a>
          </div>
          {error && <p style={styles.error}>{error}</p>}
        </form>
      </div>
    </div>
  );
};

const styles = {
  signinContainer: {
    display: 'flex',
    height: '100vh',
  },
  signinLeft: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(to bottom, #660809, #CC1012)',
    color: 'white',
    padding: '20px',
  },
  logoContainer: {
    textAlign: 'center',
  },
  logo: {
    width: '500px', // Increased size
    marginBottom: '20px',
  },
  systemName: {
    fontSize: '24px',
    fontWeight: 'bold',
  },
  signinRight: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '0 50px',
    backgroundColor: 'white',
  },
  title: {
    fontSize: '32px',
    color: '#333',
    marginBottom: '20px',
  },
  signinForm: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    maxWidth: '400px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  inputField: {
    width: '100%',
    padding: '8px',
    border: 'none',
    borderBottom: '2px solid #ccc',
    outline: 'none',
    backgroundColor: 'transparent',
  },
  formActions: {
    textAlign: 'center',
    marginTop: '10px',
  },
  forgotPassword: {
    color: '#0BACD4',
    textDecoration: 'none',
    fontWeight: 'bold',
  },
  loginButton: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#660809',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontWeight: 'bold',
    marginTop: '15px',
  },
  orContainer: {
    margin: '20px 0',
    textAlign: 'center',
  },
  otherLoginOptions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    alignItems: 'center',
  },
  googleSignin: {
    width: '100%',
    maxWidth: '300px',
    padding: '10px',
    backgroundColor: '#4285F4',
    color: 'white',
    borderRadius: '5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  facebookSignin: {
    width: '100%',
    maxWidth: '300px',
    padding: '10px',
    backgroundColor: '#3B5998',
    color: 'white',
    borderRadius: '5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: '20px',
    height: '20px',
    marginRight: '10px',
  },
  newAccount: {
    textAlign: 'center',
    marginTop: '20px',
  },
  createAccount: {
    color: '#0BACD4',
    fontWeight: 'bold',
    textDecoration: 'none',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: '10px',
  },
};

export default SignInPage;
