/**
 * Home Affairs API Service
 * Provides South African ID validation using the Home Affairs API
 * Includes mock data for testing purposes
 */

// For Node.js < 18, uncomment the line below:
// import fetch from 'node-fetch';

// Mock database of valid South African IDs with personal information
const mockHomeAffairsData = [
  {
    idNumber: "9001015009086",
    firstName: "John",
    lastName: "Doe",
    dateOfBirth: "1990-01-01",
    gender: "Male",
    citizenship: "South African",
    isValid: true,
    isAlive: true,
    maritalStatus: "Single"
  },
  {
    idNumber: "8505152240084",
    firstName: "Jane",
    lastName: "Smith",
    dateOfBirth: "1985-05-15",
    gender: "Female",
    citizenship: "South African",
    isValid: true,
    isAlive: true,
    maritalStatus: "Married"
  },
  {
    idNumber: "9206301234567",
    firstName: "Michael",
    lastName: "Johnson",
    dateOfBirth: "1992-06-30",
    gender: "Male",
    citizenship: "South African",
    isValid: true,
    isAlive: true,
    maritalStatus: "Single"
  },
  {
    idNumber: "8012157890123",
    firstName: "Sarah",
    lastName: "Wilson",
    dateOfBirth: "1980-12-15",
    gender: "Female",
    citizenship: "South African",
    isValid: true,
    isAlive: true,
    maritalStatus: "Divorced"
  },
  {
    idNumber: "9511280987654",
    firstName: "David",
    lastName: "Brown",
    dateOfBirth: "1995-11-28",
    gender: "Male",
    citizenship: "South African",
    isValid: true,
    isAlive: true,
    maritalStatus: "Single"
  },
  {
    idNumber: "8809034567087",
    firstName: "Lisa",
    lastName: "Davis",
    dateOfBirth: "1988-09-03",
    gender: "Female",
    citizenship: "South African",
    isValid: true,
    isAlive: true,
    maritalStatus: "Married"
  },
  {
    idNumber: "9103126789083",
    firstName: "Robert",
    lastName: "Miller",
    dateOfBirth: "1991-03-12",
    gender: "Male",
    citizenship: "South African",
    isValid: true,
    isAlive: true,
    maritalStatus: "Single"
  },
  {
    idNumber: "8707082345085",
    firstName: "Emily",
    lastName: "Anderson",
    dateOfBirth: "1987-07-08",
    gender: "Female",
    citizenship: "South African",
    isValid: true,
    isAlive: true,
    maritalStatus: "Married"
  },
  {
    idNumber: "9410198901086",
    firstName: "James",
    lastName: "Taylor",
    dateOfBirth: "1994-10-19",
    gender: "Male",
    citizenship: "South African",
    isValid: true,
    isAlive: true,
    maritalStatus: "Single"
  },
  {
    idNumber: "8304253456089",
    firstName: "Jennifer",
    lastName: "Thomas",
    dateOfBirth: "1983-04-25",
    gender: "Female",
    citizenship: "South African",
    isValid: true,
    isAlive: true,
    maritalStatus: "Married"
  },
  // Additional test cases for edge scenarios
  {
    idNumber: "7001019999999", // Invalid - deceased
    firstName: "Invalid",
    lastName: "User",
    dateOfBirth: "1970-01-01",
    gender: "Male",
    citizenship: "South African",
    isValid: true,
    isAlive: false,
    maritalStatus: "Deceased"
  },
  {
    idNumber: "0000000000000", // Completely invalid
    firstName: null,
    lastName: null,
    dateOfBirth: null,
    gender: null,
    citizenship: null,
    isValid: false,
    isAlive: false,
    maritalStatus: null
  }
];

/**
 * Validates South African ID number format
 * @param {string} idNumber - 13 digit South African ID number
 * @returns {boolean} - Whether the ID format is valid
 */
