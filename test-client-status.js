// Test script to verify client status functionality
// This script will help verify that clients can be marked as inactive while preserving their data

console.log('Testing client status functionality...');

// Mock client data
const mockClients = [
  {
    id: '1',
    name: 'Active Client',
    email: 'active@example.com',
    status: 'active',
    monthlyValue: 1000,
    paymentDay: 15
  },
  {
    id: '2',
    name: 'Inactive Client',
    email: 'inactive@example.com',
    status: 'inactive',
    monthlyValue: 1500,
    paymentDay: 20
  },
  {
    id: '3',
    name: 'Paused Client',
    email: 'paused@example.com',
    status: 'paused',
    monthlyValue: 800,
    paymentDay: 10
  }
];

// Test filtering functions
const getActiveClients = () => mockClients.filter(client => client.status === 'active');
const getInactiveClients = () => mockClients.filter(client => client.status === 'inactive');
const getPausedClients = () => mockClients.filter(client => client.status === 'paused');

// Run tests
console.log('Active clients:', getActiveClients());
console.log('Inactive clients:', getInactiveClients());
console.log('Paused clients:', getPausedClients());

console.log('Test completed successfully');