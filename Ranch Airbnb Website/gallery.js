/* ============================================
   BOIS DE CHENES — Gallery Page Scripts
   ============================================ */

gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {

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
    // GALLERY — Scroll reveal
    // =====================
    const items = document.querySelectorAll('.gallery-item');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, (parseInt(entry.target.dataset.index) % 4) * 80);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px 100px 0px' });

    items.forEach(item => observer.observe(item));

    // =====================
    // LIGHTBOX
    // =====================
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');
    const lightboxCounter = document.getElementById('lightboxCounter');

    const allImages = Array.from(items).map(item => item.querySelector('img').src);
    let currentIndex = 0;

    function openLightbox(index) {
        currentIndex = index;
        lightboxImg.src = allImages[currentIndex];
        lightboxCounter.textContent = `${currentIndex + 1} / ${allImages.length}`;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Fade in
        requestAnimationFrame(() => {
            lightbox.style.opacity = '1';
        });
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    function navigate(direction) {
        currentIndex = (currentIndex + direction + allImages.length) % allImages.length;
        lightboxImg.style.opacity = '0';
        setTimeout(() => {
            lightboxImg.src = allImages[currentIndex];
            lightboxCounter.textContent = `${currentIndex + 1} / ${allImages.length}`;
            lightboxImg.style.opacity = '1';
        }, 150);
    }

    // Click handlers
    items.forEach((item, i) => {
        item.addEventListener('click', () => openLightbox(i));
    });

    lightboxClose.addEventListener('click', closeLightbox);
    lightboxPrev.addEventListener('click', () => navigate(-1));
    lightboxNext.addEventListener('click', () => navigate(1));

    // Click outside to close
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox || e.target.classList.contains('lightbox-content')) {
            closeLightbox();
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') navigate(-1);
        if (e.key === 'ArrowRight') navigate(1);
    });

    // Lightbox image transition
    lightboxImg.style.transition = 'opacity 0.15s ease';

});
