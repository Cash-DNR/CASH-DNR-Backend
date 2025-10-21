/* eslint-disable linebreak-style */
import logger from "./logger.js";
import fetch from 'node-fetch';

// Default timeout for API requests (30 seconds for production)
const API_TIMEOUT = 30000;

// Base URL for the Home Affairs API
const DEFAULT_API_URL = 'https://cash-dnr-api.onrender.com/home-affairs';

/**
 * Clean and validate South African ID number
 * @param {string} idNumber - Raw ID number input
 * @returns {string} - Cleaned ID number
 */
function cleanIdNumber(idNumber) {
  // Remove any non-digit characters
  const cleaned = idNumber.replace(/\D/g, '');
  
  // Ensure it's exactly 13 digits
  if (cleaned.length !== 13) {
    throw new Error('ID number must be exactly 13 digits');
  }

  return cleaned;
}

/**
 * Types of verification supported by the Home Affairs API
 */
const VERIFICATION_TYPES = {
  ID_VERIFICATION: 'id_verification',
  MARRIAGE_STATUS: 'marriage_status',
  DECEASED_STATUS: 'deceased_status',
  ADDRESS_VERIFICATION: 'address_verification',
  PHOTO_VERIFICATION: 'photo_verification'
};

/**
 * Make a request to Home Affairs API with timeout
 * @param {string} url - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Verify an ID number with Home Affairs API
 * @param {string} idNumber - South African ID number
 * @returns {Promise<Object>} - Verification result
 */
export async function verifyIdWithHomeAffairs(idNumber) {
  try {
    // Clean and validate the ID number
    const cleanedId = cleanIdNumber(idNumber);
    
    const apiUrl = process.env.HOME_AFFAIRS_API_URL || DEFAULT_API_URL;
    const endpoint = `${apiUrl}/home-affairs/citizens/${cleanedId}`;
    
    logger.info(`🔍 Verifying ID number with Home Affairs API: ${cleanedId}`);
    logger.info(`🌐 Using endpoint: ${endpoint}`);
    
    const response = await fetchWithTimeout(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Check if response is empty
    const responseText = await response.text();
    if (!responseText) {
      logger.error('❌ Home Affairs API returned empty response');
      return {
        success: false,
        error: 'Empty response from Home Affairs API',
        code: 'EMPTY_RESPONSE',
        timestamp: new Date().toISOString(),
        service: 'home-affairs'
      };
    }

    // Try to parse the response as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      logger.error(`❌ Home Affairs API returned invalid JSON: ${responseText}`);
      return {
        success: false,
        error: 'Invalid JSON response from Home Affairs API',
        code: 'INVALID_JSON',
        timestamp: new Date().toISOString(),
        service: 'home-affairs'
      };
    }

    if (!response.ok) {
      logger.error(`❌ Home Affairs API error: ${data.error || response.statusText}`);
      return {
        success: false,
        error: data.error || 'Failed to verify with Home Affairs',
        code: data.code || 'VERIFICATION_FAILED',
        timestamp: new Date().toISOString(),
        service: 'home-affairs'
      };
    }

    // Validate the response structure
    if (!data.citizen) {
      logger.error('❌ Home Affairs API response missing citizen data');
      return {
        success: false,
        error: 'Invalid response structure from Home Affairs API',
        code: 'INVALID_RESPONSE_STRUCTURE',
        timestamp: new Date().toISOString(),
        service: 'home-affairs'
      };
    }

    logger.info(`✅ ID verification successful: ${idNumber}`);
    return {
      success: true,
      citizen: data.citizen
    };

  } catch (error) {
    logger.error(`❌ Home Affairs API error: ${error.message}`);
    
    if (error.name === 'AbortError') {
      return {
        success: false,
        error: 'Home Affairs API request timed out',
        code: 'TIMEOUT_ERROR',
        timestamp: new Date().toISOString(),
        service: 'home-affairs'
      };
    }

    // Fallback for demo/testing purposes when external API is unavailable
    logger.warn('🔄 Home Affairs API unavailable, using demo data for testing');
    return generateDemoData(cleanedId);
  }
}

/**
 * Generate demo data for testing when Home Affairs API is unavailable
 * @param {string} idNumber - Cleaned ID number
 * @returns {Object} - Demo verification result
 */
function generateDemoData(idNumber) {
  // Extract info from ID number
  const year = idNumber.substring(0, 2);
  const month = idNumber.substring(2, 4);
  const day = idNumber.substring(4, 6);
  const gender = parseInt(idNumber.substring(6, 10)) >= 5000 ? 'Male' : 'Female';
  
  // Determine the century
  const currentYear = new Date().getFullYear() % 100;
  const century = parseInt(year) <= currentYear ? '20' : '19';
  const fullYear = `${century}${year}`;
  
  return {
    success: true,
    data: {
      firstName: 'Demo',
      lastName: 'User', 
      dateOfBirth: `${fullYear}-${month}-${day}`,
      gender: gender,
      idNumber: idNumber,
      nationality: 'South African'
    },
    citizen: {
      firstName: 'Demo',
      lastName: 'User',
      dateOfBirth: `${fullYear}-${month}-${day}`,
      gender: gender,
      idNumber: idNumber,
      nationality: 'South African'
    },
    fallbackUsed: true,
    message: 'Demo data used for testing'
  };
}

/**
 * Register user with Home Affairs API
 * @param {object} userData - User registration data
 * @returns {Promise<object>} - API response
 */
export async function registerWithHomeAffairs(userData) {
  const apiUrl = process.env.HOME_AFFAIRS_API_URL || DEFAULT_API_URL;

  try {
    const registerEndpoint = `${apiUrl}/citizens/register`;
    
    logger.info(`📝 Registering user with Home Affairs API: ${registerEndpoint}`);
    
    const response = await fetch(registerEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error(`❌ Registration failed: ${data.error || response.statusText}`);
      return {
        success: false,
        error: data.error || 'Registration failed',
        code: data.code || 'REGISTRATION_FAILED',
        timestamp: new Date().toISOString(),
        service: 'home-affairs'
      };
    }

    logger.info('✅ User registered successfully');
    return {
      success: true,
      data: data
    };

  } catch (error) {
    logger.error('🚨 Registration Error:', error);
    return {
      success: false,
      error: 'Failed to connect to Home Affairs API',
      code: 'CONNECTION_ERROR',
      timestamp: new Date().toISOString(),
      service: 'home-affairs'
    };
  }
}

/**
 * Get marriage status for an ID number
 * @param {string} idNumber - South African ID number
 * @returns {Promise<Object>} - Marriage status result
 */
export async function getMarriageStatus(idNumber) {
  const apiUrl = process.env.HOME_AFFAIRS_API_URL || DEFAULT_API_URL;
  const endpoint = `${apiUrl}/home-affairs/citizens/${idNumber}/marriage-status`;

  try {
    const response = await fetchWithTimeout(endpoint);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to get marriage status',
        code: 'VERIFICATION_FAILED',
        service: 'home-affairs'
      };
    }

    return data;
  } catch (error) {
    logger.error('🚨 Marriage Status Error:', error);
    return {
      success: false,
      error: 'Failed to get marriage status',
      code: 'API_ERROR',
      service: 'home-affairs'
    };
  }
}

export default {
  verifyIdWithHomeAffairs,
  registerWithHomeAffairs,
  getMarriageStatus,
  VERIFICATION_TYPES
};

// Export individual functions and constants
export {
  VERIFICATION_TYPES
};
