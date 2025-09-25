const { spawn } = require('child_process');
const { runPersistenceTests, waitForServer } = require('./test_persistence');

const runCommand = (command, args = [], options = {}) => {
  return new Promise((resolve, reject) => {
    console.log(`🔄 Running: ${command} ${args.join(' ')}`);
    
    const process = spawn(command, args, {
      stdio: 'pipe',
      shell: true,
      ...options
    });

    let stdout = '';
    let stderr = '';

    process.stdout?.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      console.log(output.trim());
    });

    process.stderr?.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      console.error(output.trim());
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr, code });
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });

    process.on('error', (error) => {
      reject(error);
    });
  });
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const testDockerPersistence = async () => {
  console.log('🐳 Starting Docker Persistence Tests...\n');

  try {
    console.log('📦 Step 1: Building Docker containers...');
    await runCommand('docker-compose', ['up', '--build', '-d']);
    
    console.log('\n⏳ Step 2: Waiting for services to be ready...');
    await delay(10000); // Wait 10 seconds for services to start
    
    try {
      await waitForServer(30); // Wait up to 60 seconds for server
    } catch (error) {
      console.log('⚠️  Server not responding, checking container logs...');
      await runCommand('docker-compose', ['logs', 'crm-app']);
      throw error;
    }

    console.log('\n🧪 Step 3: Running persistence tests...');
    const testResults = await runPersistenceTests();

    console.log('\n📊 Step 4: Checking container data before restart...');
    
    // Check database file in container
    try {
      const { stdout } = await runCommand('docker-compose', ['exec', '-T', 'crm-app', 'ls', '-la', '/app/data/']);
      console.log('📁 Container data directory:', stdout);
    } catch (error) {
      console.log('⚠️  Could not list container data directory');
    }

    // Check uploads in container
    try {
      const { stdout } = await runCommand('docker-compose', ['exec', '-T', 'crm-app', 'find', '/app/uploads', '-type', 'f']);
      console.log('📁 Container upload files:', stdout);
    } catch (error) {
      console.log('⚠️  Could not list container upload files');
    }

    // Check host volumes
    try {
      const { stdout } = await runCommand('ls', ['-la', './data/']);
      console.log('📁 Host data directory:', stdout);
    } catch (error) {
      console.log('⚠️  Could not list host data directory');
    }

    try {
      const { stdout } = await runCommand('find', ['./uploads', '-type', 'f']);
      console.log('📁 Host upload files:', stdout);
    } catch (error) {
      console.log('⚠️  Could not list host upload files');
    }

    console.log('\n🔄 Step 5: Stopping containers...');
    await runCommand('docker-compose', ['down']);

    console.log('\n⏳ Step 6: Waiting 5 seconds...');
    await delay(5000);

    console.log('\n🚀 Step 7: Restarting containers...');
    await runCommand('docker-compose', ['up', '-d']);

    console.log('\n⏳ Step 8: Waiting for services to restart...');
    await delay(10000);
    
    try {
      await waitForServer(30);
    } catch (error) {
      console.log('⚠️  Server not responding after restart, checking logs...');
      await runCommand('docker-compose', ['logs', 'crm-app']);
      throw error;
    }

    console.log('\n🔍 Step 9: Verifying data persistence after restart...');
    const postRestartResults = await runPersistenceTests();

    console.log('\n📋 Final Results:');
    console.log('Before restart:', testResults);
    console.log('After restart:', postRestartResults);

    const persistenceSuccessful = 
      testResults.success && 
      postRestartResults.success &&
      postRestartResults.results.clientCount >= testResults.results.clientCount &&
      postRestartResults.results.fileCount >= testResults.results.fileCount;

    console.log(`\n🏆 Docker Persistence Test: ${persistenceSuccessful ? '✅ PASSED' : '❌ FAILED'}`);

    if (persistenceSuccessful) {
      console.log('✅ Data and files persisted successfully across container restarts!');
    } else {
      console.log('❌ Data or files were lost during container restart!');
    }

    // Clean up
    console.log('\n🧹 Cleaning up containers...');
    await runCommand('docker-compose', ['down']);

    return {
      success: persistenceSuccessful,
      beforeRestart: testResults,
      afterRestart: postRestartResults
    };

  } catch (error) {
    console.error('\n❌ Docker persistence test failed:', error.message);
    
    // Show logs on failure
    try {
      console.log('\n📋 Container logs:');
      await runCommand('docker-compose', ['logs', '--tail', '50']);
    } catch (logError) {
      console.log('Could not retrieve container logs');
    }

    // Clean up
    try {
      await runCommand('docker-compose', ['down']);
    } catch (cleanupError) {
      console.log('Could not clean up containers');
    }

    return {
      success: false,
      error: error.message
    };
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  testDockerPersistence()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Docker test runner error:', error);
      process.exit(1);
    });
}

module.exports = { testDockerPersistence };