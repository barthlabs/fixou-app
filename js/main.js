// fixou.app — bootstrap

(function () {
  'use strict';

  // === Topbar wiring ===
  function wireTopbar() {
    var navDash = document.getElementById('nav-dashboard');
    var navProv = document.getElementById('nav-providers');
    var navProf = document.getElementById('nav-profile');

    // Logo click: always go home (clear org context)
    var logo = document.querySelector('.topbar-logo');
    if (logo) {
      logo.addEventListener('click', function (e) {
        e.preventDefault();
        window.AppStore.setCurrentOrg(null);
        if (window.location.hash !== '#dashboard') {
          window.location.hash = '#dashboard';
        } else {
          window.routerRender();
        }
      });
    }

    if (navDash) navDash.addEventListener('click', function () {
      window.AppStore.setCurrentOrg(null);
      if (window.location.hash !== '#dashboard') {
        window.location.hash = '#dashboard';
      } else {
        window.routerRender();
      }
    });
    if (navProv) navProv.addEventListener('click', function () { window.location.hash = '#providers'; });
    if (navProf) navProf.addEventListener('click', function () { window.location.hash = '#profile'; });
  }

  // === Org switcher modal ===
  // Lists user's memberships, lets switch between them, create new, or go home.
  window._openOrgSwitcher = function () {
    var slot = document.getElementById('org-switcher-slot');
    if (!slot) {
      slot = document.createElement('div');
      slot.id = 'org-switcher-slot';
      document.body.appendChild(slot);
    }

    var ms = window.AppStore.memberships || [];
    var currentId = window.AppStore.currentOrgId;

    var items = ms.length === 0
      ? '<p class="text-muted text-small">Você ainda não pertence a nenhuma organização.</p>'
      : ms.map(function (m) {
          var isCurrent = m.orgId === currentId;
          var label = m.orgName
            || (isCurrent && window.AppStore.currentOrg && window.AppStore.currentOrg.name)
            || ('Org ' + m.orgId.substring(0, 8));
          var roleEmoji = m.role === 'admin' ? '👔' : (m.role === 'manager' ? '🧑‍💼' : '🛠️');
          return '<button class="card" data-switch-org="' + window._safeAttr(m.orgId) + '" ' +
            'style="text-align:left;cursor:pointer;width:100%;display:flex;align-items:center;gap:12px;margin-bottom:8px;border:' +
            (isCurrent ? '2px solid var(--primary)' : '1px solid var(--border)') + ';">' +
              '<div style="font-size:1.4rem;">' + roleEmoji + '</div>' +
              '<div style="flex:1;">' +
                '<div style="font-weight:700;">' + window._safeHtml(label) + '</div>' +
                '<div class="text-small text-muted">' + roleLabelOrg(m.role) + (isCurrent ? ' · ativa' : '') + '</div>' +
              '</div>' +
              (isCurrent ? '<span class="badge badge-success text-small">atual</span>' : '<span class="text-muted text-small">→</span>') +
            '</button>';
        }).join('');

    slot.innerHTML = '' +
      '<div class="modal-overlay active" onclick="window._closeOrgSwitcher(event)">' +
        '<div class="modal" onclick="event.stopPropagation()">' +
          '<div class="modal-header">' +
            '<h2 class="modal-title">Suas organizações</h2>' +
            '<button class="modal-close" onclick="window._closeOrgSwitcher()">×</button>' +
          '</div>' +
          '<div style="max-height:50vh;overflow-y:auto;">' + items + '</div>' +
          '<div class="flex gap-2 mt-4" style="flex-wrap:wrap;">' +
            (currentId ? '<button class="btn btn-secondary btn-sm" onclick="window._goToHome()">🏠 Voltar ao início</button>' : '') +
            '<button class="btn btn-primary btn-sm" style="margin-left:auto;" onclick="window._closeOrgSwitcher(); setTimeout(window._dashOpenCreateOrg, 100);">+ Nova organização</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    // Wire switch buttons
    slot.querySelectorAll('[data-switch-org]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var orgId = btn.dataset.switchOrg;
        window._switchToOrg(orgId);
      });
    });
  };

  window._closeOrgSwitcher = function (e) {
    // If event fired and target isn't the overlay itself, ignore (prevents closing on inner clicks)
    if (e && e.target && !e.target.classList.contains('modal-overlay')) return;
    var slot = document.getElementById('org-switcher-slot');
    if (slot) slot.innerHTML = '';
  };

  window._switchToOrg = function (orgId) {
    if (!orgId) return;
    window.AppStore.setCurrentOrg(orgId);
    window._closeOrgSwitcher();
    if (window.location.hash !== '#dashboard') {
      window.location.hash = '#dashboard';
    } else {
      setTimeout(function () { window.routerRender(); }, 200);
    }
  };

  // Go to home (clear current org context). User can pick another or create new.
  window._goToHome = function () {
    // setCurrentOrg(null) clears local state but keeps memberships intact
    window.AppStore.setCurrentOrg(null);
    window._closeOrgSwitcher();
    if (window.location.hash !== '#dashboard') {
      window.location.hash = '#dashboard';
    } else {
      setTimeout(function () { window.routerRender(); }, 100);
    }
  };

  function roleLabelOrg(r) {
    if (r === 'admin') return 'Administrador';
    if (r === 'manager') return 'Gestor';
    if (r === 'provider') return 'Prestador';
    return r || '';
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
    // Org navigation is now inline in the dashboard view — hide topbar switcher always.
    var orgEl = document.getElementById('topbar-org');
    if (orgEl) orgEl.hidden = true;
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

      // Always start at home (no org selected) so the user sees
      // all their orgs and services and consciously picks one to enter.
      // The org switcher lets them jump between orgs at any time.
      setTimeout(function () {
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

  // === Version badge ===
  function injectVersionBadge() {
    var badge = document.createElement('div');
    badge.id = 'version-badge';
    badge.textContent = 'v' + (window.FIXOU_VERSION || '?');
    badge.style.cssText = [
      'position:fixed',
      'top:calc(var(--topbar-h, 60px) + 4px)',
      'right:10px',
      'font-size:0.65rem',
      'color:var(--text-muted, rgba(255,255,255,0.35))',
      'letter-spacing:0.04em',
      'pointer-events:none',
      'z-index:900',
      'user-select:none'
    ].join(';');
    document.body.appendChild(badge);
  }

  // === Boot ===
  document.addEventListener('DOMContentLoaded', function () {
    wireTopbar();
    injectVersionBadge();
    window.initRouter();
    window.auth.onAuthStateChanged(onAuthChanged);
    console.log('[fixou.app] booted — version', window.FIXOU_VERSION);
  });
})();
