# Mini Sentry Test Application

This is a realistic e-commerce application designed specifically for testing Mini Sentry's error tracking capabilities. It includes controlled error scenarios and user interactions that generate events for comprehensive E2E testing.

## Architecture

- **Frontend**: React + Vite + TypeScript (Port 3001)
- **Backend**: Express.js + SQLite (Port 3002)
- **Database**: SQLite file-based database
- **Integration**: Mini Sentry client for error tracking

## Quick Start

### Prerequisites
- Node.js 16+
- Mini Sentry stack running on `localhost:8000`

### Setup & Run

1. **Start Backend:**
   ```bash
   cd backend
   npm install
   npm start
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Access Application:**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3002

## Environment Configuration

Create `.env` file in the frontend directory:

```env
VITE_MINI_SENTRY_TOKEN=your-project-ingest-token
VITE_MINI_SENTRY_URL=http://localhost:8000
```

## Application Features

### Pages & Functionality

1. **Home Page** (`/`)
   - Application overview
   - Mini Sentry integration testing
   - Send test events and sessions

2. **Products Page** (`/products`)
   - Product catalog with database integration
   - Add to cart functionality with error scenarios
   - Server and client error triggers

3. **Shopping Cart** (`/cart`)
   - Cart management with quantity controls
   - Checkout process with payment/inventory errors
   - Order creation with validation

4. **User Registration** (`/register`)
   - Form validation (client and server-side)
   - Database constraint error simulation
   - User context setting for Mini Sentry

5. **Error Testing Laboratory** (`/error-testing`)
   - Comprehensive error scenario triggers
   - JavaScript errors (TypeError, ReferenceError)
   - Network errors (timeout, 500, network failure)
   - Async errors and unhandled rejections
   - React component errors
   - Message and session testing

### Error Scenarios

The application includes controlled error generation for testing:

#### JavaScript Errors
- **TypeError**: Accessing properties of null/undefined
- **ReferenceError**: Using undefined variables
- **Custom Errors**: Application-specific errors with context

#### Network Errors
- **404 Errors**: Nonexistent endpoints
- **500 Errors**: Server-side failures
- **Timeout Errors**: Slow response simulation
- **Network Failures**: Connection issues

#### Form Validation Errors
- **Email Validation**: Invalid format detection
- **Password Validation**: Length and match requirements
- **Server Constraints**: Database unique constraint violations

#### Business Logic Errors
- **Inventory Errors**: Out of stock scenarios
- **Payment Errors**: Payment processing failures
- **Cart Errors**: Invalid cart states

## API Endpoints

The backend provides realistic e-commerce endpoints:

### Products
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product details
- `GET /api/products/trigger-error` - Trigger server error

### Users
- `POST /api/users/register` - User registration

### Orders
- `POST /api/orders` - Create order

### Health & Testing
- `GET /api/health` - Health check
- `GET /api/test-errors/500` - Trigger 500 error
- `GET /api/test-errors/timeout` - Trigger timeout
- `GET /api/test-errors/memory-leak` - Memory intensive operation

## Mini Sentry Integration

### Event Capturing
- Automatic error capturing via global handlers
- Manual error reporting with context
- User action tracking
- Session tracking

### Error Context
All events include:
- User information
- Application state
- Error categorization
- Test metadata tags

### Example Usage
```typescript
import { getMiniSentryClient } from './miniSentryClient';

const client = getMiniSentryClient();
client.captureException(error, {
  extra: { context: 'checkout', step: 'payment' },
  tags: { errorType: 'payment_failed' }
});
```

## Database Schema

SQLite tables:
- `users` - User accounts
- `products` - Product catalog
- `orders` - Order records
- `order_items` - Order line items

Sample data is automatically created on startup.

## Testing Integration

This application is designed to work with Playwright E2E tests:

### Test IDs
All interactive elements have `data-testid` attributes:
- Navigation: `nav-home`, `nav-products`, etc.
- Buttons: `trigger-type-error`, `add-to-cart-1`, etc.
- Forms: `register-email-input`, `checkout-button`, etc.

### Error Triggers
Buttons are provided to trigger specific error scenarios:
- `trigger-type-error` - JavaScript TypeError
- `trigger-network-error` - Network request failure
- `trigger-payment-error` - Checkout payment failure
- And many more...

### Event Validation
The application provides visual feedback and status indicators to confirm events are being generated and captured by Mini Sentry.

## Development

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-restart
```

### Frontend Development
```bash
cd frontend
npm run dev  # Vite dev server with HMR
```

### Building for Production
```bash
cd frontend
npm run build
npm run preview
```

## Troubleshooting

### Common Issues

1. **Mini Sentry Connection Failed**
   - Ensure Mini Sentry is running on localhost:8000
   - Check the ingest token in environment variables
   - Verify CORS settings

2. **Backend Database Errors**
   - Delete `backend/database.sqlite` and restart
   - Check file permissions
   - Verify Node.js version compatibility

3. **Frontend Build Errors**
   - Clear node_modules and reinstall
   - Check TypeScript configuration
   - Verify all dependencies are installed

### Logs
- Backend logs appear in terminal
- Frontend errors visible in browser console
- Mini Sentry events visible in Mini Sentry UI at localhost:5173

## Contributing

When adding new error scenarios:

1. Add appropriate test IDs for E2E testing
2. Include error context and metadata
3. Provide visual feedback for user testing
4. Document the error scenario in this README
5. Update corresponding Playwright tests

This application serves as both a testing tool and documentation of Mini Sentry's capabilities.