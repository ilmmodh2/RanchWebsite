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

function doGet(e) {
  var icalUrl = 'https://www.airbnb.com/calendar/ical/1058351092745200159.ics?t=4ab9d0b04f744c3587dc86ca317c1549';

  try {
    var response = UrlFetchApp.fetch(icalUrl);
    var icalData = response.getContentText();

    // Parse iCal events
    var events = [];
    var lines = icalData.split('\n');
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
          currentEvent.summary = line.split(':').slice(1).join(':');
        }
      }
    }

    // Convert events to unavailable date ranges
    var unavailableDates = [];
    for (var j = 0; j < events.length; j++) {
      unavailableDates.push({
        start: events[j].start,
        end: events[j].end
      });
    }

    var output = JSON.stringify({ unavailableDates: unavailableDates });

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
  var parts = line.split(':');
  var dateStr = parts[parts.length - 1].trim();

  // Extract just the date part (YYYYMMDD)
  var year = dateStr.substring(0, 4);
  var month = dateStr.substring(4, 6);
  var day = dateStr.substring(6, 8);

  return year + '-' + month + '-' + day;
}
