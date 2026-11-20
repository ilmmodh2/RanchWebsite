// Vercel serverless function: proxies the Airbnb iCal feed and returns
// booked date ranges as JSON for the booking page calendar.
// GET /api/calendar -> { unavailableDates: [{ start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }] }
// `end` is the checkout day (exclusive), matching iCal DTEND semantics.

const ICAL_URL = 'https://www.airbnb.com/calendar/ical/1058351092745200159.ics?t=4ab9d0b04f744c3587dc86ca317c1549';

function parseIcalDate(line) {
    // DTSTART;VALUE=DATE:20260315  or  DTSTART:20260315T140000Z
    const value = line.split(':').pop().trim();
    return value.slice(0, 4) + '-' + value.slice(4, 6) + '-' + value.slice(6, 8);
}

function parseIcal(text) {
    const ranges = [];
    let current = null;
    for (const raw of text.split(/\r?\n/)) {
        const line = raw.trim();
        if (line === 'BEGIN:VEVENT') {
            current = {};
        } else if (line === 'END:VEVENT') {
            if (current && current.start && current.end) ranges.push(current);
            current = null;
        } else if (current) {
            if (line.startsWith('DTSTART')) current.start = parseIcalDate(line);
            else if (line.startsWith('DTEND')) current.end = parseIcalDate(line);
        }
    }
    return ranges;
}

module.exports = async (req, res) => {
    try {
        const response = await fetch(ICAL_URL);
        if (!response.ok) throw new Error('Airbnb iCal HTTP ' + response.status);
        const unavailableDates = parseIcal(await response.text());
        // Cache at Vercel's edge for 10 minutes, serve stale while refreshing.
        res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=3600');
        res.status(200).json({ unavailableDates });
    } catch (err) {
        res.setHeader('Cache-Control', 'no-store');
        res.status(502).json({ error: String(err), unavailableDates: [] });
    }
};
