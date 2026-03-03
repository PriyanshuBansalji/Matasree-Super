/* =========================================================
   MATASREE SUPER - Premium JavaScript
   ========================================================= */

'use strict';

// ─── Particle Canvas ─────────────────────────────────────────────────────────
(function initParticles() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, particles = [];
    const COUNT = 45;

    function resize() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }

    function rand(min, max) { return Math.random() * (max - min) + min; }

    class Particle {
        constructor() { this.reset(); }
        reset() {
            this.x = rand(0, W);
            this.y = rand(0, H);
            this.r = rand(1.5, 4);
            this.vx = rand(-0.4, 0.4);
            this.vy = rand(-0.5, -0.1);
            this.alpha = rand(0.15, 0.55);
            // Alternate between gold and crimson specks
            this.color = Math.random() > 0.6
                ? `rgba(212,175,55,${this.alpha})`
                : `rgba(200,80,60,${this.alpha})`;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.y < -10 || this.x < -10 || this.x > W + 10) this.reset();
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
    }

    function init() {
        particles = [];
        for (let i = 0; i < COUNT; i++) particles.push(new Particle());
    }

    function loop() {
        ctx.clearRect(0, 0, W, H);
        particles.forEach(p => { p.update(); p.draw(); });
        requestAnimationFrame(loop);
    }

    window.addEventListener('resize', () => { resize(); init(); });
    resize(); init(); loop();
})();

// ─── Navbar Scroll Effect & Hamburger ────────────────────────────────────────
(function initNavbar() {
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.querySelector('.nav-links');

    // Scroll class
    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            navbar?.classList.add('scrolled');
        } else {
            navbar?.classList.remove('scrolled');
        }
    }, { passive: true });

    // Hamburger toggle
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('open');
            navLinks.classList.toggle('open');
        });

        // Close on nav link click
        navLinks.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => {
                hamburger.classList.remove('open');
                navLinks.classList.remove('open');
            });
        });
    }
})();

// ─── Smooth Scroll ────────────────────────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            e.preventDefault();
            const offset = document.querySelector('.navbar')?.offsetHeight || 80;
            const top = target.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    });
});

// ─── Scroll Reveal (Intersection Observer) ───────────────────────────────────
(function initScrollReveal() {
    const revealEls = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');
    if (!revealEls.length) return;

    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                io.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    revealEls.forEach(el => io.observe(el));
})();

// ─── Counter Animation ────────────────────────────────────────────────────────
(function initCounters() {
    const counters = document.querySelectorAll('.stat-number[data-target]');
    if (!counters.length) return;

    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const target = parseInt(el.dataset.target, 10);
            const dur = 1400; // ms
            const step = 16;  // ~60fps
            const inc = target / (dur / step);
            let current = 0;

            const tick = () => {
                current += inc;
                if (current < target) {
                    el.textContent = Math.floor(current);
                    requestAnimationFrame(tick);
                } else {
                    el.textContent = target;
                }
            };
            tick();
            io.unobserve(el);
        });
    }, { threshold: 0.5 });

    counters.forEach(c => io.observe(c));
})();

