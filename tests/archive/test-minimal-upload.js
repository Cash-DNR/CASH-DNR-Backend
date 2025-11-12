/**
 * Minimal Upload Test - Test if basic file upload works
 */

const BASE_URL = 'https://cash-dnr-backend.onrender.com';

async function testMinimalUpload() {
  console.log('🔬 Minimal Upload Test\n');
  
  try {
    // First get a token
    const testUser = {
      idNumber: "8203141234089",
      contactInfo: {
        email: `minimal.${Date.now()}@example.com`,
        phone: "+27 82 555 1234"
      },
      homeAddress: {
        streetAddress: "123 Test Street",
        town: "Sandton", 
        city: "Johannesburg",
        province: "Gauteng",
        postalCode: "2196"
      },
      password: "TestPassword123!"
    };

    const registerResponse = await fetch(`${BASE_URL}/api/auth/citizen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    if (!registerResponse.ok) {
      const error = await registerResponse.text();
      console.log('❌ Registration failed:', error);
      return;
    }

    const registerResult = await registerResponse.json();
    console.log('Register result:', registerResult);
    
    if (!registerResult.data || !registerResult.data.token) {
      console.log('❌ No token in response');
      return;
    }
    
    const token = registerResult.data.token;
    console.log('✅ Got token:', token.substring(0, 20) + '...');

    // Test the existing document upload endpoint that we know works
    console.log('\n📋 Testing existing register-with-documents endpoint...');
    
    // Create form data using browser FormData API style
    const form = new FormData();
    
    // Create simple text files instead of PDFs
    const idDoc = new Blob(['ID Document Content'], { type: 'text/plain' });
    const proofDoc = new Blob(['Proof of Residence Content'], { type: 'text/plain' });
    
    form.append('idNumber', '8012094321085');
    form.append('email', `testdoc.${Date.now()}@example.com`);
    form.append('password', 'TestPassword123!');
    form.append('id_document', idDoc, 'id_document.txt');
    form.append('proof_of_residence', proofDoc, 'proof_of_residence.txt');

    const docResponse = await fetch(`${BASE_URL}/api/auth/register-with-documents`, {
      method: 'POST',
      body: form
    });

    console.log('Document upload status:', docResponse.status);
    
    if (docResponse.ok) {
      const result = await docResponse.json();
      console.log('✅ Document upload works:', result.message);
      console.log('   Files uploaded:', result.data.uploaded?.length || 0);
    } else {
      const error = await docResponse.text();
      console.log('❌ Document upload failed:', error);
    }

  } catch (error) {
    console.error('❌ Minimal test failed:', error.message);
  }
}

testMinimalUpload();