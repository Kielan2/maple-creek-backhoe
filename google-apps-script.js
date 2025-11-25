/**
 * Google Apps Script for Employee Management and Time Card System
 *
 * SETUP INSTRUCTIONS:
 *
 * This script handles THREE main functions:
 * 1. Employee Login Data (GET request to fetch employees with Name, Login/Password, and Role)
 * 2. Time Card Submissions (POST request to save time cards to Master sheet)
 * 3. Manager Dashboard (GET request with ?action=getAll to retrieve pending time cards)
 * 4. Manager Approval (POST request with ?action=approve to approve and move time cards)
 *
 * SPREADSHEET SETUP:
 * - Sheet 1: "Employees" - Contains employee login information
 *   Columns: Name | Login (Password) | Role
 *   Example:
 *     John Doe | 1234 | Driver
 *     Jane Smith | 5678 | Manager
 *
 * - Sheet 2: "Master" - All submitted time cards (pending approval)
 *   Auto-created with headers on first submission
 *
 * - Other Sheets: Individual employee sheets (created when manager approves)
 *
 * DEPLOYMENT:
 * 1. Open your Google Sheet
 * 2. Go to Extensions → Apps Script
 * 3. Delete any default code
 * 4. Paste this entire file
 * 5. Save the project (name it "Employee Time Card System")
 * 6. Click Deploy → New deployment
 * 7. Click "Select type" → Web app
 * 8. Configure:
 *    - Description: "Employee Time Card System v1"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone"
 * 9. Click "Deploy"
 * 10. Copy the Web App URL
 * 11. Update both API URLs in employee.html with the SAME URL
 */

/**
 * Handles GET requests for employee data and manager dashboard
 */
