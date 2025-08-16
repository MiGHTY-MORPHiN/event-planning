import React,{useState} from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { FcGoogle } from 'react-icons/fc';

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const onSubmit = async (e) => {
        e.preventDefault();
        try {
            
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/home'); 
        } catch (error) {
            console.error("Error logging in:", error.message);
        }
    }
    const handleGoogleSignin = async () => {
            const provider = new GoogleAuthProvider();
            try {
                await signInWithPopup(auth, provider);
                navigate('/Home');
            } catch (error) {
                console.error("Error signing in with Google:", error);
            }
        }

    return (
        <section className="login-container">
            <h1>Login</h1>
            <form onSubmit={onSubmit}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit">Login</button>
            </form>
            <button className="google-signin" onClick={handleGoogleSignin}>
                            <FcGoogle /> Sign in with Google
                        </button>
            <p>Don't have an account? <a href="/signup">Sign Up</a></p>
        </section>
    );
}