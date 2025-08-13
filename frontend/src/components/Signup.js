// src/components/Signup.js
import React, { useState } from 'react';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
function Signup({ onSignupSuccess }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        try {
            const response = await fetch('${API_BASE_URL}/api/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || 'Signup failed');
            }
            setMessage('Signup successful! Please log in.');
            setTimeout(() => onSignupSuccess(), 2000);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="auth-form">
            <h2>Sign Up</h2>
            <form onSubmit={handleSubmit}>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" required />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
                <button type="submit">Sign Up</button>
            </form>
            {error && <p className="error">{error}</p>}
            {message && <p className="success">{message}</p>}
        </div>
    );
}

export default Signup;