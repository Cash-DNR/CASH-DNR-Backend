// Quick test to debug the South African ID validation
import { validateSAIDFormat, extractIdInfo } from './src/services/homeAffairs.js';

const testIds = [
  "9001015009087",
  "8505152240084",
  "9206301234567",
  "8012157890123"
];

console.log("Testing South African ID validation:");
testIds.forEach(id => {
  const isValid = validateSAIDFormat(id);
  const info = extractIdInfo(id);
  console.log(`ID: ${id}`);
  console.log(`Valid: ${isValid}`);
  console.log(`Info:`, info);
  console.log('---');
});
