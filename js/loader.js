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
   * Creates and injects the SVG progress ring overlay over the target canvas.
   * @param {HTMLElement} canvasEl - The canvas element to overlay
   * @param {string} accentColor - CSS color for the progress ring
   * @returns {HTMLElement} The overlay element
   */
  function createOverlay(canvasEl, accentColor) {
    var overlay = document.createElement('div');
    overlay.className = 'revv-loader-overlay';
    overlay.id = 'revv-loader-overlay';
    overlay.style.setProperty('--accent', accentColor);

    overlay.innerHTML =
      '<svg class="revv-loader-ring" viewBox="0 0 100 100">' +
        '<circle class="revv-loader-ring__track" cx="50" cy="50" r="44" />' +
        '<circle class="revv-loader-ring__progress" cx="50" cy="50" r="44" ' +
          'stroke-dasharray="276.46" stroke-dashoffset="276.46" />' +
      '</svg>' +
      '<span class="revv-loader-percent">0%</span>';

    // Set accent color on the progress circle via inline style
    var progressCircle = overlay.querySelector('.revv-loader-ring__progress');
    if (progressCircle) {
      progressCircle.style.stroke = accentColor;
    }

    // Ensure canvas parent has relative positioning for overlay placement
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
   * Updates the progress ring with the current percentage.
   * @param {HTMLElement} overlay - The overlay element
   * @param {number} percent - Progress percentage (0-100)
   */
  function updateProgress(overlay, percent) {
    var progressCircle = overlay.querySelector('.revv-loader-ring__progress');
    var percentText = overlay.querySelector('.revv-loader-percent');

    if (progressCircle) {
      var offset = 276.46 * (1 - percent / 100);
      progressCircle.style.strokeDashoffset = offset;
    }

    if (percentText) {
      percentText.textContent = Math.round(percent) + '%';
    }
  }

  /**
   * Sets the ring to indeterminate mode (no Content-Length available).
   * @param {HTMLElement} overlay - The overlay element
   */
  function setIndeterminate(overlay) {
    var ring = overlay.querySelector('.revv-loader-ring');
    var percentText = overlay.querySelector('.revv-loader-percent');

    if (ring) {
      ring.classList.add('revv-loader-ring--indeterminate');
    }

    if (percentText) {
      percentText.style.display = 'none';
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
            // No Content-Length header — use indeterminate spinner
            if (!indeterminateSet) {
              setIndeterminate(overlay);
              indeterminateSet = true;
            }
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
          // Hide the progress ring from overlay
          var ring = overlay.querySelector('.revv-loader-ring');
          var percentText = overlay.querySelector('.revv-loader-percent');
          if (ring) ring.style.display = 'none';
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
