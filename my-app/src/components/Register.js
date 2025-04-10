import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// V6 imports
import { signUp, confirmSignUp, signIn, getCurrentUser } from 'aws-amplify/auth';
import './Login.css'; // Reuse the same styling

function Register({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationStep, setVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // V6 signUp call
      const { nextStep } = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email // Include email as a user attribute
          },
          // autoSignIn: true // Optional: Amplify can attempt auto sign-in after confirmation
        }
      });

      // Check if confirmation is required
      if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        setVerificationStep(true);
      } else if (nextStep.signUpStep === 'DONE') {
        // Handle case where confirmation might not be needed (e.g., admin created)
        console.log('Sign-up complete without verification step.');
         // Might need to sign in manually or check if autoSignIn worked
         navigate('/login'); // Navigate to login for manual sign in
      } else {
         console.log('Sign-up resulted in unexpected step:', nextStep.signUpStep);
         setError('An unexpected error occurred during sign up.');
      }

    } catch (error) {
      console.error('Error signing up:', error);
      // Provide more specific error messages if possible
      if (error.name === 'UsernameExistsException') {
        setError('An account with this email already exists. Please login.');
      } else {
        setError(error.message || 'Failed to sign up');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
       // V6 confirmSignUp
      const { nextStep } = await confirmSignUp({
        username: email,
        confirmationCode: verificationCode
      });

       if (nextStep.signUpStep === 'COMPLETE_AUTO_SIGN_IN') {
         // If autoSignIn was enabled during signUp and successful
         console.log('Auto sign-in successful after verification.');
         const currentUser = await getCurrentUser();
         setUser(currentUser);
         navigate('/channels');
       } else if (nextStep.signUpStep === 'DONE') {
         // Sign up complete, but not auto-signed in. Need to sign in manually.
         console.log('Verification successful, attempting manual sign in...');
         // V6 signIn
         const { isSignedIn, nextStep: signInNextStep } = await signIn({ username: email, password });

         if (isSignedIn) {
            console.log('Manual sign-in successful after verification.');
            const currentUser = await getCurrentUser();
            setUser(currentUser);
            navigate('/channels');
         } else {
            // Handle other sign-in steps if needed (e.g., MFA)
            console.error('Sign in required further steps after verification:', signInNextStep);
            setError('Verification successful, but sign in requires additional steps. Please login manually.');
            navigate('/login');
         }
       } else {
         // Handle unexpected steps
         console.error('Unexpected step after confirmation:', nextStep.signUpStep);
         setError('An unexpected error occurred during verification.');
       }

    } catch (error) {
      console.error('Error confirming sign up:', error);
       if (error.name === 'CodeMismatchException') {
         setError('Invalid verification code. Please try again.');
       } else if (error.name === 'LimitExceededException') {
         setError('Attempt limit exceeded. Please try again later.');
       } else {
         setError(error.message || 'Failed to verify account');
       }
    } finally {
      setLoading(false);
    }
  };

  if (verificationStep) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>Verify Your Account</h2>
          <p>Please check your email ({email}) for a verification code</p>
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleVerification}>
            <div className="form-group">
              <label htmlFor="verificationCode">Verification Code</label>
              <input
                type="text"
                id="verificationCode"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                required
                autoComplete="one-time-code"
              />
            </div>
            
            <button type="submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Account'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Register</h2>
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
              minLength="8"
              autoComplete="new-password"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        
        <div className="auth-links">
          <span>Already have an account?</span>
          <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}

export default Register; 