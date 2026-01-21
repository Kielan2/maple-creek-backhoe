// Proxy function for Google Apps Script API
// This keeps the API URL hidden from the client

const https = require('https');
const url = require('url');

exports.handler = async (event) => {
  const API_URL = process.env.GOOGLE_APPS_SCRIPT_URL;

  if (!API_URL) {
    console.error('GOOGLE_APPS_SCRIPT_URL environment variable is not set');
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'API URL not configured' })
    };
  }

  try {
    // Build the target URL with query parameters
    const queryString = event.rawQuery || '';
    const targetUrl = queryString ? `${API_URL}?${queryString}` : API_URL;
    const parsedUrl = new url.URL(targetUrl);

    // Make request using https module
    const data = await new Promise((resolve, reject) => {
      const options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.pathname + parsedUrl.search,
        method: event.httpMethod,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };

      // Add content length for POST requests
      if (event.httpMethod === 'POST' && event.body) {
        options.headers['Content-Length'] = Buffer.byteLength(event.body);
      }

      const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          // Handle redirects (Google Apps Script often redirects)
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            // Follow the redirect
            const redirectUrl = new url.URL(res.headers.location);
            const redirectOptions = {
              hostname: redirectUrl.hostname,
              port: 443,
              path: redirectUrl.pathname + redirectUrl.search,
              method: 'GET',
              headers: {}
            };

            const redirectReq = https.request(redirectOptions, (redirectRes) => {
              let redirectData = '';

              redirectRes.on('data', (chunk) => {
                redirectData += chunk;
              });

              redirectRes.on('end', () => {
                resolve({ statusCode: redirectRes.statusCode, data: redirectData });
              });
            });

            redirectReq.on('error', reject);
            redirectReq.end();
          } else {
            resolve({ statusCode: res.statusCode, data: responseData });
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      // Write body for POST requests
      if (event.httpMethod === 'POST' && event.body) {
        req.write(event.body);
      }

      req.end();
    });

    // Try to parse as JSON, otherwise return as-is
    let responseBody;
    try {
      responseBody = JSON.parse(data.data);
    } catch {
      responseBody = data.data;
    }

    return {
      statusCode: data.statusCode === 200 ? 200 : data.statusCode,
      headers: {
        'Content-Type': 'application/json'
      },
      body: typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody)
    };
  } catch (error) {
    console.error('Proxy error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Proxy request failed: ' + error.message })
    };
  }
};
