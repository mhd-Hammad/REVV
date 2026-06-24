/**
 * REVV — Bugatti Chiron Page Configuration
 * Calls REVV.initCarPage() with brand-specific settings.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    if (!window.REVV || !window.REVV.initCarPage) {
      console.error('REVV shared-car-page.js not loaded');
      return;
    }

    REVV.initCarPage({
      brand: 'bugatti',
      accentColor: '#8cb8e8',
      modelPath: '../assets/models/bugatti.glb',
      fallbackImage: null,
      heroVideoId: 'hero-intro-video',
      canvasId: 'hero-model-canvas',
      navSections: [
        'section-chiron',
        'section-perf',
        'section-overview',
        'section-performance',
        'section-details'
      ],
      driveModeConfig: {
        lights: [
          { name: 'chironmi_light1', emissiveColor: 0xffffff, intensity: 5 },
          { name: 'chironred_glass', emissiveColor: 0xff0000, intensity: 8 },
          { name: 'chironmi_glass_light1', emissiveColor: 0xccddff, intensity: 3 },
          { name: 'chironmi_dashboard1', emissiveColor: 0x8cb8e8, intensity: 4 }
        ]
      },
      colorOptions: [
        { hex: '#1a1a1a', name: 'Black' },
        { hex: '#ff4500', name: 'OrangeRed' },
        { hex: '#003A99', name: 'Blue' },
        { hex: '#4B0000', name: 'Dark Red' }
      ]
    });
  });
})();
