/* ============================================
   RANCH 105 — Scroll-Driven Animations
   GSAP + ScrollTrigger — 3 Video Sections
   ============================================ */

gsap.registerPlugin(ScrollTrigger);

// --- Wait for DOM ---
document.addEventListener('DOMContentLoaded', () => {

    // =====================
    // NAVBAR
    // =====================
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    const floatingBtn = document.getElementById('floatingBtn');

    ScrollTrigger.create({
        start: 'top -80',
        onUpdate: () => {
            if (window.scrollY > 80) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
    });

    ScrollTrigger.create({
        start: 'top -500',
        onUpdate: () => {
            if (window.scrollY > 500) {
                floatingBtn.classList.add('visible');
            } else {
                floatingBtn.classList.remove('visible');
            }
        }
    });

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
    // REUSABLE: Scroll-Driven Video Setup
    // =====================
    function setupScrollVideo(videoEl, sectionEl, textConfigs) {
        if (!videoEl || !sectionEl) return;

        const init = () => {
            const duration = videoEl.duration;
            if (!duration || isNaN(duration)) return;

            // Scroll-driven video playback
            ScrollTrigger.create({
                trigger: sectionEl,
                start: 'top top',
                end: 'bottom bottom',
                scrub: 0.5,
                onUpdate: (self) => {
                    const time = self.progress * duration;
                    if (videoEl.readyState >= 2) {
                        videoEl.currentTime = time;
                    }
                }
            });

            // Text overlays
            if (textConfigs && textConfigs.length) {
                textConfigs.forEach(({ el, start, end }) => {
                    const element = document.querySelector(el);
                    if (!element) return;

                    const midIn = start + (end - start) * 0.15;
                    const midOut = end - (end - start) * 0.15;

                    ScrollTrigger.create({
                        trigger: sectionEl,
                        start: 'top top',
                        end: 'bottom bottom',
                        scrub: true,
                        onUpdate: (self) => {
                            const p = self.progress;
                            let opacity = 0;
                            let yOffset = 30;

                            if (p >= start && p <= midIn) {
                                const t = (p - start) / (midIn - start);
                                opacity = t;
                                yOffset = 30 * (1 - t);
                            } else if (p > midIn && p < midOut) {
                                opacity = 1;
                                yOffset = 0;
                            } else if (p >= midOut && p <= end) {
                                const t = (p - midOut) / (end - midOut);
                                opacity = 1 - t;
                                yOffset = -20 * t;
                            }

                            element.style.opacity = opacity;
                            element.style.transform = `translate(-50%, calc(-50% + ${yOffset}px))`;
                        }
                    });
                });
            }
        };

        if (videoEl.readyState >= 1) {
            init();
        } else {
            videoEl.addEventListener('loadedmetadata', init);
        }
        videoEl.load();
    }

    // =====================
    // HERO — Ranch Front Intro (scroll-driven)
    // =====================
    const frontIntroVideo = document.getElementById('frontIntroVideo');
    const heroSection = document.getElementById('heroVideo');

    // Hero entrance animation — subtitle/tagline fade in, name is already visible
    const heroTl = gsap.timeline({ delay: 0.5 });
    heroTl
        .to('.hero-subtitle', {
            opacity: 1, y: 0, duration: 0.8, ease: 'power3.out'
        })
        .to('.hero-tagline', {
            opacity: 1, y: 0, duration: 0.8, ease: 'power3.out'
        }, '-=0.4')
        .to('.hero-scroll-indicator', {
            opacity: 1, y: 0, duration: 0.6, ease: 'power3.out'
        }, '-=0.3');

    // Fade out centered name on scroll
    gsap.to('.hero-name-center', {
        opacity: 0,
        scale: 1.1,
        ease: 'none',
        scrollTrigger: {
            trigger: heroSection,
            start: 'top top',
            end: '40% top',
            scrub: true
        }
    });

    // Fade out bottom content on scroll
    gsap.to('.hero-content', {
        y: -50,
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
            trigger: heroSection,
            start: 'top top',
            end: '40% top',
            scrub: true
        }
    });

    // Scroll-driven front intro video
    setupScrollVideo(frontIntroVideo, heroSection, []);

    // =====================
    // INTRO SECTION
    // =====================
    gsap.utils.toArray('.reveal-text').forEach((el, i) => {
        gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: el,
                start: 'top 85%',
                toggleActions: 'play none none reverse'
            },
            delay: i * 0.15
        });
    });

    // =====================
    // LAZY RIVER — Scroll-driven video
    // =====================
    setupScrollVideo(
        document.getElementById('lazyRiverVideo'),
        document.getElementById('lazyRiverSection'),
        [
            { el: '#lazyText1', start: 0.05, end: 0.45 },
            { el: '#lazyText2', start: 0.55, end: 0.9 }
        ]
    );

    // =====================
    // RANCH MAIN — Full Walkthrough (scroll-driven)
    // =====================
    setupScrollVideo(
        document.getElementById('walkthroughVideo'),
        document.getElementById('walkthroughSection'),
        [
            { el: '#walkText1', start: 0.02, end: 0.2 },
            { el: '#walkText2', start: 0.25, end: 0.45 },
            { el: '#walkText3', start: 0.5, end: 0.7 },
            { el: '#walkText4', start: 0.75, end: 0.95 }
        ]
    );

    // =====================
    // AMENITY CARDS
    // =====================
    gsap.utils.toArray('.amenity-card').forEach((card, i) => {
        gsap.to(card, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: card,
                start: 'top 88%',
                toggleActions: 'play none none reverse'
            },
            delay: (i % 3) * 0.1
        });
    });

    // =====================
    // STATS COUNTER
    // =====================
    gsap.utils.toArray('.stat-item').forEach((stat, i) => {
        const numEl = stat.querySelector('.stat-number');
        const target = parseInt(numEl.dataset.target);

        gsap.to(stat, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: stat,
                start: 'top 85%',
                toggleActions: 'play none none reverse',
                onEnter: () => {
                    gsap.to({ val: 0 }, {
                        val: target,
                        duration: 2,
                        ease: 'power2.out',
                        onUpdate: function () {
                            numEl.textContent = Math.round(this.targets()[0].val);
                        }
                    });
                }
            },
            delay: i * 0.15
        });
    });

    // =====================
    // EXPERIENCE CARDS
    // =====================
    gsap.utils.toArray('.experience-card').forEach((card, i) => {
        gsap.to(card, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: card,
                start: 'top 88%',
                toggleActions: 'play none none reverse'
            },
            delay: (i % 2) * 0.15
        });
    });

    // =====================
    // WEDDINGS SECTION
    // =====================
    gsap.to('.weddings-text', {
        opacity: 1,
        x: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: '.weddings-section',
            start: 'top 75%',
            toggleActions: 'play none none reverse'
        }
    });

    gsap.to('.weddings-visual', {
        opacity: 1,
        x: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: '.weddings-section',
            start: 'top 75%',
            toggleActions: 'play none none reverse'
        },
        delay: 0.2
    });

    // =====================
    // DETAILS ITEMS
    // =====================
    gsap.utils.toArray('.detail-item').forEach((item, i) => {
        gsap.to(item, {
            opacity: 1,
            x: 0,
            duration: 0.6,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: item,
                start: 'top 90%',
                toggleActions: 'play none none reverse'
            },
            delay: i * 0.08
        });
    });

    // =====================
    // CTA SECTION
    // =====================
    const ctaTl = gsap.timeline({
        scrollTrigger: {
            trigger: '.cta-section',
            start: 'top 75%',
            toggleActions: 'play none none reverse'
        }
    });

    ctaTl
        .to('.cta-title', {
            opacity: 1, y: 0, duration: 0.8, ease: 'power3.out'
        })
        .to('.cta-subtitle', {
            opacity: 1, y: 0, duration: 0.6, ease: 'power3.out'
        }, '-=0.4')
        .to('.btn-book-large', {
            opacity: 1, y: 0, duration: 0.6, ease: 'power3.out'
        }, '-=0.3');

    // =====================
    // SECTION HEADERS
    // =====================
    gsap.utils.toArray('.section-header').forEach(header => {
        const label = header.querySelector('.section-label');
        const title = header.querySelector('.section-title');

        if (label) {
            gsap.from(label, {
                opacity: 0, y: 20, duration: 0.6, ease: 'power3.out',
                scrollTrigger: {
                    trigger: header,
                    start: 'top 85%',
                    toggleActions: 'play none none reverse'
                }
            });
        }

        if (title) {
            gsap.from(title, {
                opacity: 0, y: 30, duration: 0.8, ease: 'power3.out',
                scrollTrigger: {
                    trigger: header,
                    start: 'top 85%',
                    toggleActions: 'play none none reverse'
                },
                delay: 0.1
            });
        }
    });

    // =====================
    // SMOOTH SCROLL FOR NAV
    // =====================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

});
