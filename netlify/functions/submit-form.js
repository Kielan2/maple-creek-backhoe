const https = require('https');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, message: 'Method not allowed' })
    };
  }

  try {
    const formData = JSON.parse(event.body);

    // Add the access key from environment variable
    const accessKey = process.env.WEB3FORMS_ACCESS_KEY;

    if (!accessKey) {
      console.error('WEB3FORMS_ACCESS_KEY environment variable is not set');
      return {
        statusCode: 500,
        body: JSON.stringify({ success: false, message: 'Server configuration error' })
      };
    }

    // Build Web3Forms payload with required fields
    const payload = {
      access_key: accessKey,
      name: formData.name || '',
      email: formData.email || '',
      message: formData.message || '',
      subject: 'New Contact Form Submission - Maple Creek Backhoe'
    };

    console.log('Sending to Web3Forms:', JSON.stringify(payload));

    // Make request using https module
    const data = await new Promise((resolve, reject) => {
      const postData = JSON.stringify(payload);

      const options = {
        hostname: 'api.web3forms.com',
        port: 443,
        path: '/submit',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, data: JSON.parse(responseData) });
          } catch (e) {
            resolve({ statusCode: res.statusCode, data: { success: false, message: responseData } });
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(postData);
      req.end();
    });

    return {
      statusCode: data.statusCode === 200 ? 200 : 400,
      body: JSON.stringify(data.data)
    };
  } catch (error) {
    console.error('Submit form error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: 'Server error: ' + error.message })
    };
  }
};
