import React from 'react';
import { getMiniSentryClient } from '../miniSentryClient.tsx';

export default function HomePage() {
  const handleSendTestEvent = async () => {
    const client = getMiniSentryClient();
    if (client) {
      await client.captureMessage('Test message from homepage', {
        level: 'info',
        extra: { page: 'home', action: 'test_button_click' }
      });
    }
  };

  const handleSendTestSession = async () => {
    const client = getMiniSentryClient();
    if (client) {
      await client.sendSession('ok', 5000);
    }
  };

  return (
    <div>
      <section className="section">
        <h2>Welcome to Mini Sentry Test App</h2>
        <p>
          This is a realistic e-commerce application designed to test Mini Sentry's 
          error tracking capabilities. Navigate through different pages to explore 
          various error scenarios and user interactions.
        </p>
        
        <div style={{ margin: '2rem 0' }}>
          <h3>Test Mini Sentry Integration</h3>
          <button 
            onClick={handleSendTestEvent}
            data-testid="send-test-event"
            className="nav-button"
            style={{ margin: '0.5rem' }}
          >
            Send Test Event
          </button>
          <button 
            onClick={handleSendTestSession}
            data-testid="send-test-session"
            className="nav-button"
            style={{ margin: '0.5rem' }}
          >
            Send Test Session
          </button>
        </div>
      </section>

      <section className="section">
        <h3>Application Features</h3>
        <ul style={{ textAlign: 'left' }}>
          <li><strong>Products:</strong> Browse products with intentional error scenarios</li>
          <li><strong>Shopping Cart:</strong> Add items with validation and payment errors</li>
          <li><strong>User Registration:</strong> Form validation and database constraint errors</li>
          <li><strong>Error Testing:</strong> Controlled error generation for testing</li>
        </ul>
      </section>

      <section className="section">
        <h3>Error Tracking Test Scenarios</h3>
        <div style={{ textAlign: 'left' }}>
          <p>This app includes various error scenarios to test Mini Sentry:</p>
          <ul>
            <li>JavaScript TypeError and ReferenceError</li>
            <li>Network request failures and timeouts</li>
            <li>Form validation errors</li>
            <li>Database constraint violations</li>
            <li>React component errors and boundary catches</li>
            <li>Unhandled promise rejections</li>
          </ul>
        </div>
      </section>
    </div>
  );
}