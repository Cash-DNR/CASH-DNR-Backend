/**
 * SMS Service for sending OTP messages
 * Supports multiple providers: Twilio, AWS SNS, Vonage (Nexmo)
 */

import twilio from 'twilio';
import logger from './logger.js';

class SMSService {
  constructor() {
    this.provider = process.env.SMS_PROVIDER || 'twilio'; // Default to Twilio
    this.initializeProvider();
  }

  initializeProvider() {
    switch (this.provider.toLowerCase()) {
      case 'twilio':
        this.initTwilio();
        break;
      case 'aws':
        this.initAWS();
        break;
      case 'vonage':
        this.initVonage();
        break;
      default:
        logger.warn(`Unknown SMS provider: ${this.provider}. Falling back to mock mode.`);
        this.provider = 'mock';
    }
  }

  initTwilio() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !this.fromNumber) {
      logger.warn('Twilio credentials not found. SMS service will use mock mode.');
      this.provider = 'mock';
      return;
    }

    try {
      this.twilioClient = twilio(accountSid, authToken);
      logger.info('✅ Twilio SMS service initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize Twilio:', error.message);
      this.provider = 'mock';
    }
  }

  initAWS() {
    // Placeholder for AWS SNS implementation
    logger.info('🚧 AWS SNS SMS service not implemented yet. Using mock mode.');
    this.provider = 'mock';
  }

  initVonage() {
    // Placeholder for Vonage implementation  
    logger.info('🚧 Vonage SMS service not implemented yet. Using mock mode.');
    this.provider = 'mock';
  }

  /**
   * Format phone number to international format
   * @param {string} phoneNumber - Phone number in various formats
   * @returns {string} - Formatted phone number
   */
  formatPhoneNumber(phoneNumber) {
    // Remove all non-digits
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Handle South African numbers
    if (cleaned.startsWith('27')) {
      // Already in international format
      return `+${cleaned}`;
    } else if (cleaned.startsWith('0')) {
      // Local South African format (0XX XXX XXXX)
      return `+27${cleaned.substring(1)}`;
    } else if (cleaned.length === 9) {
      // Missing country code and leading zero
      return `+27${cleaned}`;
    }
    
    // Default: assume it needs +27 prefix
    return `+27${cleaned}`;
  }

  /**
   * Send OTP via SMS using the configured provider
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} otp - OTP code to send
   * @returns {Promise<Object>} - Result of SMS sending
   */
  async sendOTP(phoneNumber, otp) {
    const formattedNumber = this.formatPhoneNumber(phoneNumber);
    const message = `Your CASH-DNR verification code is: ${otp}. Valid for 60 seconds. Do not share this code.`;

    try {
      switch (this.provider) {
        case 'twilio':
          return await this.sendViaTwilio(formattedNumber, message, otp);
        case 'aws':
          return await this.sendViaAWS(formattedNumber, message, otp);
        case 'vonage':
          return await this.sendViaVonage(formattedNumber, message, otp);
        case 'mock':
        default:
          return await this.sendViaMock(formattedNumber, message, otp);
      }
    } catch (error) {
      logger.error(`❌ SMS send failed via ${this.provider}:`, error.message);
      
      // Fallback to mock mode for development
      if (this.provider !== 'mock') {
        logger.info('🔄 Falling back to mock SMS mode');
        return await this.sendViaMock(formattedNumber, message, otp);
      }
      
      throw error;
    }
  }

  /**
   * Send SMS via Twilio
   */
  async sendViaTwilio(phoneNumber, message, otp) {
    try {
      const result = await this.twilioClient.messages.create({
        body: message,
        from: this.fromNumber,
        to: phoneNumber
      });

      logger.info(`✅ SMS sent via Twilio to ${phoneNumber.replace(/\d(?=\d{4})/g, '*')}`);
      
      return {
        success: true,
        provider: 'twilio',
        messageId: result.sid,
        status: result.status,
        phoneNumber: phoneNumber,
        message: 'OTP sent successfully via SMS'
      };
    } catch (error) {
      logger.error('❌ Twilio SMS failed:', error.message);
      throw new Error(`Failed to send SMS via Twilio: ${error.message}`);
    }
  }

  /**
   * Send SMS via AWS SNS (placeholder)
   */
  async sendViaAWS(phoneNumber, message, otp) {
    // TODO: Implement AWS SNS integration
    throw new Error('AWS SNS SMS service not implemented');
  }

  /**
   * Send SMS via Vonage (placeholder)
   */
  async sendViaVonage(phoneNumber, message, otp) {
    // TODO: Implement Vonage SMS integration
    throw new Error('Vonage SMS service not implemented');
  }

  /**
   * Mock SMS sending for development/testing
   */
  async sendViaMock(phoneNumber, message, otp) {
    logger.info(`📱 [MOCK SMS] Sending OTP ${otp} to ${phoneNumber}`);
    logger.info(`📱 [MOCK SMS] Message: ${message}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      provider: 'mock',
      messageId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'delivered',
      phoneNumber: phoneNumber,
      message: 'OTP sent successfully (mock mode)',
      otp: otp // Only include OTP in mock mode for testing
    };
  }

  /**
   * Validate SMS service configuration
   */
  validateConfiguration() {
    switch (this.provider) {
      case 'twilio':
        return !!(process.env.TWILIO_ACCOUNT_SID && 
                 process.env.TWILIO_AUTH_TOKEN && 
                 process.env.TWILIO_PHONE_NUMBER);
      case 'aws':
        return !!(process.env.AWS_ACCESS_KEY_ID && 
                 process.env.AWS_SECRET_ACCESS_KEY && 
                 process.env.AWS_REGION);
      case 'vonage':
        return !!(process.env.VONAGE_API_KEY && 
                 process.env.VONAGE_API_SECRET);
      case 'mock':
      default:
        return true; // Mock mode always works
    }
  }

  /**
   * Get current provider status
   */
  getStatus() {
    return {
      provider: this.provider,
      configured: this.validateConfiguration(),
      ready: this.provider === 'mock' || this.validateConfiguration()
    };
  }
}

// Create singleton instance
const smsService = new SMSService();

export default smsService;
