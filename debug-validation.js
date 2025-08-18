// Debug the validation function with our mock IDs

function validateSAIDFormat(idNumber) {
  // Remove any spaces or dashes
  const cleanId = idNumber.replace(/[\s-]/g, '');
  
  console.log(`Testing ID: ${cleanId}`);
  
  // Check if it's exactly 13 digits
  if (!/^\d{13}$/.test(cleanId)) {
    console.log('Failed: Not 13 digits');
    return false;
  }

  // Extract components
  const year = parseInt(cleanId.substring(0, 2));
  const month = parseInt(cleanId.substring(2, 4));
  const day = parseInt(cleanId.substring(4, 6));
  const gender = parseInt(cleanId.substring(6, 10));
  const citizenship = parseInt(cleanId.substring(10, 11));
  const checkDigit = parseInt(cleanId.substring(12, 13));

  console.log(`Components: year=${year}, month=${month}, day=${day}, gender=${gender}, citizenship=${citizenship}, checkDigit=${checkDigit}`);

  // Validate date components
  if (month < 1 || month > 12) {
    console.log('Failed: Invalid month');
    return false;
  }
  if (day < 1 || day > 31) {
    console.log('Failed: Invalid day');
    return false;
  }

  // Validate checksum using Luhn algorithm
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    let digit = parseInt(cleanId[i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    console.log(`Position ${i}: digit=${cleanId[i]}, processed=${digit}, sum=${sum}`);
  }
  
  const calculatedCheckDigit = (10 - (sum % 10)) % 10;
  console.log(`Sum: ${sum}, Calculated check digit: ${calculatedCheckDigit}, Actual: ${checkDigit}`);
  
  return calculatedCheckDigit === checkDigit;
}

// Test with our mock IDs
const testIds = [
  "9001015009087",
  "8809035678901",
  "9206301234567",
  "9103121234098",
  "8707085678901"
];

testIds.forEach(id => {
  console.log(`\n=== Testing ${id} ===`);
  const result = validateSAIDFormat(id);
  console.log(`Result: ${result ? 'VALID' : 'INVALID'}\n`);
});
