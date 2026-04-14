/* ==========================================================================
   Alex Shusterman — Portfolio JS
   Smooth scroll interactions, reveal-on-scroll, custom cursor,
   active nav highlighting, scroll progress, number counters, and time.
   ========================================================================== */

(() => {
    'use strict';

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* -----------------------------------------
       Year + local time
    ----------------------------------------- */
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    const timeEl = document.getElementById('local-time');
    function updateTime() {
        if (!timeEl) return;
        const now = new Date();
        const time = now.toLocaleTimeString('en-CA', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'America/Toronto'
        });
        timeEl.textContent = `${time} Toronto`;
    }
    updateTime();
    setInterval(updateTime, 30000);

    /* -----------------------------------------
       Nav scroll state + progress bar
    ----------------------------------------- */
    const nav = document.getElementById('nav');
    const progress = document.getElementById('scroll-progress');

    function onScroll() {
        const y = window.scrollY;
        const doc = document.documentElement;
        const height = doc.scrollHeight - doc.clientHeight;
        const pct = height > 0 ? (y / height) * 100 : 0;

        if (progress) progress.style.width = pct + '%';
        if (nav) nav.classList.toggle('nav-scrolled', y > 50);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* -----------------------------------------
       Active nav link (scrollspy)
    ----------------------------------------- */
    const sections = document.querySelectorAll('section.section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    const spy = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                navLinks.forEach(link => {
                    link.classList.toggle('active', link.dataset.section === id);
                });
            }
        });
    }, {
        rootMargin: '-45% 0px -50% 0px',
        threshold: 0
    });

    sections.forEach(s => spy.observe(s));

    /* -----------------------------------------
       Reveal on scroll
    ----------------------------------------- */
    const reveals = document.querySelectorAll('.reveal');
    const revealObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in');
                revealObs.unobserve(entry.target);
            }
        });
    }, {
        rootMargin: '0px 0px -10% 0px',
        threshold: 0.12
    });

    reveals.forEach(el => {
        // Reveal all hero elements immediately on load so the hero
        // (pill, title, paragraph) animates in together — EXCEPT the
        // CTA button row, which waits for the user to start scrolling.
        if (el.closest('.hero') && !el.classList.contains('hero-cta')) {
            requestAnimationFrame(() => el.classList.add('in'));
            return;
        }
        revealObs.observe(el);
    });

    // Hero CTA: reveal on first scroll gesture
    const heroCta = document.querySelector('.hero-cta');
    if (heroCta) {
        const revealHeroCta = () => {
            heroCta.classList.add('in');
            window.removeEventListener('scroll', revealHeroCta);
            window.removeEventListener('wheel', revealHeroCta);
            window.removeEventListener('touchmove', revealHeroCta);
        };
        window.addEventListener('scroll', revealHeroCta, { passive: true, once: false });
        window.addEventListener('wheel', revealHeroCta, { passive: true, once: false });
        window.addEventListener('touchmove', revealHeroCta, { passive: true, once: false });
    }

    /* -----------------------------------------
       Hero title — line-by-line entrance
    ----------------------------------------- */
    const heroLines = document.querySelectorAll('.hero-title .line-inner');
    heroLines.forEach((line, i) => {
        setTimeout(() => line.classList.add('in'), 250 + i * 180);
    });

    /* -----------------------------------------
       Counter animation (stats)
    ----------------------------------------- */
    const counters = document.querySelectorAll('.stat-num');

    function animateCount(el) {
        const target = parseInt(el.dataset.count, 10);
        if (isNaN(target)) return;
        if (prefersReduced) { el.textContent = target; return; }

        const duration = 1800;
        const start = performance.now();

        function tick(now) {
            const t = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
            el.textContent = Math.floor(eased * target);
            if (t < 1) requestAnimationFrame(tick);
            else el.textContent = target;
        }
        requestAnimationFrame(tick);
    }

    const countObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCount(entry.target);
                countObs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.4 });

    counters.forEach(c => countObs.observe(c));

    /* -----------------------------------------
       Mobile menu
    ----------------------------------------- */
    const toggle = document.getElementById('nav-toggle');
    const menu = document.getElementById('mobile-menu');

    if (toggle && menu) {
        toggle.addEventListener('click', () => {
            toggle.classList.toggle('open');
            menu.classList.toggle('open');
            document.body.style.overflow = menu.classList.contains('open') ? 'hidden' : '';
        });

        menu.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => {
                toggle.classList.remove('open');
                menu.classList.remove('open');
                document.body.style.overflow = '';
            });
        });
    }

    /* -----------------------------------------
       Smooth scroll enhancement
       (native smooth works; this adds offset for fixed nav)
    ----------------------------------------- */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const href = anchor.getAttribute('href');
            if (!href || href === '#') return;
            const target = document.querySelector(href);
            if (!target) return;
            e.preventDefault();

            const navH = nav ? nav.offsetHeight : 0;
            const top = target.getBoundingClientRect().top + window.scrollY - navH + 1;
            window.scrollTo({ top, behavior: prefersReduced ? 'auto' : 'smooth' });
        });
    });

    /* -----------------------------------------
       Custom cursor (desktop only)
    ----------------------------------------- */
    const cursor = document.getElementById('cursor');
    const cursorDot = document.getElementById('cursor-dot');

    if (cursor && cursorDot && window.matchMedia('(pointer: fine)').matches) {
        let tx = 0, ty = 0;   // target
        let cx = 0, cy = 0;   // current (eased)

        document.addEventListener('mousemove', (e) => {
            tx = e.clientX;
            ty = e.clientY;
            cursorDot.style.transform = `translate(${tx - 2}px, ${ty - 2}px)`;
        });

        function loop() {
            cx += (tx - cx) * 0.18;
            cy += (ty - cy) * 0.18;
            cursor.style.transform = `translate(${cx - 16}px, ${cy - 16}px)`;
            requestAnimationFrame(loop);
        }
        loop();

        const hoverTargets = 'a, button, .nav-link, .btn, .cv-button, .skill-list li, .xp-item, .contact-email';
        document.querySelectorAll(hoverTargets).forEach(el => {
            el.addEventListener('mouseenter', () => cursor.classList.add('cursor-hover'));
            el.addEventListener('mouseleave', () => cursor.classList.remove('cursor-hover'));
        });
    }

    /* -----------------------------------------
       Subtle parallax on hero background
    ----------------------------------------- */
    const heroBg = document.querySelector('.hero-bg');
    if (heroBg && !prefersReduced) {
        window.addEventListener('scroll', () => {
            const y = window.scrollY;
            if (y < window.innerHeight) {
                heroBg.style.transform = `translateY(${y * 0.25}px)`;
            }
        }, { passive: true });
    }
})();