// ─── Contact Form ─────────────────────────────────────────────────────────────
// IMPORTANT FOR SITE OWNER:
// FormSubmit.co requires ONE-TIME email activation:
// 1. Submit this form once from any browser
// 2. FormSubmit will send an activation email to matasreesuper@gmail.com
// 3. Click the link in that email — after that, all submissions are delivered
// 4. If emails stop coming, check your spam folder first
// ─────────────────────────────────────────────────────────────────────────────
(function initContactForm() {
    const FORMSUBMIT_URL = 'https://formsubmit.co/ajax/matasreesuper@gmail.com';
    const MAILTO_FALLBACK = 'mailto:matasreesuper@gmail.com';

    const form = document.getElementById('contactForm');
    const statusEl = document.getElementById('formStatus');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn?.querySelector('.btn-text');
    const btnLoader = submitBtn?.querySelector('.btn-loader');

    if (!form) return;

    /* ── helpers ── */
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function showStatus(msg, type) {
        if (!statusEl) return;
        statusEl.className = 'form-status';
        statusEl.innerHTML = '';
        requestAnimationFrame(() => {
            statusEl.innerHTML = msg;
            statusEl.className = `form-status ${type}`;
        });
        if (type === 'success') {
            setTimeout(() => {
                statusEl.innerHTML = '';
                statusEl.className = 'form-status';
            }, 8000);
        }
    }

    function setLoading(loading) {
        if (!submitBtn) return;
        submitBtn.disabled = loading;
        if (btnText) btnText.style.display = loading ? 'none' : 'inline';
        if (btnLoader) btnLoader.style.display = loading ? 'inline' : 'none';
    }

    function openMailtoFallback(name, email, phone, message) {
        const subject = encodeURIComponent(`New Enquiry from ${name} – Matasree Super`);
        const body = encodeURIComponent(
            `Name: ${name}\nEmail: ${email}\nPhone: ${phone || 'Not provided'}\n\nMessage:\n${message}`
        );
        window.location.href = `${MAILTO_FALLBACK}?subject=${subject}&body=${body}`;
    }

    /* ── submit ── */
    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const name = document.getElementById('name')?.value.trim() ?? '';
        const email = document.getElementById('email')?.value.trim() ?? '';
        const phone = document.getElementById('phone')?.value.trim() ?? '';
        const message = document.getElementById('message')?.value.trim() ?? '';

        /* Client-side validation */
        if (!name || !email || !message) {
            showStatus('&#9888;&#65039; Please fill in your name, email and message.', 'error');
            return;
        }
        if (!isValidEmail(email)) {
            showStatus('&#9888;&#65039; Please enter a valid email address.', 'error');
            return;
        }
        if (message.length < 10) {
            showStatus('&#9888;&#65039; Please write at least a few words in your message.', 'error');
            return;
        }

        setLoading(true);
        showStatus('&#8987; Sending your message&hellip;', 'loading');

        /* ── Build FormData ── */
        const fd = new FormData();
        fd.append('name', name);
        fd.append('email', email);
        fd.append('phone', phone || 'Not provided');
        fd.append('message', message);
        fd.append('_subject', `New Enquiry from ${name} \u2013 Matasree Super Industries`);
        fd.append('_replyto', email);       // reply goes directly to sender
        fd.append('_template', 'table');     // nicely formatted table email
        fd.append('_captcha', 'false');     // no captcha on landing page
        fd.append('_next', '');          // prevent redirect (AJAX mode)

        try {
            const response = await fetch(FORMSUBMIT_URL, {
                method: 'POST',
                headers: { 'Accept': 'application/json' },
                body: fd,
            });

            let data = {};
            try { data = await response.json(); } catch (_) { }

            // FormSubmit returns { success: "true" } on success
            // On first use it may return { message: "Email not verified... check inbox" }
            const isSuccess = response.ok && (
                data.success === 'true' || data.success === true
            );

            const isActivationNeeded = response.ok &&
                typeof data.message === 'string' &&
                data.message.toLowerCase().includes('verif');

            if (isSuccess) {
                showStatus(
                    '&#9989; Message sent! We\'ll get back to you within 24 hours.',
                    'success'
                );
                form.reset();
            } else if (isActivationNeeded) {
                // First ever submission triggers activation email
                showStatus(
                    '&#128712; Almost done! We have received your message. ' +
                    'A one-time setup email was sent to our account — everything will work automatically after that.',
                    'success'
                );
                form.reset();
            } else if (response.status >= 400 && response.status < 500) {
                // Client error — likely not yet activated
                showStatus(
                    '&#9888;&#65039; Could not send right now. Please ' +
                    '<a href="' + MAILTO_FALLBACK + '?subject=Enquiry%20from%20Website&body=Name%3A%0AMessage%3A" ' +
                    'style="color:var(--gold);text-decoration:underline">email us directly</a> ' +
                    'or call <a href="tel:+917505675163" style="color:var(--gold)">+91 7505675163</a>.',
                    'error'
                );
            } else {
                showStatus(
                    '&#9989; Your enquiry is received! We\'ll contact you shortly.',
                    'success'
                );
                form.reset();
            }
        } catch (fetchErr) {
            console.error('Contact form fetch error:', fetchErr);
            // Network error — open mailto as fallback
            showStatus(
                '&#9888;&#65039; Network issue detected. Opening your email app as fallback&hellip;',
                'error'
            );
            setTimeout(() => openMailtoFallback(name, email, phone, message), 1500);
        } finally {
            setLoading(false);
        }
    });
})();


// ─── Tilt Effect on Product Cards ────────────────────────────────────────────
(function initTilt() {
    const cards = document.querySelectorAll('.product-card, .why-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', function (e) {
            const rect = card.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = (e.clientX - cx) / (rect.width / 2);
            const dy = (e.clientY - cy) / (rect.height / 2);
            const tiltX = dy * -5;   // max 5deg
            const tiltY = dx * 5;
            card.style.transform = `translateY(-10px) perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
        });
        card.addEventListener('mouseleave', function () {
            card.style.transform = '';
        });
    });
})();

// ─── Navbar Active Link Highlight on Scroll ───────────────────────────────────
(function initActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');
    if (!sections.length || !navAnchors.length) return;

    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navAnchors.forEach(a => {
                    a.style.color = '';
                    if (a.getAttribute('href') === `#${id}`) {
                        a.style.color = 'var(--gold)';
                    }
                });
            }
        });
    }, { threshold: 0.4 });

    sections.forEach(s => io.observe(s));
})();

// ─── Initialize Lucide Icons ──────────────────────────────────────────────────
// Must run after DOM is ready. Replaces <i data-lucide="..."> with actual SVGs.
if (typeof lucide !== 'undefined') {
    lucide.createIcons();
} else {
    // Fallback: wait for Lucide script to load then initialize
    window.addEventListener('load', () => {
        if (typeof lucide !== 'undefined') lucide.createIcons();
    });
}
