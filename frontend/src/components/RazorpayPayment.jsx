import React from 'react';
import apiPayment from '../services/apiPayment'; // adjust path if needed

const RazorpayPayment = ({ amount, receipt }) => {
  const handlePayment = async () => {
    try {
      // Step 1: Create Razorpay order via backend
      const res = await apiPayment.post('/payment/initiate', {
        amount,
        currency: 'INR',
        receipt,
      });

      const order = res.data;

      // Step 2: Configure Razorpay options
      const options = {
        key: 'YOUR_RAZORPAY_KEY_ID', // Replace with your actual Razorpay Key ID
        amount: amount * 100,
        currency: 'INR',
        name: 'Mithran Millets',
        description: 'Order Payment',
        order_id: order.orderId,
        handler: async function (response) {
          // Step 3: Verify payment signature via backend
          try {
            const verifyRes = await apiPayment.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            alert('✅ ' + verifyRes.data);
          } catch (err) {
            console.error('Verification failed:', err);
            alert('❌ Payment verification failed');
          }
        },
        prefill: {
          name: 'Customer Name',
          email: 'customer@example.com',
          contact: '9999999999',
        },
        theme: { color: '#1b4332' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Payment initiation failed:', err);
      alert('❌ Could not initiate payment');
    }
  };

  return (
    <button
      onClick={handlePayment}
      style={{
        padding: '12px 24px',
        backgroundColor: '#d4a373',
        color: '#fff',
        fontWeight: 'bold',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
      }}
    >
      Pay ₹{amount}
    </button>
  );
};

export default RazorpayPayment;
