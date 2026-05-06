// fixou.app — bootstrap

(function () {
  'use strict';

  // === Topbar wiring ===
  function wireTopbar() {
    var navDash = document.getElementById('nav-dashboard');
    var navProv = document.getElementById('nav-providers');
    var navProf = document.getElementById('nav-profile');
    var orgBtn = document.getElementById('org-switcher-btn');

    if (navDash) navDash.addEventListener('click', function () { window.location.hash = '#dashboard'; });
    if (navProv) navProv.addEventListener('click', function () { window.location.hash = '#providers'; });
    if (navProf) navProf.addEventListener('click', function () { window.location.hash = '#profile'; });

    if (orgBtn) {
      orgBtn.addEventListener('click', function () {
        if (window._openOrgSwitcher) window._openOrgSwitcher();
      });
    }
  }

  function syncTopbarUser() {
    var user = window.AppStore.currentUser;
    var topbar = document.getElementById('topbar');
    var avatar = document.getElementById('topbar-avatar');
    var fallback = document.getElementById('topbar-avatar-fallback');

    if (!topbar) return;
    topbar.hidden = !user;

    if (user && user.photoURL && avatar) {
      avatar.src = user.photoURL;
      avatar.hidden = false;
      if (fallback) fallback.hidden = true;
    } else {
      if (avatar) avatar.hidden = true;
      if (fallback) fallback.hidden = false;
    }
  }

  function syncTopbarOrg() {
    var orgEl = document.getElementById('topbar-org');
    var nameEl = document.getElementById('org-current-name');
    if (!orgEl || !nameEl) return;

    var memberships = window.AppStore.memberships || [];
    if (memberships.length === 0) {
      orgEl.hidden = true;
      return;
    }
    orgEl.hidden = false;

    var current = window.AppStore.currentOrg;
    if (current && current.name) {
      nameEl.textContent = current.name;
    } else if (window.AppStore.currentOrgId) {
      nameEl.textContent = '…';
    } else {
      nameEl.textContent = 'Selecionar organização';
    }
  }

  // === User onboarding check ===
  // True ONLY if user has no displayName at all (brand-new user).
  // Roles (admin/manager/provider) are contextual per-organization, NOT a person-level attribute.
  // Existing users with displayName but no `onboarded` flag are considered ok (no friction).
  window._needsOnboarding = function () {
    var u = window.AppStore.currentUser;
    if (!u) return false;
    if (!u.userDocLoaded) return false; // not ready yet
    return !u.displayName || u.displayName.trim().length === 0;
  };

  // === Auth state listener ===
  function onAuthChanged(fbUser) {
    var splash = document.getElementById('splash');
    if (splash && splash.parentNode) {
      splash.style.display = 'none';
    }

    if (!fbUser) {
      window.AppStore.reset();
      syncTopbarUser();
      syncTopbarOrg();
      window.AppStore.authReady = true;
      if (window.location.hash !== '#login') {
        window.location.hash = '#login';
      } else {
        window.routerRender();
      }
      return;
    }

    // Bootstrap user
    var baseUser = {
      uid: fbUser.uid,
      email: fbUser.email,
      displayName: fbUser.displayName || (fbUser.email || '').split('@')[0],
      photoURL: fbUser.photoURL,
      userDocLoaded: false
    };
    window.AppStore.currentUser = baseUser;
    window.AppStore.authReady = true;
    syncTopbarUser();

    // Load user doc + memberships
    Promise.all([
      window.AppStore.loadUserDoc(fbUser.uid),
      Promise.resolve()
    ]).then(function (results) {
      var userDoc = results[0];
      if (userDoc) {
        window.AppStore.currentUser = Object.assign({}, baseUser, userDoc, { userDocLoaded: true });
      } else {
        // Create initial user doc on first sign-in
        window.AppStore.saveUserDoc(fbUser.uid, {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: baseUser.displayName,
          photoURL: fbUser.photoURL || null
        });
        window.AppStore.currentUser.userDocLoaded = true;
      }

      // Start listeners
      window.AppStore.listenMemberships();
      window.AppStore.listenProviderProfile(fbUser.uid);

      // Restore last org or pick first
      var stored = null;
      try { stored = localStorage.getItem('fixou_currentOrgId'); } catch (e) {}

      // Wait one tick for memberships listener to fire, then route
      setTimeout(function () {
        var memberships = window.AppStore.memberships || [];
        if (stored && memberships.find(function (m) { return m.orgId === stored; })) {
          window.AppStore.setCurrentOrg(stored);
        } else if (memberships.length > 0) {
          window.AppStore.setCurrentOrg(memberships[0].orgId);
        }
        syncTopbarOrg();

        // Decide initial route
        if (window._needsOnboarding()) {
          if (window.location.hash !== '#onboarding') {
            window.location.hash = '#onboarding';
          } else {
            window.routerRender();
          }
        } else {
          if (window.location.hash === '#login' || !window.location.hash) {
            window.location.hash = '#dashboard';
          } else {
            window.routerRender();
          }
        }
      }, 400);
    });
  }

  // === Listen to store events ===
  window.addEventListener('memberships-changed', syncTopbarOrg);
  window.addEventListener('current-org-doc-changed', syncTopbarOrg);
  window.addEventListener('current-org-changed', syncTopbarOrg);

  // === Boot ===
  document.addEventListener('DOMContentLoaded', function () {
    wireTopbar();
    window.initRouter();
    window.auth.onAuthStateChanged(onAuthChanged);
    console.log('[fixou.app] booted — version', window.FIXOU_VERSION);
  });
})();
