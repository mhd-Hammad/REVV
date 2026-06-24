/**
 * REVV — Lamborghini Revuelto Page Configuration
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
      brand: 'lamborghini',
      accentColor: '#e8a020',
      modelPath: '../assets/models/lamborghini.glb',
      fallbackImage: null,
      heroVideoId: 'hero-intro-video',
      canvasId: 'hero-model-canvas',
      navSections: [
        'section-revuelto',
        'section-perf',
        'section-overview',
        'section-performance',
        'section-details'
      ],
      driveModeConfig: {
        lights: [
          { name: 'headlight', emissiveColor: 0xffffff, intensity: 5 },
          { name: 'taillight', emissiveColor: 0xff0000, intensity: 8 },
          { name: 'glass_light', emissiveColor: 0xccddff, intensity: 3 }
        ]
      },
      colorOptions: [
        { hex: '#1a1a1a', name: 'Black' },
        { hex: '#66cc33', name: 'Verde Mantis' },
        { hex: '#e8a020', name: 'Gold' },
        { hex: '#ff6600', name: 'Orange' }
      ]
    });
  });
})();
