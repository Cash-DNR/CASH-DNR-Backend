import FormData from 'form-data';
import fs from 'fs';
import fetch from 'node-fetch';

async function testUpload() {
    const form = new FormData();
    
    // Add form fields
    form.append('idNumber', '8709253456089');
    form.append('contactInfo[email]', 'JamesTaylor@gmail.com');
    form.append('contactInfo[phone]', '+27 82 123 4567');
    form.append('homeAddress[streetAddress]', '123 Main Street');
    form.append('homeAddress[town]', 'Johannesburg');
    form.append('homeAddress[city]', 'Johannesburg');
    form.append('homeAddress[province]', 'Gauteng');
    form.append('homeAddress[postalCode]', '2194');
    form.append('password', 'SecurePassword123!');

    // Add files
    const idDoc = fs.createReadStream('c:\\Users\\princ\\Downloads\\100-Joleen-More.pdf');
    const proofDoc = fs.createReadStream('c:\\Users\\princ\\Downloads\\100-Joleen-More.pdf');
    form.append('idDocument', idDoc);
    form.append('proofOfResidence', proofDoc);

    try {
        console.log('Sending request...');
        const response = await fetch('http://localhost:3000/api/citizen', {
            method: 'POST',
            body: form,
            headers: form.getHeaders()
        });

        const data = await response.json();
        console.log('Response Status:', response.status);
        console.log('Response Body:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

testUpload();
