/**
 * Google Apps Script for Employee Management and Time Card System
 * SECURE VERSION with AUTOMATIC Password Hashing and Token-Based Authentication
 *
 * SETUP INSTRUCTIONS:
 *
 * This script handles SIX main functions:
 * 1. Employee Names (GET request to fetch employee names only - NO PASSWORDS)
 * 2. Authentication (POST request with action=login to authenticate and get session token)
 * 3. Time Card Submissions (POST request with valid token to save time cards)
 * 4. Manager Dashboard (GET request with ?action=getAll&token=xxx to retrieve time cards)
 * 5. Manager Approval (POST request with action=approve and valid token)
 * 6. Manager Update (POST request with action=update and valid token to edit notes/invoice)
 * 7. AUTO-HASH: Automatically hashes passwords when you edit the Employees sheet!
 *
 * SPREADSHEET SETUP - EASY MODE:
 * - Sheet 1: "Employees" - Contains employee login information
 *   Columns: Name | Password | Role
 *
 *   Simply enter plain-text passwords - they will be AUTOMATICALLY hashed!
 *
 *   Example - Just type this:
 *     John Doe   | 1234     | Driver
 *     Jane Smith | password | Manager
 *
 *   The system will automatically convert to:
 *     John Doe   | 03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4 | Driver
 *     Jane Smith | 5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8 | Manager
 *
 * HOW IT WORKS:
 * - When you edit a password in the Employees sheet, it's automatically hashed
 * - SHA-256 hashes are 64 characters long, so the script knows what's already hashed
 * - To change a password, just type the new password - it will auto-hash
 * - The original password is replaced with its hash immediately
 *
 * - Other Sheets:
 *   - "Sessions" - Stores active session tokens (auto-created)
 *   - "Master" - All submitted time cards (auto-created on first submission)
 *
 * DEPLOYMENT:
 * 1. Open your Google Sheet
 * 2. Go to Extensions → Apps Script
 * 3. Delete any default code
 * 4. Paste this entire file
 * 5. Save the project (name it "Employee Time Card System - Auto Hash")
 * 6. Click Deploy → New deployment
 * 7. Click "Select type" → Web app
 * 8. Configure:
 *    - Description: "Employee Time Card System v2 - Auto Hash"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone"
 * 9. Click "Deploy"
 * 10. Copy the Web App URL
 * 11. Update both API URLs in employee.html with the SAME URL
 *
 * ADDING NEW EMPLOYEES:
 * 1. Open the "Employees" sheet
 * 2. Add a new row with: Name | Password | Role
 * 3. The password will automatically hash when you press Enter or move to another cell
 * 4. Done! The employee can now log in with that password
 */

/**
 * AUTO-HASH TRIGGER - Runs automatically when the sheet is edited
 * This converts plain-text passwords to SHA-256 hashes automatically
 */
function onEdit(e) {
  try {
    var sheet = e.source.getActiveSheet();
    var range = e.range;

    // Only process edits to the "Employees" sheet
    if (sheet.getName() !== 'Employees') {
      return;
    }

    // Only process edits to column B (Password column, assuming A=Name, B=Password, C=Role)
    if (range.getColumn() !== 2) {
      return;
    }

    // Skip if editing the header row
    if (range.getRow() === 1) {
      return;
    }

    var value = range.getValue();

    // Skip if empty
    if (!value || value === '') {
      return;
    }

    // Convert to string
    var password = String(value).trim();

    // Check if already hashed (SHA-256 hashes are exactly 64 characters and hex)
    if (password.length === 64 && /^[a-f0-9]+$/i.test(password)) {
      // Already hashed, don't re-hash
      return;
    }

    // Hash the password
    var hashedPassword = hashPassword(password);

    // Update the cell with the hashed password
    range.setValue(hashedPassword);

    // Optional: Show a toast notification
    SpreadsheetApp.getActiveSpreadsheet().toast(
      'Password automatically hashed for security',
      'Auto-Hash Active',
      3
    );

  } catch (error) {
    // Fail silently to avoid interrupting user's workflow
    Logger.log('Auto-hash error: ' + error.toString());
  }
}

