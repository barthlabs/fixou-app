// fixou.app — Admin (organization management) — minimal MVP

(function () {
  'use strict';

  var activeTab = 'units'; // units | members | invites

  window.renderAdmin = function (container) {
    var role = window.AppStore.currentOrgRole;
    if (role !== 'admin') {
      container.innerHTML = '<div class="card"><h2>Sem permissão</h2><p class="text-muted">Apenas admins podem acessar esta área.</p><div class="mt-4"><a class="btn btn-primary" href="#dashboard">← Voltar</a></div></div>';
      return;
    }

    container.innerHTML = '' +
      '<div class="flex items-center gap-2 mb-4">' +
        '<a class="btn btn-ghost" href="#dashboard">← Voltar</a>' +
        '<h1 class="page-title" style="margin:0;">Administrar organização</h1>' +
      '</div>' +

      '<div class="flex gap-2 mb-4">' +
        tabBtn('units', '🏢 Unidades') +
        tabBtn('members', '👥 Membros') +
        tabBtn('invites', '📧 Convites') +
      '</div>' +

      '<div id="admin-content">' + renderTab() + '</div>';

    document.querySelectorAll('[data-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        activeTab = btn.dataset.tab;
        window.routerRender();
      });
    });

    wireTab();
  };

  function tabBtn(id, label) {
    var on = activeTab === id;
    return '<button class="btn ' + (on ? 'btn-primary' : 'btn-ghost') + '" data-tab="' + id + '">' + label + '</button>';
  }

  function renderTab() {
    if (activeTab === 'units') return renderUnits();
    if (activeTab === 'members') return renderMembers();
    if (activeTab === 'invites') return renderInvites();
    return '';
  }

  function renderUnits() {
    var units = window.AppStore.units || [];
    return '' +
      '<div class="card">' +
        '<h3 class="mb-4">Adicionar nova unidade</h3>' +
        '<div class="form-row">' +
          '<input type="text" id="new-unit-name" placeholder="Nome (ex.: Loja Centro)">' +
          '<input type="text" id="new-unit-city" placeholder="Cidade">' +
          '<button class="btn btn-primary" id="add-unit-btn">+ Adicionar</button>' +
        '</div>' +
      '</div>' +

      '<h3 class="section-title">Unidades cadastradas (' + units.length + ')</h3>' +
      (units.length === 0
        ? window.emptyState('🏢', 'Nenhuma unidade ainda', 'Adicione a primeira unidade acima.')
        : units.map(function (u) {
          return '<div class="card flex items-center justify-between">' +
            '<div>' +
              '<div style="font-weight:700;">' + window._safeHtml(u.name) + '</div>' +
              '<div class="text-small text-muted">' + window._safeHtml(u.city || '—') + '</div>' +
            '</div>' +
            '<button class="btn btn-sm btn-danger" data-delete-unit="' + window._safeAttr(u.id) + '">🗑️</button>' +
          '</div>';
        }).join(''));
  }

  function renderMembers() {
    var members = window.AppStore.members || [];
    return '' +
      '<h3 class="section-title">Membros da organização (' + members.length + ')</h3>' +
      (members.length === 0
        ? window.emptyState('👥', 'Nenhum membro além de você ainda', 'Convide gestores e prestadores na aba Convites.')
        : members.map(function (m) {
          return '<div class="card flex items-center justify-between">' +
            '<div>' +
              '<div style="font-weight:700;">' + window._safeHtml(m.uid.substring(0, 8)) + '…</div>' +
              '<div class="text-small text-muted">' + roleLabel(m.role) + ' · ' + (m.status || '—') + '</div>' +
            '</div>' +
            (m.uid !== (window.AppStore.currentUser || {}).uid
              ? '<button class="btn btn-sm btn-danger" data-remove-member="' + window._safeAttr(m.uid) + '">Remover</button>'
              : '<span class="text-small text-muted">você</span>') +
          '</div>';
        }).join(''));
  }

  function renderInvites() {
    return '' +
      '<div class="card">' +
        '<h3 class="mb-4">Convidar usuário</h3>' +
        '<div class="form-group">' +
          '<label class="form-label" for="inv-email">Email da pessoa</label>' +
          '<input type="email" id="inv-email" placeholder="exemplo@email.com">' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label" for="inv-role">Papel</label>' +
          '<select id="inv-role">' +
            '<option value="manager">Gestor</option>' +
            '<option value="provider">Prestador</option>' +
            '<option value="admin">Co-administrador</option>' +
          '</select>' +
        '</div>' +
        '<button class="btn btn-primary" id="send-invite-btn">📧 Enviar convite</button>' +
        '<p class="text-small text-muted mt-4">Sistema de convites por email será habilitado em breve.</p>' +
      '</div>';
  }

  function wireTab() {
    if (activeTab === 'units') {
      var addBtn = document.getElementById('add-unit-btn');
      if (addBtn) addBtn.addEventListener('click', handleAddUnit);

      document.querySelectorAll('[data-delete-unit]').forEach(function (b) {
        b.addEventListener('click', function () { handleDeleteUnit(b.dataset.deleteUnit); });
      });
    }
    if (activeTab === 'members') {
      document.querySelectorAll('[data-remove-member]').forEach(function (b) {
        b.addEventListener('click', function () { handleRemoveMember(b.dataset.removeMember); });
      });
    }
    if (activeTab === 'invites') {
      var sendBtn = document.getElementById('send-invite-btn');
      if (sendBtn) sendBtn.addEventListener('click', handleSendInvite);
    }
  }

  async function handleAddUnit() {
    var name = (document.getElementById('new-unit-name') || {}).value;
    var city = (document.getElementById('new-unit-city') || {}).value;
    name = (name || '').trim();
    city = (city || '').trim();
    if (!name) { window.showNotification('Atenção', 'Informe o nome da unidade', 'warning'); return; }

    var orgId = window.AppStore.currentOrgId;
    if (!orgId) return;

    window.showLoading('Adicionando…');
    try {
      var ref = window.db.collection('units').doc();
      await ref.set({
        id: ref.id,
        orgId: orgId,
        name: name,
        city: city,
        managerUids: [],
        active: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      window.hideLoading();
      window.showNotification('Pronto!', 'Unidade adicionada.', 'success');
      window.routerRender();
    } catch (err) {
      window.hideLoading();
      window.showNotification('Erro', err.message || 'Não foi possível adicionar.', 'error');
    }
  }

  async function handleDeleteUnit(unitId) {
    var ok = await window.showConfirmDialog('Remover unidade?', 'Essa ação não pode ser desfeita. Chamados existentes ficarão órfãos.', { danger: true, confirmText: 'Remover' });
    if (!ok) return;
    window.showLoading('Removendo…');
    try {
      await window.db.collection('units').doc(unitId).delete();
      window.hideLoading();
      window.showNotification('Removido', 'Unidade excluída.', 'success');
      window.routerRender();
    } catch (err) {
      window.hideLoading();
      window.showNotification('Erro', err.message, 'error');
    }
  }

  async function handleRemoveMember(uid) {
    var orgId = window.AppStore.currentOrgId;
    var ok = await window.showConfirmDialog('Remover membro?', 'O usuário perderá acesso a esta organização.', { danger: true, confirmText: 'Remover' });
    if (!ok) return;
    window.showLoading('Removendo…');
    try {
      await window.db.collection('memberships').doc(uid + '_' + orgId).delete();
      window.hideLoading();
      window.showNotification('Removido', 'Membro removido.', 'success');
      window.routerRender();
    } catch (err) {
      window.hideLoading();
      window.showNotification('Erro', err.message, 'error');
    }
  }

  function handleSendInvite() {
    window.showNotification('Em breve', 'Sistema de convites por email será habilitado em breve.', 'info');
  }

  function roleLabel(r) {
    if (r === 'admin') return '👔 Admin';
    if (r === 'manager') return '🧑‍💼 Gestor';
    if (r === 'provider') return '🛠️ Prestador';
    return r || '—';
  }

  console.log('[fixou.app] admin.js loaded');
})();
