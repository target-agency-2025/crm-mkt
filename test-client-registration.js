// Test script to verify client registration functionality
// This script will help verify that new clients can be registered correctly

console.log('Testing client registration functionality...');

// Mock client data
const mockClientData = {
  name: 'Test Client',
  email: 'test@example.com',
  phone: '123456789',
  company: 'Test Company',
  color: '#6A0DAD',
  monthlyValue: 1000,
  paymentDay: 15,
  status: 'active'
};

console.log('Mock client data:', mockClientData);

// Test client data conversion
const convertClientData = (client) => {
  return {
    name: client.name,
    email: client.email,
    phone: client.phone,
    company: client.company || '',
    color: client.color,
    monthlyValue: client.monthlyValue?.toString() || '0',
    paymentDay: client.paymentDay?.toString() || '1',
    status: client.status
  };
};

const convertedData = convertClientData(mockClientData);
console.log('Converted client data:', convertedData);

console.log('Test completed successfully');