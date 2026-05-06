// fixou.app — Hash-based router

(function () {
  'use strict';

  var publicRoutes = ['login']; // routes that don't require auth

  function parseHash() {
    var hash = window.location.hash.replace(/^#/, '') || 'dashboard';
    var parts = hash.split('/');
    return { route: parts[0], params: parts.slice(1) };
  }

  function render() {
    var container = document.getElementById('view-container');
    if (!container) return;

    var parsed = parseHash();
    var route = parsed.route;
    var params = parsed.params;

    var user = window.AppStore.currentUser;

    // Auth guard
    if (!user && publicRoutes.indexOf(route) === -1) {
      window.location.hash = '#login';
      return;
    }
    if (user && route === 'login') {
      // already signed in — go to dashboard or onboarding
      if (window._needsOnboarding && window._needsOnboarding()) {
        window.location.hash = '#onboarding';
      } else {
        window.location.hash = '#dashboard';
      }
      return;
    }

    // Show/hide topbar based on auth
    var topbar = document.getElementById('topbar');
    if (topbar) topbar.hidden = !user;

    // Route dispatch
    var renderers = {
      login: window.renderLogin,
      onboarding: window.renderOnboarding,
      dashboard: window.renderDashboard,
      ticket: window.renderTicket,
      admin: window.renderAdmin,
      providers: window.renderProviders,
      profile: window.renderProfile
    };

    var fn = renderers[route];
    if (fn) {
      try {
        fn(container, params);
      } catch (err) {
        console.error('[router] render error for', route, err);
        container.innerHTML = '<div class="card"><h2>Erro</h2><p class="text-muted">' + window._safeHtml(err.message || 'Erro ao renderizar a página.') + '</p></div>';
      }
    } else {
      container.innerHTML = '<div class="card"><h2>Página não encontrada</h2><p class="text-muted">Rota: ' + window._safeHtml(route) + '</p></div>';
    }

    // Scroll to top on route change
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  window.initRouter = function () {
    window.addEventListener('hashchange', render);
    render();
  };

  window.routerRender = render;

  console.log('[fixou.app] router.js loaded');
})();
