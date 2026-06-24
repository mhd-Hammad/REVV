/**
 * REVV — Ferrari SF90 Page Configuration
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
      brand: 'ferrari',
      accentColor: '#DC143C',
      modelPath: '../assets/models/ferrari.glb',
      fallbackImage: null,
      heroVideoId: 'hero-intro-video',
      canvasId: 'hero-model-canvas',
      navSections: [
        'section-sf90',
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
        { hex: '#DC143C', name: 'Rosso Corsa' },
        { hex: '#FFD700', name: 'Yellow' },
        { hex: '#f0f0f0', name: 'White' }
      ]
    });
  });
})();
