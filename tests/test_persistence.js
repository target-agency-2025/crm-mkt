const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const API_BASE = 'http://localhost:3001';
const TEST_DB_PATH = './data/crm.db';
const TEST_UPLOADS_PATH = './uploads';

// Test utilities
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const waitForServer = async (maxAttempts = 30) => {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await axios.get(`${API_BASE}/api/health`);
      console.log('✅ Server is ready');
      return true;
    } catch (error) {
      console.log(`⏳ Waiting for server... (${i + 1}/${maxAttempts})`);
      await delay(2000);
    }
  }
  throw new Error('Server failed to start');
};

const createTestClient = async () => {
  const clientData = {
    name: 'Test Client Persistence',
    email: `test-${Date.now()}@persistence.com`,
    phone: '11999887766',
    company: 'Persistence Test Co',
    address: 'Test Street, 123',
    color: '#FF5733'
  };

  try {
    const response = await axios.post(`${API_BASE}/api/clients`, clientData, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('✅ Test client created:', response.data.id);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to create test client:', error.response?.data || error.message);
    throw error;
  }
};

const uploadTestImage = async (clientId) => {
  // Create a simple test image (1x1 pixel PNG)
  const testImageBuffer = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
    0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
    0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00,
    0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01,
    0xE2, 0x21, 0xBC, 0x33, 0x00, 0x00, 0x00, 0x00,
    0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);

  const tempImagePath = path.join(__dirname, 'test-image.png');
  fs.writeFileSync(tempImagePath, testImageBuffer);

  try {
    const form = new FormData();
    form.append('name', 'Test Client Updated');
    form.append('email', `test-updated-${Date.now()}@persistence.com`);
    form.append('phone', '11999887766');
    form.append('company', 'Updated Test Co');
    form.append('profilePhoto', fs.createReadStream(tempImagePath));

    const response = await axios.put(`${API_BASE}/api/clients/${clientId}`, form, {
      headers: {
        ...form.getHeaders(),
      },
    });

    console.log('✅ Test image uploaded for client:', clientId);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to upload test image:', error.response?.data || error.message);
    throw error;
  } finally {
    // Clean up temp file
    if (fs.existsSync(tempImagePath)) {
      fs.unlinkSync(tempImagePath);
    }
  }
};

const countClients = async () => {
  try {
    const response = await axios.get(`${API_BASE}/api/clients`);
    return response.data.length;
  } catch (error) {
    console.error('❌ Failed to count clients:', error.response?.data || error.message);
    return 0;
  }
};

const checkDatabaseFile = () => {
  const exists = fs.existsSync(TEST_DB_PATH);
  if (exists) {
    const stats = fs.statSync(TEST_DB_PATH);
    console.log(`✅ Database file exists: ${TEST_DB_PATH} (${stats.size} bytes)`);
    return { exists: true, size: stats.size };
  } else {
    console.log(`❌ Database file missing: ${TEST_DB_PATH}`);
    return { exists: false, size: 0 };
  }
};

const countUploadedFiles = () => {
  try {
    if (!fs.existsSync(TEST_UPLOADS_PATH)) {
      console.log(`❌ Uploads directory missing: ${TEST_UPLOADS_PATH}`);
      return 0;
    }

    const profilePhotosDir = path.join(TEST_UPLOADS_PATH, 'profile-photos');
    if (!fs.existsSync(profilePhotosDir)) {
      console.log(`❌ Profile photos directory missing: ${profilePhotosDir}`);
      return 0;
    }

    const files = fs.readdirSync(profilePhotosDir);
    const imageFiles = files.filter(file => 
      file.toLowerCase().endsWith('.jpg') || 
      file.toLowerCase().endsWith('.png') || 
      file.toLowerCase().endsWith('.jpeg')
    );

    console.log(`✅ Found ${imageFiles.length} uploaded images in ${profilePhotosDir}`);
    if (imageFiles.length > 0) {
      console.log(`   Files: ${imageFiles.join(', ')}`);
    }
    
    return imageFiles.length;
  } catch (error) {
    console.error('❌ Error counting uploaded files:', error.message);
    return 0;
  }
};

// Main test function
const runPersistenceTests = async () => {
  console.log('🚀 Starting CRM Persistence Tests...\n');

  try {
    // Wait for server to be ready
    await waitForServer();

    // Check initial state
    console.log('\n📊 Initial State Check:');
    const initialClientCount = await countClients();
    const initialDbState = checkDatabaseFile();
    const initialFileCount = countUploadedFiles();

    console.log(`   Clients: ${initialClientCount}`);
    console.log(`   Database: ${initialDbState.exists ? 'exists' : 'missing'} (${initialDbState.size} bytes)`);
    console.log(`   Upload files: ${initialFileCount}`);

    // Create test client
    console.log('\n📝 Creating Test Data:');
    const testClient = await createTestClient();

    // Upload test image
    console.log('\n📸 Uploading Test Image:');
    const updatedClient = await uploadTestImage(testClient.id);

    // Check state after creation
    console.log('\n📊 State After Creation:');
    const afterClientCount = await countClients();
    const afterDbState = checkDatabaseFile();
    const afterFileCount = countUploadedFiles();

    console.log(`   Clients: ${afterClientCount} (${afterClientCount - initialClientCount > 0 ? '+' : ''}${afterClientCount - initialClientCount})`);
    console.log(`   Database: ${afterDbState.exists ? 'exists' : 'missing'} (${afterDbState.size} bytes)`);
    console.log(`   Upload files: ${afterFileCount} (${afterFileCount - initialFileCount > 0 ? '+' : ''}${afterFileCount - initialFileCount})`);

    // Validate persistence
    console.log('\n✅ Persistence Test Results:');
    const clientsPersisted = afterClientCount > initialClientCount;
    const databasePersisted = afterDbState.exists && afterDbState.size > 0;
    const filesPersisted = afterFileCount > initialFileCount;

    console.log(`   ✅ Clients persisted: ${clientsPersisted ? 'YES' : 'NO'}`);
    console.log(`   ✅ Database persisted: ${databasePersisted ? 'YES' : 'NO'}`);
    console.log(`   ✅ Files persisted: ${filesPersisted ? 'YES' : 'NO'}`);

    const allTestsPassed = clientsPersisted && databasePersisted && filesPersisted;
    
    console.log(`\n🎯 Overall Result: ${allTestsPassed ? '✅ PASSED' : '❌ FAILED'}`);
    
    return {
      success: allTestsPassed,
      results: {
        clientsPersisted,
        databasePersisted,
        filesPersisted,
        clientCount: afterClientCount,
        dbSize: afterDbState.size,
        fileCount: afterFileCount
      }
    };

  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

// Export for use in other scripts
module.exports = {
  runPersistenceTests,
  waitForServer,
  createTestClient,
  uploadTestImage,
  countClients,
  checkDatabaseFile,
  countUploadedFiles
};

// Run tests if this file is executed directly
if (require.main === module) {
  runPersistenceTests()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test runner error:', error);
      process.exit(1);
    });
}