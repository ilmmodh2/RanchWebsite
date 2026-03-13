/* ============================================
   BOIS DE CHENES — Booking Page Scripts
   Calendar Sync + Formspree Email
   ============================================ */

gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {

    // =====================
    // CONFIG
    // =====================

    // Formspree endpoint for email submissions
    const FORMSPREE_URL = 'https://formspree.io/f/xvzwadky';

    // Google Apps Script proxy URL for Airbnb calendar sync
    // INSTRUCTIONS: Deploy the google-apps-script.js file to Google Apps Script,
    // then paste your Web App URL below. Until then, it uses fallback dates.
    const CALENDAR_PROXY_URL = 'https://script.google.com/macros/s/AKfycbyTAGBP7MN9fknRhkD5ZX_Dw2QcCYe9iPx_ZRHbAWW_9KwzJWDEflC-amlvmjtlbaZh/exec';  // Paste your Google Apps Script URL here

    // =====================
    // MOBILE MENU
    // =====================
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
    });

    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // =====================
    // ENTRANCE ANIMATIONS
    // =====================
    gsap.set('.booking-hero .section-label', { opacity: 0, y: 20 });

    const heroTl = gsap.timeline({ delay: 0.2 });
    heroTl
        .to('.booking-hero .section-label', {
            opacity: 1, y: 0, duration: 0.6, ease: 'power3.out'
        })
        .to('.booking-hero-title', {
            opacity: 1, y: 0, duration: 0.8, ease: 'power3.out'
        }, '-=0.3')
        .to('.booking-hero-subtitle', {
            opacity: 1, y: 0, duration: 0.6, ease: 'power3.out'
        }, '-=0.3');

    gsap.utils.toArray('.booking-option-card').forEach((card, i) => {
        gsap.to(card, {
            opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
            scrollTrigger: {
                trigger: card, start: 'top 88%',
                toggleActions: 'play none none reverse'
            },
            delay: i * 0.15
        });
    });

    gsap.to('.booking-form', {
        opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
        scrollTrigger: {
            trigger: '.booking-form', start: 'top 85%',
            toggleActions: 'play none none reverse'
        }
    });

    gsap.from('.form-header', {
        opacity: 0, y: 30, duration: 0.8, ease: 'power3.out',
        scrollTrigger: {
            trigger: '.form-header', start: 'top 85%',
            toggleActions: 'play none none reverse'
        }
    });

    // =====================
    // AVAILABILITY CALENDAR
    // =====================
    const unavailableDates = new Set();

    function addUnavailableRange(startStr, endStr) {
        const start = new Date(startStr + 'T00:00:00');
        const end = new Date(endStr + 'T00:00:00');
        const d = new Date(start);
        while (d <= end) {
            unavailableDates.add(d.toISOString().split('T')[0]);
            d.setDate(d.getDate() + 1);
        }
    }

    // Fetch unavailable dates from Airbnb via Google Apps Script proxy
    async function fetchAirbnbCalendar() {
        if (!CALENDAR_PROXY_URL) {
            console.log('No calendar proxy URL configured.');
            return;
        }

        try {
            const response = await fetch(CALENDAR_PROXY_URL);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();

            // Always clear existing dates and apply live data (even if 0 bookings)
            unavailableDates.clear();

            if (data.unavailableDates && data.unavailableDates.length > 0) {
                data.unavailableDates.forEach(range => {
                    addUnavailableRange(range.start, range.end);
                });
                console.log(`Synced ${data.unavailableDates.length} booking(s) from Airbnb`);
            } else {
                console.log('Airbnb calendar synced — no current bookings blocked.');
            }

            renderCalendars();
        } catch (err) {
            console.warn('Could not fetch Airbnb calendar:', err);
        }
    }

    // No hardcoded fallback dates — live Airbnb sync handles all blocked dates.

    const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentMonth = today.getMonth();
    let currentYear = today.getFullYear();
    let checkInDate = null;
    let checkOutDate = null;
    let selectingCheckOut = false;

    const cal1 = document.getElementById('calendarMonth1');
    const cal2 = document.getElementById('calendarMonth2');
    const displayCheckIn = document.getElementById('displayCheckIn');
    const displayCheckOut = document.getElementById('displayCheckOut');
    const hiddenCheckIn = document.getElementById('checkIn');
    const hiddenCheckOut = document.getElementById('checkOut');

    function formatDateDisplay(date) {
        return `${MONTH_NAMES[date.getMonth()].slice(0, 3)} ${date.getDate()}, ${date.getFullYear()}`;
    }

    function formatDateISO(date) {
        return date.toISOString().split('T')[0];
    }

    function isUnavailable(date) {
        return unavailableDates.has(formatDateISO(date));
    }

    function isPast(date) {
        return date < today;
    }

    function isInRange(date) {
        if (!checkInDate || !checkOutDate) return false;
        return date > checkInDate && date < checkOutDate;
    }

    function hasUnavailableInRange(start, end) {
        const d = new Date(start);
        d.setDate(d.getDate() + 1);
        while (d < end) {
            if (isUnavailable(d)) return true;
            d.setDate(d.getDate() + 1);
        }
        return false;
    }

    function renderMonth(container, year, month, showNav) {
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        let html = `<div class="calendar-header">`;
        if (showNav === 'left') {
            html += `<button class="calendar-nav" data-dir="-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>`;
        } else {
            html += `<span></span>`;
        }
        html += `<h4>${MONTH_NAMES[month]} ${year}</h4>`;
        if (showNav === 'right') {
            html += `<button class="calendar-nav" data-dir="1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>`;
        } else {
            html += `<span></span>`;
        }
        html += `</div>`;

        html += `<div class="calendar-weekdays">`;
        DAY_NAMES.forEach(d => {
            html += `<div class="calendar-weekday">${d}</div>`;
        });
        html += `</div>`;

        html += `<div class="calendar-days">`;

        for (let i = 0; i < firstDay; i++) {
            html += `<div class="calendar-day empty"></div>`;
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = formatDateISO(date);
            let classes = 'calendar-day';

            if (isPast(date)) {
                classes += ' past';
            } else if (isUnavailable(date)) {
                classes += ' unavailable';
            }

            if (dateStr === formatDateISO(today)) {
                classes += ' today';
            }

            if (checkInDate && dateStr === formatDateISO(checkInDate)) {
                classes += ' selected range-start';
                if (checkOutDate && dateStr === formatDateISO(checkOutDate)) {
                    classes += ' range-end';
                }
            }

            if (checkOutDate && dateStr === formatDateISO(checkOutDate)) {
                classes += ' selected range-end';
            }

            if (isInRange(date) && !isUnavailable(date)) {
                classes += ' in-range';
            }

            html += `<div class="${classes}" data-date="${dateStr}">${day}</div>`;
        }

        html += `</div>`;
        container.innerHTML = html;

        container.querySelectorAll('.calendar-nav').forEach(btn => {
            btn.addEventListener('click', () => {
                const dir = parseInt(btn.dataset.dir);
                currentMonth += dir;
                if (currentMonth > 11) { currentMonth = 0; currentYear++; }
                if (currentMonth < 0) { currentMonth = 11; currentYear--; }
                renderCalendars();
            });
        });

        container.querySelectorAll('.calendar-day:not(.empty):not(.past):not(.unavailable)').forEach(dayEl => {
            dayEl.addEventListener('click', () => {
                const clickedDate = new Date(dayEl.dataset.date + 'T00:00:00');
                handleDateClick(clickedDate);
            });
        });
    }

    function handleDateClick(date) {
        if (!selectingCheckOut || !checkInDate || date <= checkInDate) {
            checkInDate = date;
            checkOutDate = null;
            selectingCheckOut = true;
        } else {
            if (hasUnavailableInRange(checkInDate, date)) {
                checkInDate = date;
                checkOutDate = null;
                selectingCheckOut = true;
            } else {
                checkOutDate = date;
                selectingCheckOut = false;
            }
        }

        updateDateDisplay();
        renderCalendars();
    }

    function updateDateDisplay() {
        if (checkInDate) {
            displayCheckIn.textContent = formatDateDisplay(checkInDate);
            displayCheckIn.classList.add('has-date');
            hiddenCheckIn.value = formatDateISO(checkInDate);
        } else {
            displayCheckIn.textContent = 'Select a date';
            displayCheckIn.classList.remove('has-date');
            hiddenCheckIn.value = '';
        }

        if (checkOutDate) {
            displayCheckOut.textContent = formatDateDisplay(checkOutDate);
            displayCheckOut.classList.add('has-date');
            hiddenCheckOut.value = formatDateISO(checkOutDate);
        } else {
            displayCheckOut.textContent = selectingCheckOut ? 'Select check-out' : 'Select a date';
            displayCheckOut.classList.remove('has-date');
            hiddenCheckOut.value = '';
        }
    }

    function renderCalendars() {
        let month2 = currentMonth + 1;
        let year2 = currentYear;
        if (month2 > 11) { month2 = 0; year2++; }

        renderMonth(cal1, currentYear, currentMonth, 'left');
        renderMonth(cal2, year2, month2, 'right');
    }

    // Initial render, then fetch live Airbnb data
    renderCalendars();
    fetchAirbnbCalendar();

    // =====================
    // PHONE FORMATTING
    // =====================
    const phoneInput = document.getElementById('phone');
    phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 10) value = value.slice(0, 10);
        if (value.length >= 6) {
            value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6)}`;
        } else if (value.length >= 3) {
            value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
        }
        e.target.value = value;
    });

    // =====================
    // FORM SUBMISSION → FORMSPREE
    // =====================
    const bookingForm = document.getElementById('bookingForm');
    const formSuccess = document.getElementById('formSuccess');
    const submitBtn = bookingForm.querySelector('.btn-submit');

    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate dates
        if (!checkInDate || !checkOutDate) {
            alert('Please select both check-in and check-out dates from the calendar.');
            return;
        }

        if (checkOutDate <= checkInDate) {
            alert('Check-out must be after check-in.');
            return;
        }

        // Show loading state
        const originalText = submitBtn.querySelector('span').textContent;
        submitBtn.querySelector('span').textContent = 'Sending...';
        submitBtn.disabled = true;

        // Build form data
        const formData = new FormData(bookingForm);
        formData.set('checkIn', formatDateDisplay(checkInDate));
        formData.set('checkOut', formatDateDisplay(checkOutDate));
        formData.set('weddingInterest', document.getElementById('weddingInterest').checked ? 'Yes' : 'No');

        // Calculate nights
        const nights = Math.round((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
        formData.set('nights', nights + ' night(s)');

        try {
            const response = await fetch(FORMSPREE_URL, {
                method: 'POST',
                body: formData,
                headers: { 'Accept': 'application/json' }
            });

            if (response.ok) {
                // Success — show confirmation
                bookingForm.style.display = 'none';
                formSuccess.classList.add('visible');
                formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                const data = await response.json();
                const errorMsg = data.errors ? data.errors.map(e => e.message).join(', ') : 'Something went wrong.';
                alert('Submission failed: ' + errorMsg);
                submitBtn.querySelector('span').textContent = originalText;
                submitBtn.disabled = false;
            }
        } catch (err) {
            alert('Network error. Please try again or book through Airbnb.');
            submitBtn.querySelector('span').textContent = originalText;
            submitBtn.disabled = false;
        }
    });

    // =====================
    // SMOOTH SCROLL
    // =====================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            e.preventDefault();
            const target = document.querySelector(targetId);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

});
