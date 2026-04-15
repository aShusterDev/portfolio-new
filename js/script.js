/* ==========================================================================
   Alex Shusterman — Portfolio JS
   Smooth scroll interactions, reveal-on-scroll, custom cursor,
   active nav highlighting, scroll progress, number counters, and time.
   ========================================================================== */

(() => {
    'use strict';

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* -----------------------------------------
       Theme toggle (light / dark)
       Defaults to dark; light is opt-in, persisted in localStorage.
       The initial theme is set by an inline script in <head> to avoid FOUC.
    ----------------------------------------- */
    const themeToggle = document.getElementById('theme-toggle');

    function applyTheme(theme) {
        if (theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        if (themeToggle) {
            const isLight = theme === 'light';
            const label = isLight ? 'Switch to dark mode' : 'Switch to light mode';
            themeToggle.setAttribute('aria-label', label);
            themeToggle.setAttribute('title', label);
        }
    }

    // Sync button label with whatever was pre-applied in <head>.
    applyTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isLight = document.documentElement.getAttribute('data-theme') === 'light';
            const next = isLight ? 'dark' : 'light';
            applyTheme(next);
            try { localStorage.setItem('theme', next); } catch (e) { /* ignore */ }
        });
    }

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
       Unified scroll handler (rAF-throttled)
       Handles: nav state, progress bar, hero parallax.
       Consolidating and throttling avoids redundant reflows
       and keeps scrolling smooth.
    ----------------------------------------- */
    const nav = document.getElementById('nav');
    const progress = document.getElementById('scroll-progress');
    const heroBg = document.querySelector('.hero-bg');
    const doParallax = heroBg && !prefersReduced;

    let scrollTicking = false;
    function handleScroll() {
        const y = window.scrollY;
        const doc = document.documentElement;
        const height = doc.scrollHeight - doc.clientHeight;
        const pct = height > 0 ? (y / height) * 100 : 0;

        if (progress) progress.style.width = pct + '%';
        if (nav) nav.classList.toggle('nav-scrolled', y > 50);

        if (doParallax && y < window.innerHeight) {
            heroBg.style.transform = `translate3d(0, ${y * 0.25}px, 0)`;
        }

        scrollTicking = false;
    }
    function onScroll() {
        if (!scrollTicking) {
            scrollTicking = true;
            requestAnimationFrame(handleScroll);
        }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    handleScroll();

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

    // Hero CTA: reveal on first scroll gesture.
    // AbortController tears down all three listeners with one call.
    const heroCta = document.querySelector('.hero-cta');
    if (heroCta) {
        const ctrl = new AbortController();
        const revealHeroCta = () => {
            heroCta.classList.add('in');
            ctrl.abort();
        };
        const opts = { passive: true, signal: ctrl.signal };
        window.addEventListener('scroll', revealHeroCta, opts);
        window.addEventListener('wheel', revealHeroCta, opts);
        window.addEventListener('touchmove', revealHeroCta, opts);
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
       Profile portrait — tap to expand (touch only)
       Desktop uses :hover. Touch devices don't have a reliable hover
       state, so tapping the portrait toggles an .open class. Any scroll
       or outside tap dismisses it. A single AbortController tears down
       both dismiss listeners.
    ----------------------------------------- */
    const navBrand = document.querySelector('.nav-brand');
    const isTouch = window.matchMedia('(hover: none)').matches;

    if (navBrand && isTouch) {
        let dismissCtrl = null;

        const closePortrait = () => {
            navBrand.classList.remove('open');
            if (dismissCtrl) {
                dismissCtrl.abort();
                dismissCtrl = null;
            }
        };

        const openPortrait = () => {
            navBrand.classList.add('open');
            dismissCtrl = new AbortController();
            const signal = dismissCtrl.signal;
            window.addEventListener('scroll', closePortrait, { passive: true, signal });
            document.addEventListener('click', (e) => {
                if (!navBrand.contains(e.target)) closePortrait();
            }, { signal });
        };

        navBrand.addEventListener('click', (e) => {
            // Hijack the link tap so we can toggle instead of navigating.
            // stopPropagation prevents the document-level outside-click
            // handler (added in openPortrait) from immediately re-closing
            // this same event as it bubbles up.
            e.preventDefault();
            e.stopPropagation();
            if (navBrand.classList.contains('open')) {
                closePortrait();
            } else {
                openPortrait();
            }
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

})();
