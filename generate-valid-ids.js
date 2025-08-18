// Generate valid South African ID numbers

function generateCheckDigit(idWithoutCheck) {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    let digit = parseInt(idWithoutCheck[i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return (10 - (sum % 10)) % 10;
}

function generateValidSAID(year, month, day, gender, citizenship) {
  const yearStr = year.toString().padStart(2, '0');
  const monthStr = month.toString().padStart(2, '0');
  const dayStr = day.toString().padStart(2, '0');
  const genderStr = gender.toString().padStart(4, '0');
  const citizenshipStr = citizenship.toString();
  const raceStr = '8'; // Fixed digit for our examples
  
  const baseId = yearStr + monthStr + dayStr + genderStr + citizenshipStr + raceStr;
  const checkDigit = generateCheckDigit(baseId);
  
  return baseId + checkDigit.toString();
}

// Generate valid IDs for our mock data
console.log('Valid South African ID numbers:');

// John Doe - Male (90/01/01, gender 5009, citizen)
const johnId = generateValidSAID(90, 1, 1, 5009, 0);
console.log(`John Doe (90/01/01): ${johnId}`);

// Sarah Smith - Female (88/09/03, gender 1234, citizen) 
const sarahId = generateValidSAID(88, 9, 3, 1234, 0);
console.log(`Sarah Smith (88/09/03): ${sarahId}`);

// Michael Johnson - Male (85/12/15, gender 7890, citizen)
const michaelId = generateValidSAID(85, 12, 15, 7890, 0);
console.log(`Michael Johnson (85/12/15): ${michaelId}`);

// Lisa Davis - Female (88/09/03, gender 4567, citizen)
const lisaId = generateValidSAID(88, 9, 3, 4567, 0);
console.log(`Lisa Davis (88/09/03): ${lisaId}`);

// Robert Miller - Male (91/03/12, gender 6789, citizen)
const robertId = generateValidSAID(91, 3, 12, 6789, 0);
console.log(`Robert Miller (91/03/12): ${robertId}`);

// Emily Anderson - Female (87/07/08, gender 2345, citizen)
const emilyId = generateValidSAID(87, 7, 8, 2345, 0);
console.log(`Emily Anderson (87/07/08): ${emilyId}`);

// James Taylor - Male (94/10/19, gender 8901, citizen)
const jamesId = generateValidSAID(94, 10, 19, 8901, 0);
console.log(`James Taylor (94/10/19): ${jamesId}`);

// Jennifer Thomas - Female (83/04/25, gender 3456, citizen)
const jenniferIdId = generateValidSAID(83, 4, 25, 3456, 0);
console.log(`Jennifer Thomas (83/04/25): ${jenniferIdId}`);
