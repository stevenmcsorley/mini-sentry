// Mini Sentry client integration for test app
// This will be replaced with the actual @mini-sentry/client package once built

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface MiniSentryConfig {
  token: string;
  baseUrl: string;
  release?: string;
  environment?: string;
  beforeSend?: (event: any) => any;
}

interface CaptureContext {
  extra?: Record<string, any>;
  tags?: Record<string, string>;
  user?: {
    id?: string;
    email?: string;
    username?: string;
  };
  level?: 'error' | 'warning' | 'info';
}

class MiniSentryClient {
  private config: MiniSentryConfig;

  constructor(config: MiniSentryConfig) {
    this.config = config;
    this.setupGlobalErrorHandlers();
  }

  private setupGlobalErrorHandlers() {
    // Handle unhandled errors
    window.addEventListener('error', (event) => {
      this.captureException(event.error || new Error(event.message), {
        extra: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureException(event.reason, {
        extra: { 
          type: 'unhandledrejection',
          promise: event.promise
        }
      });
    });
  }

  async captureException(error: Error, context?: CaptureContext) {
    const event = {
      message: error.message,
      level: context?.level || 'error',
      stack: error.stack,
      release: this.config.release,
      environment: this.config.environment,
      timestamp: new Date().toISOString(),
      extra: {
        ...context?.extra,
        error_type: error.constructor.name
      },
      tags: context?.tags,
      user: context?.user
    };

    if (this.config.beforeSend) {
      const modifiedEvent = this.config.beforeSend(event);
      if (!modifiedEvent) return; // Event was filtered out
    }

    try {
      await fetch(`${this.config.baseUrl}/api/events/ingest/token/${this.config.token}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });
      console.log('[MiniSentry] Event captured:', event);
    } catch (err) {
      console.error('[MiniSentry] Failed to capture event:', err);
    }
  }

  async captureMessage(message: string, context?: CaptureContext) {
    await this.captureException(new Error(message), {
      ...context,
      level: context?.level || 'info'
    });
  }

  async sendSession(status: 'ok' | 'errored' | 'crashed' | 'exited', duration?: number) {
    const session = {
      session_id: crypto.randomUUID(),
      status,
      release: this.config.release,
      environment: this.config.environment,
      duration_ms: duration || Math.floor(Math.random() * 10000),
      timestamp: new Date().toISOString()
    };

    try {
      await fetch(`${this.config.baseUrl}/api/sessions/ingest/token/${this.config.token}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(session)
      });
      console.log('[MiniSentry] Session sent:', session);
    } catch (err) {
      console.error('[MiniSentry] Failed to send session:', err);
    }
  }

  setUser(user: CaptureContext['user']) {
    // Store user context for future events
    (window as any).__miniSentryUser = user;
  }

  setTag(key: string, value: string) {
    if (!(window as any).__miniSentryTags) {
      (window as any).__miniSentryTags = {};
    }
    (window as any).__miniSentryTags[key] = value;
  }
}

let client: MiniSentryClient | null = null;

export const initMiniSentry = (config: MiniSentryConfig): MiniSentryClient => {
  client = new MiniSentryClient(config);
  return client;
};

export const getMiniSentryClient = (): MiniSentryClient | null => client;

// React Error Boundary component

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class MiniSentryErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{error?: Error}> },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const client = getMiniSentryClient();
    if (client) {
      client.captureException(error, {
        extra: {
          errorInfo,
          component_stack: errorInfo.componentStack
        }
      });
    }
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      if (FallbackComponent) {
        return <FallbackComponent error={this.state.error} />;
      }
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Something went wrong!</h2>
          <p>The error has been reported to Mini Sentry.</p>
          <button onClick={() => window.location.reload()}>Reload Page</button>
        </div>
      );
    }

    return this.props.children;
  }
}