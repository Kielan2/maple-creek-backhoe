/**
 * Google Apps Script for Time Card Submission
 *
 * Instructions:
 * 1. Open your Google Sheet for time card data
 * 2. Go to Extensions → Apps Script
 * 3. Delete any default code
 * 4. Paste this entire file
 * 5. Save the project
 * 6. Deploy → New deployment → Web app
 * 7. Set "Who has access" to "Anyone"
 * 8. Deploy and copy the Web App URL
 * 9. Update the TIMECARD_API_URL in drivers.html with your Web App URL
 */

/**
 * Handles POST requests for time card submissions
 */
function doPost(e) {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    // Parse the incoming data - handle both JSON and form-encoded data
    var data;
    if (e.postData && e.postData.type === 'application/json') {
      data = JSON.parse(e.postData.contents);
    } else {
      // Form-encoded data
      data = e.parameter;

      // Reconstruct work_log_rows array from form data
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

    // Get or create a sheet for this employee
    var employeeName = data.employee_name || 'Unknown Employee';
    var sheet = spreadsheet.getSheetByName(employeeName);

    if (!sheet) {
      // Create a new sheet for this employee
      sheet = spreadsheet.insertSheet(employeeName);
    }

    var workLogRows = data.work_log_rows || [];
    if (workLogRows.length === 0) {
      workLogRows = [{}];
    }

    // Find the next empty row
    var lastRow = sheet.getLastRow();
    var startRow = lastRow + 1;

    // Add a separator/header block for this submission
    sheet.appendRow(['']); // Empty row for spacing
    sheet.appendRow(['MAPLE CREEK BACKHOE SERVICE INC. - EMPLOYEE TIME CARD']);

    // Add employee info block
    sheet.appendRow(['SUBMISSION TIMESTAMP:', new Date()]);
    sheet.appendRow(['EMPLOYEE NAME:', data.employee_name || '']);
    sheet.appendRow(['DATE:', data.date || '']);
    sheet.appendRow(['DAY OF WEEK:', data.day_of_week || '']);
    sheet.appendRow(['']); // Empty row

    // Add work log header
    sheet.appendRow([
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
      sheet.appendRow([
        (i + 1), // Row number
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
    sheet.appendRow(['']); // Empty row
    sheet.appendRow(['TRUCK/TRACTOR INFO:']);
    sheet.appendRow(['EQUIPMENT #:', data.equipment_num || '']);
    sheet.appendRow(['BEG-MILES/HRS:', data.beg_miles || '']);
    sheet.appendRow(['END-MILES/HRS:', data.end_miles || '']);
    sheet.appendRow(['TOTAL MILES:', data.total_miles || '']);
    sheet.appendRow(['FUEL GALLONS:', data.fuel_gallons || '']);

    // Add safety info
    sheet.appendRow(['']); // Empty row
    sheet.appendRow(['WERE YOU INJURED ON THE JOB TODAY?', data.injured || 'no']);
    if (data.injury_details) {
      sheet.appendRow(['INJURY DETAILS:', data.injury_details]);
    }

    // Add signature
    sheet.appendRow(['']); // Empty row
    sheet.appendRow(['EMPLOYEE SIGNATURE:', data.signature || '']);

    // Add a separator line
    var separatorRow = sheet.getLastRow();
    sheet.appendRow(['END OF TIME CARD']);

    // Format the block (make header rows bold)
    // Bold the title
    sheet.getRange(startRow + 2, 1).setFontWeight('bold').setFontSize(12);

    // Bold the section headers
    sheet.getRange(startRow + 8, 1, 1, 11).setFontWeight('bold').setBackground('#f3f3f3');
    sheet.getRange(startRow + 8 + workLogRows.length + 2, 1).setFontWeight('bold');

    // Format separator with black background and white text
    var separatorRange = sheet.getRange(separatorRow + 1, 1, 1, 11);
    separatorRange.setBackground('#000000');
    separatorRange.setFontColor('#FFFFFF');
    separatorRange.setFontWeight('bold');
    separatorRange.setHorizontalAlignment('center');

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Time card submitted successfully',
      rows_added: workLogRows.length
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Error processing submission: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
