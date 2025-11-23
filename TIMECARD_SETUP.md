# Time Card Google Sheet Setup Guide

This guide will help you set up your Google Sheet to receive time card submissions from the driver's form.

## What's Been Updated

1. **drivers.html** - Now includes form submission functionality
2. **google-apps-script.js** - Updated script to handle time card data (use this for your TIME CARD sheet)

## Step-by-Step Setup

### Step 1: Open Your Time Card Google Sheet

1. Go to your Google Sheet at: `https://script.google.com/macros/s/AKfycbwuJ1p15G08mEEtKPSuoLrsO7B2Y3ZW-4Awh-obZqKku1aw70M81I2MaU8t8Ob7qzUk/exec`
2. This is the sheet where time card submissions will be stored

### Step 2: Update the Apps Script

1. In your Time Card Google Sheet, click **Extensions** → **Apps Script**
2. Delete any existing code
3. Copy the entire contents of `google-apps-script.js` from this project
4. Paste it into the Apps Script editor
5. Click **Save** (Ctrl+S / Cmd+S)

### Step 3: Redeploy the Web App

Since you've updated the script, you need to create a new deployment:

1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ and choose **Web app**
3. Configure:
   - **Description**: "Time Card Submission Handler"
   - **Execute as**: Me
   - **Who has access**: Anyone
4. Click **Deploy**
5. **IMPORTANT**: The URL should be the same one you already provided:
   `https://script.google.com/macros/s/AKfycbwuJ1p15G08mEEtKPSuoLrsO7B2Y3ZW-4Awh-obZqKku1aw70M81I2MaU8t8Ob7qzUk/exec`

### Step 4: Test the Setup (Optional)

You can test the script directly in the Apps Script editor:

1. In the Apps Script editor, select the `testDoPost` function from the dropdown
2. Click the **Run** button
3. Check your Google Sheet - you should see a test entry added

### Step 5: Test the Form

1. Open `drivers.html` in a web browser
2. Log in with an employee account
3. Fill out the time card form
4. Click "Submit Time Card"
5. Check your Google Sheet - the data should appear!

## How the Data is Formatted

The script will automatically create these columns on first submission:

| Column | Description |
|--------|-------------|
| Timestamp | When the form was submitted |
| Employee Name | Name of the employee |
| Date | Date of work |
| Day of Week | Day of the week |
| Load Time | From/Load Time |
| Del Time | To/Delivery Time |
| Truck/Equip # | Truck or equipment number |
| # of Loads | Number of loads |
| Unit of Meas. | Unit of measurement |
| Material Type | Type of material |
| Source/Supplier | Source or supplier |
| Job Name/Desc. | Job description |
| Job #/Phase # | Job number or phase |
| Hours | Job hours |
| Equipment # | Equipment number (from Truck/Tractor section) |
| Beg-Miles/Hrs | Beginning miles/hours |
| End-Miles/Hrs | Ending miles/hours |
| Total Miles | Calculated total miles |
| Fuel Gallons | Fuel used |
| Injured | Yes/No |
| Injury Details | Injury description (if applicable) |
| Signature | Employee signature |

## Important Notes

### Multiple Work Log Rows

If an employee adds multiple rows in the "Daily Work Log" table, **each row will be saved as a separate entry** in your Google Sheet. This means:

- If they have 3 work log entries, you'll get 3 rows in the sheet
- Each row will have the same employee info, date, equipment info, etc.
- But each row will have different load times, job descriptions, etc.

### Example

If an employee fills out:
- Employee Name: John Doe
- Date: 2025-11-22
- Work Log Row 1: Job A, 2 hours
- Work Log Row 2: Job B, 3 hours
- Work Log Row 3: Job C, 1 hour

You'll get **3 rows** in your Google Sheet:

| Employee Name | Date | Job Desc | Hours |
|---------------|------|----------|-------|
| John Doe | 2025-11-22 | Job A | 2 |
| John Doe | 2025-11-22 | Job B | 3 |
| John Doe | 2025-11-22 | Job C | 1 |

## Troubleshooting

### Form submission fails
- Verify your Web App URL in drivers.html line 427 matches your deployed URL
- Make sure the script is deployed with "Anyone" access
- Check browser console (F12) for error messages

### Data not appearing in sheet
- Make sure you're looking at the correct Google Sheet
- Check that the sheet isn't filtered
- Verify the script has permission to edit the sheet

### Permission errors
- When you first deploy, you may need to authorize the script
- Click "Review permissions" and allow access

## Security Notes

- The Web App must be set to "Anyone" access for the form to submit data
- All submissions are timestamped automatically
- Employee authentication is handled separately (via the login system)
- Consider the Google Sheet's sharing settings - only share with authorized personnel

## Next Steps

Once everything is working:
1. You can delete the test row if you ran the test function
2. Monitor the first few real submissions to ensure data is formatted correctly
3. You may want to set up data validation rules in your Google Sheet
4. Consider creating a separate sheet/tab for archived data
