// fixou.app — User profile

(function () {
  'use strict';

  window.renderProfile = function (container) {
    var u = window.AppStore.currentUser;
    if (!u) return;

    var memberships = window.AppStore.memberships || [];
    var providerProfile = window.AppStore.providerProfile;

    container.innerHTML = '' +
      '<div style="max-width:680px;margin:0 auto;">' +
        '<div class="flex items-center gap-2 mb-4">' +
          '<a class="btn btn-ghost" href="#dashboard">← Voltar</a>' +
          '<h1 class="page-title" style="margin:0;">Perfil</h1>' +
        '</div>' +

        '<div class="card">' +
          '<div style="display:flex;gap:14px;align-items:center;margin-bottom:14px;">' +
            (u.photoURL
              ? '<img src="' + window._safeAttr(u.photoURL) + '" style="width:64px;height:64px;border-radius:50%;object-fit:cover;">'
              : '<div style="width:64px;height:64px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;color:white;font-size:1.5rem;font-weight:700;">' + window._safeHtml((u.displayName || 'U')[0].toUpperCase()) + '</div>'
            ) +
            '<div>' +
              '<div style="font-weight:700;font-size:1.15rem;">' + window._safeHtml(u.displayName || '—') + '</div>' +
              '<div class="text-small text-muted">' + window._safeHtml(u.email || '') + '</div>' +
            '</div>' +
          '</div>' +

          '<div class="form-group">' +
            '<label class="form-label" for="p-name">Nome de exibição</label>' +
            '<input type="text" id="p-name" value="' + window._safeHtml(u.displayName || '') + '">' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label" for="p-phone">Telefone</label>' +
            '<input type="tel" id="p-phone" value="' + window._safeHtml(u.phone || '') + '">' +
          '</div>' +
          '<button class="btn btn-primary" id="save-profile-btn">Salvar perfil</button>' +
        '</div>' +

        '<h3 class="section-title">Papéis ativos</h3>' +
        '<div class="card">' +
          renderActiveRoles(memberships, providerProfile) +
          '<p class="text-small text-muted mt-4">Os papéis são contextuais. Você pode ser admin de uma organização, gestor em outra, e prestador para terceiros — tudo ao mesmo tempo.</p>' +
        '</div>' +

        '<h3 class="section-title">Minhas organizações (' + memberships.length + ')</h3>' +
        (memberships.length === 0
          ? window.emptyState('🏢', 'Sem organização', 'Você ainda não está associado a nenhuma organização.')
          : memberships.map(function (m) {
            return '<div class="card">' +
              '<div style="font-weight:700;">' + window._safeHtml(m.orgId) + '</div>' +
              '<div class="text-small text-muted">' + (m.role || '—') + ' · ' + (m.status || '—') + '</div>' +
            '</div>';
          }).join('')
        ) +

        (u.isProvider && providerProfile ? renderProviderSection(providerProfile) : '') +

        '<div class="card mt-4" style="border-color:rgba(239,68,68,0.4);">' +
          '<h3 style="color:var(--danger);margin-bottom:8px;">Zona de risco</h3>' +
          '<button class="btn btn-danger" id="signout-btn">🚪 Sair da conta</button>' +
        '</div>' +

        '<div class="text-center text-small text-muted mt-4">fixou.app · ' + window._safeHtml(window.FIXOU_VERSION) + '</div>' +
      '</div>';

    var saveBtn = document.getElementById('save-profile-btn');
    if (saveBtn) saveBtn.addEventListener('click', handleSave);

    var signoutBtn = document.getElementById('signout-btn');
    if (signoutBtn) signoutBtn.addEventListener('click', async function () {
      var ok = await window.showConfirmDialog('Sair da conta?', 'Você precisará fazer login novamente.', { confirmText: 'Sair', danger: true });
      if (ok) window.signOutUser();
    });
  };

  function renderProviderSection(p) {
    return '' +
      '<h3 class="section-title">Perfil de prestador</h3>' +
      '<div class="card">' +
        '<div style="font-weight:700;margin-bottom:6px;">Especialidades</div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">' +
          (p.specialties || []).map(function (s) { return '<span class="badge badge-info">' + window._safeHtml(s) + '</span>'; }).join('') +
        '</div>' +
        '<p class="text-small text-muted">' + window._safeHtml(p.bio || 'Sem descrição.') + '</p>' +
      '</div>';
  }

  function renderActiveRoles(memberships, providerProfile) {
    var roles = [];
    var hasAdmin = (memberships || []).some(function (m) { return m.role === 'admin'; });
    var hasManager = (memberships || []).some(function (m) { return m.role === 'manager'; });
    var hasProvider = !!providerProfile;

    if (hasAdmin) {
      var adminCount = memberships.filter(function (m) { return m.role === 'admin'; }).length;
      roles.push('<span class="badge badge-purple">👔 Administrador (' + adminCount + ')</span>');
    }
    if (hasManager) {
      var managerCount = memberships.filter(function (m) { return m.role === 'manager'; }).length;
      roles.push('<span class="badge badge-info">🧑‍💼 Gestor (' + managerCount + ')</span>');
    }
    if (hasProvider) {
      roles.push('<span class="badge badge-success">🛠️ Prestador</span>');
    }
    if (roles.length === 0) {
      return '<span class="text-muted text-small">Nenhum papel definido. Vá ao Dashboard pra criar uma organização ou cadastrar-se como prestador.</span>';
    }
    return '<div style="display:flex;gap:8px;flex-wrap:wrap;">' + roles.join('') + '</div>';
  }

  async function handleSave() {
    var u = window.AppStore.currentUser;
    if (!u) return;
    var name = document.getElementById('p-name').value.trim();
    var phone = document.getElementById('p-phone').value.trim();
    if (!name) { window.showNotification('Atenção', 'Informe um nome', 'warning'); return; }

    window.showLoading('Salvando…');
    try {
      await window.AppStore.saveUserDoc(u.uid, { displayName: name, phone: phone || null });
      Object.assign(window.AppStore.currentUser, { displayName: name, phone: phone || null });
      window.hideLoading();
      window.showNotification('Salvo', 'Perfil atualizado.', 'success');
    } catch (err) {
      window.hideLoading();
      window.showNotification('Erro', err.message, 'error');
    }
  }

  console.log('[fixou.app] profile.js loaded');
})();
