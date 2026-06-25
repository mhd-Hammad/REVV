/**
 * REVV Shared Car Page Bootstrap
 * Extracts all common logic from the 7 car page inline scripts into one shared file.
 * Depends on: window.REVV.toast, window.REVV.loader, window.REVV.videoHandler
 *
 * Usage: REVV.initCarPage(config) — called by each car's page-specific config script.
 */
window.REVV = window.REVV || {};

(function () {
  'use strict';

  // ======================== CLOSURE STATE ========================
  var scene, camera, renderer, controls, carModel;
  var wheelMeshes = [];
  var isAnimating = false;
  var driveMode = false;
  var lenis = null;

  // ======================== CDN HEALTH CHECK ========================
  function checkCDNHealth() {
    var failed = window.__cdnFailed || [];

    // Timeout detection — if global isn't defined, it didn't load
    if (typeof THREE === 'undefined' && failed.indexOf('three') === -1) {
      failed.push('three');
    }
    if (typeof gsap === 'undefined' && failed.indexOf('gsap') === -1) {
      failed.push('gsap');
    }
    if (typeof Lenis === 'undefined' && failed.indexOf('lenis') === -1) {
      failed.push('lenis');
    }

    // Three.js group failed
    if (failed.indexOf('three') !== -1 || failed.indexOf('gltf-loader') !== -1 || failed.indexOf('orbit-controls') !== -1) {
      var btn360 = document.getElementById('show-360');
      if (btn360) btn360.style.display = 'none';
      if (window.REVV && window.REVV.toast) {
        REVV.toast.show({
          message: '3D viewer unavailable — reload to try again',
          type: 'warning',
          duration: 0
        });
      }
    }

    // GSAP group failed
    if (failed.indexOf('gsap') !== -1 || failed.indexOf('scrolltrigger') !== -1) {
      if (window.REVV && window.REVV.toast) {
        REVV.toast.show({
          message: 'Animations unavailable — content still accessible',
          type: 'info',
          duration: 8000
        });
      }
    }

    // Lenis failed — skip silently (native scroll works)

    return failed;
  }

  // ======================== LENIS SMOOTH SCROLL ========================
  function initLenis() {
    if (typeof Lenis === 'undefined') return null;
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return null;

    var lenisInstance = new Lenis({
      duration: 1.2,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false
    });

    // Integrate with GSAP ScrollTrigger
    lenisInstance.on('scroll', ScrollTrigger.update);

    gsap.ticker.add(function (time) {
      lenisInstance.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    return lenisInstance;
  }

  // ======================== ZOOM PREVENTION ========================
  function initZoomPrevention(canvasId) {
    document.addEventListener('wheel', function (e) {
      if (e.ctrlKey) e.preventDefault();
    }, { passive: false });

    document.addEventListener('keydown', function (e) {
      if (e.ctrlKey && (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')) {
        e.preventDefault();
      }
    });

    document.addEventListener('gesturestart', function (e) { e.preventDefault(); }, { passive: false });
    document.addEventListener('gesturechange', function (e) { e.preventDefault(); }, { passive: false });
    document.addEventListener('gestureend', function (e) { e.preventDefault(); }, { passive: false });
  }

  // ======================== THREE.JS SCENE SETUP ========================
  function initThreeJS(config) {
    if (typeof THREE === 'undefined') return;

    var canvas = document.getElementById(config.canvasId || 'hero-model-canvas');
    if (!canvas) return;

    // Renderer
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: false
    });
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x0a0c10);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    // Scene
    scene = new THREE.Scene();

    // Camera
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(4, 3, 8);

    // Orbit Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minDistance = 4;
    controls.maxDistance = 15;
    controls.minPolarAngle = 0.5;
    controls.maxPolarAngle = 1.5;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2;
    controls.target = new THREE.Vector3(0, 0.5, 0);
    controls.update();

    // Canvas zoom — enable on hover, disable on leave
    var heroCanvas = renderer.domElement;

    heroCanvas.addEventListener('mouseenter', function () {
      controls.enableZoom = true;
    });

    heroCanvas.addEventListener('mouseleave', function () {
      controls.enableZoom = false;
    });

    heroCanvas.addEventListener('wheel', function (e) {
      if (controls.enableZoom) {
        e.preventDefault();
      }
    }, { passive: false });

    // Ground plane
    var groundGeometry = new THREE.PlaneGeometry(30, 30, 32, 32);
    groundGeometry.rotateX(-Math.PI / 2);
    var groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x111115,
      side: THREE.DoubleSide,
      roughness: 0.8,
      metalness: 0.2
    });
    var groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.castShadow = false;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Lights
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    var mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(5, 10, 5);
    mainLight.castShadow = true;
    mainLight.shadow.bias = -0.0001;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    scene.add(mainLight);

    var fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);

    var rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
    rimLight.position.set(0, 3, -8);
    scene.add(rimLight);

    // Window resize handler
    window.addEventListener('resize', function () {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  // ======================== MODEL LOADING ========================
  function loadModel(config) {
    if (typeof THREE === 'undefined') return;
    if (!window.REVV || !window.REVV.loader) return;

    REVV.loader.loadModel({
      path: config.modelPath,
      canvasId: config.canvasId || 'hero-model-canvas',
      accentColor: config.accentColor,
      fallbackImageUrl: config.fallbackImage || null,
      onLoad: function (gltf) {
        carModel = gltf.scene;

        // Calculate bounding box to scale model
        var box = new THREE.Box3().setFromObject(carModel);
        var size = box.getSize(new THREE.Vector3());
        var center = box.getCenter(new THREE.Vector3());

        // Scale to fit (target ~5 units)
        var maxDim = Math.max(size.x, size.y, size.z);
        var scale = 5 / maxDim;
        carModel.scale.setScalar(scale);

        // Center and place on ground
        carModel.position.x = -center.x * scale;
        carModel.position.y = (-box.min.y * scale) + 0.01;
        carModel.position.z = -center.z * scale;

        // Enable shadows and detect wheel meshes
        carModel.traverse(function (child) {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.userData.isPaintable = true;
            var n = (child.name || '').toLowerCase();
            if (n.includes('wheel') || n.includes('tyre') || n.includes('tire') || n.includes('rim')) {
              wheelMeshes.push(child);
            }
          }
        });

        scene.add(carModel);
        startAnimation();
        console.log(config.brand + ' model loaded successfully');
      },
      onError: function (error) {
        console.error('Error loading model:', error);
      }
    });
  }

  // ======================== ANIMATION LOOP ========================
  function animate() {
    if (!isAnimating) return;
    requestAnimationFrame(animate);
    if (controls) controls.update();
    if (driveMode && carModel) {
      wheelMeshes.forEach(function (w) { w.rotation.x += 0.3; });
      carModel.position.y = Math.sin(Date.now() * 0.01) * 0.005;
    }
    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }

  function startAnimation() {
    if (!isAnimating) {
      isAnimating = true;
      animate();
    }
  }

  function stopAnimation() {
    isAnimating = false;
  }

  // ======================== 360° / VIDEO TOGGLE ========================
  function init360VideoToggle(config) {
    var heroVideoId = config.heroVideoId || 'hero-intro-video';
    var canvasId = config.canvasId || 'hero-model-canvas';

    var heroIntroVideo = document.getElementById(heroVideoId);
    var heroModel = document.getElementById(canvasId);
    var show360Btn = document.getElementById('show-360');
    var showVideoBtn = document.getElementById('show-video');
    var heroText = document.querySelector('.hero-text-vertical');
    var colorControls = document.getElementById('color-controls');

    var modelLoaded = false;
    var threeInitialized = false;

    if (show360Btn) {
      show360Btn.addEventListener('click', function () {
        // Initialize Three.js scene + load model on FIRST click only
        if (!threeInitialized && typeof THREE !== 'undefined') {
          threeInitialized = true;
          initThreeJS(config);
        }
        if (!modelLoaded && typeof THREE !== 'undefined') {
          modelLoaded = true;
          loadModel(config);
        }
        if (heroIntroVideo) {
          heroIntroVideo.pause();
          heroIntroVideo.classList.add('hero-intro-video-hidden');
        }
        if (heroModel) heroModel.classList.remove('hero-model-hidden');
        startAnimation();
        show360Btn.classList.add('hero-toggle-hidden');
        if (showVideoBtn) showVideoBtn.classList.remove('hero-toggle-hidden');
        if (colorControls) colorControls.classList.remove('color-controls-hidden');
        if (heroText) {
          heroText.style.opacity = '0';
          heroText.style.pointerEvents = 'none';
        }
      });
    }

    if (showVideoBtn) {
      showVideoBtn.addEventListener('click', function () {
        if (heroModel) heroModel.classList.add('hero-model-hidden');
        stopAnimation();
        if (heroIntroVideo) {
          heroIntroVideo.classList.remove('hero-intro-video-hidden');
          heroIntroVideo.play().catch(function () {});
        }
        showVideoBtn.classList.add('hero-toggle-hidden');
        if (show360Btn) show360Btn.classList.remove('hero-toggle-hidden');
        if (colorControls) colorControls.classList.add('color-controls-hidden');
        if (heroText) {
          heroText.style.opacity = '1';
          heroText.style.pointerEvents = 'auto';
        }
      });
    }
  }

  // ======================== COLOR CHANGE ========================
  function setCarColor(hex) {
    if (!carModel) return;
    if (typeof THREE === 'undefined') return;
    var color = new THREE.Color(hex);
    carModel.traverse(function (c) {
      if (!c.isMesh || !c.material) return;
      var mats = Array.isArray(c.material) ? c.material : [c.material];
      mats.forEach(function (mat) {
        if (!mat.isMeshStandardMaterial && !mat.isMeshPhysicalMaterial) return;
        if (mat.transparent && mat.opacity < 0.9) return;
        if (mat.metalness > 0.95 && mat.roughness < 0.08) return;
        var b = mat.color.r + mat.color.g + mat.color.b;
        if (b < 0.08) return;
        if (!mat.userData._origColor) mat.userData._origColor = mat.color.clone();
        mat.color.set(color);
        mat.needsUpdate = true;
      });
    });
  }

  function resetCarColor() {
    if (!carModel) return;
    carModel.traverse(function (c) {
      if (!c.isMesh || !c.material) return;
      var mats = Array.isArray(c.material) ? c.material : [c.material];
      mats.forEach(function (mat) {
        if (mat.userData._origColor) {
          mat.color.copy(mat.userData._origColor);
          mat.needsUpdate = true;
        }
      });
    });
  }

  function initColorControls() {
    var colorBtns = document.querySelectorAll('.color-btn');
    colorBtns.forEach(function (btn) {
      var color = btn.getAttribute('data-color');
      if (color) {
        btn.addEventListener('click', function () {
          setCarColor(color);
          colorBtns.forEach(function (b) { b.classList.remove('active'); });
          btn.classList.add('active');
        });
      }
    });

    var resetBtn = document.getElementById('reset-color');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        resetCarColor();
        colorBtns.forEach(function (b) { b.classList.remove('active'); });
      });
    }
  }

  // ======================== DRIVE MODE ========================
  function enableDriveMode(config) {
    controls.autoRotate = true;
    controls.autoRotateSpeed = 6;
    var driveModeBtn = document.getElementById('drive-mode');
    if (driveModeBtn) driveModeBtn.classList.add('drive-active');

    if (!carModel) return;

    // Apply emissive lights from config
    var lights = (config.driveModeConfig && config.driveModeConfig.lights) || [];

    carModel.traverse(function (c) {
      if (!c.isMesh || !c.material) return;
      var mats = Array.isArray(c.material) ? c.material : [c.material];
      mats.forEach(function (mat) {
        if (!mat.emissive) return;
        var mName = (mat.name || '').toLowerCase();

        // Save original emissive on first activation
        if (!mat.userData._driveOrig) {
          mat.userData._driveOrig = {
            emissive: mat.emissive.clone(),
            emissiveIntensity: mat.emissiveIntensity
          };
        }

        // Apply per-config light overrides
        for (var i = 0; i < lights.length; i++) {
          if (mName === lights[i].name.toLowerCase()) {
            mat.emissive.set(lights[i].emissiveColor);
            mat.emissiveIntensity = lights[i].intensity;
            mat.needsUpdate = true;
          }
        }
      });
    });

    // Add scene lights for ground illumination
    if (!scene.userData._driveLights) {
      var hL = new THREE.SpotLight(0xffffff, 3, 12, Math.PI / 6, 0.5);
      hL.position.set(-0.8, 0.6, 3);
      hL.target.position.set(-0.8, 0, 8);
      scene.add(hL);
      scene.add(hL.target);

      var hR = new THREE.SpotLight(0xffffff, 3, 12, Math.PI / 6, 0.5);
      hR.position.set(0.8, 0.6, 3);
      hR.target.position.set(0.8, 0, 8);
      scene.add(hR);
      scene.add(hR.target);

      var tL = new THREE.PointLight(0xff1100, 2.5, 5);
      tL.position.set(-0.7, 0.6, -2.5);
      scene.add(tL);

      var tR = new THREE.PointLight(0xff1100, 2.5, 5);
      tR.position.set(0.7, 0.6, -2.5);
      scene.add(tR);

      var iL = new THREE.PointLight(0xff6633, 0.8, 3);
      iL.position.set(0, 1, 0.3);
      scene.add(iL);

      scene.userData._driveLights = [hL, hL.target, hR, hR.target, tL, tR, iL];
    }
  }

  function disableDriveMode() {
    if (controls) controls.autoRotateSpeed = 2;
    var driveModeBtn = document.getElementById('drive-mode');
    if (driveModeBtn) driveModeBtn.classList.remove('drive-active');

    // Restore original emissive values
    if (carModel) {
      carModel.traverse(function (c) {
        if (!c.isMesh || !c.material) return;
        var mats = Array.isArray(c.material) ? c.material : [c.material];
        mats.forEach(function (mat) {
          if (mat.userData._driveOrig) {
            mat.emissive.copy(mat.userData._driveOrig.emissive);
            mat.emissiveIntensity = mat.userData._driveOrig.emissiveIntensity;
            mat.needsUpdate = true;
          }
        });
      });
    }

    // Remove scene lights
    if (scene && scene.userData._driveLights) {
      scene.userData._driveLights.forEach(function (l) { scene.remove(l); });
      scene.userData._driveLights = null;
    }
  }

  function initDriveMode(config) {
    var driveModeBtn = document.getElementById('drive-mode');
    if (!driveModeBtn) return;

    driveModeBtn.addEventListener('click', function () {
      driveMode = !driveMode;
      if (driveMode) {
        enableDriveMode(config);
      } else {
        disableDriveMode();
      }
    });
  }

  // ======================== FLOATING NAV ========================
  function initFloatingNav(config) {
    var floatingNav = document.getElementById('floating-nav');
    var backToTopBtn = document.getElementById('back-to-top');
    var navLinks = document.querySelectorAll('.floating-link');
    var navSections = (config.navSections || [])
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);

    function updateFloatingNav() {
      var hero = document.querySelector('.hero-stage');
      if (hero && floatingNav) {
        var heroBottom = hero.getBoundingClientRect().bottom;
        floatingNav.classList.toggle('visible', heroBottom < 100);
      }
    }

    function updateActiveLink() {
      var vh = window.innerHeight;
      var bestId = navSections[0] ? navSections[0].id : '';
      var bestScore = -Infinity;
      navSections.forEach(function (section) {
        var rect = section.getBoundingClientRect();
        var visTop = Math.max(rect.top, 0);
        var visBottom = Math.min(rect.bottom, vh);
        var visible = Math.max(0, visBottom - visTop);
        if (visible > bestScore) {
          bestScore = visible;
          bestId = section.id;
        }
      });
      navLinks.forEach(function (link) {
        link.classList.toggle('active', link.getAttribute('href') === '#' + bestId);
      });
    }

    // Nav link smooth scroll
    navLinks.forEach(function (link) {
      link.addEventListener('click', function (event) {
        event.preventDefault();
        var target = document.querySelector(link.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    // Back to top
    if (backToTopBtn) {
      backToTopBtn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Scroll listener
    window.addEventListener('scroll', function () {
      updateFloatingNav();
      updateActiveLink();
    });

    // Initial state
    updateFloatingNav();
    updateActiveLink();
  }

  // ======================== DRAGGABLE ELEMENTS ========================
  function initDraggable() {
    function makeDraggable(element) {
      var isDragging = false;
      var startX, startY, initialX, initialY;

      element.addEventListener('mousedown', function (e) {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        var rect = element.getBoundingClientRect();
        initialX = rect.left;
        initialY = rect.top;
        element.style.position = 'fixed';
        element.style.left = initialX + 'px';
        element.style.top = initialY + 'px';
        element.style.bottom = 'auto';
        element.style.right = 'auto';
        element.style.zIndex = '100';
      });

      document.addEventListener('mousemove', function (e) {
        if (!isDragging) return;
        var dx = e.clientX - startX;
        var dy = e.clientY - startY;
        element.style.left = (initialX + dx) + 'px';
        element.style.top = (initialY + dy) + 'px';
      });

      document.addEventListener('mouseup', function () {
        if (isDragging) {
          isDragging = false;
          element.style.zIndex = '3';
        }
      });
    }

    // Apply to moving text
    var movingText = document.querySelector('.moving-text-left');
    if (movingText) makeDraggable(movingText);

    // Apply to all [data-draggable] elements
    var draggableElements = document.querySelectorAll('[data-draggable]');
    draggableElements.forEach(function (el) {
      makeDraggable(el);
    });
  }

  // ======================== IMAGE LAZY LOAD ========================
  function initImageLazyLoad() {
    var lazyImages = document.querySelectorAll('.detail-fullwidth-media img[loading="lazy"]');
    lazyImages.forEach(function (img) {
      if (img.complete) {
        img.classList.add('loaded');
      } else {
        img.addEventListener('load', function () {
          img.classList.add('loaded');
        });
      }
    });
  }

  // ======================== GSAP CINEMATIC ANIMATIONS ========================
  function initGSAPAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    // Moving text fade-in on scroll
    gsap.set('.moving-text-left', { opacity: 0, y: 40 });
    ScrollTrigger.create({
      trigger: '#section-moving',
      start: 'top 60%',
      onEnter: function () {
        gsap.to('.moving-text-left', {
          opacity: 1, y: 0, duration: 1, ease: 'power3.out'
        });
      }
    });

    // Cinematic slide-over sections
    var cinematicSections = [
      document.getElementById('section-overview'),
      document.getElementById('section-performance')
    ];

    // Add detail-fullwidth-block elements
    var fullwidthBlocks = document.querySelectorAll('.detail-fullwidth-block');
    for (var i = 0; i < fullwidthBlocks.length; i++) {
      cinematicSections.push(fullwidthBlocks[i]);
    }

    cinematicSections.forEach(function (section, index) {
      if (!section) return;

      var text = section.querySelector('.aero-floating-copy') || section.querySelector('.floating-text-clean');

      section.style.zIndex = index + 10;
      if (text) gsap.set(text, { opacity: 0, y: 40 });

      if (index === 0) {
        ScrollTrigger.create({
          trigger: section,
          start: 'top top',
          end: '+=100%',
          pin: true,
          pinSpacing: false,
          onEnter: function () { if (text) gsap.to(text, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }); },
          onLeave: function () { if (text) gsap.to(text, { opacity: 0, y: -40, duration: 0.5 }); },
          onEnterBack: function () { if (text) gsap.to(text, { opacity: 1, y: 0, duration: 0.8 }); },
          onLeaveBack: function () { if (text) gsap.to(text, { opacity: 0, y: 40, duration: 0.5 }); }
        });
      } else {
        var prevSection = cinematicSections[index - 1];

        gsap.set(section, { yPercent: 100 });
        gsap.to(section, {
          yPercent: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: prevSection,
            start: 'top top',
            end: '+=100%',
            scrub: true
          }
        });

        ScrollTrigger.create({
          trigger: section,
          start: 'top 70%',
          onEnter: function () { if (text) gsap.to(text, { opacity: 1, y: 0, duration: 0.8 }); },
          onLeave: function () { if (text) gsap.to(text, { opacity: 0, y: -40, duration: 0.5 }); },
          onEnterBack: function () { if (text) gsap.to(text, { opacity: 1, y: 0, duration: 0.8 }); },
          onLeaveBack: function () { if (text) gsap.to(text, { opacity: 0, y: 40, duration: 0.5 }); }
        });

        ScrollTrigger.create({
          trigger: section,
          start: 'top top',
          end: '+=100%',
          pin: true,
          pinSpacing: false
        });
      }
    });
  }

  // ======================== VIDEO HANDLER ========================
  function initVideoHandler(config) {
    if (window.REVV && window.REVV.videoHandler) {
      REVV.videoHandler.init({ accentColor: config.accentColor });
    }
  }

  // ======================== HOME TRANSITION ========================
  function initHomeTransition() {
    var btns = document.querySelectorAll('.hero-home-btn, .car-page-footer-link');
    btns.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var overlay = document.getElementById('home-transition');
        if (overlay) {
          overlay.classList.add('active');
          setTimeout(function () {
            window.location.href = '../home.html';
          }, 600);
        }
      });
    });
  }

  // ======================== MAIN BOOTSTRAP ========================
  /**
   * Initialize a car detail page with shared logic.
   * @param {Object} config - Page configuration
   * @param {string} config.brand - Brand identifier (e.g. 'bugatti')
   * @param {string} config.accentColor - CSS accent color (e.g. '#8cb8e8')
   * @param {string} config.modelPath - Path to .glb model file
   * @param {string|null} config.fallbackImage - Fallback image URL or null
   * @param {string} [config.heroVideoId='hero-intro-video'] - Hero video element ID
   * @param {string} [config.canvasId='hero-model-canvas'] - 3D canvas element ID
   * @param {string[]} config.navSections - Section IDs for floating nav tracking
   * @param {Object} config.driveModeConfig - Drive mode light configuration
   * @param {Array} config.driveModeConfig.lights - Array of {name, emissiveColor, intensity}
   * @param {Array} config.colorOptions - Color picker entries [{hex, name}]
   */
  function initCarPage(config) {
    config = config || {};
    config.heroVideoId = config.heroVideoId || 'hero-intro-video';
    config.canvasId = config.canvasId || 'hero-model-canvas';

    // 1. CDN Health Check
    var failed = checkCDNHealth();

    // 2. Lenis Init (if available)
    var lenisAvailable = failed.indexOf('lenis') === -1;
    if (lenisAvailable) {
      lenis = initLenis();
    }

    // 3. Zoom Prevention
    initZoomPrevention(config.canvasId);

    // 4. Three.js Scene Setup — DEFERRED to 360° button click
    // Do NOT init Three.js on page load. It creates WebGL context + loads shaders
    // which blocks other resources. Only init when user actually wants 3D.

    // 5. Model Loading — DEFERRED until user clicks 360° button
    // Model is NOT loaded on page load to prevent blocking CSS/video/images

    // 6. 360° / Video Toggle (passes config so model loads on first 360° click)
    init360VideoToggle(config);

    // 7. Color Change
    initColorControls();

    // 8. Drive Mode
    initDriveMode(config);

    // 9. Floating Nav
    initFloatingNav(config);

    // 10. Draggable Elements
    initDraggable();

    // 11. Image Lazy Load
    initImageLazyLoad();

    // 12. GSAP Cinematic Animations
    initGSAPAnimations();

    // 13. Video Handler
    initVideoHandler(config);

    // 14. Home Transition
    initHomeTransition();
  }

  // Expose public API
  window.REVV.initCarPage = initCarPage;
})();
