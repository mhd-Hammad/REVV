/**
 * REVV 3D Model Loader with Progress
 * Wraps THREE.GLTFLoader to display a circular SVG progress ring
 * overlaid on the canvas during download, with error handling,
 * toast notifications, and optional fallback image.
 */
window.REVV = window.REVV || {};

(function () {
  'use strict';

  /**
   * Creates and injects a premium loading overlay over the target canvas.
   * @param {HTMLElement} canvasEl - The canvas element to overlay
   * @param {string} accentColor - CSS color for accent
   * @returns {HTMLElement} The overlay element
   */
  function createOverlay(canvasEl, accentColor) {
    var overlay = document.createElement('div');
    overlay.className = 'revv-loader-overlay';
    overlay.id = 'revv-loader-overlay';
    overlay.style.setProperty('--accent', accentColor);

    overlay.innerHTML =
      '<div class="revv-loader-content">' +
        '<div class="revv-loader-icon">' +
          '<svg viewBox="0 0 120 48" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M20 38 C20 38 25 28 40 26 C50 24 55 20 60 18 C65 16 75 14 85 16 C95 18 100 22 105 28 C108 32 108 38 108 38" stroke-linecap="round"/>' +
            '<circle cx="35" cy="40" r="6"/>' +
            '<circle cx="90" cy="40" r="6"/>' +
            '<line x1="20" y1="38" x2="108" y2="38" stroke-opacity="0.3"/>' +
          '</svg>' +
        '</div>' +
        '<div class="revv-loader-bar">' +
          '<div class="revv-loader-bar__fill"></div>' +
        '</div>' +
        '<span class="revv-loader-text">Loading 3D Model</span>' +
        '<span class="revv-loader-percent">0%</span>' +
      '</div>';

    // Ensure canvas parent has relative positioning
    var parent = canvasEl.parentNode;
    if (parent) {
      var parentPos = window.getComputedStyle(parent).position;
      if (parentPos === 'static') {
        parent.style.position = 'relative';
      }
      parent.appendChild(overlay);
    }

    return overlay;
  }

  /**
   * Updates the loader with the current percentage.
   * @param {HTMLElement} overlay - The overlay element
   * @param {number} percent - Progress percentage (0-100)
   */
  function updateProgress(overlay, percent) {
    var barFill = overlay.querySelector('.revv-loader-bar__fill');
    var percentText = overlay.querySelector('.revv-loader-percent');

    if (barFill) {
      barFill.style.width = Math.round(percent) + '%';
    }
    if (percentText) {
      percentText.textContent = Math.round(percent) + '%';
    }
  }

  // Known model sizes in bytes (for percentage estimation when Content-Length unavailable)
  var KNOWN_MODEL_SIZES = {
    'bugatti.glb': 5452800,
    'ferrari.glb': 5767168,
    'lamborghini.glb': 8283136,
    'mclaren_p1.glb': 4718592,
    'pagani.glb': 1468006,
    'porsche.glb': 9961472,
    'rimac.glb': 4509696
  };

  /**
   * Sets the overlay to indeterminate mode (no Content-Length available).
   * Shows sliding bar but estimates percentage from known model sizes.
   * @param {HTMLElement} overlay - The overlay element
   */
  function setIndeterminate(overlay) {
    var bar = overlay.querySelector('.revv-loader-bar');

    if (bar) {
      bar.classList.add('revv-loader-bar--indeterminate');
    }
  }

  /**
   * Updates percentage using estimated total from known model sizes.
   */
  function updateIndeterminateProgress(overlay, bytesLoaded, modelPath) {
    var percentText = overlay.querySelector('.revv-loader-percent');
    var barFill = overlay.querySelector('.revv-loader-bar__fill');
    var bar = overlay.querySelector('.revv-loader-bar');

    // Extract filename from path
    var fileName = modelPath ? modelPath.split('/').pop() : '';
    var estimatedTotal = KNOWN_MODEL_SIZES[fileName] || 15000000; // default 15MB

    var percent = Math.min(99, Math.round((bytesLoaded / estimatedTotal) * 100));

    if (percentText) {
      percentText.textContent = percent + '%';
    }
    if (barFill && bar) {
      bar.classList.remove('revv-loader-bar--indeterminate');
      barFill.style.width = percent + '%';
    }
  }

  /**
   * Fades out and removes the overlay from the DOM.
   * @param {HTMLElement} overlay - The overlay element
   */
  function fadeOutOverlay(overlay) {
    overlay.classList.add('revv-loader-overlay--hidden');

    setTimeout(function () {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }, 400);
  }

  /**
   * Shows a fallback image in the canvas container.
   * @param {HTMLElement} canvasEl - The canvas element
   * @param {string} fallbackImageUrl - URL to the fallback image
   */
  function showFallbackImage(canvasEl, fallbackImageUrl) {
    var parent = canvasEl.parentNode;
    if (!parent) return;

    var img = document.createElement('img');
    img.src = fallbackImageUrl;
    img.alt = '3D model fallback';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    img.style.position = 'absolute';
    img.style.inset = '0';
    img.style.zIndex = '5';

    parent.appendChild(img);
  }

  /**
   * Loads a 3D model with progress feedback.
   * @param {Object} options - Load options
   * @param {string} options.path - Path to .glb file
   * @param {string} options.canvasId - ID of the canvas element to overlay
   * @param {string} options.accentColor - CSS color for progress ring
   * @param {string|null} [options.fallbackImageUrl] - Optional static image on failure
   * @param {Function|null} [options.onProgress] - Extra callback receiving percent 0-100
   * @param {Function} options.onLoad - Callback receiving gltf on success
   * @param {Function|null} [options.onError] - Extra callback receiving error
   * @returns {Promise} Resolves with gltf object on success, rejects with error on failure
   */
  function loadModel(options) {
    return new Promise(function (resolve, reject) {
      // Check if THREE global exists
      if (typeof THREE === 'undefined') {
        var noThreeError = new Error('THREE.js is not loaded');

        if (window.REVV && window.REVV.toast) {
          REVV.toast.show({
            message: '3D viewer unavailable — THREE.js failed to load',
            type: 'error',
            duration: 0
          });
        }

        if (options.onError && typeof options.onError === 'function') {
          options.onError(noThreeError);
        }

        reject(noThreeError);
        return;
      }

      // Check if GLTFLoader is available
      if (!THREE.GLTFLoader) {
        var noLoaderError = new Error('THREE.GLTFLoader is not available');

        if (window.REVV && window.REVV.toast) {
          REVV.toast.show({
            message: '3D viewer unavailable — GLTFLoader failed to load',
            type: 'error',
            duration: 0
          });
        }

        if (options.onError && typeof options.onError === 'function') {
          options.onError(noLoaderError);
        }

        reject(noLoaderError);
        return;
      }

      var canvasEl = document.getElementById(options.canvasId);
      if (!canvasEl) {
        var noCanvasError = new Error('Canvas element not found: #' + options.canvasId);

        if (options.onError && typeof options.onError === 'function') {
          options.onError(noCanvasError);
        }

        reject(noCanvasError);
        return;
      }

      // Create and inject the progress overlay
      var overlay = createOverlay(canvasEl, options.accentColor || '#8cb8e8');
      var indeterminateSet = false;

      var gltfLoader = new THREE.GLTFLoader();

      // Add Draco decoder for compressed models
      if (THREE.DRACOLoader) {
        var dracoLoader = new THREE.DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
        gltfLoader.setDRACOLoader(dracoLoader);
      }

      gltfLoader.load(
        options.path,

        // onLoad callback
        function (gltf) {
          fadeOutOverlay(overlay);
          resolve(gltf);

          if (options.onLoad && typeof options.onLoad === 'function') {
            options.onLoad(gltf);
          }
        },

        // onProgress callback
        function (xhr) {
          if (xhr.total === 0) {
            // No Content-Length header — estimate percentage from known sizes
            if (!indeterminateSet) {
              setIndeterminate(overlay);
              indeterminateSet = true;
            }
            updateIndeterminateProgress(overlay, xhr.loaded, options.path);
          } else {
            var percent = (xhr.loaded / xhr.total) * 100;
            updateProgress(overlay, percent);

            if (options.onProgress && typeof options.onProgress === 'function') {
              options.onProgress(percent);
            }
          }
        },

        // onError callback
        function (error) {
          // Hide the loader content from overlay
          var loaderContent = overlay.querySelector('.revv-loader-content');
          if (loaderContent) loaderContent.style.display = 'none';
          if (percentText) percentText.style.display = 'none';

          // Retry function re-invokes loadModel with same options
          var retryFn = function () {
            // Remove the current overlay if still present
            if (overlay.parentNode) {
              overlay.parentNode.removeChild(overlay);
            }
            loadModel(options);
          };

          // Show toast with retry
          if (window.REVV && window.REVV.toast) {
            REVV.toast.show({
              message: '3D model failed to load',
              type: 'error',
              duration: 0,
              retryAction: retryFn
            });
          }

          // Show fallback image if configured
          if (options.fallbackImageUrl) {
            showFallbackImage(canvasEl, options.fallbackImageUrl);
          }

          // Call onError callback if provided
          if (options.onError && typeof options.onError === 'function') {
            options.onError(error);
          }

          // Reject the promise
          reject(error);
        }
      );
    });
  }

  // Expose public API
  window.REVV.loader = {
    loadModel: loadModel
  };
})();
