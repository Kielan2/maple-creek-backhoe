// Proxy function for Google Apps Script API
// This keeps the API URL hidden from the client

exports.handler = async (event) => {
  const API_URL = process.env.GOOGLE_APPS_SCRIPT_URL;

  if (!API_URL) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'API URL not configured' })
    };
  }

  try {
    // Build the target URL with query parameters
    const queryString = event.rawQuery || '';
    const targetUrl = queryString ? `${API_URL}?${queryString}` : API_URL;

    // Forward the request
    const fetchOptions = {
      method: event.httpMethod,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };

    // Include body for POST requests
    if (event.httpMethod === 'POST' && event.body) {
      fetchOptions.body = event.body;
    }

    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.text();

    // Try to parse as JSON, otherwise return as-is
    let responseBody;
    try {
      responseBody = JSON.parse(data);
    } catch {
      responseBody = data;
    }

    return {
      statusCode: response.ok ? 200 : response.status,
      headers: {
        'Content-Type': 'application/json'
      },
      body: typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody)
    };
  } catch (error) {
    console.error('Proxy error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Proxy request failed' })
    };
  }
};
