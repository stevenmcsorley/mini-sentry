import React, { useState } from 'react';
import { getMiniSentryClient } from '../miniSentryClient.tsx';

export default function ErrorTestingPage() {
  const [status, setStatus] = useState<string>('');
  const client = getMiniSentryClient();

  // JavaScript Error Scenarios
  const triggerTypeError = () => {
    setStatus('Triggering TypeError...');
    try {
      // Intentional TypeError
      const user = null as any;
      console.log(user.profile.name); // Will throw TypeError
    } catch (error) {
      setStatus('TypeError triggered and captured');
    }
  };

  const triggerReferenceError = () => {
    setStatus('Triggering ReferenceError...');
    try {
      // Intentional ReferenceError
      console.log(undefinedVariable); // Will throw ReferenceError
    } catch (error) {
      setStatus('ReferenceError triggered and captured');
    }
  };

  const triggerCustomError = () => {
    setStatus('Triggering custom error...');
    const error = new Error('Custom test error with detailed context');
    if (client) {
      client.captureException(error, {
        extra: {
          errorType: 'custom_test_error',
          testScenario: 'error_testing_page',
          userAction: 'button_click'
        },
        tags: {
          errorCategory: 'test',
          severity: 'low'
        }
      });
    }
    setStatus('Custom error captured');
  };

  // Network Error Scenarios
  const triggerNetworkError = async () => {
    setStatus('Triggering network error...');
    try {
      await fetch('/api/nonexistent-endpoint');
    } catch (error) {
      setStatus('Network error triggered and captured');
    }
  };

  const triggerTimeoutError = async () => {
    setStatus('Triggering timeout error...');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);
      
      await fetch('/api/test-errors/timeout', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
    } catch (error) {
      setStatus('Timeout error triggered and captured');
    }
  };

  const trigger500Error = async () => {
    setStatus('Triggering server error...');
    try {
      const response = await fetch('/api/test-errors/500');
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
    } catch (error) {
      setStatus('Server error triggered and captured');
    }
  };

  // Async Error Scenarios  
  const triggerUnhandledRejection = () => {
    setStatus('Triggering unhandled promise rejection...');
    // Intentional unhandled promise rejection
    Promise.reject(new Error('Unhandled promise rejection for testing'));
    setStatus('Unhandled rejection triggered');
  };

  const triggerAsyncError = async () => {
    setStatus('Triggering async error...');
    const asyncOperation = async () => {
      throw new Error('Async operation failed');
    };
    
    try {
      await asyncOperation();
    } catch (error) {
      if (client) {
        client.captureException(error as Error, {
          extra: { asyncContext: 'test_async_operation' }
        });
      }
      setStatus('Async error captured');
    }
  };

  // Performance-related Errors
  const triggerMemoryIntensiveError = async () => {
    setStatus('Triggering memory intensive operation...');
    try {
      await fetch('/api/test-errors/memory-leak');
      setStatus('Memory intensive operation completed');
    } catch (error) {
      setStatus('Memory operation failed and captured');
    }
  };

  // React Component Errors
  const [shouldThrow, setShouldThrow] = useState(false);

  const triggerComponentError = () => {
    setStatus('Triggering React component error...');
    setShouldThrow(true);
  };

  const ErrorComponent = () => {
    if (shouldThrow) {
      throw new Error('Intentional React component error');
    }
    return null;
  };

  // Message and Session Testing
  const sendWarningMessage = () => {
    if (client) {
      client.captureMessage('Warning: Test warning message', {
        level: 'warning',
        extra: { testType: 'warning_message' }
      });
    }
    setStatus('Warning message sent');
  };

  const sendInfoMessage = () => {
    if (client) {
      client.captureMessage('Info: Test information message', {
        level: 'info',
        extra: { testType: 'info_message' }
      });
    }
    setStatus('Info message sent');
  };

  const sendErrorSession = () => {
    if (client) {
      client.sendSession('errored', 3000);
    }
    setStatus('Error session sent');
  };

  const sendCrashedSession = () => {
    if (client) {
      client.sendSession('crashed', 1500);
    }
    setStatus('Crashed session sent');
  };

  return (
    <div>
      <section className="section">
        <h2>Error Testing Laboratory</h2>
        <p>Use these buttons to trigger various error scenarios for testing Mini Sentry.</p>
        
        {status && (
          <div className={`status-indicator ${status.includes('error') || status.includes('failed') ? 'error' : 
            status.includes('warning') ? 'warning' : 'success'}`}>
            Status: {status}
          </div>
        )}
      </section>

      <section className="section">
        <h3>JavaScript Errors</h3>
        <div className="error-triggers">
          <button 
            onClick={triggerTypeError}
            data-testid="trigger-type-error"
            className="error-button"
          >
            Trigger TypeError
          </button>
          <button 
            onClick={triggerReferenceError}
            data-testid="trigger-reference-error"
            className="error-button"
          >
            Trigger ReferenceError
          </button>
          <button 
            onClick={triggerCustomError}
            data-testid="trigger-custom-error"
            className="error-button"
          >
            Trigger Custom Error
          </button>
        </div>
      </section>

      <section className="section">
        <h3>Network Errors</h3>
        <div className="error-triggers">
          <button 
            onClick={triggerNetworkError}
            data-testid="trigger-network-error"
            className="error-button"
          >
            Trigger Network Error
          </button>
          <button 
            onClick={triggerTimeoutError}
            data-testid="trigger-timeout-error"
            className="error-button"
          >
            Trigger Timeout Error
          </button>
          <button 
            onClick={trigger500Error}
            data-testid="trigger-500-error"
            className="error-button"
          >
            Trigger 500 Error
          </button>
        </div>
      </section>

      <section className="section">
        <h3>Async Errors</h3>
        <div className="error-triggers">
          <button 
            onClick={triggerUnhandledRejection}
            data-testid="trigger-unhandled-rejection"
            className="error-button"
          >
            Unhandled Rejection
          </button>
          <button 
            onClick={triggerAsyncError}
            data-testid="trigger-async-error"
            className="error-button"
          >
            Trigger Async Error
          </button>
          <button 
            onClick={triggerMemoryIntensiveError}
            data-testid="trigger-memory-error"
            className="error-button"
          >
            Memory Intensive Error
          </button>
        </div>
      </section>

      <section className="section">
        <h3>React Component Errors</h3>
        <div className="error-triggers">
          <button 
            onClick={triggerComponentError}
            data-testid="trigger-component-error"
            className="error-button"
          >
            Trigger Component Error
          </button>
          <button 
            onClick={() => setShouldThrow(false)}
            data-testid="reset-component-error"
            className="nav-button"
          >
            Reset Component
          </button>
        </div>
        <ErrorComponent />
      </section>

      <section className="section">
        <h3>Messages & Sessions</h3>
        <div className="error-triggers">
          <button 
            onClick={sendWarningMessage}
            data-testid="send-warning-message"
            className="error-button warning"
          >
            Send Warning Message
          </button>
          <button 
            onClick={sendInfoMessage}
            data-testid="send-info-message"
            className="error-button info"
          >
            Send Info Message
          </button>
          <button 
            onClick={sendErrorSession}
            data-testid="send-error-session"
            className="error-button"
          >
            Send Error Session
          </button>
          <button 
            onClick={sendCrashedSession}
            data-testid="send-crashed-session"
            className="error-button"
          >
            Send Crashed Session
          </button>
        </div>
      </section>
    </div>
  );
}