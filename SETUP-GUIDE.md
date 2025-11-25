# Employee Time Card System - Setup Guide

## Overview
This system provides role-based access for Drivers and Managers:
- **Drivers**: Submit time cards
- **Managers**: View all submitted time cards with dashboard and filters

---

## Part 1: Google Sheets Setup

### Step 1: Create Your Google Sheet Structure

1. **Open your existing Google Sheet** (or create a new one)

2. **Create the "Employees" sheet** (for login data):
   - Rename Sheet1 to "Employees" (or create a new sheet named "Employees")
   - Add these column headers in Row 1:
     ```
     A1: Name
     B1: Login
     C1: Role
     ```

3. **Add employee data** starting from Row 2:
   ```
   Example:
   Row 2: John Doe    | 1234 | Driver
   Row 3: Jane Smith  | 5678 | Manager
   Row 4: Bob Johnson | 9012 | Driver
   ```

   **Important**:
   - Column A: Employee full name
   - Column B: Their password/login code
   - Column C: Either "Driver" or "Manager" (case-insensitive)

4. **Don't create any other sheets** - Employee time card sheets will be auto-created when they submit their first time card.

---

## Part 2: Google Apps Script Deployment

### Step 2: Add the Script to Your Google Sheet

1. In your Google Sheet, go to **Extensions → Apps Script**

2. Delete any default code in the editor

3. Copy ALL the code from `google-apps-script.js` and paste it into the Apps Script editor

4. Click the **Save** icon (💾) or press `Ctrl + S`

5. Name your project: "Employee Time Card System"

### Step 3: Deploy as Web App

1. Click **Deploy → New deployment**

2. Click the **gear icon ⚙️** next to "Select type"

3. Choose **Web app**

4. Configure the deployment:
   - **Description**: "Employee Time Card System v1"
   - **Execute as**: **Me** (your account)
   - **Who has access**: **Anyone**

5. Click **Deploy**

6. **Grant Permissions**:
   - Click "Authorize access"
   - Choose your Google account
   - Click "Advanced" → "Go to [Project Name] (unsafe)"
   - Click "Allow"

7. **Copy the Web App URL** (looks like: `https://script.google.com/macros/s/ABC123.../exec`)
   - Keep this URL safe - you'll need it in the next step

---

## Part 3: Update Your HTML File

### Step 4: Update API URLs in employee.html

You need to update **TWO** places in `employee.html` with your Web App URL:

#### Location 1: Employee Login API (around line 358)
Find this line:
```javascript
const API_URL = 'https://script.google.com/macros/s/AKfycbyo5u0d41rXf6RK3btgxocgf34qpiWK8e7Lh-O_LTway6bLvrtOU09O0Nx8mSf-KpoC/exec';
```

Replace it with:
```javascript
const API_URL = 'YOUR_WEB_APP_URL_HERE';
```

#### Location 2: Time Card Submission API (around line 527)
Find this line:
```javascript
const TIMECARD_API_URL = 'https://script.google.com/macros/s/AKfycbzvzMY_bEDIc0U3UK1FTa7HbDPtKVk7FX7soIhx2AGXHd6rOFs18sKMM-csX7uBQNwR/exec';
```

Replace it with:
```javascript
const TIMECARD_API_URL = 'YOUR_WEB_APP_URL_HERE';
```

**Note**: Both URLs should be THE SAME - the single Web App URL you copied in Step 3.

---

## Part 4: Testing

### Test Driver Login
1. Open `employee.html` in your browser
2. Select a Driver from the dropdown
3. Enter their password
4. Click "Access Page"
5. You should see the Time Card form

### Test Manager Login
1. Refresh the page or log out
2. Select a Manager from the dropdown
3. Enter their password
4. Click "Access Page"
5. You should see the Manager Dashboard

### Test Time Card Submission (Driver)
1. Log in as a Driver
2. Fill out the time card form
3. Click "Submit Time Card"
4. Check your Google Sheet - a new sheet should be created with the driver's name

### Test Manager Dashboard
1. Log in as a Manager
2. You should see:
   - Quick stats (Today's Submissions, This Week, Total Hours, Active Employees)
   - Filter options (by employee, date range)
   - A table of all submitted time cards
   - "View" button to see full details of each submission

---

## How the System Works

### For Drivers:
1. **Login** → Select name + enter password
2. **Fill Form** → Complete daily time card with:
   - Work log entries (multiple rows)
   - Equipment/truck information
   - Safety check
   - Signature
3. **Submit** → Data saved to Google Sheet under their name

### For Managers:
1. **Login** → Select name + enter password
2. **View Dashboard** → See overview stats and all submissions
3. **Filter** → Filter by employee, date range
4. **View Details** → Click "View" to see full time card
5. **Print** → Print individual time cards if needed

---

## Troubleshooting

### Issue: "Failed to load employee data"
- Check that your "Employees" sheet exists and has the correct column names
- Verify the API_URL in employee.html is correct
- Make sure the Google Apps Script is deployed as "Anyone" can access

### Issue: "No time card data available" (Manager Dashboard)
- Have at least one driver submit a time card first
- Check that employee sheets exist in your spreadsheet
- Verify the TIMECARD_API_URL in employee.html is correct

### Issue: Login dropdown is empty
- Check your "Employees" sheet has data starting from Row 2
- Make sure Column A (Name) and Column B (Login) have values
- Clear browser cache and refresh

### Issue: Time card won't submit
- Check browser console (F12) for errors
- Verify TIMECARD_API_URL is correct
- Make sure all required fields are filled out

---

## Security Notes

- Passwords are stored in plain text in the Google Sheet (Column B)
- This is suitable for internal use with simple PIN-style passwords
- For production use with sensitive data, consider implementing proper authentication
- The "Anyone" access setting means anyone with the URL can access the web app
- Consider limiting access to "Anyone with the link" or specific Google accounts

---

## Need Help?

- Check the browser console (F12) for error messages
- Review the Apps Script logs: Apps Script editor → Execution log
- Ensure all URLs are updated correctly
- Verify Google Sheet structure matches the instructions

---

## Quick Reference

**Google Sheet Structure:**
- Sheet "Employees": Name | Login | Password
- Auto-created sheets: One per employee with their time cards

**Two Web App URLs needed (same URL for both):**
- Line ~358: `API_URL` (for login)
- Line ~527: `TIMECARD_API_URL` (for submissions and dashboard)

**Roles:**
- "Driver" → See time card form
- "Manager" → See dashboard with all time cards
