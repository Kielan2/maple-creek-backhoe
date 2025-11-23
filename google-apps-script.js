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
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    // Check if this is the first submission (no headers)
    var lastRow = sheet.getLastRow();
    if (lastRow === 0) {
      // Add headers
      sheet.appendRow([
        'Timestamp',
        'Employee Name',
        'Date',
        'Day of Week',
        'Load Time',
        'Del Time',
        'Truck/Equip #',
        '# of Loads',
        'Unit of Meas.',
        'Material Type',
        'Source/Supplier',
        'Job Name/Desc.',
        'Job #/Phase #',
        'Hours',
        'Equipment #',
        'Beg-Miles/Hrs',
        'End-Miles/Hrs',
        'Total Miles',
        'Fuel Gallons',
        'Injured',
        'Injury Details',
        'Signature'
      ]);
    }

    // Process each work log row
    var workLogRows = data.work_log_rows || [];

    if (workLogRows.length === 0) {
      // If no work log rows, add a single entry with just the basic info
      workLogRows = [{}];
    }

    // Add a row for each work log entry
    for (var i = 0; i < workLogRows.length; i++) {
      var workLog = workLogRows[i];

      var row = [
        new Date(), // Timestamp
        data.employee_name || '',
        data.date || '',
        data.day_of_week || '',
        workLog.load_time || '',
        workLog.del_time || '',
        workLog.truck_equip || '',
        workLog.num_loads || '',
        workLog.unit_meas || '',
        workLog.material_type || '',
        workLog.source_supplier || '',
        workLog.job_desc || '',
        workLog.job_num || '',
        workLog.job_hours || '',
        data.equipment_num || '',
        data.beg_miles || '',
        data.end_miles || '',
        data.total_miles || '',
        data.fuel_gallons || '',
        data.injured || '',
        data.injury_details || '',
        data.signature || ''
      ];

      sheet.appendRow(row);
    }

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

/**
 * Optional: Test function to verify the script works
 * Run this function in the Apps Script editor to test
 */
function testDoPost() {
  var testData = {
    postData: {
      contents: JSON.stringify({
        employee_name: 'Test Employee',
        date: '2025-11-22',
        day_of_week: 'Friday',
        work_log_rows: [
          {
            load_time: '08:00',
            del_time: '09:00',
            truck_equip: 'Truck 1',
            num_loads: '5',
            unit_meas: 'tons',
            material_type: 'gravel',
            source_supplier: 'Acme Supply',
            job_desc: 'Road work',
            job_num: 'JOB-001',
            job_hours: '1'
          }
        ],
        equipment_num: 'T-123',
        beg_miles: '1000',
        end_miles: '1050',
        total_miles: '50',
        fuel_gallons: '10',
        injured: 'no',
        injury_details: '',
        signature: 'Test Employee'
      })
    }
  };

  var result = doPost(testData);
  Logger.log(result.getContent());
}

