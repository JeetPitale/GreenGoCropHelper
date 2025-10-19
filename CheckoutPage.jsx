// frontend/CheckoutPage.js
import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button'; // Your Button Component

const stripePromise = loadStripe('your-public-key-from-stripe');

const CheckoutPage = () => {
  const handleCheckout = async () => {
    // Call your backend to create a Checkout Session
    const response = await fetch('/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount: 1000 }), // The amount to charge (in cents)
    });

    const { sessionId } = await response.json();

    // Redirect to Stripe Checkout
    const stripe = await stripePromise;
    const { error } = await stripe.redirectToCheckout({ sessionId });

    if (error) {
      console.log('Error redirecting to checkout:', error.message);
    }
  };

  return (
    <div>
      <h2>Checkout</h2>
      <Button onClick={handleCheckout}>Pay Now</Button>
    </div>
  );
};

export default CheckoutPage;
