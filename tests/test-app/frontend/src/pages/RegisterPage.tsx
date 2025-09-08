import React, { useState } from 'react';
import { getMiniSentryClient } from '../miniSentryClient.tsx';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<string>('');
  const client = getMiniSentryClient();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const errors: string[] = [];
    
    if (!formData.email) {
      errors.push('Email is required');
    } else if (!formData.email.includes('@')) {
      errors.push('Invalid email format');
    }
    
    if (!formData.username) {
      errors.push('Username is required');
    } else if (formData.username.length < 3) {
      errors.push('Username must be at least 3 characters');
    }
    
    if (!formData.password) {
      errors.push('Password is required');
    } else if (formData.password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.push('Passwords do not match');
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus('');

    try {
      // Client-side validation
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      // Submit to API
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          username: formData.username,
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Success
      setStatus('Registration successful!');
      if (client) {
        client.captureMessage('User registered successfully', {
          level: 'info',
          extra: {
            userId: data.user.id,
            username: data.user.username,
            email: data.user.email,
            action: 'user_registration'
          }
        });
        client.setUser({
          id: data.user.id.toString(),
          email: data.user.email,
          username: data.user.username
        });
      }
      
      // Reset form
      setFormData({ email: '', username: '', password: '', confirmPassword: '' });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setStatus(`Error: ${errorMessage}`);
      
      if (client) {
        client.captureException(err as Error, {
          extra: {
            formData: {
              email: formData.email,
              username: formData.username,
              // Never log passwords
            },
            action: 'registration_failed'
          }
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestValidationError = (errorType: string) => {
    switch (errorType) {
      case 'email':
        setFormData(prev => ({ ...prev, email: 'invalid-email' }));
        break;
      case 'username':
        setFormData(prev => ({ ...prev, username: 'duplicate-user' }));
        break;
      case 'password':
        setFormData(prev => ({ ...prev, password: '123' }));
        break;
      case 'mismatch':
        setFormData(prev => ({ 
          ...prev, 
          password: 'password123',
          confirmPassword: 'different123'
        }));
        break;
    }
  };

  return (
    <div>
      <section className="section">
        <h2>User Registration</h2>
        <p>Create a new account and test form validation errors.</p>
      </section>

      <section className="section">
        <h3>Error Testing Actions</h3>
        <div className="error-triggers">
          <button 
            onClick={() => handleTestValidationError('email')}
            data-testid="trigger-email-validation-error"
            className="error-button"
          >
            Trigger Email Error
          </button>
          <button 
            onClick={() => handleTestValidationError('username')}
            data-testid="trigger-username-validation-error"
            className="error-button"
          >
            Trigger Username Error
          </button>
          <button 
            onClick={() => handleTestValidationError('password')}
            data-testid="trigger-password-validation-error"
            className="error-button"
          >
            Trigger Password Error
          </button>
          <button 
            onClick={() => handleTestValidationError('mismatch')}
            data-testid="trigger-password-mismatch-error"
            className="error-button"
          >
            Trigger Password Mismatch
          </button>
        </div>
      </section>

      <section className="section">
        {status && (
          <div className={`status-indicator ${status.includes('Error') ? 'error' : 'success'}`}>
            {status}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              data-testid="register-email-input"
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              data-testid="register-username-input"
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              data-testid="register-password-input"
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              data-testid="register-confirm-password-input"
              disabled={isSubmitting}
            />
          </div>

          <button 
            type="submit" 
            className="submit-button"
            data-testid="register-submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Registering...' : 'Register'}
          </button>
        </form>
      </section>

      <section className="section">
        <h3>Test Data</h3>
        <p>You can use these values for testing:</p>
        <ul style={{ textAlign: 'left' }}>
          <li><strong>Valid email:</strong> testuser@example.com</li>
          <li><strong>Valid username:</strong> testuser123</li>
          <li><strong>Valid password:</strong> password123</li>
          <li><strong>Duplicate username:</strong> duplicate-user (will trigger server error)</li>
          <li><strong>Invalid email:</strong> invalid-email (will trigger client validation)</li>
        </ul>
      </section>
    </div>
  );
}