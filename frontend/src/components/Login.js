// src/components/Login.js
import React, { useState } from 'react';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
function Login({ onLoginSuccess, onSwitchToSignup }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await fetch('${API_BASE_URL}/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || 'Login failed');
            }
            localStorage.setItem('user_id', data.user_id);
            onLoginSuccess(data.user_id);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="auth-form">
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" required />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
                <button type="submit">Login</button>
            </form>
            {error && <p className="error">{error}</p>}
            <p>Don't have an account? <button onClick={onSwitchToSignup} className="link-button">Sign Up</button></p>
        </div>
    );
}

export default Login;