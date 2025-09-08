import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Database from 'sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;

// Database setup
const dbPath = join(__dirname, '..', 'database.sqlite');
const db = new Database.Database(dbPath);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize database tables
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Products table
      db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        stock_quantity INTEGER DEFAULT 0,
        category_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Orders table
      db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        total_amount REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`);

      // Order items table
      db.run(`CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
      )`);

      // Insert sample data
      db.run(`INSERT OR IGNORE INTO products (id, name, description, price, stock_quantity) VALUES 
        (1, 'Laptop Pro', 'High-performance laptop for professionals', 1299.99, 10),
        (2, 'Wireless Headphones', 'Premium noise-cancelling headphones', 199.99, 25),
        (3, 'Smartphone', 'Latest smartphone with advanced features', 899.99, 15),
        (4, 'Tablet', '10-inch tablet for productivity and entertainment', 399.99, 20),
        (5, 'Smart Watch', 'Fitness tracking and smart notifications', 299.99, 30)`);

      console.log('Database initialized successfully');
      resolve();
    });
  });
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Products endpoints
app.get('/api/products', (req, res) => {
  db.all('SELECT * FROM products ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to fetch products' });
    }
    res.json({ products: rows });
  });
});

app.get('/api/products/:id', (req, res) => {
  const { id } = req.params;
  
  // Intentional error scenario for testing
  if (id === 'trigger-error') {
    throw new Error('Intentional server error for testing');
  }

  db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database query failed' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ product: row });
  });
});

// Users endpoints
app.post('/api/users/register', async (req, res) => {
  const { email, username, password } = req.body;

  // Validation errors for testing
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email address' });
  }
  if (!username || username.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  // Simulate database constraint error
  if (username === 'duplicate-user') {
    return res.status(409).json({ error: 'Username already exists' });
  }

  const userId = Math.floor(Math.random() * 10000);
  res.status(201).json({
    message: 'User registered successfully',
    user: { id: userId, email, username }
  });
});

// Orders endpoints
app.post('/api/orders', (req, res) => {
  const { user_id, items } = req.body;

  // Validation for testing
  if (!user_id) {
    return res.status(400).json({ error: 'User ID is required' });
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Order must contain at least one item' });
  }

  // Simulate inventory error
  const outOfStockItem = items.find(item => item.product_id === 999);
  if (outOfStockItem) {
    return res.status(400).json({ error: 'Product is out of stock' });
  }

  // Simulate payment processing error
  if (req.body.payment_method === 'invalid-card') {
    return res.status(402).json({ error: 'Payment processing failed' });
  }

  const orderId = Math.floor(Math.random() * 10000);
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  res.status(201).json({
    message: 'Order created successfully',
    order: {
      id: orderId,
      user_id,
      total_amount: total,
      status: 'confirmed',
      created_at: new Date().toISOString()
    }
  });
});

// Error testing endpoints
app.get('/api/test-errors/500', (req, res) => {
  throw new Error('Intentional 500 error for testing');
});

app.get('/api/test-errors/timeout', (req, res) => {
  // Simulate slow response
  setTimeout(() => {
    res.json({ message: 'This response was delayed' });
  }, 5000);
});

app.get('/api/test-errors/memory-leak', (req, res) => {
  // Simulate memory-intensive operation
  const bigArray = new Array(1000000).fill('test-data');
  res.json({ message: 'Memory intensive operation completed', size: bigArray.length });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
const startServer = async () => {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`Test backend server running on http://localhost:${PORT}`);
      console.log('Available endpoints:');
      console.log('- GET  /api/health');
      console.log('- GET  /api/products');
      console.log('- GET  /api/products/:id');
      console.log('- POST /api/users/register');
      console.log('- POST /api/orders');
      console.log('- GET  /api/test-errors/*');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();