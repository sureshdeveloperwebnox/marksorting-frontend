const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function testUpload() {
  const filePath = path.join(__dirname, '..', 'test_avatar.png');
  if (!fs.existsSync(filePath)) {
    console.error('Test PNG file not found at:', filePath);
    return;
  }

  const fileBuffer = fs.readFileSync(filePath);
  const fileName = 'test_avatar.png';
  const fileType = 'image/png';

  console.log('1. Fetching presigned upload URL from backend...');
  try {
    const response = await axios.post('http://localhost:4000/api/v1/upload/presigned-url', {
      fileName,
      fileType
    });

    console.log('Presigned URL response:', JSON.stringify(response.data, null, 2));
    const { uploadUrl, fileUrl, key } = response.data;

    console.log('\n2. Attempting to upload to S3/DO Spaces via PUT request...');
    const uploadResponse = await axios.put(uploadUrl, fileBuffer, {
      headers: {
        'Content-Type': fileType,
        'x-amz-acl': 'public-read'
      }
    });

    console.log('Upload S3 Response Status:', uploadResponse.status);
    console.log('Upload S3 Response Headers:', uploadResponse.headers);
    console.log('SUCCESS! File uploaded successfully.');
    console.log('Public File URL:', fileUrl);

  } catch (error) {
    console.error('\nERROR OCCURRED DURING UPLOAD:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', typeof error.response.data === 'object' ? JSON.stringify(error.response.data, null, 2) : error.response.data);
      console.error('Headers:', error.response.headers);
    } else {
      console.error('Error Message:', error.message);
    }
  }
}

testUpload();
