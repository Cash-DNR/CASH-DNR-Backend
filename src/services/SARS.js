/* eslint-disable linebreak-style */
import logger from './logger.js';
import fetch from 'node-fetch';

/**
 * SARS Tax Service
 * Provides tax verification and compliance checking using the SARS API
 */

// Base URL for SARS API
const DEFAULT_SARS_API_URL = 'https://cash-dnr-api.onrender.com/sars';

// Valid tax compliance statuses
const COMPLIANCE_STATUSES = {
  COMPLIANT: 'Compliant',
  NON_COMPLIANT: 'Non-compliant',
  PENDING: 'Pending',
  UNKNOWN: 'Unknown'
};

// Tax return types with metadata
const TAX_RETURN_TYPES = {
  VAT: {
    code: 'VAT',
    name: 'Value Added Tax',
    periods: ['Q1', 'Q2', 'Q3', 'Q4'],
    periodType: 'quarter'
  },
  PAYE: {
    code: 'PAYE',
    name: 'Pay As You Earn',
    periods: Array.from({length: 12}, (_, i) => (i + 1).toString().padStart(2, '0')),
    periodType: 'month'
  },
  ITR: {
    code: 'ITR',
    name: 'Individual Tax Return',
    periods: ['annual'],
    periodType: 'year'
  },
  PIT: {
    code: 'PIT',
    name: 'Personal Income Tax',
    periods: ['annual'],
    periodType: 'year'
  }
};

/**
 * Verify taxpayer status with SARS
 * @param {string} idNumber - South African ID number
 * @returns {Promise<object>} - Verification result
 */
export async function verifyWithSARS(idNumber) {
  const apiUrl = process.env.SARS_API_URL || DEFAULT_SARS_API_URL;
  
  try {
    logger.info(`🔍 Verifying tax status for ID: ${idNumber}`);
    const response = await fetch(`${apiUrl}/taxpayers/${idNumber}/verification`);
    const data = await response.json();

    if (!response.ok) {
      logger.error(`❌ SARS API error: ${data.error || response.statusText}`);
      return {
        success: false,
        error: data.error || 'Failed to verify with SARS',
        code: data.code || 'VERIFICATION_FAILED',
        timestamp: new Date().toISOString(),
        service: 'sars'
      };
    }

    logger.info(`✅ Tax verification successful for ID: ${idNumber}`);
    return {
      success: true,
      idNumber: data.idNumber,
      isTaxRegistered: data.isTaxRegistered,
      taxNumber: data.taxNumber,
      verificationTimestamp: data.verificationTimestamp,
      validationSource: data.validationSource,
      complianceDetails: data.complianceDetails
    };

  } catch (error) {
    logger.error('🚨 SARS Verification Error:', error);
    return {
      success: false,
      error: 'Failed to connect to SARS API',
      code: 'API_CONNECTION_ERROR',
      timestamp: new Date().toISOString(),
      service: 'sars'
    };
  }
}

/**
 * Validates tax compliance status and issues
 * @param {object} complianceDetails - Compliance details from SARS
 * @returns {object} - Validation result
 */
export function validateTaxCompliance(complianceDetails) {
  if (!complianceDetails) {
    return {
      isCompliant: false,
      status: COMPLIANCE_STATUSES.UNKNOWN,
      issues: ['No compliance information available']
    };
  }

  return {
    isCompliant: complianceDetails.status === COMPLIANCE_STATUSES.COMPLIANT,
    status: complianceDetails.status,
    issues: complianceDetails.complianceIssues || [],
    lastVerified: complianceDetails.lastVerified,
    outstandingReturns: complianceDetails.outstandingReturns || {},
    nextFilingDue: complianceDetails.nextFilingDue || {},
    lastSubmissions: complianceDetails.lastSubmissions || {}
  };
}

/**
 * Middleware to check SARS compliance
 */
export async function sarsComplianceChecker(req, res, next) {
  const { idNumber } = req.body;

  if (!idNumber) {
    logger.warn('❌ SARS compliance check attempted without ID number');
    return res.status(400).json({
      success: false,
      error: 'ID number is required for SARS compliance check',
      code: 'MISSING_ID_NUMBER',
      timestamp: new Date().toISOString(),
      service: 'sars'
    });
  }

  try {
    const sarsResponse = await verifyWithSARS(idNumber);

    if (!sarsResponse.success) {
      logger.warn(`⚠️ SARS verification failed for ID: ${idNumber}`);
      return res.status(400).json(sarsResponse);
    }

    // Validate compliance
    const complianceValidation = validateTaxCompliance(sarsResponse.complianceDetails);
    
    // Attach both SARS data and compliance validation to request object
    req.sarsData = {
      ...sarsResponse,
      compliance: complianceValidation
    };

    logger.info(`✅ SARS compliance check completed for ID: ${idNumber}`);
    next();
  } catch (error) {
    logger.error('🚨 SARS Middleware Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during SARS compliance check',
      code: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString(),
      service: 'sars'
    });
  }
}

/**
 * Generate a tax number for a new taxpayer
 * @param {string} idNumber - South African ID number
 * @returns {string} - Generated tax number
 */
export function generateTaxNumber(idNumber) {
  // Tax number format: T + last 9 digits of ID + checksum digit
  const baseNumber = idNumber.slice(-9);
  const prefix = 'T';
  
  // Calculate checksum (simple implementation)
  let sum = 0;
  for (let i = 0; i < baseNumber.length; i++) {
    sum += parseInt(baseNumber[i]) * (i + 1);
  }
  const checksum = (sum % 9).toString();
  
  return `${prefix}${baseNumber}${checksum}`;
}

// Export constants and functions
export {
  COMPLIANCE_STATUSES,
  TAX_RETURN_TYPES
};

