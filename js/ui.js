// fixou.app — UI helpers (notifications, modals, sanitization)

(function () {
  'use strict';

  // Sanitize text for safe HTML insertion
  window._safeHtml = function (str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  // Sanitize for use inside attribute values (single-quote contexts)
  window._safeAttr = function (str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
  };

  // Toast notification
  // type: 'info' | 'success' | 'warning' | 'error'
  window.showNotification = function (title, message, type, durationMs) {
    type = type || 'info';
    durationMs = durationMs || 4000;
    var container = document.getElementById('notification-container');
    if (!container) return;

    var el = document.createElement('div');
    el.className = 'notification ' + type;
    el.innerHTML =
      '<div class="notification-title">' + window._safeHtml(title) + '</div>' +
      (message ? '<div class="notification-message">' + window._safeHtml(message) + '</div>' : '');
    container.appendChild(el);

    setTimeout(function () {
      el.style.transition = 'opacity 0.3s, transform 0.3s';
      el.style.opacity = '0';
      el.style.transform = 'translateX(20px)';
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 300);
    }, durationMs);
  };

  // Confirm dialog (Promise-based)
  window.showConfirmDialog = function (title, message, opts) {
    opts = opts || {};
    var confirmText = opts.confirmText || 'Confirmar';
    var cancelText = opts.cancelText || 'Cancelar';
    var danger = !!opts.danger;

    return new Promise(function (resolve) {
      var overlay = document.createElement('div');
      overlay.className = 'modal-overlay active';
      overlay.style.zIndex = '10000';
      overlay.innerHTML =
        '<div class="modal" role="dialog" aria-labelledby="confirm-title">' +
          '<div class="modal-header">' +
            '<h2 class="modal-title" id="confirm-title">' + window._safeHtml(title) + '</h2>' +
          '</div>' +
          '<p style="margin-bottom:20px;color:var(--text-secondary);">' + window._safeHtml(message) + '</p>' +
          '<div style="display:flex;gap:8px;justify-content:flex-end;">' +
            '<button class="btn btn-ghost" data-action="cancel">' + window._safeHtml(cancelText) + '</button>' +
            '<button class="btn ' + (danger ? 'btn-danger' : 'btn-primary') + '" data-action="confirm">' + window._safeHtml(confirmText) + '</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(overlay);

      function cleanup(result) {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        resolve(result);
      }

      overlay.addEventListener('click', function (e) {
        var action = e.target && e.target.dataset && e.target.dataset.action;
        if (action === 'confirm') cleanup(true);
        else if (action === 'cancel' || e.target === overlay) cleanup(false);
      });
    });
  };

  // Alert dialog
  window.showAlertDialog = function (title, message) {
    return new Promise(function (resolve) {
      var overlay = document.createElement('div');
      overlay.className = 'modal-overlay active';
      overlay.style.zIndex = '10000';
      overlay.innerHTML =
        '<div class="modal" role="dialog">' +
          '<div class="modal-header">' +
            '<h2 class="modal-title">' + window._safeHtml(title) + '</h2>' +
          '</div>' +
          '<p style="margin-bottom:20px;color:var(--text-secondary);">' + window._safeHtml(message) + '</p>' +
          '<div style="display:flex;justify-content:flex-end;">' +
            '<button class="btn btn-primary" data-action="ok">OK</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(overlay);

      function cleanup() {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        resolve();
      }

      overlay.addEventListener('click', function (e) {
        var action = e.target && e.target.dataset && e.target.dataset.action;
        if (action === 'ok' || e.target === overlay) cleanup();
      });
    });
  };

  // Loading overlay
  var _loadingOverlay = null;
  window.showLoading = function (text) {
    if (_loadingOverlay) return;
    _loadingOverlay = document.createElement('div');
    _loadingOverlay.className = 'modal-overlay active';
    _loadingOverlay.style.zIndex = '11000';
    _loadingOverlay.style.background = 'rgba(0,0,0,0.5)';
    _loadingOverlay.innerHTML =
      '<div style="background:var(--bg-card);border-radius:var(--radius);padding:24px 32px;display:flex;align-items:center;gap:14px;">' +
        '<span style="font-size:1.4rem;animation:pulse 1s infinite;">⏳</span>' +
        '<span>' + window._safeHtml(text || 'Carregando…') + '</span>' +
      '</div>';
    document.body.appendChild(_loadingOverlay);
  };
  window.hideLoading = function () {
    if (_loadingOverlay && _loadingOverlay.parentNode) {
      _loadingOverlay.parentNode.removeChild(_loadingOverlay);
    }
    _loadingOverlay = null;
  };

  // Format timestamp (Firestore Timestamp or ms)
  window.formatTime = function (ts) {
    if (!ts) return '';
    var date = ts.toDate ? ts.toDate() : new Date(ts);
    var now = new Date();
    var diffMs = now - date;
    var diffMin = Math.floor(diffMs / 60000);
    var diffH = Math.floor(diffMin / 60);
    var diffD = Math.floor(diffH / 24);
    if (diffMin < 1) return 'agora';
    if (diffMin < 60) return diffMin + ' min atrás';
    if (diffH < 24) return diffH + 'h atrás';
    if (diffD < 7) return diffD + 'd atrás';
    return date.toLocaleDateString('pt-BR');
  };

  // Empty state helper
  window.emptyState = function (icon, title, message) {
    return (
      '<div class="card" style="text-align:center;padding:40px 20px;">' +
        '<div style="font-size:3rem;margin-bottom:12px;">' + (icon || '📭') + '</div>' +
        '<div style="font-weight:700;font-size:1.05rem;margin-bottom:4px;">' + window._safeHtml(title) + '</div>' +
        (message ? '<div class="text-muted text-small">' + window._safeHtml(message) + '</div>' : '') +
      '</div>'
    );
  };

  console.log('[fixou.app] ui.js loaded');
})();
