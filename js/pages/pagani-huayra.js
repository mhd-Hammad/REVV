/**
 * REVV — Pagani Huayra Page Configuration
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
      brand: 'pagani',
      accentColor: '#4169E1',
      modelPath: '../assets/models/pagani.glb',
      fallbackImage: null,
      heroVideoId: 'hero-intro-video',
      canvasId: 'hero-model-canvas',
      navSections: [
        'section-huayra',
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
        { hex: '#c0c0c0', name: 'Silver' },
        { hex: '#4169E1', name: 'Blue' },
        { hex: '#333333', name: 'Carbon' }
      ]
    });
  });
})();
