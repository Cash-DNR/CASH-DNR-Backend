/* eslint-disable linebreak-style */
/**
 * SARS API Service (Enhanced)
 * Checks if a user has a registered tax number and compliance status
 * Includes mock data for testing purposes
 */

// Unified mock data structure for SARS
const mockSarsData = [
  {
    idNumber: '9001015009086', // John Doe
    taxReferenceNumber: '1234567890',
    taxComplianceStatus: 'Compliant',
    lastSubmissionDate: '2025-08-15',
    outstandingReturns: [],
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1990-01-01',
    gender: 'Male',
    citizenship: 'South African',
    maritalStatus: 'Single'
  },
  {
    idNumber: '8505152240084', // Jane Smith
    taxReferenceNumber: '9876543210',
    taxComplianceStatus: 'Non-compliant',
    lastSubmissionDate: '2025-06-30',
    outstandingReturns: ['VAT2024Q2', 'PAYE2025M07'],
    firstName: 'Jane',
    lastName: 'Smith',
    dateOfBirth: '1985-05-15',
    gender: 'Female',
    citizenship: 'South African',
    maritalStatus: 'Married'
  },
  {
    idNumber: '9206301234567', // Michael Johnson
    taxReferenceNumber: null, // Not registered yet
    taxComplianceStatus: null,
    lastSubmissionDate: null,
    outstandingReturns: [],
    firstName: 'Michael',
    lastName: 'Johnson',
    dateOfBirth: '1992-06-30',
    gender: 'Male',
    citizenship: 'South African',
    maritalStatus: 'Single'
  }
];

/**
 * Simulates API call to SARS
 * @param {string} idNumber - South African ID number
 * @param {boolean} consentToRegister - User consent for tax number registration
 * @returns {Promise<object>} - API response
 */
async function mockSarsAPI(idNumber, consentToRegister = false) {
  await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 300)); // Simulate delay

  const record = mockSarsData.find(r => r.idNumber === idNumber);

  if (record) {
    if (record.taxReferenceNumber) {
      return {
        success: true,
        message: 'Taxpayer found',
        data: {
          idNumber,
          taxReferenceNumber: record.taxReferenceNumber,
          taxComplianceStatus: record.taxComplianceStatus,
          lastSubmissionDate: record.lastSubmissionDate,
          outstandingReturns: record.outstandingReturns
        }
      };
    } else if (consentToRegister) {
      // Generate a new tax reference number
      const newTaxReferenceNumber = `TRN${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      record.taxReferenceNumber = newTaxReferenceNumber;
      record.taxComplianceStatus = 'Compliant';
      record.lastSubmissionDate = new Date().toISOString().split('T')[0];
      return {
        success: true,
        message: 'Tax number generated successfully',
        data: {
          idNumber,
          taxReferenceNumber: newTaxReferenceNumber,
          taxComplianceStatus: 'Compliant',
          lastSubmissionDate: record.lastSubmissionDate,
          outstandingReturns: []
        }
      };
    } else {
      return {
        success: false,
        message: 'User has no tax number registered',
        data: {
          idNumber,
          taxReferenceNumber: null
        },
        needsRegistration: true
      };
    }
  }

  return {
    success: false,
    message: 'ID number not found in SARS database',
    data: null
  };
}

/**
 * Main function to verify user with SARS
 * @param {string} idNumber
 * @returns {Promise<object>}
 */
async function verifyWithSARS(idNumber, consentToRegister) {
  try {
    const useMockMode = process.env.SARS_MOCK_MODE === 'true';
    let apiResponse;

    if (useMockMode) {
      console.log('🔍 Using SARS Mock API for verification');
      apiResponse = await mockSarsAPI(idNumber, consentToRegister);
    } else {
      // TODO: Replace with real SARS API integration when available
      console.log('⚠️ Real SARS API integration not implemented, using mock fallback');
      apiResponse = await mockSarsAPI(idNumber, consentToRegister);
      apiResponse.fallbackUsed = true;
    }

    return apiResponse;
  } catch (error) {
    console.error('🚨 SARS API Error:', error);
    return {
      success: false,
      message: 'Internal error during SARS verification',
      error: error.message
    };
  }
}

/**
 * Middleware to check SARS compliance
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
export async function sarsComplianceChecker(req, res, next) {
  const { idNumber, consentToRegister } = req.body;

  if (!idNumber) {
    return res.status(400).json({
      success: false,
      message: 'ID number is required for SARS compliance check'
    });
  }

  try {
    const sarsResponse = await verifyWithSARS(idNumber, consentToRegister);

    if (!sarsResponse.success) {
      if (sarsResponse.needsRegistration) {
        return res.status(400).json({
          success: false,
          message: sarsResponse.message,
          data: sarsResponse.data,
          needsRegistration: true
        });
      }

      return res.status(400).json({
        success: false,
        message: sarsResponse.message,
        data: sarsResponse.data
      });
    }

    req.sarsData = sarsResponse.data; // Attach SARS data to request object
    next();
  } catch (error) {
    console.error('🚨 SARS Middleware Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during SARS compliance check'
    });
  }
}

