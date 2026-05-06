// fixou.app — Onboarding (single step: just register the person)
// Roles are contextual (per-organization) — chosen later via actions on dashboard.

(function () {
  'use strict';

  window.renderOnboarding = function (container) {
    var u = window.AppStore.currentUser || {};
    var name = u.displayName || '';
    var phone = u.phone || '';

    container.innerHTML = '' +
      '<div style="max-width:520px;margin:0 auto;">' +
        '<h1 class="page-title">Bem-vindo ao fixou.app! 👋</h1>' +
        '<p class="page-subtitle">Como prefere ser chamado? Você pode atualizar isso depois no perfil.</p>' +
        '<div class="card">' +
          '<div class="form-group">' +
            '<label class="form-label" for="ob-name">Nome de exibição</label>' +
            '<input type="text" id="ob-name" value="' + window._safeHtml(name) + '" autocomplete="name">' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label" for="ob-phone">Telefone (opcional)</label>' +
            '<input type="tel" id="ob-phone" value="' + window._safeHtml(phone) + '" placeholder="(11) 99999-9999" autocomplete="tel">' +
          '</div>' +
          '<button class="btn btn-primary btn-block" id="ob-finish">Continuar</button>' +
        '</div>' +
        '<p class="text-small text-muted text-center mt-4">' +
          'A seguir, você poderá criar uma organização, cadastrar-se como prestador, ou aguardar convites.' +
        '</p>' +
      '</div>';

    var btn = document.getElementById('ob-finish');
    if (btn) btn.addEventListener('click', handleFinish);
  };

  async function handleFinish() {
    var u = window.AppStore.currentUser;
    if (!u) return;

    var nameEl = document.getElementById('ob-name');
    var phoneEl = document.getElementById('ob-phone');
    var name = nameEl ? (nameEl.value || '').trim() : '';
    var phone = phoneEl ? (phoneEl.value || '').trim() : '';

    if (!name) {
      window.showNotification('Atenção', 'Informe seu nome', 'warning');
      return;
    }

    window.showLoading('Salvando…');
    try {
      var patch = {
        displayName: name,
        phone: phone || null,
        onboarded: true
      };
      await window.AppStore.saveUserDoc(u.uid, patch);
      Object.assign(window.AppStore.currentUser, patch, { userDocLoaded: true });

      window.hideLoading();
      window.showNotification('Pronto!', 'Bem-vindo ao fixou.app.', 'success');
      window.location.hash = '#dashboard';
    } catch (err) {
      window.hideLoading();
      console.error('[onboarding] finish error:', err);
      window.showNotification('Erro', err.message || 'Não foi possível salvar.', 'error');
    }
  }

  console.log('[fixou.app] onboarding.js loaded (simplified)');
})();
