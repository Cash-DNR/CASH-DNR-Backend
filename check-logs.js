// Simple script to check recent production logs
import fetch from 'node-fetch';

const checkLogs = async () => {
  console.log('Fetching production server health...\n');
  
  try {
    const response = await fetch('https://cash-dnr-backend.onrender.com/health');
    const data = await response.json();
    console.log('Server Status:', data);
    
    console.log('\n🔍 To check detailed logs:');
    console.log('1. Visit: https://dashboard.render.com/');
    console.log('2. Select: cash-dnr-backend');
    console.log('3. View: Logs tab');
    console.log('\nLook for recent errors related to /register-with-documents');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
};

checkLogs();