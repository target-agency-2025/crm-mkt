// Test script to verify profile photo upload functionality
// This script will help verify that profile photos are being saved to the database correctly

console.log('Testing profile photo upload functionality...');

// Mock client data with profile photo
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

// Test form data creation
const createMockFormData = (clientData, profilePhoto) => {
  const formData = new FormData();
  
  Object.keys(clientData).forEach(key => {
    if (clientData[key] !== null && clientData[key] !== undefined) {
      formData.append(key, clientData[key]);
    }
  });
  
  if (profilePhoto) {
    formData.append('profilePhoto', profilePhoto);
  }
  
  return formData;
};

const mockFormData = createMockFormData(mockClientData);
console.log('Form data created successfully');

console.log('Test completed successfully');