function validateSAIDFormat(idNumber) {
  // Remove any spaces or dashes
  const cleanId = idNumber.replace(/[\s-]/g, '');
  
  // Check if it's exactly 13 digits
  if (!/^\d{13}$/.test(cleanId)) {
    return false;
  }

  // Extract components
  const year = parseInt(cleanId.substring(0, 2));
  const month = parseInt(cleanId.substring(2, 4));
  const day = parseInt(cleanId.substring(4, 6));
  const gender = parseInt(cleanId.substring(6, 10));
  const citizenship = parseInt(cleanId.substring(10, 11));
  const checkDigit = parseInt(cleanId.substring(12, 13));

  // Validate date components
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  // Validate checksum using Luhn algorithm
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    let digit = parseInt(cleanId[i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  
  const calculatedCheckDigit = (10 - (sum % 10)) % 10;
  
  return calculatedCheckDigit === checkDigit;
}

/**
 * Extracts information from South African ID number
 * @param {string} idNumber - 13 digit South African ID number
 * @returns {object} - Extracted information
 */
function extractIdInfo(idNumber) {
  const cleanId = idNumber.replace(/[\s-]/g, '');
  
  // Basic validation - just check length and that it's numeric
  if (!/^\d{13}$/.test(cleanId)) {
    return null;
  }

  const year = parseInt(cleanId.substring(0, 2));
  const month = parseInt(cleanId.substring(2, 4));
  const day = parseInt(cleanId.substring(4, 6));
  const genderCode = parseInt(cleanId.substring(6, 10));
  const citizenshipCode = parseInt(cleanId.substring(10, 11));

  // Basic date validation
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  // Determine century (assumes current year is 2025)
  const fullYear = year < 26 ? 2000 + year : 1900 + year;
  
  return {
    dateOfBirth: `${fullYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
    gender: genderCode < 5000 ? 'Female' : 'Male',
    citizenship: citizenshipCode === 0 ? 'South African' : 'Foreign'
  };
}

/**
 * Simulates API call to Home Affairs
 * @param {string} idNumber - South African ID number
 * @returns {Promise<object>} - API response
 */
async function mockHomeAffairsAPI(idNumber) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

  const cleanId = idNumber.replace(/[\s-]/g, '');
  
  // Find in mock data
  const mockRecord = mockHomeAffairsData.find(record => record.idNumber === cleanId);
  
  if (mockRecord) {
    return {
      success: true,
      data: {
        idNumber: cleanId,
        isValid: true,
        isRegistered: false,
        homeAffairsData: mockRecord,
        extractedInfo: extractIdInfo(cleanId)
      },
      message: 'ID found in Home Affairs database'
    };
  }

  // If not in mock data but valid format, check if it's a valid SA ID
  if (validateSAIDFormat(cleanId)) {
    const extractedInfo = extractIdInfo(cleanId);
    
    return {
      success: false,
      data: null,
      message: 'ID number is valid format but not found in Home Affairs database',
      extractedInfo
    };
  }

  return {
    success: false,
    data: null,
    message: 'Invalid South African ID number format'
  };
}

/**
 * Register user with your Home Affairs API
 * @param {object} userData - User registration data
 * @returns {Promise<object>} - API response
 */
async function registerWithHomeAffairsAPI(userData) {
  const apiUrl = process.env.HOME_AFFAIRS_API_URL;
  const apiKey = process.env.HOME_AFFAIRS_API_KEY;

  try {
    const registerEndpoint = `${apiUrl}/api/register/citizen`;
    
    console.log(`📝 Registering user with your API: ${registerEndpoint}`);
    
    const response = await fetch(registerEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-API-Key': apiKey,
        'User-Agent': 'CASH-DNR-Backend/1.0.0'
      },
      body: JSON.stringify({
        idNumber: userData.idNumber,
        contactInfo: {
          phone: userData.phone || '',
          email: userData.email || ''
        }
      }),
      timeout: 30000
    });

    console.log(`📡 Registration response status: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ User registered successfully with your API:', data);
      
      return {
        success: true,
        data: {
          userId: data.userId,
          taxId: data.taxId,
          userInfo: data.userInfo
        },
        message: data.message || 'User registered successfully',
        source: 'cash-dnr-api'
      };
    } else if (response.status === 409) {
      // User already exists
      const errorData = await response.json();
      return {
        success: false,
        data: null,
        message: 'User already registered',
        error: errorData.error || 'Conflict',
        source: 'cash-dnr-api'
      };
    } else {
      const errorText = await response.text();
      throw new Error(`Registration failed: ${response.status} - ${errorText}`);
    }

  } catch (error) {
    console.error('🚨 Registration API Error:', error);
    return {
      success: false,
      data: null,
      message: 'Failed to register with Home Affairs API',
      error: error.message,
      source: 'cash-dnr-api-error'
    };
  }
}

/**
 * Real API call to your deployed Home Affairs API
 * @param {string} idNumber - South African ID number
 * @returns {Promise<object>} - API response
 */
async function realHomeAffairsAPI(idNumber) {
  const apiUrl = process.env.HOME_AFFAIRS_API_URL;
  const apiKey = process.env.HOME_AFFAIRS_API_KEY;

  try {
    // Primary endpoint: /citizens/{idNumber} based on your API documentation
    const citizenEndpoint = `${apiUrl}/api/citizens/${idNumber}`;
    
    console.log(`🔍 Verifying ID with your API: ${citizenEndpoint}`);
    
    const response = await fetch(citizenEndpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-API-Key': apiKey,
        'User-Agent': 'CASH-DNR-Backend/1.0.0'
      },
      timeout: 30000 // 30 second timeout
    });

    console.log(`📡 Response status: ${response.status} from your API`);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Successful API response from your service:', data);
      
      // Transform your API response to match our expected format
      return {
        success: true,
        data: {
          idNumber: idNumber,
          isValid: true,
          isRegistered: false,
          homeAffairsData: {
            idNumber: idNumber,
            firstName: data.personalInfo?.firstName || data.firstName,
            lastName: data.personalInfo?.lastName || data.lastName,
            dateOfBirth: data.personalInfo?.dateOfBirth || data.dateOfBirth,
            gender: data.personalInfo?.gender || data.gender,
            citizenship: data.personalInfo?.nationality || 'South African',
            isValid: data.kycStatus === 'Verified' || data.status === 'Active',
            isAlive: true,
            maritalStatus: data.personalInfo?.maritalStatus || 'Unknown'
          },
          extractedInfo: extractIdInfo(idNumber)
        },
        message: 'ID verification successful via your API',
        source: 'cash-dnr-api',
        endpoint: citizenEndpoint
      };
    } else if (response.status === 404) {
      // ID not found in your database
      const errorText = await response.text();
      return {
        success: false,
        data: null,
        message: 'ID number not found in Home Affairs database',
        error: errorText,
        source: 'cash-dnr-api'
      };
    } else if (response.status === 429) {
      // Rate limited
      return {
        success: false,
        data: null,
        message: 'Rate limited by Home Affairs API. Please try again later.',
        error: 'Rate limit exceeded',
        source: 'cash-dnr-api'
      };
    } else {
      // Other error
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

  } catch (error) {
    console.error('🚨 Home Affairs API Error:', error);
    return {
      success: false,
      data: null,
      message: 'Failed to connect to Home Affairs API',
      error: error.message,
      source: 'cash-dnr-api-error'
    };
  }
}

