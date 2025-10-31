import Transaction from '../models/Transaction.js';
import TransactionLog from '../models/TransactionLog.js';
import logger from './logger.js';

class TaxTaggingService {
  // VAT rate in South Africa
  static VAT_RATE = 0.15;

  // Threshold amounts for different tax implications
  static THRESHOLDS = {
    SMALL_TRANSACTION: 1000,      // R1,000
    MEDIUM_TRANSACTION: 10000,    // R10,000
    LARGE_TRANSACTION: 100000,    // R100,000
    REPORTABLE_CASH: 24999,       // R24,999 - cash transactions above this require reporting
    SUSPICIOUS_AMOUNT: 500000     // R500,000 - flagged for review
  };

  // Business expense categories that are typically tax deductible
  static BUSINESS_EXPENSE_KEYWORDS = [
    'office', 'supplies', 'equipment', 'rent', 'utilities', 'fuel', 'travel',
    'meeting', 'conference', 'training', 'software', 'subscription', 'maintenance',
    'advertising', 'marketing', 'professional', 'legal', 'accounting', 'consultation'
  ];

  // Personal expense keywords
  static PERSONAL_EXPENSE_KEYWORDS = [
    'groceries', 'food', 'restaurant', 'entertainment', 'clothing', 'personal',
    'gift', 'donation', 'medical', 'pharmacy', 'hospital', 'school', 'education'
  ];

  // Exempt transaction keywords
  static EXEMPT_KEYWORDS = [
    'salary', 'wage', 'pension', 'grant', 'welfare', 'insurance', 'medical aid',
    'educational', 'charity', 'donation to registered npo'
  ];

  /**
   * Automatically classify transaction for tax purposes
   * @param {Object} transactionData - Transaction data
   * @returns {Object} Tax classification details
   */
  static async classifyTransaction(transactionData) {
    try {
      const {
        amount,
        purpose,
        transaction_type,
        receiver_info,
        user_id
      } = transactionData;

      const classification = {
        tax_classification: Transaction.TAX_CLASSIFICATION.REVIEW_REQUIRED,
        confidence_score: 0,
        reasoning: [],
        tax_implications: {},
        flags: [],
        suggested_category: null
      };

      // 1. Amount-based classification
      const amountAnalysis = this.analyzeAmount(parseFloat(amount));
      classification.tax_implications = { ...classification.tax_implications, ...amountAnalysis };

      // 2. Purpose-based classification
      const purposeAnalysis = this.analyzePurpose(purpose);
      classification.confidence_score += purposeAnalysis.confidence;
      classification.reasoning.push(...purposeAnalysis.reasoning);

      // 3. Receiver analysis
      const receiverAnalysis = this.analyzeReceiver(receiver_info);
      classification.confidence_score += receiverAnalysis.confidence;
      classification.reasoning.push(...receiverAnalysis.reasoning);

      // 4. Transaction type analysis
      const typeAnalysis = this.analyzeTransactionType(transaction_type, amount);
      classification.flags.push(...typeAnalysis.flags);

      // 5. Final classification decision
      const finalClassification = this.makeFinalClassification(
        classification.confidence_score,
        purposeAnalysis.suggested_category,
        amountAnalysis.risk_level,
        typeAnalysis.flags
      );

      classification.tax_classification = finalClassification.classification;
      classification.suggested_category = finalClassification.category;

      // 6. Calculate potential tax implications
      if (finalClassification.classification === Transaction.TAX_CLASSIFICATION.TAXABLE_BUSINESS) {
        classification.tax_implications.vat_amount = this.calculateVAT(amount);
        classification.tax_implications.is_vat_applicable = true;
      }

      logger.info(`Tax classification completed for transaction amount ${amount}: ${classification.tax_classification}`);

      return classification;
    } catch (error) {
      logger.error('Error in tax classification:', error);
      return {
        tax_classification: Transaction.TAX_CLASSIFICATION.REVIEW_REQUIRED,
        confidence_score: 0,
        reasoning: ['Error in automated classification'],
        tax_implications: {},
        flags: ['CLASSIFICATION_ERROR'],
        suggested_category: null
      };
    }
  }

