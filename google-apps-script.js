// ============================================
// BOIS DE CHENES — Google Apps Script
// iCal Calendar Proxy
// ============================================
//
// DEPLOYMENT INSTRUCTIONS:
// 1. Go to https://script.google.com
// 2. Click "New Project"
// 3. Delete the default code and paste this entire file
// 4. Click "Deploy" → "New Deployment"
// 5. Select type: "Web app"
// 6. Set "Execute as": "Me"
// 7. Set "Who has access": "Anyone"
// 8. Click "Deploy"
// 9. Copy the Web App URL (looks like: https://script.google.com/macros/s/XXXXX/exec)
// 10. Paste that URL into booking.js where it says CALENDAR_PROXY_URL
//
// That's it! The calendar will now auto-sync with your Airbnb bookings.
// ============================================

function doGet() {
  var icalUrl = 'https://www.airbnb.com/calendar/ical/1058351092745200159.ics?t=4ab9d0b04f744c3587dc86ca317c1549';

  try {
    var response = UrlFetchApp.fetch(icalUrl, { muteHttpExceptions: true });
    var icalData = response.getContentText();

    // Unfold RFC 5545 folded lines (lines split with \r\n + space/tab)
    icalData = icalData.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');

    // Split on CRLF or LF
    var lines = icalData.split(/\r\n|\n/);
    var events = [];
    var currentEvent = null;

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();

      if (line === 'BEGIN:VEVENT') {
        currentEvent = {};
      } else if (line === 'END:VEVENT' && currentEvent) {
        if (currentEvent.dtstart && currentEvent.dtend) {
          events.push({
            start: currentEvent.dtstart,
            end: currentEvent.dtend,
            summary: currentEvent.summary || 'Booked'
          });
        }
        currentEvent = null;
      } else if (currentEvent) {
        if (line.indexOf('DTSTART') === 0) {
          currentEvent.dtstart = parseIcalDate(line);
        } else if (line.indexOf('DTEND') === 0) {
          currentEvent.dtend = parseIcalDate(line);
        } else if (line.indexOf('SUMMARY') === 0) {
          currentEvent.summary = line.split(':').slice(1).join(':').trim();
        }
      }
    }

    // Convert events to unavailable date ranges
    // Note: iCal DTEND for all-day events is exclusive (day after checkout),
    // so we subtract one day to get the actual last unavailable date.
    var unavailableDates = [];
    for (var j = 0; j < events.length; j++) {
      var endDate = new Date(events[j].end + 'T00:00:00');
      endDate.setDate(endDate.getDate() - 1);
      var adjustedEnd = endDate.toISOString().split('T')[0];
      unavailableDates.push({
        start: events[j].start,
        end: adjustedEnd
      });
    }

    var output = JSON.stringify({ unavailableDates: unavailableDates, count: events.length });

    return ContentService.createTextOutput(output)
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    var errorOutput = JSON.stringify({ error: error.toString(), unavailableDates: [] });
    return ContentService.createTextOutput(errorOutput)
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function parseIcalDate(line) {
  // Handle formats like:
  // DTSTART;VALUE=DATE:20260315
  // DTSTART:20260315T140000Z
  // DTSTART;TZID=America/Chicago:20260315T140000
  var colonIdx = line.lastIndexOf(':');
  var dateStr = line.substring(colonIdx + 1).trim();

  // Extract just the date part (YYYYMMDD)
  var year = dateStr.substring(0, 4);
  var month = dateStr.substring(4, 6);
  var day = dateStr.substring(6, 8);

  return year + '-' + month + '-' + day;
}
