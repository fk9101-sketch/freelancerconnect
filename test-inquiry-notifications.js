// Test script for real-time inquiry notifications
// This script simulates a customer posting an inquiry to test the real-time functionality

const testInquiry = async () => {
  try {
    console.log('🧪 Testing real-time inquiry notifications...');
    
    // Test inquiry data
    const inquiryData = {
      freelancerId: 'test-freelancer-id', // Replace with actual freelancer ID
      customerName: 'Test Customer',
      requirement: 'Need help with electrical work at my home',
      mobileNumber: '+91-9876543210',
      budget: '₹2000-5000',
      area: 'Jaipur',
      status: 'new'
    };

    console.log('📤 Sending test inquiry...');
    console.log('Inquiry data:', inquiryData);

    // Send inquiry to the API
    const response = await fetch('/api/customer/inquiries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inquiryData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Inquiry sent successfully!');
      console.log('Response:', result);
      console.log('🎉 Real-time notification should appear for the freelancer');
    } else {
      const error = await response.text();
      console.error('❌ Failed to send inquiry:', error);
    }
  } catch (error) {
    console.error('❌ Error testing inquiry:', error);
  }
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testInquiry = testInquiry;
  console.log('🧪 Test function available: testInquiry()');
}

export { testInquiry };
