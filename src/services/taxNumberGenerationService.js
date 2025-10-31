/**
 * Tax Number Generation Service
 * Handles automatic tax number generation for Phase 1 registration
 * Integrates with SARS for validation and registration
 */

import logger from './logger.js';

class TaxNumberGenerationService {
  /**
   * Generate a South African tax number
   * Format: 9 digits + 1 check digit = 10 digits total
   * Based on SARS tax number format
   */
  static generateTaxNumber() {
    // Generate 9 random digits
    let taxNumber = '';
    for (let i = 0; i < 9; i++) {
      taxNumber += Math.floor(Math.random() * 10).toString();
    }

    // Calculate check digit using Luhn algorithm
    const checkDigit = this.calculateCheckDigit(taxNumber);

    return taxNumber + checkDigit.toString();
  }

  /**
   * Calculate check digit using modified Luhn algorithm
   * @param {string} baseNumber - 9-digit base number
   * @returns {number} Check digit (0-9)
   */
  static calculateCheckDigit(baseNumber) {
    let sum = 0;
    let alternate = false;

    // Process digits from right to left
    for (let i = baseNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(baseNumber.charAt(i));

      if (alternate) {
        digit *= 2;
        if (digit > 9) {
          digit = Math.floor(digit / 10) + (digit % 10);
        }
      }

      sum += digit;
      alternate = !alternate;
    }

    return (10 - (sum % 10)) % 10;
  }

  /**
   * Validate South African tax number format
   * @param {string} taxNumber - Tax number to validate
   * @returns {boolean} True if valid format
   */
  static validateTaxNumber(taxNumber) {
    // Must be exactly 10 digits
    if (!/^\d{10}$/.test(taxNumber)) {
      return false;
    }

    // Validate check digit
    const baseNumber = taxNumber.substring(0, 9);
    const providedCheckDigit = parseInt(taxNumber.charAt(9));
    const calculatedCheckDigit = this.calculateCheckDigit(baseNumber);

    return providedCheckDigit === calculatedCheckDigit;
  }

  /**
   * Generate tax number for new user registration
   * @param {Object} userDetails - User registration details
   * @returns {Promise<Object>} Generated tax number and registration status
   */
  static async generateForUser(userDetails) {
    try {
      const { id_number, first_name, last_name, date_of_birth } = userDetails;

      logger.info(`Generating tax number for user: ${first_name} ${last_name}`);

      // Check if user already has a tax number in SARS database
      const existingTaxNumber = await this.checkExistingTaxNumber(id_number);

      if (existingTaxNumber) {
        logger.info(`Found existing tax number for ID: ${id_number}`);
        return {
          success: true,
          taxNumber: existingTaxNumber,
          isExisting: true,
          message: 'Retrieved existing tax number from SARS database'
        };
      }

      // Generate new tax number
      let attempts = 0;
      let taxNumber;
      let isUnique = false;

      while (!isUnique && attempts < 10) {
        taxNumber = this.generateTaxNumber();

        // Check if number is unique (both in our DB and SARS)
        isUnique = await this.checkTaxNumberUniqueness(taxNumber);
        attempts++;
      }

      if (!isUnique) {
        throw new Error('Unable to generate unique tax number after 10 attempts');
      }

      // Register with SARS (simulated for now)
      const sarsRegistration = await this.registerWithSARS({
        taxNumber,
        idNumber: id_number,
        firstName: first_name,
        lastName: last_name,
        dateOfBirth: date_of_birth
      });

      if (!sarsRegistration.success) {
        throw new Error(`SARS registration failed: ${sarsRegistration.error}`);
      }

      logger.info(`Successfully generated tax number: ${taxNumber} for user: ${first_name} ${last_name}`);

      return {
        success: true,
        taxNumber,
        isExisting: false,
        sarsReference: sarsRegistration.reference,
        message: 'New tax number generated and registered with SARS'
      };

    } catch (error) {
      logger.error('Tax number generation failed:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to generate tax number'
      };
    }
  }

  /**
   * Check if user already has a tax number in SARS database
   * @param {string} idNumber - South African ID number
   * @returns {Promise<string|null>} Existing tax number or null
   */
  static async checkExistingTaxNumber(idNumber) {
    try {
      // Simulate SARS API call
      // In production, this would call the actual SARS API
      logger.debug(`Checking existing tax number for ID: ${idNumber}`);

      // Simulated response - in production, replace with actual SARS API call
      const mockResponse = await this.mockSARSLookup(idNumber);

      return mockResponse.taxNumber || null;

    } catch (error) {
      logger.warn(`Error checking existing tax number for ID ${idNumber}:`, error);
      return null;
    }
  }

