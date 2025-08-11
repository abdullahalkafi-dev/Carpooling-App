// Driver Location Socket.IO Test Client
// This file demonstrates how to test the driver location functionality

const io = require('socket.io-client');

// Connect to the server
const socket = io('http://localhost:5007');

// Test data
const testData = {
  carpoolId: "66c123456789abcdef012345", // Replace with actual carpool ID
  driverId: "66c123456789abcdef012346",  // Replace with actual driver ID
  userId: "66c123456789abcdef012347",    // Replace with actual member ID
  location: [-74.006, 40.7128] // New York coordinates [longitude, latitude]
};

socket.on('connect', () => {
  console.log('Connected to server');
  
  // Test driver starting location sharing
  console.log('\n🚗 Testing driver location start...');
  socket.emit('startDriverLocation', {
    carpoolId: testData.carpoolId,
    driverId: testData.driverId,
    location: testData.location
  });
});

// Driver responses
socket.on('driverLocationStarted', (data) => {
  console.log('✅ Driver location started:', data);
  
  // Simulate location updates
  setTimeout(() => {
    console.log('\n📍 Sending location update...');
    socket.emit('updateDriverLocation', {
      location: [-74.007, 40.7129] // Slightly moved
    });
  }, 2000);
  
  // Stop location sharing after 5 seconds
  setTimeout(() => {
    console.log('\n⏹️  Stopping location sharing...');
    socket.emit('stopDriverLocation');
  }, 5000);
});

socket.on('driverLocationStopped', (data) => {
  console.log('✅ Driver location stopped:', data);
  
  // Test member joining location updates
  setTimeout(() => {
    console.log('\n👥 Testing member joining location updates...');
    socket.emit('joinCarpoolLocation', {
      carpoolId: testData.carpoolId,
      userId: testData.userId
    });
  }, 1000);
});

socket.on('driverLocationError', (error) => {
  console.log('❌ Driver location error:', error.message);
});

// Member responses
socket.on('locationRoomJoined', (data) => {
  console.log('✅ Joined location room:', data);
  
  // Leave room after 2 seconds
  setTimeout(() => {
    console.log('\n🚪 Leaving location room...');
    socket.emit('leaveCarpoolLocation', {
      carpoolId: testData.carpoolId,
      userId: testData.userId
    });
  }, 2000);
});

socket.on('locationRoomLeft', (data) => {
  console.log('✅ Left location room:', data);
  console.log('\n🎉 All tests completed!');
  
  // Disconnect after testing
  setTimeout(() => {
    socket.disconnect();
    process.exit(0);
  }, 1000);
});

socket.on('locationRoomError', (error) => {
  console.log('❌ Location room error:', error.message);
});

// Location updates (received by members)
socket.on('driverLocationUpdate', (data) => {
  console.log('📍 Driver location update received:', data);
});

socket.on('driverLocationStopped', (data) => {
  console.log('⏹️  Driver stopped sharing location:', data);
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

// Handle connection errors
socket.on('connect_error', (error) => {
  console.log('❌ Connection error:', error.message);
  process.exit(1);
});

console.log('🔌 Connecting to Socket.IO server...');
console.log('📝 Make sure to update the test data with valid MongoDB ObjectIds');
console.log('🏃‍♂️ Starting tests in 3 seconds...');

// Instructions for testing
setTimeout(() => {
  console.log('\n📋 Testing Instructions:');
  console.log('1. Update testData with valid MongoDB ObjectIds from your database');
  console.log('2. Make sure the carpool exists and the user is a member');
  console.log('3. Run: node test-driver-location.js');
  console.log('4. Watch the console for test results\n');
}, 1000);
