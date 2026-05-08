/* ============================================================
   REVV — Landing Page (index.html) Script
   ============================================================
   Sections:
     1. NAVBAR — scroll state + brand-aware tinting
     2. HERO — car video rotation + text animations
     3. LOGO BAR — infinite scroll + click-to-section
     4. CAR SECTIONS — floating text reveal on scroll
     5. BRAND TRANSITION — animated page navigation to car pages
   ============================================================ */

gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {

    /* ----------------------------------------------------------
       1. NAVBAR
       ---------------------------------------------------------- */
    const navbar = document.getElementById('main-navbar');

    // Shrink navbar after scrolling past hero
    ScrollTrigger.create({
        start: "top -100px",
        onEnter: () => navbar.classList.add('scrolled'),
        onLeaveBack: () => navbar.classList.remove('scrolled'),
    });

    // Tint navbar border/glow to match whichever car section is behind it
    const brandSections = document.querySelectorAll('.car-reveal-section[data-brand]');

    if (brandSections.length > 0) {
        const navbarHeight = 60;

        function updateNavbarBrand() {
            let activeBrand = null;
            brandSections.forEach(section => {
                const rect = section.getBoundingClientRect();
                if (rect.top < navbarHeight && rect.bottom > 0) {
                    activeBrand = section.dataset.brand;
                }
            });

            if (activeBrand) {
                navbar.classList.add('brand-active');
                navbar.setAttribute('data-brand', activeBrand);
            } else {
                navbar.classList.remove('brand-active');
                navbar.removeAttribute('data-brand');
            }
        }

        window.addEventListener('scroll', updateNavbarBrand, { passive: true });
        updateNavbarBrand();
    }

    /* ----------------------------------------------------------
       2. HERO — Video Rotation + Text Animations
       ---------------------------------------------------------- */

    // Particles (optional — only runs if particles.js is loaded)
    if (window.particlesJS) {
        particlesJS('particles-js', {
            particles: {
                number: { value: 40, density: { enable: true, value_area: 800 } },
                color: { value: ["#c9a84c", "#ffffff"] },
                opacity: { value: 0.3, random: true },
                size: { value: 2, random: true },
                line_linked: { enable: false },
                move: { enable: true, speed: 0.5, direction: "none", random: true, straight: false, out_mode: "out" }
            },
            interactivity: { detect_on: "canvas", events: { onhover: { enable: false } } },
            retina_detect: true
        });
    }

    // Hero text entrance
    const heroTl = gsap.timeline();
    heroTl.from('.car-name', { y: 40, opacity: 0, duration: 1.2, delay: 0.4, ease: "power3.out" })
        .from('.car-tagline', { y: 20, opacity: 0, duration: 1, ease: "power2.out" }, "-=0.7");

    // Car data — each entry drives the hero video + text rotation
    const cars = [
        { video: "assets/videos/ferrari-landing.mp4",          brand: "FERRARI",     name: "SF90",     tagline: "A plug-in hybrid supercar that blends Formula 1-derived engineering with Ferrari's road performance DNA. It delivers explosive acceleration, advanced aerodynamics, and a balance between electric efficiency and pure combustion power." },
        { video: "assets/videos/lambo-landing.mp4",            brand: "LAMBORGHINI", name: "REVUELTO", tagline: "The successor to Lamborghini's V12 legacy, combining a naturally aspirated engine with hybrid technology. It features sharp futuristic styling, aggressive aerodynamics, and raw emotional power for extreme driving excitement." },
        { video: "assets/videos/porsche-landing-update.mp4",   brand: "PORSCHE",     name: "GT3 RS",   tagline: "A track-focused machine engineered for precision and aerodynamic efficiency. Every element is designed for cornering speed, lightweight performance, and race-level responsiveness shaped by motorsport heritage." },
        { video: "assets/videos/bugatti-landing.mp4",          brand: "BUGATTI",     name: "CHIRON",   tagline: "A high-performance evolution of the Chiron built for ultimate speed stability. Its quad-turbo W16 engine delivers relentless power for sustained top speeds while maintaining luxury-level comfort and control." },
        { video: "assets/videos/pagani-landing.mp4",           brand: "PAGANI",      name: "HUAYRA R", tagline: "A track-only masterpiece focused on mechanical purity and artistic engineering. Powered by a naturally aspirated V12, it delivers raw sound, extreme precision, and handcrafted detail in every component." },
        { video: "assets/videos/mclaren-landing.mp4",        brand: "MCLAREN",     name: "P1",       tagline: "One of the original hybrid hypercars that set a new performance benchmark. It combines electric boost with a twin-turbo V8, delivering seamless power and exceptional aerodynamic balance with emotional driving character." },
        { video: "assets/videos/rimac-landing.mp4",            brand: "RIMAC",       name: "NEVERA",   tagline: "A fully electric hypercar redefining acceleration and performance limits. With instant torque across all four motors, it delivers record-breaking speed, precision handling, and a glimpse into zero-emission extreme performance." }
    ];

    const carNameEl       = document.querySelector('.car-dynamic-info .car-name');
    const carVideoEl      = document.getElementById('hero-car-video');
    const carVideoSourceEl = document.getElementById('hero-car-video-source');
    const carTaglineEl    = document.getElementById('hero-car-tagline');
    const carContainer    = document.querySelector('.car-display-container');

    // Hidden video element for preloading the next car
    const preloadVideoEl  = document.createElement('video');
    preloadVideoEl.preload = 'metadata';
    preloadVideoEl.muted = true;
    preloadVideoEl.playsInline = true;
    preloadVideoEl.style.display = 'none';
    document.body.appendChild(preloadVideoEl);

    // Fade in the hero container
    gsap.to(carContainer, { opacity: 1, scale: 1, duration: 2, delay: 0.5, ease: "power2.out" });

    // Shuffle queue so cars appear in random order, never repeating back-to-back
    let queue = [];
    let currentCar = null;
    let nextCar = null;

    function buildRandomQueue(excludeVideo = '') {
        const shuffled = [...cars].sort(() => Math.random() - 0.5);
        if (excludeVideo && shuffled.length > 1 && shuffled[0].video === excludeVideo) {
            [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
        }
        return shuffled;
    }

    function getNextCar() {
        if (queue.length === 0) queue = buildRandomQueue(currentCar ? currentCar.video : '');
        return queue.shift();
    }

function preloadNextCarVideo(car) {
    if (!car) return;

    preloadVideoEl.pause();

    preloadVideoEl.removeAttribute('src');
    preloadVideoEl.load();

    preloadVideoEl.preload = 'metadata';
    preloadVideoEl.src = car.video;
}

function applyHeroCar(car) {
    currentCar = car;

    gsap.fromTo(
        '.car-dynamic-info',
        { y: 56, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.95, ease: "power3.out" }
    );

    carNameEl.textContent = car.name;
    carTaglineEl.textContent = car.tagline;

    setTimeout(() => {
        carVideoSourceEl.src = car.video;

        carVideoEl.play().catch(() => {});
    }, 120);
}
    function playNextInRotation() {
        applyHeroCar(nextCar || getNextCar());
        nextCar = getNextCar();
        preloadNextCarVideo(nextCar);
    }

    playNextInRotation();
    carVideoEl.addEventListener('ended', playNextInRotation);

    /* ----------------------------------------------------------
       3. LOGO BAR — Infinite Scroll + Click-to-Section
       ---------------------------------------------------------- */
    const logoViewport = document.getElementById('brand-logo-viewport');
    const logoTrack    = document.getElementById('brand-logo-track');

    if (logoViewport && logoTrack) {
        let offsetX = 0;
        let speed = 0.5;
        let isPaused = false;

        function getLoopWidth() { return logoTrack.scrollWidth / 2; }

        function moveLogos() {
            if (!isPaused) {
                offsetX -= speed;
                const loopWidth = getLoopWidth();
                if (Math.abs(offsetX) >= loopWidth) offsetX += loopWidth;
                if (offsetX > 0) offsetX -= loopWidth;
                logoTrack.style.transform = `translateX(${offsetX}px)`;
            }
            requestAnimationFrame(moveLogos);
        }

        logoViewport.addEventListener('mouseenter', () => { isPaused = true; });
        logoViewport.addEventListener('mouseleave', () => { isPaused = false; });
        requestAnimationFrame(moveLogos);
    }

    // Click a brand logo → smooth scroll to that car section
    document.querySelectorAll('.brand-logo-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(link.getAttribute('href'));
            if (target) {
                window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset - 80, behavior: 'smooth' });
            }
        });
    });

    /* ----------------------------------------------------------
       4. CAR SECTIONS — Floating Text Reveal on Scroll
       ---------------------------------------------------------- */
    const carRevealSections = document.querySelectorAll('.car-reveal-section');

    if (carRevealSections.length > 0) {
        const floatingTextObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const textBox = entry.target.querySelector('.car-floating-text');
                if (!textBox) return;
                textBox.classList.toggle('is-visible', entry.isIntersecting);
            });
        }, { threshold: 0.55 });

        carRevealSections.forEach(section => floatingTextObserver.observe(section));
    }

    // Footer animation
    const footer = document.querySelector('.main-footer');
    if (footer) {
        gsap.from('.footer-brand',  { scrollTrigger: { trigger: '.main-footer', start: 'top 90%', toggleActions: 'play none none reverse' }, y: 30, opacity: 0, duration: 0.8 });
        gsap.from('.footer-column', { scrollTrigger: { trigger: '.main-footer', start: 'top 90%', toggleActions: 'play none none reverse' }, y: 30, opacity: 0, duration: 0.8, stagger: 0.15, delay: 0.2 });
    }

    // Smooth scroll for all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const id = this.getAttribute('href');
            if (id === '#') return;
            const el = document.querySelector(id);
            if (el) {
                e.preventDefault();
                window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - 80, behavior: 'smooth' });
            }
        });
    });

    /* ----------------------------------------------------------
       5. BRAND TRANSITION — Animated Navigation to Car Pages
       ---------------------------------------------------------- */

    // Brand themes: background color, accent glow, and logo path
    const brandThemes = {
        ferrari:     { bg: '#0D0D0D', accent: '#FF2800', logo: 'assets/images/ferrari-logo.wine.svg' },
        porsche:     { bg: '#0A0A0A', accent: '#CBA135', logo: 'assets/images/porsche-logo.wine.svg' },
        lamborghini: { bg: '#0B0B0B', accent: '#D4AF37', logo: 'assets/images/lamborghini-logo.wine.svg' },
        bugatti:     { bg: '#05070D', accent: '#1E90FF', logo: 'assets/images/bugatti-logo.wine.svg' },
        rimac:       { bg: '#050505', accent: '#00D1FF', logo: 'assets/images/rimac-automobili-logo.svg' },
        pagani:      { bg: '#111111', accent: '#C0C0C0', logo: 'assets/images/pagani_company-logo.wine.svg' },
        mclaren:     { bg: '#0A0A0A', accent: '#FF6A00', logo: 'assets/images/mclaren-logo-update.svg' }
    };

    function showBrandIntro(brand, targetUrl) {
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        document.documentElement.style.background = '#000000';
        window.scrollTo(0, 0);

        const theme = brandThemes[brand];
        if (!theme) { window.location.href = targetUrl; return; }

        // Full-screen overlay with brand logo
        const overlay = document.createElement('div');
        overlay.className = 'brand-cover';
        overlay.style.cssText = `background:${theme.bg};position:fixed;inset:0;z-index:999999;display:flex;align-items:center;justify-content:center`;

        const logo = document.createElement('img');
        logo.src = theme.logo;
        logo.className = 'brand-logo-intro';
        logo.alt = brand + ' logo';
        logo.style.cssText = 'opacity:0;transform:scale(0.9);transition:all 0.8s cubic-bezier(0.16,1,0.3,1)';

        overlay.appendChild(logo);
        document.body.appendChild(overlay);
        document.body.style.background = theme.bg;
        document.documentElement.style.background = theme.bg;
        overlay.getBoundingClientRect(); // force paint
        document.body.classList.add('transitioning');

        // Animate logo in → fade out → navigate
        setTimeout(() => { logo.style.opacity = '1'; logo.style.transform = 'scale(1.05)'; logo.style.filter = `drop-shadow(0 0 25px ${theme.accent})`; }, 50);
        setTimeout(() => { overlay.classList.add('fade-out'); }, 900);
        setTimeout(() => { overlay.style.pointerEvents = 'none'; window.location.replace(targetUrl); }, 920);
    }

    // Map page filenames to brand keys
    const carPageMap = {
        'pages/ferrari-sf90.html': 'ferrari',
        'pages/lamborghini-revuelto.html': 'lamborghini',
        'pages/bugatti-chiron.html': 'bugatti',
        'pages/rimac-nevera.html': 'rimac',
        'pages/porsche-911.html': 'porsche',
        'pages/mclaren-p1.html': 'mclaren',
        'pages/pagani-huayra.html': 'pagani'
    };

    // Intercept DETAILS button clicks → play brand intro then navigate
    document.querySelectorAll('.car-details-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const url = this.getAttribute('href');
            let brand = null;
            for (const [page, name] of Object.entries(carPageMap)) {
                if (url.includes(page)) { brand = name; break; }
            }
            brand ? showBrandIntro(brand, url) : (window.location.href = url);
        });
    });

});