/**
 * Main function to verify ID with Home Affairs
 * @param {string} idNumber - South African ID number
 * @returns {Promise<object>} - Verification result
 */
async function verifyIdWithHomeAffairs(idNumber) {
  try {
    // Input validation
    if (!idNumber || typeof idNumber !== 'string') {
      return {
        success: false,
        message: 'ID number is required',
        data: null
      };
    }

    const cleanId = idNumber.replace(/[\s-]/g, '');

    // Basic length and numeric validation
    if (!/^\d{13}$/.test(cleanId)) {
      return {
        success: false,
        message: 'Invalid South African ID number format',
        data: null,
        validationDetails: {
          formatValid: false,
          length: cleanId.length,
          expected: 13
        }
      };
    }

    // Extract basic info from ID
    const extractedInfo = extractIdInfo(cleanId);

    // Use mock or real API based on environment
    const useMockMode = process.env.HOME_AFFAIRS_MOCK_MODE === 'true';
    
    let apiResponse;
    if (useMockMode) {
      console.log('🔍 Using Home Affairs Mock API for ID verification');
      // For mock mode, validate checksum
      if (!validateSAIDFormat(cleanId)) {
        return {
          success: false,
          message: 'Invalid South African ID number format',
          data: null,
          validationDetails: {
            formatValid: false,
            length: cleanId.length,
            expected: 13
          }
        };
      }
      apiResponse = await mockHomeAffairsAPI(cleanId);
    } else {
      console.log('🔍 Using Real Home Affairs API for ID verification');
      // For real API, skip checksum validation and let your API decide
      apiResponse = await realHomeAffairsAPI(cleanId);
      
      // If real API fails, fallback to mock for development
      if (!apiResponse.success && process.env.NODE_ENV === 'development') {
        console.log('⚠️ Real API failed, falling back to mock data for development');
        // Validate checksum for mock fallback
        if (validateSAIDFormat(cleanId)) {
          apiResponse = await mockHomeAffairsAPI(cleanId);
          apiResponse.fallbackUsed = true;
        } else {
          // Even fallback fails due to invalid checksum
          return {
            success: false,
            message: 'ID number not found in Home Affairs database',
            data: null,
            validationDetails: {
              formatValid: false,
              length: cleanId.length,
              expected: 13,
              note: 'Invalid checksum for mock fallback'
            },
            fallbackUsed: true
          };
        }
      }
    }

    return {
      ...apiResponse,
      extractedInfo,
      validationDetails: {
        formatValid: true,
        length: cleanId.length,
        expected: 13
      }
    };

  } catch (error) {
    console.error('Home Affairs verification error:', error);
    return {
      success: false,
      message: 'Internal error during ID verification',
      data: null,
      error: error.message
    };
  }
}

