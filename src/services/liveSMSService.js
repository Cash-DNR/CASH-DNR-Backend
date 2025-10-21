/**
 * Live SMS Service Implementation
 * Supports multiple SMS providers: Twilio, AWS SNS, Vonage
 */

import twilio from 'twilio';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class LiveSMSService {
  constructor() {
    this.provider = process.env.SMS_PROVIDER || 'twilio';
    this.mockMode = process.env.SMS_MOCK_MODE === 'true';
    
    if (!this.mockMode) {
      this.initializeProvider();
    }
    
    console.log(`📱 SMS Service initialized: ${this.provider} (Mock mode: ${this.mockMode})`);
  }

  initializeProvider() {
    switch (this.provider.toLowerCase()) {
      case 'twilio':
        this.initializeTwilio();
        break;
      case 'aws':
        this.initializeAWS();
        break;
      case 'vonage':
        this.initializeVonage();
        break;
      case 'console':
        this.initializeConsole();
        break;
      default:
        throw new Error(`Unsupported SMS provider: ${this.provider}`);
    }
  }

  initializeTwilio() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !this.twilioPhoneNumber) {
      throw new Error('Missing Twilio credentials. Please check TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in .env');
    }

    this.twilioClient = twilio(accountSid, authToken);
    console.log(`✅ Twilio initialized with phone: ${this.twilioPhoneNumber}`);
  }

  initializeAWS() {
    // TODO: Implement AWS SNS initialization
    throw new Error('AWS SNS SMS service not yet implemented');
  }

  initializeVonage() {
    // TODO: Implement Vonage initialization
    throw new Error('Vonage SMS service not yet implemented');
  }

  initializeConsole() {
    console.log(`✅ Console SMS provider initialized - OTPs will be displayed in console`);
  }

  /**
   * Send SMS message
   * @param {string} phoneNumber - Recipient phone number (e.g., "+27682606328")
   * @param {string} message - SMS message content
   * @returns {Promise<Object>} - SMS delivery result
   */
  async sendSMS(phoneNumber, message) {
    console.log(`📱 Attempting to send SMS to ${phoneNumber}`);
    console.log(`📝 Message: ${message}`);

    if (this.mockMode) {
      return this.sendMockSMS(phoneNumber, message);
    }

    try {
      switch (this.provider.toLowerCase()) {
        case 'twilio':
          return await this.sendTwilioSMS(phoneNumber, message);
        case 'aws':
          return await this.sendAWSSMS(phoneNumber, message);
        case 'vonage':
          return await this.sendVonageSMS(phoneNumber, message);
        case 'console':
          return this.sendConsoleSMS(phoneNumber, message);
        default:
          throw new Error(`Unsupported SMS provider: ${this.provider}`);
      }
    } catch (error) {
      console.error(`❌ SMS sending failed:`, error.message);
      throw error;
    }
  }

  async sendTwilioSMS(phoneNumber, message) {
    try {
      // Format phone number for Twilio (must include country code)
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      
      const twilioMessage = await this.twilioClient.messages.create({
        body: message,
        from: this.twilioPhoneNumber,
        to: formattedNumber
      });

      console.log(`✅ SMS sent successfully via Twilio`);
      console.log(`📱 SID: ${twilioMessage.sid}`);
      console.log(`📊 Status: ${twilioMessage.status}`);

      return {
        success: true,
        provider: 'twilio',
        messageId: twilioMessage.sid,
        status: twilioMessage.status,
        to: formattedNumber,
        sentAt: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ Twilio SMS failed:`, error.message);
      throw new Error(`Twilio SMS delivery failed: ${error.message}`);
    }
  }

  async sendAWSSMS(phoneNumber, message) {
    // TODO: Implement AWS SNS SMS sending
    throw new Error('AWS SNS SMS service not yet implemented');
  }

  async sendVonageSMS(phoneNumber, message) {
    // TODO: Implement Vonage SMS sending
    throw new Error('Vonage SMS service not yet implemented');
  }

  sendConsoleSMS(phoneNumber, message) {
    const formattedNumber = this.formatPhoneNumber(phoneNumber);
    const timestamp = new Date().toISOString();
    
    // Enhanced console display for OTP
    console.log('\n' + '='.repeat(80));
    console.log('🔐 CONSOLE SMS SERVICE - OTP GENERATED');
    console.log('='.repeat(80));
    console.log(`📱 Phone Number: ${formattedNumber}`);
    console.log(`⏰ Timestamp: ${timestamp}`);
    console.log(`📝 Message: ${message}`);
    
    // Extract OTP from message (assuming it's in the format "Your ... code is: 123456")
    const otpMatch = message.match(/code is: (\d+)/);
    if (otpMatch) {
      console.log('\n🎯 === USE THIS OTP FOR LOGIN ===');
      console.log(`🔢 OTP CODE: ${otpMatch[1]}`);
      console.log('🎯 ==============================');
    }
    
    console.log('='.repeat(80));
    console.log('💡 Copy the OTP code above to complete your login\n');
    
    return {
      success: true,
      provider: 'console',
      messageId: `console_${Date.now()}`,
      status: 'delivered',
      to: formattedNumber,
      sentAt: timestamp,
      displayedInConsole: true,
      note: 'OTP displayed in server console for development'
    };
  }

  sendMockSMS(phoneNumber, message) {
    console.log(`🔧 MOCK SMS MODE - No actual SMS sent`);
    console.log(`📱 Would send to: ${phoneNumber}`);
    console.log(`📝 Message: ${message}`);
    
    return {
      success: true,
      provider: 'mock',
      messageId: `mock_${Date.now()}`,
      status: 'delivered',
      to: phoneNumber,
      sentAt: new Date().toISOString(),
      note: 'This is a mock SMS - no actual message was sent'
    };
  }

  /**
   * Format phone number for SMS providers
   * Converts local format (0682606328) to international (+27682606328)
   */
  formatPhoneNumber(phoneNumber) {
    // Remove any spaces, dashes, or other formatting
    let cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // If it starts with 0, replace with +27 (South Africa)
    if (cleaned.startsWith('0')) {
      cleaned = '+27' + cleaned.substring(1);
    }
    
    // If it doesn't start with +, assume it needs +27
    if (!cleaned.startsWith('+')) {
      cleaned = '+27' + cleaned;
    }
    
    console.log(`📱 Phone number formatted: ${phoneNumber} → ${cleaned}`);
    return cleaned;
  }

  /**
   * Generate OTP code
   */
  generateOTP(length = 6) {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * digits.length)];
    }
    return otp;
  }

  /**
   * Create OTP message template
   */
  createOTPMessage(otp, appName = 'CASH-DNR') {
    return `Your ${appName} verification code is: ${otp}. This code expires in 10 minutes. Do not share this code with anyone.`;
  }

  /**
   * Send OTP via SMS
   */
  async sendOTP(phoneNumber, appName = 'CASH-DNR') {
    const otp = this.generateOTP();
    const message = this.createOTPMessage(otp, appName);
    
    try {
      const result = await this.sendSMS(phoneNumber, message);
      
      return {
        ...result,
        otp, // Include OTP for verification (remove in production)
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
      };
    } catch (error) {
      throw new Error(`Failed to send OTP: ${error.message}`);
    }
  }

  /**
   * Test SMS service configuration
   */
  async testConfiguration() {
    console.log('🧪 Testing SMS service configuration...');
    console.log(`📱 Provider: ${this.provider}`);
    console.log(`🔧 Mock mode: ${this.mockMode}`);
    
    if (this.mockMode) {
      console.log('✅ Mock mode - configuration valid');
      return { success: true, mode: 'mock' };
    }

    try {
      switch (this.provider.toLowerCase()) {
        case 'twilio':
          // Test Twilio credentials by fetching account info
          const account = await this.twilioClient.api.v2010.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
          console.log(`✅ Twilio connection successful`);
          console.log(`📋 Account: ${account.friendlyName}`);
          console.log(`📊 Status: ${account.status}`);
          return { 
            success: true, 
            provider: 'twilio',
            account: account.friendlyName,
            status: account.status
          };
        case 'console':
          console.log('✅ Console SMS provider ready - OTPs will be displayed in server console');
          return {
            success: true,
            provider: 'console',
            mode: 'development',
            note: 'OTP codes will be displayed in server console for easy testing'
          };
        default:
          throw new Error(`Configuration test not implemented for ${this.provider}`);
      }
    } catch (error) {
      console.error(`❌ Configuration test failed:`, error.message);
      throw error;
    }
  }
}

// Export singleton instance
const liveSMSService = new LiveSMSService();
export default liveSMSService;
export { LiveSMSService };
