import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signIn, getCurrentUser } from 'aws-amplify/auth';
import './Login.css';

function Login({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { isSignedIn, nextStep } = await signIn({ username: email, password });

      if (isSignedIn) {
        console.log('Sign in successful');
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        navigate('/channels');
      } else {
        console.error('Sign in requires further steps:', nextStep);
        setError('Sign in requires additional steps. Please check your authentication method.');
      }
    } catch (error) {
      console.error('Error signing in:', error);
      if (error.name === 'UserNotFoundException') {
        setError('User not found. Please check your email or register.');
      } else if (error.name === 'NotAuthorizedException') {
        setError('Incorrect password. Please try again.');
      } else if (error.name === 'UserNotConfirmedException') {
        setError('User is not confirmed. Please check your email for a verification code or register again.');
      } else {
        setError(error.message || 'Failed to sign in');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login</h2>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="auth-links">
          <span>Don't have an account?</span>
          <Link to="/register">Register</Link>
        </div>
      </div>
    </div>
  );
}

export default Login; 