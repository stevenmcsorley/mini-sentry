import React, { useState } from 'react';
import { getMiniSentryClient } from '../miniSentryClient.tsx';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([
    { id: 1, name: 'Laptop Pro', price: 1299.99, quantity: 1 },
    { id: 2, name: 'Wireless Headphones', price: 199.99, quantity: 2 }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const client = getMiniSentryClient();

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleQuantityChange = (id: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setCartItems(items => 
      items.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleRemoveItem = (id: number) => {
    setCartItems(items => items.filter(item => item.id !== id));
    
    if (client) {
      client.captureMessage('Item removed from cart', {
        level: 'info',
        extra: { itemId: id, action: 'remove_from_cart' }
      });
    }
  };

  const handleCheckout = async () => {
    setIsProcessing(true);
    
    try {
      // Simulate checkout process with potential errors
      
      // Error scenario 1: Empty cart
      if (cartItems.length === 0) {
        throw new Error('Cannot checkout with empty cart');
      }
      
      // Error scenario 2: High total amount (simulate payment failure)
      if (total > 5000) {
        throw new Error('Payment declined: Amount exceeds daily limit');
      }
      
      // Error scenario 3: Out of stock (simulate inventory check)
      const outOfStockItem = cartItems.find(item => item.id === 999);
      if (outOfStockItem) {
        throw new Error(`${outOfStockItem.name} is no longer in stock`);
      }
      
      // Simulate network request
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: 123,
          items: cartItems.map(item => ({
            product_id: item.id,
            quantity: item.quantity,
            price: item.price
          })),
          total_amount: total
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Checkout failed');
      }

      const order = await response.json();
      
      // Success
      if (client) {
        client.captureMessage('Checkout completed successfully', {
          level: 'info',
          extra: {
            orderId: order.order.id,
            totalAmount: total,
            itemCount: cartItems.length,
            action: 'checkout_success'
          }
        });
        client.sendSession('ok', 2000);
      }
      
      alert(`Order completed! Order ID: ${order.order.id}`);
      setCartItems([]); // Clear cart
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Checkout failed';
      alert(`Checkout failed: ${errorMessage}`);
      
      if (client) {
        client.captureException(err as Error, {
          extra: {
            cartItems: cartItems.length,
            totalAmount: total,
            action: 'checkout_failed'
          }
        });
        client.sendSession('errored', 1500);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckoutWithError = async (errorType: string) => {
    setIsProcessing(true);
    
    try {
      let errorPayload = {};
      
      switch (errorType) {
        case 'payment':
          errorPayload = { ...errorPayload, payment_method: 'invalid-card' };
          break;
        case 'inventory':
          errorPayload = { 
            ...errorPayload, 
            items: [{ product_id: 999, quantity: 1, price: 100 }]
          };
          break;
        case 'network':
          // Intentional network error
          await fetch('/api/nonexistent-checkout-endpoint');
          break;
      }
      
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 123,
          items: cartItems,
          ...errorPayload
        })
      });
      
    } catch (err) {
      console.log(`Expected ${errorType} error for testing`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <section className="section">
        <h2>Shopping Cart</h2>
        <p>Review your items and test checkout error scenarios.</p>
      </section>

      <section className="section">
        <h3>Error Testing Actions</h3>
        <div className="error-triggers">
          <button 
            onClick={() => handleCheckoutWithError('payment')}
            data-testid="trigger-payment-error"
            className="error-button"
            disabled={isProcessing}
          >
            Trigger Payment Error
          </button>
          <button 
            onClick={() => handleCheckoutWithError('inventory')}
            data-testid="trigger-inventory-error"
            className="error-button"
            disabled={isProcessing}
          >
            Trigger Inventory Error
          </button>
          <button 
            onClick={() => handleCheckoutWithError('network')}
            data-testid="trigger-checkout-network-error"
            className="error-button"
            disabled={isProcessing}
          >
            Trigger Network Error
          </button>
        </div>
      </section>

      <section className="section">
        {cartItems.length === 0 ? (
          <div>
            <h3>Your cart is empty</h3>
            <p>Add some products to your cart to see them here.</p>
          </div>
        ) : (
          <div>
            <h3>Cart Items</h3>
            {cartItems.map(item => (
              <div 
                key={item.id} 
                className="product-card"
                data-testid={`cart-item-${item.id}`}
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '1rem'
                }}
              >
                <div>
                  <h4>{item.name}</h4>
                  <p>${item.price.toFixed(2)} each</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div>
                    <button 
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      data-testid={`decrease-quantity-${item.id}`}
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <span style={{ margin: '0 1rem' }}>{item.quantity}</span>
                    <button 
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      data-testid={`increase-quantity-${item.id}`}
                    >
                      +
                    </button>
                  </div>
                  <div>${(item.price * item.quantity).toFixed(2)}</div>
                  <button 
                    onClick={() => handleRemoveItem(item.id)}
                    data-testid={`remove-item-${item.id}`}
                    className="error-button"
                    style={{ padding: '0.25rem 0.5rem' }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            
            <div style={{ borderTop: '2px solid #dee2e6', paddingTop: '1rem', marginTop: '1rem' }}>
              <h3>Total: ${total.toFixed(2)}</h3>
              <button 
                onClick={handleCheckout}
                data-testid="checkout-button"
                className="submit-button"
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Checkout'}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}