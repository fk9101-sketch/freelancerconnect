# Razorpay Payment Gateway Integration

This document describes the Razorpay payment gateway integration in the HireLocal application.

## Overview

The Razorpay integration allows customers and freelancers to make payments using various payment methods including:
- Credit/Debit Cards
- UPI
- Net Banking
- Digital Wallets

## Configuration

### Test Mode (Current)
- **Key ID**: `rzp_test_R7Ty66NOUMV7mp`
- **Key Secret**: `E7hYUdNJ8lxOwITCRXGKnBTX`

### Production Mode
To switch to production mode, update the following files:

1. **Client Configuration** (`client/src/lib/razorpay-config.ts`):
```typescript
export const CURRENT_ENV = 'LIVE';
```

2. **Server Configuration** (`server/razorpay-config.ts`):
```typescript
export const CURRENT_ENV = 'LIVE';
```

3. **Environment Variables**:
Set the following environment variables for production:
```bash
RAZORPAY_LIVE_KEY_ID=your_live_key_id
RAZORPAY_LIVE_KEY_SECRET=your_live_key_secret
REACT_APP_RAZORPAY_LIVE_KEY_ID=your_live_key_id
```

## Database Schema

### Payments Table
```sql
CREATE TABLE payments (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  subscription_id VARCHAR REFERENCES subscriptions(id),
  amount INTEGER NOT NULL,
  currency VARCHAR DEFAULT 'INR',
  status payment_status DEFAULT 'pending',
  payment_method payment_method DEFAULT 'razorpay',
  razorpay_order_id VARCHAR,
  razorpay_payment_id VARCHAR,
  razorpay_signature VARCHAR,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Payment Status Enum
- `pending`: Payment initiated but not completed
- `success`: Payment completed successfully
- `failed`: Payment failed
- `cancelled`: Payment cancelled by user

### Payment Method Enum
- `razorpay`: Razorpay payment gateway
- `other`: Other payment methods

## API Endpoints

### 1. Create Payment Order
**POST** `/api/payments/create-order`

**Request Body:**
```json
{
  "amount": 500,
  "currency": "INR",
  "description": "Service payment",
  "subscriptionId": "optional-subscription-id"
}
```

**Response:**
```json
{
  "orderId": "order_xyz123",
  "amount": 50000,
  "currency": "INR",
  "paymentId": "payment-db-id"
}
```

### 2. Verify Payment
**POST** `/api/payments/verify`

**Request Body:**
```json
{
  "razorpay_order_id": "order_xyz123",
  "razorpay_payment_id": "pay_abc456",
  "razorpay_signature": "signature_hash"
}
```

**Response:**
```json
{
  "success": true,
  "paymentId": "payment-db-id",
  "status": "success"
}
```

### 3. Get Payment Details
**GET** `/api/payments/:paymentId`

**Response:**
```json
{
  "id": "payment-id",
  "userId": "user-id",
  "amount": 500,
  "status": "success",
  "razorpayOrderId": "order_xyz123",
  "razorpayPaymentId": "pay_abc456",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### 4. Get User Payments
**GET** `/api/payments/user/:userId`

**Response:**
```json
[
  {
    "id": "payment-id",
    "amount": 500,
    "status": "success",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

## Components

### 1. RazorpayPayment Component
Located at `client/src/components/razorpay-payment.tsx`

Used for subscription payments in the freelancer dashboard.

**Props:**
- `amount`: Payment amount
- `description`: Payment description
- `subscriptionId`: Optional subscription ID
- `onSuccess`: Success callback
- `onFailure`: Failure callback
- `onCancel`: Cancel callback

### 2. CustomerPayment Component
Located at `client/src/components/customer-payment.tsx`

Used for service payments in the customer dashboard.

**Props:**
- `amount`: Payment amount
- `description`: Payment description
- `onSuccess`: Success callback
- `onFailure`: Failure callback
- `onCancel`: Cancel callback

## Payment Flow

### 1. Subscription Payment (Freelancers)
1. User selects a subscription plan
2. System creates a subscription record
3. Payment modal opens with Razorpay integration
4. User completes payment through Razorpay
5. Payment is verified on the server
6. Subscription is activated
7. User is redirected to success page

### 2. Service Payment (Customers)
1. User selects a service from the dashboard
2. Payment modal opens with customer details form
3. User fills in personal details
4. Payment is processed through Razorpay
5. Payment is verified on the server
6. User receives confirmation

## Error Handling

### Payment Failures
- Invalid payment signature
- Insufficient funds
- Network connectivity issues
- Payment gateway errors

### User Experience
- Clear error messages
- Retry options
- Support contact information
- Graceful fallbacks

## Security Features

1. **Signature Verification**: All payments are verified using Razorpay's signature verification
2. **Server-side Processing**: Payment verification happens on the server
3. **Environment Separation**: Test and live credentials are properly separated
4. **User Authorization**: Users can only access their own payment records

## Testing

### Test Cards
Use these test card numbers for testing:
- **Success**: 4111 1111 1111 1111
- **Failure**: 4000 0000 0000 0002
- **CVV**: Any 3-digit number
- **Expiry**: Any future date

### Test UPI
- **UPI ID**: success@razorpay

## Monitoring

### Payment Status Tracking
- All payment attempts are logged in the database
- Payment status is tracked from initiation to completion
- Failed payments are recorded for analysis

### Analytics
- Payment success rates
- Popular payment methods
- Transaction volumes
- Error patterns

## Support

For payment-related issues:
- Check Razorpay dashboard for transaction details
- Review server logs for error messages
- Contact Razorpay support for gateway issues
- Use test mode for development and testing

## Future Enhancements

1. **Webhook Integration**: Real-time payment notifications
2. **Refund Processing**: Automated refund handling
3. **Payment Analytics**: Detailed payment insights
4. **Multiple Payment Methods**: Support for additional gateways
5. **Subscription Management**: Automated recurring payments
