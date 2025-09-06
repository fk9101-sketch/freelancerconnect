// Razorpay Configuration
export const RAZORPAY_CONFIG = {
  // Test credentials
  TEST: {
    KEY_ID: 'rzp_test_R7Ty66NOUMV7mp',
    KEY_SECRET: 'E7hYUdNJ8lxOwITCRXGKnBTX',
  },
  // Live credentials (for production)
  LIVE: {
    KEY_ID: import.meta.env.VITE_RAZORPAY_LIVE_KEY_ID || '',
    KEY_SECRET: import.meta.env.VITE_RAZORPAY_LIVE_KEY_SECRET || '',
  }
};

// Current environment (change to 'LIVE' for production)
export const CURRENT_ENV = 'TEST';

// Get current configuration
export const getRazorpayConfig = () => {
  const config = RAZORPAY_CONFIG[CURRENT_ENV as keyof typeof RAZORPAY_CONFIG];
  console.log('🔧 Frontend Razorpay Configuration:', {
    keyId: config.KEY_ID,
    keySecret: config.KEY_SECRET ? `${config.KEY_SECRET.substring(0, 10)}...` : 'NOT SET',
    environment: CURRENT_ENV
  });
  return config;
};

// Razorpay checkout options
export const getRazorpayOptions = (orderData: any, description: string, customerDetails?: any) => {
  const config = getRazorpayConfig();

  return {
    key: config.KEY_ID,
    amount: orderData.amount,
    currency: orderData.currency || 'INR',
    name: 'HireLocal',
    description: description,
    order_id: orderData.orderId,
    prefill: {
      name: customerDetails?.name || 'Test User',
      email: customerDetails?.email || 'test@example.com',
      contact: customerDetails?.contact || '9999999999'
    },
    notes: {
      address: 'HireLocal Office',
      description: description
    },
    theme: {
      color: '#6366f1'
    },
    // Add retry configuration
    retry: {
      enabled: true,
      max_count: 3
    },
    // Add callback configuration
    callback_url: window.location.origin + '/payment-success',
    cancel_url: window.location.origin + '/payment-failed',
    // Add webhook URL for server-side confirmation
    webhook_url: window.location.origin + '/api/payments/webhook'
  };
};

// Helper function to load Razorpay script
export const loadRazorpayScript = async (): Promise<void> => {
  if (window.Razorpay) {
    console.log('Razorpay script already loaded');
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      console.log('Razorpay script already loading, waiting...');
      existingScript.addEventListener('load', () => {
        console.log('Razorpay script loaded from existing element');
        resolve();
      });
      existingScript.addEventListener('error', () => {
        console.error('Failed to load Razorpay script from existing element');
        reject(new Error('Failed to load Razorpay script'));
      });
      return;
    }

    console.log('Loading Razorpay script...');
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      console.log('Razorpay script loaded successfully');
      resolve();
    };
    script.onerror = () => {
      console.error('Failed to load Razorpay script');
      reject(new Error('Failed to load Razorpay script'));
    };
    document.body.appendChild(script);
  });
};

// Helper function to create Razorpay instance
export const createRazorpayInstance = (options: any) => {
  if (!window.Razorpay) {
    throw new Error('Razorpay script not loaded');
  }
  console.log('Creating Razorpay instance with options:', options);
  return new window.Razorpay(options);
};

// Helper function to validate Razorpay configuration
export const validateRazorpayConfig = () => {
  const config = getRazorpayConfig();
  if (!config.KEY_ID || !config.KEY_SECRET) {
    throw new Error('Razorpay configuration is incomplete');
  }
  console.log('Razorpay configuration validated:', {
    keyId: config.KEY_ID,
    environment: CURRENT_ENV
  });
  return true;
};
