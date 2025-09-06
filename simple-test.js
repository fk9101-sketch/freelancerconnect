const crypto = require('crypto');

// Test Razorpay configuration
const RAZORPAY_CONFIG = {
  KEY_ID: 'rzp_test_R7Ty66NOUMV7mp',
  KEY_SECRET: 'E7hYUdNJ8lxOwITCRXGKnBTX',
};

// Test signature verification function
function verifyRazorpaySignature(orderId, paymentId, signature) {
  try {
    console.log('=== SIGNATURE VERIFICATION TEST ===');
    console.log('Order ID:', orderId);
    console.log('Payment ID:', paymentId);
    console.log('Received Signature:', signature);
    console.log('Using Key Secret:', RAZORPAY_CONFIG.KEY_SECRET ? `${RAZORPAY_CONFIG.KEY_SECRET.substring(0, 10)}...` : 'NOT SET');
    
    // Ensure we have the secret key
    if (!RAZORPAY_CONFIG.KEY_SECRET) {
      console.error('Razorpay secret key is not configured');
      return false;
    }
    
    // Create the signature body exactly as Razorpay expects
    const body = orderId + "|" + paymentId;
    console.log('Signature Body:', body);
    
    // Generate expected signature using HMAC SHA256
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_CONFIG.KEY_SECRET)
      .update(body)
      .digest("hex");
    
    console.log('Expected Signature:', expectedSignature);
    console.log('Received Signature:', signature);
    console.log('Signatures Match:', expectedSignature === signature);
    console.log('=== SIGNATURE VERIFICATION TEST END ===');
    
    return expectedSignature === signature;
  } catch (error) {
    console.error('Error in signature verification:', error);
    return false;
  }
}

// Test with sample data
const testOrderId = 'order_test123';
const testPaymentId = 'pay_test456';
const testSignature = 'test_signature_789';

console.log('🧪 Testing Razorpay Payment Verification\n');

// Test 1: Payment signature verification
console.log('Test 1: Payment Signature Verification');
const signatureValid = verifyRazorpaySignature(testOrderId, testPaymentId, testSignature);
console.log(`Result: ${signatureValid ? '✅ PASS' : '❌ FAIL'}\n`);

// Test 2: Generate valid signature for testing
console.log('Test 2: Generate Valid Signature for Testing');
const validSignature = crypto
  .createHmac("sha256", RAZORPAY_CONFIG.KEY_SECRET)
  .update(testOrderId + "|" + testPaymentId)
  .digest("hex");

console.log('Valid signature for testing:', validSignature);
console.log('You can use this signature to test successful verification\n');

// Test 3: Test with valid signature
console.log('Test 3: Test with Valid Signature');
const validSignatureTest = verifyRazorpaySignature(testOrderId, testPaymentId, validSignature);
console.log(`Result: ${validSignatureTest ? '✅ PASS' : '❌ FAIL'}\n`);

console.log('🎯 Test Summary:');
console.log(`- Signature verification: ${signatureValid ? '✅ Working' : '❌ Broken'}`);
console.log(`- Valid signature test: ${validSignatureTest ? '✅ Working' : '❌ Broken'}`);

console.log('\n💡 To test with real data:');
console.log('1. Make a test payment through your app');
console.log('2. Check the server logs for the actual values');
console.log('3. Replace the test values above with real ones');
console.log('4. Run this test again to verify the signature');

