import React, { useState, useEffect } from 'react';
import { getMiniSentryClient } from '../miniSentryClient.tsx';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const client = getMiniSentryClient();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }
      const data = await response.json();
      setProducts(data.products || []);
      setError('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      if (client) {
        client.captureException(err as Error, {
          extra: { context: 'fetch_products', page: 'products' }
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product: Product) => {
    try {
      // Simulate adding to cart with potential errors
      if (product.stock_quantity === 0) {
        throw new Error('Product is out of stock');
      }

      // Simulate random network failure (10% chance)
      if (Math.random() < 0.1) {
        throw new Error('Network error while adding to cart');
      }

      // Success case
      if (client) {
        client.captureMessage(`Product added to cart: ${product.name}`, {
          level: 'info',
          extra: { 
            productId: product.id,
            productName: product.name,
            price: product.price,
            action: 'add_to_cart'
          }
        });
      }
      
      alert(`${product.name} added to cart!`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add to cart';
      alert(`Error: ${errorMessage}`);
      if (client) {
        client.captureException(err as Error, {
          extra: { 
            context: 'add_to_cart',
            productId: product.id,
            productName: product.name
          }
        });
      }
    }
  };

  const handleProductError = async (productId: number) => {
    try {
      // Intentionally trigger an error by requesting a product that causes server error
      await fetch(`/api/products/trigger-error`);
    } catch (err) {
      console.log('Expected error for testing');
    }
  };

  const handleViewProduct = (product: Product) => {
    // Intentional error scenario - accessing undefined property
    if (product.id === 999) {
      const undefinedProduct = undefined as any;
      console.log(undefinedProduct.details.specifications); // Will throw error
    }
    
    if (client) {
      client.captureMessage(`Product viewed: ${product.name}`, {
        level: 'info',
        extra: { 
          productId: product.id,
          action: 'view_product'
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="section">
        <h2>Loading Products...</h2>
        <p>Please wait while we fetch the latest products.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="section">
        <h2>Error Loading Products</h2>
        <div className="status-indicator error">
          {error}
        </div>
        <button onClick={fetchProducts} className="nav-button">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <section className="section">
        <h2>Products Catalog</h2>
        <p>Browse our products and test various error scenarios.</p>
        <button 
          onClick={fetchProducts}
          data-testid="refresh-products"
          className="nav-button"
        >
          Refresh Products
        </button>
      </section>

      <section className="section">
        <h3>Error Testing Actions</h3>
        <div className="error-triggers">
          <button 
            onClick={() => handleProductError(999)}
            data-testid="trigger-product-server-error"
            className="error-button"
          >
            Trigger Server Error
          </button>
          <button 
            onClick={() => handleViewProduct({ id: 999, name: 'Test Product', description: '', price: 0, stock_quantity: 0 })}
            data-testid="trigger-product-client-error"
            className="error-button"
          >
            Trigger Client Error
          </button>
        </div>
      </section>

      <section className="section">
        <div className="product-grid">
          {products.map((product) => (
            <div key={product.id} className="product-card" data-testid={`product-${product.id}`}>
              <div 
                className="product-image"
                style={{
                  height: '150px',
                  background: '#f8f9fa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  color: '#6c757d'
                }}
              >
                Product Image
              </div>
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <div className="price">${product.price.toFixed(2)}</div>
              <p>Stock: {product.stock_quantity}</p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => handleViewProduct(product)}
                  data-testid={`view-product-${product.id}`}
                  className="nav-button"
                  style={{ flex: 1 }}
                >
                  View
                </button>
                <button 
                  onClick={() => handleAddToCart(product)}
                  data-testid={`add-to-cart-${product.id}`}
                  className="cart-button"
                  style={{ flex: 1 }}
                  disabled={product.stock_quantity === 0}
                >
                  {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {products.length === 0 && (
        <section className="section">
          <h3>No Products Available</h3>
          <p>There are currently no products available. Please check back later.</p>
        </section>
      )}
    </div>
  );
}