// =====================================================================
// Snigdha & Pramod Wedding — RSVP Google Apps Script
// =====================================================================
// Deploy as: Web App
//   Execute as: Me
//   Who has access: Anyone
//
// After deploying, copy the Web App URL into your .env.local as:
//   VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_ID/exec
//
// Steps:
// 1. Open Google Sheets, create a new spreadsheet "Wedding RSVPs"
// 2. Extensions > Apps Script
// 3. Paste this code and save
// 4. Deploy > New Deployment > Web App
//    - Execute as: Me
//    - Who has access: Anyone
// 5. Copy the Web App URL into your .env.local
// =====================================================================

var SHEET_NAME = 'RSVPs';

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);

    // Auto-create sheet with header row on first run
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      var header = sheet.getRange(1, 1, 1, 6);
      header.setValues([[
        'Timestamp',
        'Full Name',
        'Email',
        'Number of Guests',
        'Events Attending',
        'Message',
      ]]);
      header.setFontWeight('bold');
      header.setBackground('#7A8C6E');
      header.setFontColor('#FFFFFF');
    }

    // Server-side validation
    if (!data.name || !data.email || !data.guests) {
      return buildResponse({ success: false, error: 'Missing required fields.' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return buildResponse({ success: false, error: 'Invalid email address.' });
    }

    // Append row
    sheet.appendRow([
      new Date().toISOString(),
      String(data.name).trim(),
      String(data.email).trim().toLowerCase(),
      Number(data.guests),
      String(data.events  || '').trim(),
      String(data.message || '').trim(),
    ]);

    // Optional: uncomment to send a confirmation email to the guest
    // MailApp.sendEmail({
    //   to: data.email,
    //   subject: 'RSVP Confirmed — Snigdha & Pramod Wedding',
    //   body:
    //     'Dear ' + data.name + ',\n\n' +
    //     'Thank you for your RSVP! We are so excited to celebrate our garden romance with you.\n\n' +
    //     'With love,\nSnigdha & Pramod',
    // });

    return buildResponse({ success: true, message: 'RSVP recorded. Thank you!' });

  } catch (err) {
    return buildResponse({ success: false, error: 'Server error: ' + err.message });
  }
}

// Health-check endpoint (GET)
function doGet() {
  return buildResponse({ status: 'ok', message: 'Wedding RSVP service is running.' });
}

function buildResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