  /**
   * Analyze transaction amount for tax implications
   */
  static analyzeAmount(amount) {
    const implications = {
      amount_category: '',
      risk_level: 'low',
      reporting_required: false,
      vat_inclusive_estimate: amount / (1 + this.VAT_RATE)
    };

    if (amount >= this.THRESHOLDS.SUSPICIOUS_AMOUNT) {
      implications.risk_level = 'critical';
      implications.reporting_required = true;
      implications.amount_category = 'suspicious_high';
    } else if (amount >= this.THRESHOLDS.LARGE_TRANSACTION) {
      implications.risk_level = 'high';
      implications.amount_category = 'large';
    } else if (amount >= this.THRESHOLDS.MEDIUM_TRANSACTION) {
      implications.risk_level = 'medium';
      implications.amount_category = 'medium';
    } else if (amount >= this.THRESHOLDS.SMALL_TRANSACTION) {
      implications.amount_category = 'small';
    } else {
      implications.amount_category = 'micro';
    }

    // Cash reporting threshold
    if (amount > this.THRESHOLDS.REPORTABLE_CASH) {
      implications.cash_reporting_required = true;
    }

    return implications;
  }

  /**
   * Analyze transaction purpose for tax classification
   */
  static analyzePurpose(purpose) {
    const purposeLower = purpose.toLowerCase();
    const analysis = {
      confidence: 0,
      reasoning: [],
      suggested_category: null
    };

    // Check for business expense keywords
    const businessMatches = this.BUSINESS_EXPENSE_KEYWORDS.filter(keyword =>
      purposeLower.includes(keyword)
    );

    if (businessMatches.length > 0) {
      analysis.confidence += 30;
      analysis.reasoning.push(`Business keywords found: ${businessMatches.join(', ')}`);
      analysis.suggested_category = 'business_expense';
    }

    // Check for personal expense keywords
    const personalMatches = this.PERSONAL_EXPENSE_KEYWORDS.filter(keyword =>
      purposeLower.includes(keyword)
    );

    if (personalMatches.length > 0) {
      analysis.confidence += 25;
      analysis.reasoning.push(`Personal keywords found: ${personalMatches.join(', ')}`);
      analysis.suggested_category = 'personal_expense';
    }

    // Check for exempt keywords
    const exemptMatches = this.EXEMPT_KEYWORDS.filter(keyword =>
      purposeLower.includes(keyword)
    );

    if (exemptMatches.length > 0) {
      analysis.confidence += 40;
      analysis.reasoning.push(`Exempt keywords found: ${exemptMatches.join(', ')}`);
      analysis.suggested_category = 'exempt';
    }

    // Check for tax-related terms
    if (purposeLower.includes('tax') || purposeLower.includes('sars') || purposeLower.includes('vat')) {
      analysis.confidence += 20;
      analysis.reasoning.push('Tax-related transaction detected');
      analysis.suggested_category = 'tax_payment';
    }

    return analysis;
  }

  /**
   * Analyze receiver information
   */
  static analyzeReceiver(receiverInfo) {
    const analysis = {
      confidence: 0,
      reasoning: []
    };

    // Check if receiver is a business (has VAT number format)
    if (receiverInfo.taxId && this.isBusinessTaxId(receiverInfo.taxId)) {
      analysis.confidence += 25;
      analysis.reasoning.push('Receiver appears to be a registered business');
    }

    // Check receiver name for business indicators
    if (receiverInfo.name) {
      const businessIndicators = ['pty', 'ltd', 'cc', 'inc', 'company', 'corporation', 'enterprise'];
      const nameLower = receiverInfo.name.toLowerCase();

      if (businessIndicators.some(indicator => nameLower.includes(indicator))) {
        analysis.confidence += 20;
        analysis.reasoning.push('Receiver name indicates business entity');
      }
    }

    return analysis;
  }

  /**
   * Analyze transaction type for flags
   */
  static analyzeTransactionType(transactionType, amount) {
    const analysis = {
      flags: []
    };

    // Cash transaction analysis
    if (transactionType === Transaction.TYPES.MANUAL) {
      if (amount > this.THRESHOLDS.REPORTABLE_CASH) {
        analysis.flags.push('LARGE_CASH_TRANSACTION');
      }
      if (amount > this.THRESHOLDS.SUSPICIOUS_AMOUNT) {
        analysis.flags.push('SUSPICIOUS_CASH_AMOUNT');
      }
    }

    // ATM transactions over certain amounts
    if (transactionType === Transaction.TYPES.ATM && amount > this.THRESHOLDS.LARGE_TRANSACTION) {
      analysis.flags.push('LARGE_ATM_WITHDRAWAL');
    }

    return analysis;
  }