function doGet(e) {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var action = e.parameter.action || 'getEmployees';

    // Handle different GET request types
    if (action === 'getAll') {
      // Manager Dashboard: Get all pending time cards from Master sheet
      return getAllTimeCards(spreadsheet);
    } else {
      // Default: Get employee login data
      return getEmployees(spreadsheet);
    }

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Error processing request: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Gets employee login data from the "Employees" sheet
 */
function getEmployees(spreadsheet) {
  try {
    var employeeSheet = spreadsheet.getSheetByName('Employees');

    if (!employeeSheet) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Employees sheet not found. Please create a sheet named "Employees" with columns: Name, Login, Role'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Get all data from the Employees sheet
    var dataRange = employeeSheet.getDataRange();
    var values = dataRange.getValues();

    if (values.length < 2) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'No employee data found. Please add employees to the Employees sheet.'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var employees = [];

    // Process each employee row (skip header row)
    for (var i = 1; i < values.length; i++) {
      var row = values[i];

      // Skip empty rows
      if (!row[0] || row[0] === '') continue;

      var employee = {
        Name: row[0] || '',
        Login: row[1] || '',
        Role: row[2] || ''
      };

      employees.push(employee);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      employees: employees
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Error fetching employees: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Gets all pending time cards from Master sheet (for Manager Dashboard)
 */
function getAllTimeCards(spreadsheet) {
  try {
    var masterSheet = spreadsheet.getSheetByName('Master');

    if (!masterSheet) {
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        data: []
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var dataRange = masterSheet.getDataRange();
    var values = dataRange.getValues();

    if (values.length < 2) {
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        data: []
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var headers = values[0];
    var timeCards = [];

    // Process each time card row (skip header)
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      var actualRowNumber = i + 1; // Actual row in the sheet (accounting for header)

      // Skip empty rows but preserve row numbering
      if (!row[0]) continue;

      var timeCard = {
        row_number: actualRowNumber, // Store the actual row number in the sheet
        submission_id: row[0] || '',
        timestamp: row[1] || '',
        employee_name: row[2] || '',
        date: row[3] || '',
        day_of_week: row[4] || '',
        equipment_num: row[5] || '',
        beg_miles: row[6] || '',
        end_miles: row[7] || '',
        total_miles: row[8] || '',
        fuel_gallons: row[9] || '',
        injured: row[10] || 'no',
        injury_details: row[11] || '',
        signature: row[12] || '',
        work_log_json: row[13] || '[]',
        status: row[14] || 'Pending',
        manager_notes: row[15] || ''
      };

      // Parse work log JSON
      try {
        timeCard.work_log_rows = JSON.parse(timeCard.work_log_json);
      } catch(e) {
        timeCard.work_log_rows = [];
      }

      timeCards.push(timeCard);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      data: timeCards
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Error fetching time cards: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handles POST requests for time card submissions and approvals
 */
function doPost(e) {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    // Check if this is an approval request
    var action = e.parameter.action || '';

    if (action === 'approve') {
      return approveTimeCard(e, spreadsheet);
    } else {
      return submitTimeCard(e, spreadsheet);
    }

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Error processing submission: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Submits a time card to the Master sheet
 */
function submitTimeCard(e, spreadsheet) {
  try {
    // Parse the incoming data
    var data;
    if (e.postData && e.postData.type === 'application/json') {
      data = JSON.parse(e.postData.contents);
    } else {
      data = e.parameter;

      // Reconstruct work_log_rows array from form data if needed
      var workLogRows = [];
      if (data['work_log_rows[0][load_time]'] !== undefined) {
        var i = 0;
        while (data['work_log_rows[' + i + '][load_time]'] !== undefined) {
          workLogRows.push({
            load_time: data['work_log_rows[' + i + '][load_time]'] || '',
            del_time: data['work_log_rows[' + i + '][del_time]'] || '',
            truck_equip: data['work_log_rows[' + i + '][truck_equip]'] || '',
            num_loads: data['work_log_rows[' + i + '][num_loads]'] || '',
            unit_meas: data['work_log_rows[' + i + '][unit_meas]'] || '',
            material_type: data['work_log_rows[' + i + '][material_type]'] || '',
            source_supplier: data['work_log_rows[' + i + '][source_supplier]'] || '',
            job_desc: data['work_log_rows[' + i + '][job_desc]'] || '',
            job_num: data['work_log_rows[' + i + '][job_num]'] || '',
            job_hours: data['work_log_rows[' + i + '][job_hours]'] || ''
          });
          i++;
        }
        data.work_log_rows = workLogRows;
      }
    }

    // Get or create Master sheet
    var masterSheet = spreadsheet.getSheetByName('Master');

    if (!masterSheet) {
      masterSheet = spreadsheet.insertSheet('Master');
      // Add headers
      masterSheet.appendRow([
        'Submission ID',
        'Timestamp',
        'Employee Name',
        'Date',
        'Day of Week',
        'Equipment #',
        'Beg Miles/Hrs',
        'End Miles/Hrs',
        'Total Miles',
        'Fuel Gallons',
        'Injured',
        'Injury Details',
        'Signature',
        'Work Log JSON',
        'Status',
        'Manager Notes'
      ]);

      // Format header row
      var headerRange = masterSheet.getRange(1, 1, 1, 16);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#f3f3f3');
    }

    // Generate unique submission ID
    var submissionId = 'TC-' + new Date().getTime();
    var timestamp = new Date();

    // Convert work_log_rows to JSON string
    var workLogJson = JSON.stringify(data.work_log_rows || []);

    // Add the time card as a single row
    masterSheet.appendRow([
      submissionId,
      timestamp,
      data.employee_name || '',
      data.date || '',
      data.day_of_week || '',
      data.equipment_num || '',
      data.beg_miles || '',
      data.end_miles || '',
      data.total_miles || '',
      data.fuel_gallons || '',
      data.injured || 'no',
      data.injury_details || '',
      data.signature || '',
      workLogJson,
      'Pending',
      ''
    ]);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Time card submitted successfully',
      submission_id: submissionId
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Error submitting time card: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Approves a time card: adds manager notes, marks as approved, and moves to employee sheet
 */
function approveTimeCard(e, spreadsheet) {
  try {
    var data;
    if (e.postData && e.postData.type === 'application/json') {
      data = JSON.parse(e.postData.contents);
    } else {
      data = e.parameter;
    }

    var submissionId = data.submission_id;
    var managerNotes = data.manager_notes || '';

    var masterSheet = spreadsheet.getSheetByName('Master');

    if (!masterSheet) {
      throw new Error('Master sheet not found');
    }

    // Find the row with this submission ID
    var dataRange = masterSheet.getDataRange();
    var values = dataRange.getValues();
    var rowNumber = -1;

    for (var i = 1; i < values.length; i++) {
      if (values[i][0] === submissionId) {
        rowNumber = i + 1; // Actual row number (accounting for header at row 1)
        break;
      }
    }

    if (rowNumber === -1) {
      throw new Error('Time card not found with submission ID: ' + submissionId);
    }

    // Get the time card data from the row
    var rowData = masterSheet.getRange(rowNumber, 1, 1, 16).getValues()[0];

    // Update status and manager notes in Master sheet
    masterSheet.getRange(rowNumber, 15).setValue('Approved');
    masterSheet.getRange(rowNumber, 16).setValue(managerNotes);

    // Parse the data
    var submissionId = rowData[0];
    var timestamp = rowData[1];
    var employeeName = rowData[2];
    var date = rowData[3];
    var dayOfWeek = rowData[4];
    var equipmentNum = rowData[5];
    var begMiles = rowData[6];
    var endMiles = rowData[7];
    var totalMiles = rowData[8];
    var fuelGallons = rowData[9];
    var injured = rowData[10];
    var injuryDetails = rowData[11];
    var signature = rowData[12];
    var workLogJson = rowData[13];

    // Parse work log
    var workLogRows = [];
    try {
      workLogRows = JSON.parse(workLogJson);
    } catch(e) {
      workLogRows = [];
    }

    // Get or create employee sheet
    var employeeSheet = spreadsheet.getSheetByName(employeeName);

    if (!employeeSheet) {
      employeeSheet = spreadsheet.insertSheet(employeeName);
    }

    var lastRow = employeeSheet.getLastRow();
    var startRow = lastRow + 1;

    // Add time card in detailed format to employee sheet
    employeeSheet.appendRow(['']);
    employeeSheet.appendRow(['MAPLE CREEK BACKHOE SERVICE INC. - EMPLOYEE TIME CARD']);
    employeeSheet.appendRow(['SUBMISSION ID:', submissionId]);
    employeeSheet.appendRow(['SUBMISSION TIMESTAMP:', timestamp]);
    employeeSheet.appendRow(['APPROVED BY MANAGER:', new Date()]);
    if (managerNotes) {
      employeeSheet.appendRow(['MANAGER NOTES:', managerNotes]);
    }
    employeeSheet.appendRow(['EMPLOYEE NAME:', employeeName]);
    employeeSheet.appendRow(['DATE:', date]);
    employeeSheet.appendRow(['DAY OF WEEK:', dayOfWeek]);
    employeeSheet.appendRow(['']);

    // Add work log header
    employeeSheet.appendRow([
      '',
      'FROM/LOAD TIME',
      'TO/DEL. TIME',
      'TRUCK/EQUIP. #',
      '# OF LOADS',
      'UNIT OF MEAS.',
      'MATERIAL TYPE',
      'SOURCE/SUPPLIER',
      'JOB NAME/DESCRIPTION',
      'JOB #/PHASE #',
      'JOB HOURS'
    ]);

    // Add work log rows
    for (var i = 0; i < workLogRows.length; i++) {
      var workLog = workLogRows[i];
      employeeSheet.appendRow([
        (i + 1),
        workLog.load_time || '',
        workLog.del_time || '',
        workLog.truck_equip || '',
        workLog.num_loads || '',
        workLog.unit_meas || '',
        workLog.material_type || '',
        workLog.source_supplier || '',
        workLog.job_desc || '',
        workLog.job_num || '',
        workLog.job_hours || ''
      ]);
    }

    // Add truck/tractor info
    employeeSheet.appendRow(['']);
    employeeSheet.appendRow(['TRUCK/TRACTOR INFO:']);
    employeeSheet.appendRow(['EQUIPMENT #:', equipmentNum]);
    employeeSheet.appendRow(['BEG-MILES/HRS:', begMiles]);
    employeeSheet.appendRow(['END-MILES/HRS:', endMiles]);
    employeeSheet.appendRow(['TOTAL MILES:', totalMiles]);
    employeeSheet.appendRow(['FUEL GALLONS:', fuelGallons]);

    // Add safety info
    employeeSheet.appendRow(['']);
    employeeSheet.appendRow(['WERE YOU INJURED ON THE JOB TODAY?', injured]);
    if (injuryDetails) {
      employeeSheet.appendRow(['INJURY DETAILS:', injuryDetails]);
    }

    // Add signature
    employeeSheet.appendRow(['']);
    employeeSheet.appendRow(['EMPLOYEE SIGNATURE:', signature]);
    employeeSheet.appendRow(['END OF TIME CARD']);

    // Format the employee sheet
    var titleRow = startRow + 2;
    employeeSheet.getRange(titleRow, 1).setFontWeight('bold').setFontSize(12);

    var workLogHeaderRow = startRow + 10 + (managerNotes ? 1 : 0);
    employeeSheet.getRange(workLogHeaderRow, 1, 1, 11).setFontWeight('bold').setBackground('#f3f3f3');

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Time card approved and moved to employee sheet'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Error approving time card: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