  /**
   * Check if generated tax number is unique
   * @param {string} taxNumber - Generated tax number
   * @returns {Promise<boolean>} True if unique
   */
  static async checkTaxNumberUniqueness(taxNumber) {
    try {
      // Check in local database
      const { User } = await import('../models/User.js');
      const existingUser = await User.findOne({
        where: { tax_number: taxNumber }
      });

      if (existingUser) {
        return false;
      }

      // Check with SARS database
      const sarsCheck = await this.checkWithSARS(taxNumber);
      return !sarsCheck.exists;

    } catch (error) {
      logger.warn(`Error checking tax number uniqueness: ${taxNumber}`, error);
      return false;
    }
  }

  /**
   * Register new tax number with SARS
   * @param {Object} registrationData - Tax registration details
   * @returns {Promise<Object>} Registration result
   */
  static async registerWithSARS(registrationData) {
    try {
      const { taxNumber, idNumber, firstName, lastName, dateOfBirth } = registrationData;

      logger.info(`Registering tax number ${taxNumber} with SARS for ID: ${idNumber}`);

      // Simulate SARS registration API call
      // In production, replace with actual SARS API integration
      const registrationResult = await this.mockSARSRegistration({
        taxNumber,
        idNumber,
        firstName,
        lastName,
        dateOfBirth
      });

      return registrationResult;

    } catch (error) {
      logger.error('SARS registration failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if tax number exists in SARS database
   * @param {string} taxNumber - Tax number to check
   * @returns {Promise<Object>} Check result
   */
  static async checkWithSARS(taxNumber) {
    try {
      // Simulate SARS check
      // In production, replace with actual SARS API call
      return await this.mockSARSCheck(taxNumber);

    } catch (error) {
      logger.warn(`Error checking with SARS for tax number: ${taxNumber}`, error);
      return { exists: false };
    }
  }

  /**
   * Get tax bracket information for user
   * @param {number} annualIncome - Annual income amount
   * @returns {Object} Tax bracket information
   */
  static getTaxBracket(annualIncome) {
    // South African tax brackets for 2024/2025 tax year
    const taxBrackets = [
      { min: 0, max: 237100, rate: 0.18, rebate: 0 },
      { min: 237101, max: 370500, rate: 0.26, rebate: 42678 },
      { min: 370501, max: 512800, rate: 0.31, rebate: 61910 },
      { min: 512801, max: 673000, rate: 0.36, rebate: 87626 },
      { min: 673001, max: 857900, rate: 0.39, rebate: 107734 },
      { min: 857901, max: 1817000, rate: 0.41, rebate: 124734 },
      { min: 1817001, max: Infinity, rate: 0.45, rebate: 197434 }
    ];

    const bracket = taxBrackets.find(b => annualIncome >= b.min && annualIncome <= b.max);

    if (!bracket) {
      return taxBrackets[0]; // Default to lowest bracket
    }

    return {
      ...bracket,
      estimatedTax: Math.max(0, (annualIncome * bracket.rate) - bracket.rebate)
    };
  }

  // Mock methods for development - replace with actual SARS API calls in production

  /**
   * Mock SARS lookup for existing tax numbers
   */
  static async mockSARSLookup(idNumber) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simulate some users already having tax numbers (10% chance)
    const hasExistingTaxNumber = Math.random() < 0.1;

    if (hasExistingTaxNumber) {
      return {
        taxNumber: this.generateTaxNumber(),
        status: 'active'
      };
    }

    return { taxNumber: null };
  }

  /**
   * Mock SARS registration
   */
  static async mockSARSRegistration(data) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate 95% success rate
    const success = Math.random() < 0.95;

    if (success) {
      return {
        success: true,
        reference: `SARS-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
        status: 'registered',
        message: 'Tax number successfully registered with SARS'
      };
    } else {
      return {
        success: false,
        error: 'SARS system temporarily unavailable'
      };
    }
  }

  /**
   * Mock SARS check
   */
  static async mockSARSCheck(taxNumber) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Simulate 1% chance of collision
    const exists = Math.random() < 0.01;

    return {
      exists,
      status: exists ? 'active' : 'not_found'
    };
  }

  /**
   * Update user income category for tax calculation
   * @param {string} userId - User ID
   * @param {string} incomeType - 'salary' or 'business'
   * @param {number} annualAmount - Annual income amount
   * @returns {Promise<Object>} Update result
   */
  static async updateIncomeCategory(userId, incomeType, annualAmount) {
    try {
      const { User } = await import('../models/User.js');

      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Calculate tax bracket
      const taxBracket = this.getTaxBracket(annualAmount);

      // Update user record (assuming we add income tracking fields)
      const updateData = {
        income_type: incomeType,
        annual_income: annualAmount,
        tax_bracket: taxBracket.rate,
        estimated_annual_tax: taxBracket.estimatedTax,
        updated_at: new Date()
      };

      await user.update(updateData);

      logger.info(`Updated income category for user ${userId}: ${incomeType}, R${annualAmount}`);

      return {
        success: true,
        taxBracket,
        message: 'Income category updated successfully'
      };

    } catch (error) {
      logger.error('Income category update failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default TaxNumberGenerationService;
