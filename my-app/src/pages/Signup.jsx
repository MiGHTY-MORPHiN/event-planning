import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import {auth} from '../firebase';
import "./Login.css";


import { FcGoogle } from 'react-icons/fc';
import { HiOutlineMail } from 'react-icons/hi';
import { RiLockPasswordLine } from 'react-icons/ri';
import { FaRegHandPaper } from 'react-icons/fa';

export async function createPlannerAccount(email, uid) {

  const body =
  {
    uid: uid,
    name: "",
    email: email,
    eventHistory: [],
    activeEvents: [],
    preferences: []
  }

  const res = await fetch(
      
      "https://us-central1-planit-sdp.cloudfunctions.net/api/planner/signup",
      {
        method: "POST",
        headers:{
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

}

export default function Signup() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [error, setError] = useState(null);
    const [password, setPassword] = useState('');

    const onSubmit = async (e) => {
        e.preventDefault();
        try {
            setError("")
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            //To create planner document on signup
            const uid = userCredential.user.uid;
            await createPlannerAccount(email, uid);
            navigate('/login');
        } catch (error) {
            console.error("Error signing up:", error);
            let message = "Something went wrong";
                if(error.code == "auth/email-already-in-use"){
                    message = "Account with this email already exists, log in instead.";
                }
                else if(error.code =="auth/weak-password"){
                    message = "Password should be at least 6 characters long";
                }
                setError(message);
        }

    }
    const handleGoogleSignup = async () => {
        const provider = new GoogleAuthProvider();
        try {
              setError("")
            
            const userCrendential = await signInWithPopup(auth, provider);

            //To create planner document on signup
            const uid = userCrendential.user.uid;
            const email = userCrendential.user.email;

            console.log(email);
            await createPlannerAccount(email, uid);
            navigate('/login');
        } catch (error) {
            console.error("Error signing up with Google:", error);
            let message = "Something went wrong";
                if(error.code == "auth/email-already-in-use"){
                    message = "Account with this email already exists, log in instead.";
                }      
                setError(message);    
        
        }
    }
    return (
        <main className="login-page">
            <section className="login-card">
        <header className="login-header">
          <h1 className="login-title">
            Sign UP! <FaRegHandPaper className="wave-icon" />
          </h1>
          <p className="login-subtitle">Please enter your details</p>
        </header>



        
          {error && <p className="error">{error}</p>}
            <form onSubmit={onSubmit}>
                <label htmlFor="email" className="input-label">Email</label>
          <div className="input-with-icon">
            <svg className="input-icon" viewBox="0 0 24 24">
              <path d="M2 6.5A2.5 2.5 0 0 1 4.5 4h15A2.5 2.5 0 0 1 22 6.5v11A2.5 2.5 0 0 1 19.5 20h-15A2.5 2.5 0 0 1 2 17.5v-11Zm2.3-.5 7.2 5.1c.3.21.7.21 1 0L19.7 6H4.3Zm15.2 2.2-6.5 4.6a2.5 2.5 0 0 1-2.9 0L3.6 8.2V17.5c0 .55.45 1 1 1h14.8c.55 0 1-.45 1-1V8.2Z" />
            </svg>
                <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
              </div>

              <label htmlFor="password" className="input-label">Password</label>
          <div className="input-with-icon">
            <svg className="input-icon" viewBox="0 0 24 24">
              <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 8V7a3 3 0 1 1 6 0v3H9Zm3 4a1.75 1.75 0 0 1 1 3.2V19a1 1 0 1 1-2 0v-1.8a1.75 1.75 0 0 1 1-3.2Z" />
            </svg>
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
              </div>

                <div className="center-link">
            <a className="link subtle" href="#forgot"></a>
          </div>
                <button type="submit" className="btn primary">Sign Up</button>
            </form>
                {/* Divider under subtitle */}
          <div className="divider">
            <hr />
            <span>or</span>
            <hr />
          </div>
                {/* Google Sign-in */}
    <button className="btn google-btn" type="button" onClick={handleGoogleSignup}>
        Sign up with Google <FcGoogle />
    </button>
            
            <p className="muted center">Already have an account? <a href="/login">Login</a></p>
                </section>
        </main>
    );
}