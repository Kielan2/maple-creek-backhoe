# Time Card Approval Workflow

## System Overview

This system implements a manager approval workflow for employee time cards.

```
┌─────────────┐      ┌──────────────┐      ┌───────────────┐      ┌─────────────────┐
│   Driver    │ ───> │ Master Sheet │ ───> │    Manager    │ ───> │ Employee Sheets │
│  Submits    │      │ (All Pending)│      │   Approves    │      │   (Approved)    │
└─────────────┘      └──────────────┘      └───────────────┘      └─────────────────┘
```

---

## Workflow Steps

### 1. Driver Submits Time Card
- Driver logs in and fills out time card form
- Clicks "Submit Time Card"
- **Goes to**: "Master" sheet as a single row
- **Status**: "Pending"

### 2. Manager Reviews
- Manager logs in and sees dashboard
- Views all pending submissions from "Master" sheet
- Can view details of each time card
- **Status**: Shows "Pending" in yellow badge

### 3. Manager Approves
- Manager clicks "Approve" button
- Enters optional manager notes
- Confirms approval
- **Actions**:
  1. Updates "Master" sheet: Status → "Approved", adds manager notes
  2. Copies time card to individual employee sheet (formatted)
  3. Updates dashboard (approved cards show green badge)

---

## Google Sheet Structure

### Sheet 1: "Employees"
Employee login information
```
Name         | Login | Role
-------------|-------|--------
John Doe     | 1234  | Driver
Jane Smith   | 5678  | Manager
Bob Johnson  | 9012  | Driver
```

### Sheet 2: "Master"
All time card submissions (auto-created on first submission)
```
Columns:
- Submission ID
- Timestamp
- Employee Name
- Date
- Day of Week
- Equipment #
- Beg Miles/Hrs
- End Miles/Hrs
- Total Miles
- Fuel Gallons
- Injured
- Injury Details
- Signature
- Work Log JSON (stores all work log rows)
- Status (Pending/Approved)
- Manager Notes
```

### Sheet 3+: Individual Employee Sheets
Created when manager approves time cards
```
Example: "John Doe" sheet
- Contains all approved time cards for John Doe
- Formatted with headers, work logs, and manager notes
- Includes submission ID and approval timestamp
```

---

## Manager Dashboard Features

### Quick Stats
- **Today's Submissions**: Count of submissions today
- **This Week**: Submissions in the last 7 days
- **Total Hours**: Sum of all hours this week
- **Active Employees**: Number of unique employees who submitted

### Filters
- Filter by employee
- Filter by date range (from/to)
- Apply filters button

### Time Cards Table
Shows:
- Submission ID (e.g., TC-1234567890)
- Date
- Employee Name
- Total Hours
- Status Badge (Yellow=Pending, Green=Approved)
- Action Buttons:
  - **Approve** (only for pending)
  - **View** (see full details)

### Approval Process
1. Click "Approve" button
2. Enter manager notes (optional)
   - Example: "Verified with dispatch"
   - Example: "Missing truck #, added notes"
3. Confirm approval
4. System:
   - Marks as approved in Master sheet
   - Adds manager notes
   - Creates/updates employee sheet
   - Refreshes dashboard

### View Details
- Opens popup window with:
  - Submission ID and status
  - Manager notes (if any)
  - Employee information
  - Work log table
  - Equipment details
  - Safety information
  - Print button

---

## Benefits of This Workflow

### For Drivers
- Simple submission process
- No changes to their interface
- Instant feedback on submission
- Can see their approved cards in individual sheet

### For Managers
- Central "Master" sheet for all pending submissions
- Easy filtering and searching
- Can add notes before approval
- Clear status tracking (Pending/Approved)
- Approved time cards archived in employee sheets

### For Record Keeping
- **Master Sheet**: Complete audit trail of ALL submissions
- **Employee Sheets**: Clean, approved records per employee
- **Status Tracking**: Know what's pending vs approved
- **Manager Notes**: Document any issues or corrections
- **Timestamps**: Track submission AND approval times

---

## Technical Implementation

### Data Flow

**Driver Submission** (POST request):
```javascript
{
  employee_name: "John Doe",
  date: "2025-01-24",
  work_log_rows: [...],
  // ... other fields
}
```
→ Saved as single row in "Master" sheet
→ Status = "Pending"

**Manager Views** (GET request with `?action=getAll`):
```javascript
{
  success: true,
  data: [
    {
      row_number: 2,
      submission_id: "TC-1234567890",
      employee_name: "John Doe",
      status: "Pending",
      // ... other fields
    }
  ]
}
```

**Manager Approves** (POST request with `?action=approve`):
```javascript
{
  action: "approve",
  row_number: 2,
  manager_notes: "Verified with dispatch"
}
```
→ Updates Master sheet (status, notes)
→ Copies to employee sheet
→ Returns success

---

## Setup Instructions

### 1. Update Google Apps Script
- Copy the new code from `google-apps-script.js`
- Paste into your Apps Script editor
- Save and redeploy

### 2. Test the Flow
1. **As Driver**: Submit a time card
2. Check "Master" sheet - should see new row with "Pending" status
3. **As Manager**: Log in, see the pending submission
4. Click "Approve", add notes, confirm
5. Check "Master" sheet - status should be "Approved"
6. Check employee sheet - should have formatted time card

### 3. Verify
- Master sheet has all submissions
- Employee sheets only have approved cards
- Manager notes appear in both places
- Dashboard updates correctly

---

## Future Enhancements (Optional)

- **Reject/Return**: Button to send back to driver for corrections
- **Email Notifications**: Alert manager when new submissions arrive
- **Export**: Download time cards as PDF or Excel
- **Search**: Search by submission ID, employee, or date range
- **Bulk Approval**: Select multiple and approve all at once
- **Comments**: Add comments/discussion on time cards

---

## Troubleshooting

### Issue: Manager sees no time cards
- Check that drivers have submitted at least one
- Verify "Master" sheet exists and has data
- Check browser console for errors

### Issue: Approval doesn't work
- Verify the Web App URL is correct
- Check that the script has been redeployed
- Look at Apps Script execution logs

### Issue: Employee sheet not created
- Check Apps Script permissions
- Verify employee name in submission matches exactly
- Check execution logs for errors

---

## Summary

**Key Points:**
- ✅ All submissions go to Master sheet (single rows)
- ✅ Manager reviews and approves from Master sheet
- ✅ Approved cards move to employee sheets
- ✅ Manager can add notes during approval
- ✅ Status tracking (Pending/Approved)
- ✅ One central approval workflow

This system provides clear accountability, easy management, and complete audit trails for all time card submissions!
