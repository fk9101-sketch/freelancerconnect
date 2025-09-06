// Server-side Razorpay Configuration
import crypto from 'crypto';

export const RAZORPAY_CONFIG = {
  // Test credentials
  TEST: {
    KEY_ID: 'rzp_test_R7Ty66NOUMV7mp',
    KEY_SECRET: 'E7hYUdNJ8lxOwITCRXGKnBTX',
  },
  // Live credentials (for production)
  LIVE: {
    KEY_ID: process.env.RAZORPAY_LIVE_KEY_ID || '',
    KEY_SECRET: process.env.RAZORPAY_LIVE_KEY_SECRET || '',
  }
};

// Current environment (change to 'LIVE' for production)
export const CURRENT_ENV = 'TEST';

// Get current configuration
export const getRazorpayConfig = () => {
  return RAZORPAY_CONFIG[CURRENT_ENV as keyof typeof RAZORPAY_CONFIG];
};

// Verify Razorpay signature
export const verifyRazorpaySignature = (orderId: string, paymentId: string, signature: string): boolean => {
  try {
    const config = getRazorpayConfig();
    
    console.log('=== SIGNATURE VERIFICATION START ===');
    console.log('Order ID:', orderId);
    console.log('Payment ID:', paymentId);
    console.log('Received Signature:', signature);
    console.log('Using Key Secret:', config.KEY_SECRET ? `${config.KEY_SECRET.substring(0, 10)}...` : 'NOT SET');
    
    // Ensure we have the secret key
    if (!config.KEY_SECRET) {
      console.error('Razorpay secret key is not configured');
      return false;
    }
    
    // Validate input parameters
    if (!orderId || !paymentId || !signature) {
      console.error('Missing required parameters for signature verification');
      return false;
    }
    
    // Create the signature body exactly as Razorpay expects
    const body = orderId + "|" + paymentId;
    console.log('Signature Body:', body);
    
    // Generate expected signature using HMAC SHA256
    const expectedSignature = crypto
      .createHmac("sha256", config.KEY_SECRET)
      .update(body)
      .digest("hex");
    
    console.log('Expected Signature:', expectedSignature);
    console.log('Received Signature:', signature);
    console.log('Signatures Match:', expectedSignature === signature);
    
    // Additional validation - check if signatures are valid hex strings
    const isValidHex = /^[a-fA-F0-9]+$/.test(signature) && /^[a-fA-F0-9]+$/.test(expectedSignature);
    console.log('Valid hex format:', isValidHex);
    
    if (!isValidHex) {
      console.error('Invalid signature format - not a valid hex string');
      return false;
    }
    
    const isValid = expectedSignature === signature;
    console.log('=== SIGNATURE VERIFICATION END ===');
    console.log('Final Result:', isValid ? 'VALID' : 'INVALID');
    
    if (!isValid) {
      console.error('❌ SIGNATURE VERIFICATION FAILED');
      console.error('Expected:', expectedSignature);
      console.error('Received:', signature);
      console.error('Body used:', body);
      console.error('Secret used:', config.KEY_SECRET ? `${config.KEY_SECRET.substring(0, 10)}...` : 'NOT SET');
      
      // Additional debugging - try different signature formats
      console.log('=== DEBUGGING SIGNATURE FORMATS ===');
      
      // Try with different body formats
      const bodyVariations = [
        orderId + "|" + paymentId,  // Standard format
        paymentId + "|" + orderId,  // Reversed format
        orderId + paymentId,        // No separator
        paymentId + orderId,        // No separator, reversed
      ];
      
      for (let i = 0; i < bodyVariations.length; i++) {
        const testBody = bodyVariations[i];
        const testSignature = crypto
          .createHmac("sha256", config.KEY_SECRET)
          .update(testBody)
          .digest("hex");
        
        console.log(`Test ${i + 1} - Body: "${testBody}" -> Signature: ${testSignature}`);
        if (testSignature === signature) {
          console.log(`✅ MATCH FOUND with format ${i + 1}!`);
          return true;
        }
      }
      
      console.log('=== END DEBUGGING ===');
    } else {
      console.log('✅ SIGNATURE VERIFICATION SUCCESSFUL');
    }
    
    return isValid;
  } catch (error) {
    console.error('Error in signature verification:', error);
    return false;
  }
};

// Verify webhook signature (for future use)
export const verifyWebhookSignature = (payload: string, signature: string): boolean => {
  try {
    const config = getRazorpayConfig();
    
    if (!config.KEY_SECRET) {
      console.error('Razorpay secret key is not configured for webhook verification');
      return false;
    }
    
    const expectedSignature = crypto
      .createHmac('sha256', config.KEY_SECRET)
      .update(payload)
      .digest('hex');
    
    return expectedSignature === signature;
  } catch (error) {
    console.error('Error in webhook signature verification:', error);
    return false;
  }
};
