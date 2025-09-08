import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ProductsPage from './pages/ProductsPage'
import CartPage from './pages/CartPage'
import RegisterPage from './pages/RegisterPage'
import ErrorTestingPage from './pages/ErrorTestingPage'

function Navigation() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Home', testId: 'nav-home' },
    { path: '/products', label: 'Products', testId: 'nav-products' },
    { path: '/cart', label: 'Cart', testId: 'nav-cart' },
    { path: '/register', label: 'Register', testId: 'nav-register' },
    { path: '/error-testing', label: 'Error Testing', testId: 'nav-error-testing' }
  ];

  return (
    <nav className="nav">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`nav-button ${location.pathname === item.path ? 'active' : ''}`}
          data-testid={item.testId}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function AppContent() {
  return (
    <div className="container">
      <header className="header">
        <h1>Mini Sentry Test App</h1>
        <p>E-Commerce Platform for Testing Error Tracking</p>
      </header>
      
      <Navigation />
      
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/error-testing" element={<ErrorTestingPage />} />
        </Routes>
      </main>
      
      <footer style={{ marginTop: '3rem', padding: '2rem', color: '#6c757d', fontSize: '0.9rem' }}>
        <p>Mini Sentry Test Application - Designed for E2E Testing</p>
        <p>This app intentionally generates errors for testing error tracking functionality.</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App