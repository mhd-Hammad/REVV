/**
 * REVV — Porsche 911 GT3 RS Page Configuration
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
      brand: 'porsche',
      accentColor: '#d5001c',
      modelPath: '../assets/models/porsche.glb',
      fallbackImage: null,
      heroVideoId: 'hero-intro-video',
      canvasId: 'hero-model-canvas',
      navSections: [
        'section-gt3rs',
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
        { hex: '#d5001c', name: 'Guards Red' },
        { hex: '#b5b5b5', name: 'GT Silver' },
        { hex: '#ffd800', name: 'Racing Yellow' }
      ]
    });
  });
})();
