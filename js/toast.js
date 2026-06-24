/**
 * REVV Toast Notification System
 * Provides stackable, auto-dismissing toast notifications
 * matching the REVV dark luxury aesthetic.
 */
window.REVV = window.REVV || {};

(function () {
  'use strict';

  var container = null;
  var MAX_VISIBLE = 4;

  // SVG icons per toast type
  var icons = {
    error:
      '<svg viewBox="0 0 20 20" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/>' +
      '<line x1="7" y1="7" x2="13" y2="13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
      '<line x1="13" y1="7" x2="7" y2="13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
      '</svg>',
    warning:
      '<svg viewBox="0 0 20 20" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M10 2L1 18h18L10 2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>' +
      '<line x1="10" y1="8" x2="10" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
      '<circle cx="10" cy="15" r="0.8" fill="currentColor"/>' +
      '</svg>',
    info:
      '<svg viewBox="0 0 20 20" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/>' +
      '<line x1="10" y1="9" x2="10" y2="14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
      '<circle cx="10" cy="6.5" r="0.8" fill="currentColor"/>' +
      '</svg>'
  };

  /**
   * Ensures the toast container exists in the DOM.
   * Injects it on first call.
   */
  function ensureContainer() {
    if (container) return container;

    container = document.createElement('div');
    container.id = 'revv-toast-container';
    container.className = 'revv-toast-container';
    document.body.appendChild(container);

    return container;
  }

  /**
   * Returns all visible toast elements currently in the container.
   */
  function getVisibleToasts() {
    if (!container) return [];
    return Array.prototype.slice.call(container.querySelectorAll('.revv-toast'));
  }

  /**
   * Dismiss a single toast element with exit animation.
   * @param {HTMLElement} toastEl - The toast element to dismiss
   */
  function dismiss(toastEl) {
    if (!toastEl || !toastEl.parentNode) return;

    // Prevent double-dismiss
    if (toastEl.classList.contains('revv-toast--exiting')) return;

    // Clear any auto-dismiss timer
    if (toastEl._dismissTimer) {
      clearTimeout(toastEl._dismissTimer);
      toastEl._dismissTimer = null;
    }

    // Add exit animation class
    toastEl.classList.remove('revv-toast--entering');
    toastEl.classList.add('revv-toast--exiting');

    // Remove from DOM after animation completes (250ms)
    setTimeout(function () {
      if (toastEl.parentNode) {
        toastEl.parentNode.removeChild(toastEl);
      }
    }, 250);
  }

  /**
   * Dismiss all visible toasts.
   */
  function dismissAll() {
    var toasts = getVisibleToasts();
    for (var i = 0; i < toasts.length; i++) {
      dismiss(toasts[i]);
    }
  }

  /**
   * Show a new toast notification.
   * @param {Object} options
   * @param {string} options.message - The notification text (required)
   * @param {string} [options.type='info'] - 'error' | 'warning' | 'info'
   * @param {number} [options.duration=5000] - Auto-dismiss delay in ms (0 = persistent)
   * @param {Function|null} [options.retryAction=null] - If provided, shows a RETRY button
   * @returns {HTMLElement} The created toast element
   */
  function show(options) {
    if (!options || !options.message) return null;

    var message = options.message;
    var type = options.type || 'info';
    var duration = options.duration !== undefined ? options.duration : 5000;
    var retryAction = options.retryAction || null;

    ensureContainer();

    // Enforce max visible toasts — auto-dismiss oldest when limit reached
    var visibleToasts = getVisibleToasts();
    while (visibleToasts.length >= MAX_VISIBLE) {
      dismiss(visibleToasts[0]);
      visibleToasts = getVisibleToasts();
    }

    // Build toast element
    var toast = document.createElement('div');
    toast.className = 'revv-toast revv-toast--' + type + ' revv-toast--entering';

    // Icon
    var iconDiv = document.createElement('div');
    iconDiv.className = 'revv-toast__icon';
    iconDiv.innerHTML = icons[type] || icons.info;
    toast.appendChild(iconDiv);

    // Body
    var bodyDiv = document.createElement('div');
    bodyDiv.className = 'revv-toast__body';
    var msgP = document.createElement('p');
    msgP.className = 'revv-toast__message';
    msgP.textContent = message; // textContent to prevent XSS
    bodyDiv.appendChild(msgP);
    toast.appendChild(bodyDiv);

    // Retry button (only if retryAction provided)
    if (retryAction && typeof retryAction === 'function') {
      var retryBtn = document.createElement('button');
      retryBtn.className = 'revv-toast__retry';
      retryBtn.textContent = 'RETRY';
      retryBtn.addEventListener('click', function () {
        retryAction();
        dismiss(toast);
      });
      toast.appendChild(retryBtn);
    }

    // Close button
    var closeBtn = document.createElement('button');
    closeBtn.className = 'revv-toast__close';
    closeBtn.setAttribute('aria-label', 'Dismiss');
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', function () {
      dismiss(toast);
    });
    toast.appendChild(closeBtn);

    // Append to container
    container.appendChild(toast);

    // Auto-dismiss after duration (if duration > 0)
    if (duration > 0) {
      toast._dismissTimer = setTimeout(function () {
        dismiss(toast);
      }, duration);
    }

    return toast;
  }

  // Expose public API
  window.REVV.toast = {
    show: show,
    dismiss: dismiss,
    dismissAll: dismissAll
  };
})();
