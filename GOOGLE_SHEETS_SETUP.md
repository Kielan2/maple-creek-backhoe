# Google Sheets Setup Guide for Driver Authentication

This guide will help you set up a Google Sheet to store employee names and passwords for the driver authentication system.

## Step 1: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet
2. Name it something like "Maple Creek Employees" or "Driver Passwords"

## Step 2: Set Up Your Sheet Structure

Your Google Sheet needs to have the following columns (the exact header names can vary, but these are recommended):

| Name | Password | Login |
|------|----------|-------|
| John Doe | password123 | password123 |
| Jane Smith | securepass456 | securepass456 |
| Bob Johnson | mypass789 | mypass789 |

**Important Notes:**
- The first row should contain headers (Name, Password, Login, etc.)
- Column names are case-insensitive (Name, name, NAME all work)
- You can use either "Password" or "Login" as the password column name
- Make sure there are no empty rows between the header and data rows

## Step 3: Create a Google Apps Script

1. In your Google Sheet, click **Extensions** → **Apps Script**
2. Delete any default code and paste the following script:

```javascript
function doGet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  
  // Find column indices (case-insensitive)
  var nameIndex = -1;
  var passwordIndex = -1;
  
  for (var i = 0; i < headers.length; i++) {
    var header = String(headers[i]).toLowerCase();
    if (header === 'name' || header === 'employee name') {
      nameIndex = i;
    }
    if (header === 'password' || header === 'login' || header === 'pass') {
      passwordIndex = i;
    }
  }
  
  if (nameIndex === -1 || passwordIndex === -1) {
    return ContentService.createTextOutput(JSON.stringify({
      error: 'Missing required columns: Name and Password'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  // Convert data to JSON
  var employees = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var name = String(row[nameIndex]).trim();
    var password = String(row[passwordIndex]).trim();
    
    // Skip empty rows
    if (name && password) {
      employees.push({
        Name: name,
        Login: password,
        Password: password
      });
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify(employees))
    .setMimeType(ContentService.MimeType.JSON);
}
```

3. Click **Save** (or press Ctrl+S / Cmd+S)
4. Name your project something like "Employee Data API"

## Step 4: Deploy as Web App

1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ next to "Select type" and choose **Web app**
3. Configure the deployment:
   - **Description**: "Employee Authentication API" (or any description)
   - **Execute as**: Me
   - **Who has access**: Anyone
4. Click **Deploy**
5. **Copy the Web App URL** - it will look like:
   ```
   https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
   ```
6. Click **Done**

## Step 5: Update Your HTML File

1. Open `drivers.html` in a text editor
2. Find this line (around line 257):
   ```javascript
   const API_URL = 'https://script.google.com/macros/s/AKfycbyo5u0d41rXf6RK3btgxocgf34qpiWK8e7Lh-O_LTway6bLvrtOU09O0Nx8mSf-KpoC/exec';
   ```
3. Replace the URL with your Web App URL from Step 4
4. Save the file

## Step 6: Test Your Setup

1. Open `drivers.html` in a web browser
2. You should see a login form
3. The dropdown should populate with employee names from your Google Sheet
4. Try logging in with one of the passwords from your sheet

## Troubleshooting

### The dropdown doesn't populate with names
- Check that your Google Sheet has the correct column headers (Name, Password, or Login)
- Verify your Web App is deployed and set to "Anyone" access
- Open the Web App URL directly in a browser - you should see JSON data
- Check the browser console (F12) for error messages

### "Failed to load employee data" error
- Make sure your Google Apps Script is saved and deployed
- Verify the API_URL in drivers.html matches your Web App URL
- Check that your sheet has data rows (not just headers)
- Try refreshing the page

### Password doesn't work
- Make sure the password in the sheet matches exactly (including spaces/case)
- Check that you're selecting the correct employee from the dropdown
- The password comparison is case-sensitive

## Security Notes

- ⚠️ This is a basic authentication system suitable for internal use
- Passwords are visible in the browser's developer tools
- Consider using more secure authentication for sensitive data
- The Google Sheet should have appropriate sharing settings (only share with authorized users)
- You can add more columns to your sheet (like email, phone, etc.) - they will be included in the data but not used for authentication

## Example Google Sheet Structure

```
| Name          | Password      | Email              | Phone       |
|---------------|---------------|--------------------|-------------|
| John Doe      | john2024      | john@example.com   | 555-0100    |
| Jane Smith    | jane2024      | jane@example.com   | 555-0101    |
| Bob Johnson   | bob2024       | bob@example.com    | 555-0102    |
```

The script will automatically find the "Name" and "Password" columns regardless of other columns you add.

