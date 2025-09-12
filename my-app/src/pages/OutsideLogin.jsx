import React,{useState} from "react";
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { FcGoogle } from 'react-icons/fc';
import { FaRegHandPaper } from 'react-icons/fa';
import './Login.css'; 

export default function Login() {
    const navigate = useNavigate();
    const [error, setError] = useState(null);

  const handleGoogleSignin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user; // This contains the user details
      console.log("User details:", user);
      // You can store user info in localStorage or context if needed
      if (user && user.uid) {
        // Simple base64 encoding (not secure, just obfuscation)
        const encodedId = btoa(user.uid);
        localStorage.setItem('userId', encodedId);
        window.location.href = 'http://127.0.0.1:3000/test.html?userId=' + encodeURIComponent(encodedId);
      }
    } catch (error) {
      console.error("Error signing in with Google:", error);
      let message = "Something went wrong";
      if(error.code == "auth/invalid-credential"){
        message = "Invalid credential";
      }
      setError(message); 
    }
  }
    
  const params = new URLSearchParams(window.location.search);
  const encodedId = params.get('userId');
  const userId = encodedId ? atob(encodedId) : null;

  return (
    <section className ="background">
    <main className="login-page">
      <section className="login-card">
        <header className="login-header">
          <h1 className="login-title">
            Welcome To PlanIt! <FaRegHandPaper className="wave-icon" />
          </h1>
          <p className="login-subtitle">Please enter your details</p>
        </header>

{/* Google Sign-in */}
    <button className="btn google-btn" type="button" onClick={handleGoogleSignin}>
        Log in with Google <FcGoogle />
    </button>
    {error && <div className="error-message">{error}</div>}

    </section>
    </main>
    </section>
  );
}