/**
 * Handles GET requests for employee data and manager dashboard
 */
function doGet(e) {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var action = e.parameter.action || 'getEmployeeNames';

    // Handle different GET request types
    if (action === 'getAll') {
      // Manager Dashboard: Get all pending time cards from Master sheet
      // Requires valid session token
      var token = e.parameter.token || '';
      if (!validateToken(token, spreadsheet)) {
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: 'Unauthorized: Invalid or expired session token'
        })).setMimeType(ContentService.MimeType.JSON);
      }
      return getAllTimeCards(spreadsheet);
    } else if (action === 'getEmployeeNames') {
      // Default: Get ONLY employee names (no passwords)
      return getEmployeeNames(spreadsheet);
    } else {
      // Legacy support - but don't return passwords
      return getEmployeeNames(spreadsheet);
    }

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Error processing request: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Gets ONLY employee names (no passwords) from the "Employees" sheet
 * This is safe to call from the client
 */
function getEmployeeNames(spreadsheet) {
  try {
    var employeeSheet = spreadsheet.getSheetByName('Employees');

    if (!employeeSheet) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Employees sheet not found. Please create a sheet named "Employees" with columns: Name, PasswordHash, Role'
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

      // ONLY return name - NO PASSWORD DATA
      var employee = {
        Name: row[0] || ''
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
 * Hashes a password using SHA-256
 */
function hashPassword(password) {
  var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
  var hash = '';
  for (var i = 0; i < rawHash.length; i++) {
    var byte = rawHash[i];
    if (byte < 0) byte += 256;
    var hexByte = byte.toString(16);
    if (hexByte.length == 1) hexByte = '0' + hexByte;
    hash += hexByte;
  }
  return hash;
}

/**
 * Authenticates a user and returns a session token
 */
function authenticateUser(username, passwordHash, spreadsheet) {
  try {
    var employeeSheet = spreadsheet.getSheetByName('Employees');

    if (!employeeSheet) {
      return {
        success: false,
        error: 'Employees sheet not found'
      };
    }

    var dataRange = employeeSheet.getDataRange();
    var values = dataRange.getValues();

    // Find the employee
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      var name = row[0] || '';
      var storedHash = row[1] || '';
      var role = row[2] || '';

      if (name === username) {
        // Compare password hashes
        if (storedHash === passwordHash) {
          // Generate session token
          var token = generateToken(username, role);

          // Store token in Sessions sheet
          storeToken(token, username, role, spreadsheet);

          return {
            success: true,
            token: token,
            name: username,
            role: role
          };
        } else {
          return {
            success: false,
            error: 'Invalid password'
          };
        }
      }
    }

    return {
      success: false,
      error: 'User not found'
    };

  } catch (error) {
    return {
      success: false,
      error: 'Authentication error: ' + error.toString()
    };
  }
}

/**
 * Generates a secure session token
 */
function generateToken(username, role) {
  var timestamp = new Date().getTime();
  var random = Utilities.getUuid();
  var tokenData = username + '|' + role + '|' + timestamp + '|' + random;
  return Utilities.base64Encode(tokenData);
}

/**
 * Stores a session token with expiration
 */
function storeToken(token, username, role, spreadsheet) {
  var sessionsSheet = spreadsheet.getSheetByName('Sessions');

  if (!sessionsSheet) {
    sessionsSheet = spreadsheet.insertSheet('Sessions');
    sessionsSheet.appendRow(['Token', 'Username', 'Role', 'Created', 'Expires']);
    var headerRange = sessionsSheet.getRange(1, 1, 1, 5);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#f3f3f3');
  }

  var now = new Date();
  var expires = new Date(now.getTime() + (8 * 60 * 60 * 1000)); // 8 hours

  sessionsSheet.appendRow([token, username, role, now, expires]);

  // Clean up old tokens (older than 24 hours)
  cleanupExpiredTokens(sessionsSheet);
}

/**
 * Validates a session token
 */
function validateToken(token, spreadsheet) {
  try {
    var sessionsSheet = spreadsheet.getSheetByName('Sessions');

    if (!sessionsSheet) {
      return false;
    }

    var dataRange = sessionsSheet.getDataRange();
    var values = dataRange.getValues();

    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      var storedToken = row[0];
      var expires = new Date(row[4]);
      var now = new Date();

      if (storedToken === token && expires > now) {
        return true;
      }
    }

    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Gets user info from token
 */
function getUserFromToken(token, spreadsheet) {
  try {
    var sessionsSheet = spreadsheet.getSheetByName('Sessions');

    if (!sessionsSheet) {
      return null;
    }

    var dataRange = sessionsSheet.getDataRange();
    var values = dataRange.getValues();

    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      var storedToken = row[0];
      var username = row[1];
      var role = row[2];
      var expires = new Date(row[4]);
      var now = new Date();

      if (storedToken === token && expires > now) {
        return {
          username: username,
          role: role
        };
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Cleans up expired tokens
 */
function cleanupExpiredTokens(sessionsSheet) {
  try {
    var dataRange = sessionsSheet.getDataRange();
    var values = dataRange.getValues();
    var now = new Date();
    var rowsToDelete = [];

    // Find expired tokens (from bottom to top to preserve row indices)
    for (var i = values.length - 1; i > 0; i--) {
      var expires = new Date(values[i][4]);
      if (expires < now) {
        rowsToDelete.push(i + 1); // +1 because sheet rows are 1-indexed
      }
    }

    // Delete expired rows
    for (var j = 0; j < rowsToDelete.length; j++) {
      sessionsSheet.deleteRow(rowsToDelete[j]);
    }
  } catch (error) {
    // Fail silently - this is just cleanup
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

      // Format date as YYYY-MM-DD for HTML date input
      var dateValue = row[3];
      var formattedDate = '';
      if (dateValue) {
        if (dateValue instanceof Date) {
          var year = dateValue.getFullYear();
          var month = String(dateValue.getMonth() + 1).padStart(2, '0');
          var day = String(dateValue.getDate()).padStart(2, '0');
          formattedDate = year + '-' + month + '-' + day;
        } else {
          // If it's already a string, try to parse and reformat it
          formattedDate = String(dateValue);
        }
      }

      // Format time as HH:MM for HTML time input
      var timeInValue = row[5];
      var formattedTimeIn = '';
      if (timeInValue) {
        if (timeInValue instanceof Date) {
          var hours = String(timeInValue.getHours()).padStart(2, '0');
          var minutes = String(timeInValue.getMinutes()).padStart(2, '0');
          formattedTimeIn = hours + ':' + minutes;
        } else {
          formattedTimeIn = String(timeInValue);
        }
      }

      var timeOutValue = row[6];
      var formattedTimeOut = '';
      if (timeOutValue) {
        if (timeOutValue instanceof Date) {
          var hours = String(timeOutValue.getHours()).padStart(2, '0');
          var minutes = String(timeOutValue.getMinutes()).padStart(2, '0');
          formattedTimeOut = hours + ':' + minutes;
        } else {
          formattedTimeOut = String(timeOutValue);
        }
      }

      var timeCard = {
        row_number: actualRowNumber, // Store the actual row number in the sheet
        submission_id: row[0] || '',
        timestamp: row[1] || '',
        employee_name: row[2] || '',
        date: formattedDate,
        day_of_week: row[4] || '',
        time_in: formattedTimeIn,
        time_out: formattedTimeOut,
        equipment_num: row[7] || '',
        beg_miles: row[8] || '',
        end_miles: row[9] || '',
        utah_miles: row[10] || '',
        idaho_miles: row[11] || '',
        wyoming_miles: row[12] || '',
        total_miles: row[13] || '',
        fuel_gallons: row[14] || '',
        truck_defects: row[15] || '',
        trailer_defects: row[16] || '',
        defect_remarks: row[17] || '',
        injured: row[18] || 'no',
        injury_details: row[19] || '',
        signature: row[20] || '',
        work_log_json: row[21] || '[]',
        status: row[22] || 'Pending',
        manager_notes: row[23] || '',
        invoice_num: row[24] || ''
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
 * Handles POST requests for authentication, time card submissions and approvals
 */
function doPost(e) {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    // Parse the request
    var data;
    if (e.postData && e.postData.type === 'application/json') {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter && e.parameter.payload) {
      // Handle payload parameter (used to avoid CORS preflight)
      data = JSON.parse(e.parameter.payload);
    } else {
      data = e.parameter;
    }

    var action = data.action || '';

    if (action === 'login') {
      // Handle login request
      var username = data.username || '';
      var passwordHash = data.passwordHash || '';

      var result = authenticateUser(username, passwordHash, spreadsheet);

      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);

    } else if (action === 'approve') {
      // Validate token before approving
      var token = data.token || '';
      if (!validateToken(token, spreadsheet)) {
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: 'Unauthorized: Invalid or expired session token'
        })).setMimeType(ContentService.MimeType.JSON);
      }
      return approveTimeCard(e, spreadsheet);

    } else if (action === 'update') {
      // Validate token before updating
      var token = data.token || '';
      if (!validateToken(token, spreadsheet)) {
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: 'Unauthorized: Invalid or expired session token'
        })).setMimeType(ContentService.MimeType.JSON);
      }
      return updateTimeCard(e, spreadsheet);

    } else {
      // Time card submission - validate token
      var token = data.token || '';
      if (!validateToken(token, spreadsheet)) {
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: 'Unauthorized: Please log in again'
        })).setMimeType(ContentService.MimeType.JSON);
      }
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
    } else if (e.parameter && e.parameter.payload) {
      // Handle payload parameter (used to avoid CORS preflight)
      data = JSON.parse(e.parameter.payload);
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

      // Reconstruct truck_defects array from form data
      // jQuery sends arrays as truck_defects[] parameter
      if (data['truck_defects[]'] !== undefined) {
        var truckDefectsParam = data['truck_defects[]'];
        // Could be a single string or already an array
        data.truck_defects = Array.isArray(truckDefectsParam) ? truckDefectsParam : [truckDefectsParam];
      }

      // Reconstruct trailer_defects array from form data
      if (data['trailer_defects[]'] !== undefined) {
        var trailerDefectsParam = data['trailer_defects[]'];
        data.trailer_defects = Array.isArray(trailerDefectsParam) ? trailerDefectsParam : [trailerDefectsParam];
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
        'Time In',
        'Time Out',
        'Equipment #',
        'Beg Miles/Hrs',
        'End Miles/Hrs',
        'Utah Miles',
        'Idaho Miles',
        'Wyoming Miles',
        'Total Miles',
        'Fuel Gallons',
        'Truck Defects',
        'Trailer Defects',
        'Defect Remarks',
        'Injured',
        'Injury Details',
        'Signature',
        'Work Log JSON',
        'Status',
        'Manager Notes',
        'Invoice #'
      ]);

      // Format header row
      var headerRange = masterSheet.getRange(1, 1, 1, 25);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#f3f3f3');
    }

    // Generate unique submission ID
    var submissionId = 'TC-' + new Date().getTime();
    var timestamp = new Date();

    // Convert work_log_rows to JSON string
    var workLogJson = JSON.stringify(data.work_log_rows || []);

    // Debug logging
    Logger.log('=== submitTimeCard Debug ===');
    Logger.log('data.truck_defects: ' + JSON.stringify(data.truck_defects));
    Logger.log('data[truck_defects[]]: ' + JSON.stringify(data['truck_defects[]']));
    Logger.log('data.trailer_defects: ' + JSON.stringify(data.trailer_defects));
    Logger.log('data[trailer_defects[]]: ' + JSON.stringify(data['trailer_defects[]']));

    // Convert defect arrays to comma-separated strings
    var truckDefects = Array.isArray(data.truck_defects) ? data.truck_defects.join(', ') : (data.truck_defects || '');
    var trailerDefects = Array.isArray(data.trailer_defects) ? data.trailer_defects.join(', ') : (data.trailer_defects || '');

    Logger.log('truckDefects string: ' + truckDefects);
    Logger.log('trailerDefects string: ' + trailerDefects);

    // Add the time card as a single row
    masterSheet.appendRow([
      submissionId,
      timestamp,
      data.employee_name || '',
      data.date || '',
      data.day_of_week || '',
      data.time_in || '',
      data.time_out || '',
      data.equipment_num || '',
      data.beg_miles || '',
      data.end_miles || '',
      data.utah_miles || '',
      data.idaho_miles || '',
      data.wyoming_miles || '',
      data.total_miles || '',
      data.fuel_gallons || '',
      truckDefects,
      trailerDefects,
      data.defect_remarks || '',
      data.injured || 'no',
      data.injury_details || '',
      data.signature || '',
      workLogJson,
      'Pending',
      '',  // Manager Notes
      ''   // Invoice #
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
 * Approves a time card: saves all edits, marks as approved
 */
function approveTimeCard(e, spreadsheet) {
  try {
    var data;
    if (e.postData && e.postData.type === 'application/json') {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter && e.parameter.payload) {
      data = JSON.parse(e.parameter.payload);
    } else {
      data = e.parameter;
    }

    var submissionId = data.submission_id;

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

    // Convert defect arrays to comma-separated strings (handles both array and string input)
    var truckDefects = Array.isArray(data.truck_defects) ? data.truck_defects.join(', ') : (data.truck_defects || '');
    var trailerDefects = Array.isArray(data.trailer_defects) ? data.trailer_defects.join(', ') : (data.trailer_defects || '');

    // Update all editable fields in Master sheet before approving
    masterSheet.getRange(rowNumber, 3).setValue(data.employee_name || '');
    masterSheet.getRange(rowNumber, 4).setValue(data.date || '');
    masterSheet.getRange(rowNumber, 5).setValue(data.day_of_week || '');
    masterSheet.getRange(rowNumber, 6).setValue(data.time_in || '');
    masterSheet.getRange(rowNumber, 7).setValue(data.time_out || '');
    masterSheet.getRange(rowNumber, 8).setValue(data.equipment_num || '');
    masterSheet.getRange(rowNumber, 9).setValue(data.beg_miles || '');
    masterSheet.getRange(rowNumber, 10).setValue(data.end_miles || '');
    masterSheet.getRange(rowNumber, 11).setValue(data.utah_miles || '');
    masterSheet.getRange(rowNumber, 12).setValue(data.idaho_miles || '');
    masterSheet.getRange(rowNumber, 13).setValue(data.wyoming_miles || '');
    masterSheet.getRange(rowNumber, 14).setValue(data.total_miles || '');
    masterSheet.getRange(rowNumber, 15).setValue(data.fuel_gallons || '');
    masterSheet.getRange(rowNumber, 16).setValue(truckDefects);
    masterSheet.getRange(rowNumber, 17).setValue(trailerDefects);
    masterSheet.getRange(rowNumber, 18).setValue(data.defect_remarks || '');
    masterSheet.getRange(rowNumber, 19).setValue(data.injured || 'no');
    masterSheet.getRange(rowNumber, 20).setValue(data.injury_details || '');
    masterSheet.getRange(rowNumber, 21).setValue(data.signature || '');
    masterSheet.getRange(rowNumber, 22).setValue(data.work_log_json || '[]');

    // Set status to Approved and save manager fields
    masterSheet.getRange(rowNumber, 23).setValue('Approved');
    masterSheet.getRange(rowNumber, 24).setValue(data.manager_notes || '');
    masterSheet.getRange(rowNumber, 25).setValue(data.invoice_num || '');

    // COMMENTED OUT: Individual employee sheet functionality
    // All data is now managed in the Master sheet only
    /*
    // Parse the data
    var submissionId = rowData[0];
    var timestamp = rowData[1];
    var employeeName = rowData[2];
    var date = rowData[3];
    var dayOfWeek = rowData[4];
    var equipmentNum = rowData[5];
    var begMiles = rowData[6];
    var endMiles = rowData[7];
    var utahMiles = rowData[8];
    var idahoMiles = rowData[9];
    var wyomingMiles = rowData[10];
    var totalMiles = rowData[11];
    var fuelGallons = rowData[12];
    var injured = rowData[13];
    var injuryDetails = rowData[14];
    var signature = rowData[15];
    var workLogJson = rowData[16];

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
    employeeSheet.appendRow(['UTAH MILES:', utahMiles]);
    employeeSheet.appendRow(['IDAHO MILES:', idahoMiles]);
    employeeSheet.appendRow(['WYOMING MILES:', wyomingMiles]);
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
    */

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Time card approved'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Error approving time card: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Updates all fields for an existing time card (approved or pending)
 */
function updateTimeCard(e, spreadsheet) {
  try {
    var data;
    if (e.postData && e.postData.type === 'application/json') {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter && e.parameter.payload) {
      data = JSON.parse(e.parameter.payload);
    } else {
      data = e.parameter;
    }

    var submissionId = data.submission_id;

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

    // Update all editable fields in Master sheet
    // Column mapping:
    // 1: Submission ID (don't update)
    // 2: Timestamp (don't update)
    // 3: Employee Name
    // 4: Date
    // 5: Day of Week
    // 6: Time In
    // 7: Time Out
    // 8: Equipment #
    // 9: Beg Miles/Hrs
    // 10: End Miles/Hrs
    // 11: Utah Miles
    // 12: Idaho Miles
    // 13: Wyoming Miles
    // 14: Total Miles
    // 15: Fuel Gallons
    // 16: Truck Defects
    // 17: Trailer Defects
    // 18: Defect Remarks
    // 19: Injured
    // 20: Injury Details
    // 21: Signature
    // 22: Work Log JSON
    // 23: Status (don't update here)
    // 24: Manager Notes
    // 25: Invoice #

    // Convert defect arrays to comma-separated strings (handles both array and string input)
    var truckDefects = Array.isArray(data.truck_defects) ? data.truck_defects.join(', ') : (data.truck_defects || '');
    var trailerDefects = Array.isArray(data.trailer_defects) ? data.trailer_defects.join(', ') : (data.trailer_defects || '');

    masterSheet.getRange(rowNumber, 3).setValue(data.employee_name || '');
    masterSheet.getRange(rowNumber, 4).setValue(data.date || '');
    masterSheet.getRange(rowNumber, 5).setValue(data.day_of_week || '');
    masterSheet.getRange(rowNumber, 6).setValue(data.time_in || '');
    masterSheet.getRange(rowNumber, 7).setValue(data.time_out || '');
    masterSheet.getRange(rowNumber, 8).setValue(data.equipment_num || '');
    masterSheet.getRange(rowNumber, 9).setValue(data.beg_miles || '');
    masterSheet.getRange(rowNumber, 10).setValue(data.end_miles || '');
    masterSheet.getRange(rowNumber, 11).setValue(data.utah_miles || '');
    masterSheet.getRange(rowNumber, 12).setValue(data.idaho_miles || '');
    masterSheet.getRange(rowNumber, 13).setValue(data.wyoming_miles || '');
    masterSheet.getRange(rowNumber, 14).setValue(data.total_miles || '');
    masterSheet.getRange(rowNumber, 15).setValue(data.fuel_gallons || '');
    masterSheet.getRange(rowNumber, 16).setValue(truckDefects);
    masterSheet.getRange(rowNumber, 17).setValue(trailerDefects);
    masterSheet.getRange(rowNumber, 18).setValue(data.defect_remarks || '');
    masterSheet.getRange(rowNumber, 19).setValue(data.injured || 'no');
    masterSheet.getRange(rowNumber, 20).setValue(data.injury_details || '');
    masterSheet.getRange(rowNumber, 21).setValue(data.signature || '');
    masterSheet.getRange(rowNumber, 22).setValue(data.work_log_json || '[]');
    masterSheet.getRange(rowNumber, 24).setValue(data.manager_notes || '');
    masterSheet.getRange(rowNumber, 25).setValue(data.invoice_num || '');

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Time card updated successfully'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Error updating time card: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