/**
 * Validates if registration data matches Home Affairs records
 * @param {object} registrationData - User registration data
 * @param {object} homeAffairsData - Data from Home Affairs API
 * @returns {object} - Validation result
 */
function validateRegistrationMatch(registrationData, homeAffairsData) {
  const errors = [];
  
  if (!homeAffairsData || !homeAffairsData.isValid) {
    errors.push('ID number is not valid in Home Affairs database');
  }

  if (homeAffairsData && !homeAffairsData.isAlive) {
    errors.push('Cannot register with an ID number of a deceased person');
  }

  // Name matching (case insensitive, allowing for minor variations)
  if (homeAffairsData) {
    const normalizeString = (str) => str.toLowerCase().trim().replace(/[^a-z]/g, '');
    
    const providedFirstName = normalizeString(registrationData.firstName);
    const providedLastName = normalizeString(registrationData.lastName);
    const officialFirstName = normalizeString(homeAffairsData.firstName || '');
    const officialLastName = normalizeString(homeAffairsData.lastName || '');

    if (providedFirstName !== officialFirstName) {
      errors.push(`First name '${registrationData.firstName}' does not match Home Affairs record '${homeAffairsData.firstName}'`);
    }

    if (providedLastName !== officialLastName) {
      errors.push(`Last name '${registrationData.lastName}' does not match Home Affairs record '${homeAffairsData.lastName}'`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    homeAffairsData
  };
}

export default {
  verifyIdWithHomeAffairs,
  validateRegistrationMatch,
  validateSAIDFormat,
  extractIdInfo,
  registerWithHomeAffairsAPI
};

// Export individual functions as well
export { verifyIdWithHomeAffairs, validateRegistrationMatch, validateSAIDFormat, extractIdInfo, registerWithHomeAffairsAPI };
