/**
 * REVV Video Loading/Error Handler
 * Attaches loading states and error handling to all <video> elements on a page.
 * Depends on: window.REVV.toast (toast.js must be loaded first)
 */
window.REVV = window.REVV || {};

(function () {
  'use strict';

  // Default poster fallback: inline SVG dark gradient data URI
  var DEFAULT_POSTER =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%230a0a0f'/%3E%3Cstop offset='100%25' stop-color='%2315151a'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23g)' width='16' height='9'/%3E%3C/svg%3E";

  /**
   * Initialize video handler for all <video> elements on the page.
   * Videos below the fold are lazy-loaded (src removed until scrolled into view).
   * @param {Object} [options]
   * @param {string} [options.accentColor] - Brand accent for shimmer highlight
   * @param {string} [options.posterFallback] - Data URI or path for poster
   */
  function init(options) {
    var opts = options || {};
    var videos = document.querySelectorAll('video');

    for (var i = 0; i < videos.length; i++) {
      var video = videos[i];
      var isHeroVideo = video.id === 'hero-intro-video' || video.id === 'hero-car-video';

      if (isHeroVideo) {
        // Hero videos load immediately
        handleVideo(video, opts);
      } else {
        // Off-screen videos: defer loading until visible
        deferVideo(video, opts);
      }
    }
  }

  /**
   * Defer a video's loading until it scrolls into view.
   * Stores the src, removes it, and restores when visible.
   */
  function deferVideo(videoEl, opts) {
    if (!videoEl || videoEl._revvDeferred) return;
    videoEl._revvDeferred = true;

    // Store original src and remove it to prevent download
    var originalSrc = videoEl.getAttribute('src') || '';
    var sourceEl = videoEl.querySelector('source');
    var sourceSrc = sourceEl ? sourceEl.getAttribute('src') : '';

    if (originalSrc) {
      videoEl.removeAttribute('src');
      videoEl.setAttribute('data-src', originalSrc);
    }
    if (sourceEl && sourceSrc) {
      sourceEl.removeAttribute('src');
      sourceEl.setAttribute('data-src', sourceSrc);
    }

    // Set preload to none
    videoEl.preload = 'none';

    // Set poster placeholder
    var poster = opts.posterFallback || DEFAULT_POSTER;
    videoEl.setAttribute('poster', poster);

    // Use IntersectionObserver to load when visible
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            observer.unobserve(videoEl);
            restoreAndPlay(videoEl, originalSrc, sourceEl, sourceSrc, opts);
          }
        });
      }, { rootMargin: '200px' }); // Start loading 200px before visible

      observer.observe(videoEl);
    } else {
      // Fallback: just load immediately if no IntersectionObserver
      restoreAndPlay(videoEl, originalSrc, sourceEl, sourceSrc, opts);
    }
  }

  /**
   * Restore video src and begin playback.
   */
  function restoreAndPlay(videoEl, originalSrc, sourceEl, sourceSrc, opts) {
    if (originalSrc) {
      videoEl.src = originalSrc;
    }
    if (sourceEl && sourceSrc) {
      sourceEl.src = sourceSrc;
    }
    videoEl.preload = 'metadata';
    videoEl.autoplay = true;
    videoEl.load();
    videoEl.play().catch(function () {});
    handleVideo(videoEl, opts);
  }

  /**
   * Attach loading/error state handling to a single video element.
   * @param {HTMLVideoElement} videoEl - The video element to handle
   * @param {Object} [options]
   * @param {string} [options.accentColor] - Brand accent color
   * @param {string} [options.posterFallback] - Poster fallback URI
   */
  function handleVideo(videoEl, options) {
    if (!videoEl || !videoEl.parentNode) return;

    var opts = options || {};
    var parent = videoEl.parentNode;
    var poster = opts.posterFallback || DEFAULT_POSTER;

    // Guard: mark video as already handled to prevent double-init
    if (videoEl._revvHandled) return;
    videoEl._revvHandled = true;

    // Set accent color CSS variable if provided
    if (opts.accentColor) {
      parent.style.setProperty('--accent', opts.accentColor);
    }

    // Add loading state to parent container (shows shimmer)
    if (!parent.classList.contains('is-loading')) {
      parent.classList.add('is-loading');
    }

    // Set poster attribute to dark gradient placeholder
    videoEl.setAttribute('poster', poster);

    // Track state to guard against multiple event firings
    var isLoading = true;
    var isBuffering = false;
    var hasError = false;

    // --- Event: canplay or playing → remove loading state ---
    function onReady() {
      if (!isLoading || hasError) return;
      isLoading = false;
      parent.classList.remove('is-loading');
    }

    videoEl.addEventListener('canplay', onReady);
    videoEl.addEventListener('playing', function () {
      // Remove loading if still loading
      if (isLoading && !hasError) {
        isLoading = false;
        parent.classList.remove('is-loading');
      }
      // Remove buffering state when playback resumes
      if (isBuffering) {
        isBuffering = false;
        parent.classList.remove('is-buffering');
      }
    });

    // --- Event: waiting / stalled → add buffering state ---
    function onBuffering() {
      if (hasError) return;
      if (!isBuffering) {
        isBuffering = true;
        parent.classList.add('is-buffering');
      }
    }

    videoEl.addEventListener('waiting', onBuffering);
    videoEl.addEventListener('stalled', onBuffering);

    // --- Event: error → show retry UI and fire toast ---
    videoEl.addEventListener('error', function () {
      // Guard: don't inject error UI twice
      if (hasError) return;
      hasError = true;
      isLoading = false;
      isBuffering = false;

      // Remove loading/buffering states
      parent.classList.remove('is-loading');
      parent.classList.remove('is-buffering');

      // Inject inline retry UI
      var errorDiv = document.createElement('div');
      errorDiv.className = 'revv-video-error';

      var msgP = document.createElement('p');
      msgP.className = 'revv-video-error__msg';
      msgP.textContent = 'Video unavailable';
      errorDiv.appendChild(msgP);

      var retryBtn = document.createElement('button');
      retryBtn.className = 'revv-video-error__retry';
      retryBtn.textContent = 'RETRY';
      retryBtn.addEventListener('click', function () {
        retryVideo(videoEl, parent, errorDiv, opts);
      });
      errorDiv.appendChild(retryBtn);

      parent.appendChild(errorDiv);

      // Fire toast notification
      if (window.REVV && window.REVV.toast && window.REVV.toast.show) {
        window.REVV.toast.show({
          message: 'Video unavailable',
          type: 'error',
          duration: 5000
        });
      }
    });
  }

  /**
   * Retry loading the video: re-set src, call load() then play(), remove error UI.
   * @param {HTMLVideoElement} videoEl
   * @param {HTMLElement} parent
   * @param {HTMLElement} errorDiv
   * @param {Object} opts
   */
  function retryVideo(videoEl, parent, errorDiv, opts) {
    // Get the video's src (direct or from first <source>)
    var src = videoEl.src;
    if (!src) {
      var sourceEl = videoEl.querySelector('source');
      if (sourceEl) {
        src = sourceEl.getAttribute('src');
      }
    }

    // Remove the error UI
    if (errorDiv && errorDiv.parentNode) {
      errorDiv.parentNode.removeChild(errorDiv);
    }

    // Reset handled flag so events can fire again
    videoEl._revvHandled = false;

    // Re-set source to force reload
    if (src) {
      if (videoEl.src) {
        videoEl.src = src;
      } else {
        var sourceEl2 = videoEl.querySelector('source');
        if (sourceEl2) {
          sourceEl2.setAttribute('src', src);
        }
      }
    }

    // Reload and play
    videoEl.load();
    videoEl.play();

    // Re-attach handling
    handleVideo(videoEl, opts);
  }

  // Expose public API
  window.REVV.videoHandler = {
    init: init,
    handleVideo: handleVideo
  };
})();