  /**
   * Make final classification decision
   */
  static makeFinalClassification(confidenceScore, suggestedCategory, riskLevel, flags) {
    let classification = Transaction.TAX_CLASSIFICATION.REVIEW_REQUIRED;
    const category = suggestedCategory;

    // High confidence classifications
    if (confidenceScore >= 60) {
      switch (suggestedCategory) {
      case 'business_expense':
        classification = Transaction.TAX_CLASSIFICATION.TAXABLE_BUSINESS;
        break;
      case 'personal_expense':
        classification = Transaction.TAX_CLASSIFICATION.TAXABLE_PERSONAL;
        break;
      case 'exempt':
        classification = Transaction.TAX_CLASSIFICATION.EXEMPT;
        break;
      default:
        classification = Transaction.TAX_CLASSIFICATION.NON_TAXABLE;
      }
    } else if (confidenceScore >= 40) {
      // Medium confidence - still needs review but with suggestion
      classification = Transaction.TAX_CLASSIFICATION.REVIEW_REQUIRED;
    }

    // Override for high-risk transactions
    if (riskLevel === 'critical' || flags.includes('SUSPICIOUS_CASH_AMOUNT')) {
      classification = Transaction.TAX_CLASSIFICATION.REVIEW_REQUIRED;
    }

    return { classification, category };
  }

  /**
   * Check if tax ID appears to be for a business
   */
  static isBusinessTaxId(taxId) {
    // South African VAT numbers are 10 digits
    // Income tax numbers are 9-10 digits
    // This is a simplified check
    return /^\d{10}$/.test(taxId.replace(/\s/g, ''));
  }

  /**
   * Calculate VAT amount
   */
  static calculateVAT(amount) {
    const vatExclusiveAmount = amount / (1 + this.VAT_RATE);
    const vatAmount = amount - vatExclusiveAmount;

    return {
      vat_inclusive_amount: parseFloat(amount),
      vat_exclusive_amount: parseFloat(vatExclusiveAmount.toFixed(2)),
      vat_amount: parseFloat(vatAmount.toFixed(2)),
      vat_rate: this.VAT_RATE
    };
  }

  /**
   * Log tax classification action
   */
  static async logTaxClassification(transactionId, userId, classificationResult, metadata = {}) {
    try {
      await TransactionLog.create({
        transaction_id: transactionId,
        user_id: userId,
        log_type: TransactionLog.LOG_TYPES.TAX_CLASSIFIED,
        severity: classificationResult.tax_classification === Transaction.TAX_CLASSIFICATION.REVIEW_REQUIRED
          ? TransactionLog.SEVERITY.MEDIUM
          : TransactionLog.SEVERITY.LOW,
        message: `Transaction automatically classified as: ${classificationResult.tax_classification}`,
        new_values: {
          tax_classification: classificationResult.tax_classification,
          confidence_score: classificationResult.confidence_score
        },
        tax_details: classificationResult,
        system_metadata: metadata
      });

      logger.info(`Tax classification logged for transaction ${transactionId}`);
    } catch (error) {
      logger.error('Error logging tax classification:', error);
    }
  }

  /**
   * Generate tax summary for a user's transactions
   */
  static async generateTaxSummary(userId, dateFrom, dateTo) {
    try {
      // This would typically involve complex queries and calculations
      // Placeholder for now
      const summary = {
        period: { from: dateFrom, to: dateTo },
        total_transactions: 0,
        tax_classifications: {
          taxable_business: { count: 0, total_amount: 0 },
          taxable_personal: { count: 0, total_amount: 0 },
          non_taxable: { count: 0, total_amount: 0 },
          exempt: { count: 0, total_amount: 0 },
          review_required: { count: 0, total_amount: 0 }
        },
        estimated_vat: 0,
        flags_raised: []
      };

      logger.info(`Tax summary generated for user ${userId}`);
      return summary;
    } catch (error) {
      logger.error('Error generating tax summary:', error);
      throw error;
    }
  }
}

export default TaxTaggingService;
