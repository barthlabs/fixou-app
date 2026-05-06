// fixou.app — Dashboard

(function () {
  'use strict';

  var statusFilter = 'all'; // all | open | published | assigned | in_progress | awaiting_confirmation | awaiting_approval | approved
  var unsubscribers = [];

  window.renderDashboard = function (container) {
    var u = window.AppStore.currentUser;
    if (!u) return;

    detachListeners();

    var role = window.AppStore.currentOrgRole;
    var hasOrg = !!window.AppStore.currentOrgId;

    // Provider without org-context: show available published tickets across orgs
    if (u.isProvider && !hasOrg) return renderProviderHome(container);

    // No org yet (admin/manager waiting)
    if (!hasOrg) return renderEmptyState(container);

    container.innerHTML = '' +
      '<div class="flex items-center justify-between mb-4" style="flex-wrap:wrap;gap:12px;">' +
        '<div>' +
          '<h1 class="page-title" style="margin-bottom:2px;">' + window._safeHtml((window.AppStore.currentOrg || {}).name || '—') + '</h1>' +
          '<div class="text-muted text-small">' + roleLabel(role) + ' · ' + window._safeHtml((window.AppStore.currentOrg || {}).type || '') + '</div>' +
        '</div>' +
        (canCreateTicket(role) ? '<button class="btn btn-primary" id="btn-new-ticket">+ Novo chamado</button>' : '') +
      '</div>' +

      renderStats() +

      '<div class="flex items-center justify-between mb-2 mt-4" style="gap:12px;flex-wrap:wrap;">' +
        '<h2 class="section-title" style="margin:0;">Chamados</h2>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;">' + renderFilters() + '</div>' +
      '</div>' +

      '<div id="tickets-list">' + renderTickets() + '</div>' +

      (role === 'admin' ? '<div class="mt-4 flex gap-2"><a class="btn btn-secondary" href="#admin">⚙️ Administrar organização</a></div>' : '');

    // wire
    var newBtn = document.getElementById('btn-new-ticket');
    if (newBtn) newBtn.addEventListener('click', function () { window.location.hash = '#ticket/new'; });

    document.querySelectorAll('[data-filter]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        statusFilter = btn.dataset.filter;
        var listEl = document.getElementById('tickets-list');
        if (listEl) listEl.innerHTML = renderTickets();
        document.querySelectorAll('[data-filter]').forEach(function (b) {
          b.classList.toggle('btn-primary', b.dataset.filter === statusFilter);
          b.classList.toggle('btn-ghost', b.dataset.filter !== statusFilter);
        });
      });
    });

    // re-render on changes
    var rerender = function () {
      var listEl = document.getElementById('tickets-list');
      if (listEl) listEl.innerHTML = renderTickets();
    };
    window.addEventListener('tickets-changed', rerender);
    unsubscribers.push(function () { window.removeEventListener('tickets-changed', rerender); });
  };

  function renderProviderHome(container) {
    container.innerHTML = '' +
      '<h1 class="page-title">Chamados disponíveis</h1>' +
      '<p class="page-subtitle">Chamados públicos onde você pode se candidatar.</p>' +
      '<div id="provider-feed">' + window.emptyState('🛠️', 'Em breve', 'O feed de chamados públicos para prestadores estará disponível em breve.') + '</div>';
  }

  function renderEmptyState(container) {
    var u = window.AppStore.currentUser || {};
    var isAdmin = u.isAdmin === true;
    container.innerHTML = '' +
      '<h1 class="page-title">Olá, ' + window._safeHtml((u.displayName || '').split(' ')[0] || 'usuário') + '! 👋</h1>' +
      '<p class="page-subtitle">Você ainda não tem nenhuma organização associada.</p>' +

      (isAdmin ? '<div class="card" style="border:1px solid var(--primary);">' +
        '<h3 style="margin-bottom:8px;">🏢 Criar minha primeira organização</h3>' +
        '<div class="form-group">' +
          '<label class="form-label" for="empty-org-name">Nome</label>' +
          '<input type="text" id="empty-org-name" placeholder="Ex.: Lojas Bella, Condomínio Solar">' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label" for="empty-org-type">Tipo</label>' +
          '<select id="empty-org-type">' +
            '<option value="lojas">Rede de lojas</option>' +
            '<option value="condominio">Condomínio</option>' +
            '<option value="clube">Clube</option>' +
            '<option value="outro">Outro</option>' +
          '</select>' +
        '</div>' +
        '<button class="btn btn-primary btn-block" id="empty-create-org-btn">Criar organização</button>' +
      '</div>' : '') +

      '<div class="card">' +
        '<h3 style="margin-bottom:8px;">Outras opções</h3>' +
        '<ul style="margin-left:20px;color:var(--text-secondary);line-height:1.8;">' +
          '<li>Aguarde um convite de administrador para entrar numa organização</li>' +
          '<li>Ou ajuste seu perfil</li>' +
        '</ul>' +
        '<div class="mt-4"><a class="btn btn-secondary" href="#profile">Ir para o perfil</a></div>' +
      '</div>';

    var createBtn = document.getElementById('empty-create-org-btn');
    if (createBtn) createBtn.addEventListener('click', handleCreateOrgFromEmpty);
  }

  async function handleCreateOrgFromEmpty() {
    var name = (document.getElementById('empty-org-name') || {}).value;
    var type = (document.getElementById('empty-org-type') || {}).value;
    name = (name || '').trim();
    if (!name) { window.showNotification('Atenção', 'Informe o nome da organização', 'warning'); return; }
    window.showLoading('Criando organização…');
    try {
      var orgId = await window.AppStore.createOrganization({ name: name, type: type || 'lojas' });
      var u = window.AppStore.currentUser;
      if (u && u.uid) await window.AppStore.saveUserDoc(u.uid, { defaultOrgId: orgId });
      window.hideLoading();
      window.showNotification('Pronto!', 'Organização criada.', 'success');
      // Wait briefly for memberships listener to fire and pick the new org
      setTimeout(function () {
        var ms = window.AppStore.memberships || [];
        var found = ms.find(function (m) { return m.orgId === orgId; });
        if (found) window.AppStore.setCurrentOrg(orgId);
        window.routerRender();
      }, 600);
    } catch (err) {
      window.hideLoading();
      console.error('[dashboard] createOrg error:', err);
      window.showNotification('Erro', err.message || 'Não foi possível criar.', 'error');
    }
  }

  function renderStats() {
    var t = window.AppStore.tickets || [];
    var open = t.filter(function (x) { return x.status === 'open' || x.status === 'published'; }).length;
    var inProgress = t.filter(function (x) { return x.status === 'assigned' || x.status === 'in_progress' || x.status === 'awaiting_confirmation'; }).length;
    var awaiting = t.filter(function (x) { return x.status === 'awaiting_approval'; }).length;
    var approved = t.filter(function (x) { return x.status === 'approved'; }).length;

    return '' +
      '<div class="grid grid-cols-auto">' +
        '<div class="stat-box"><div class="stat-value">' + open + '</div><div class="stat-label">Abertos</div></div>' +
        '<div class="stat-box"><div class="stat-value">' + inProgress + '</div><div class="stat-label">Em andamento</div></div>' +
        '<div class="stat-box"><div class="stat-value">' + awaiting + '</div><div class="stat-label">Aguardando aprovação</div></div>' +
        '<div class="stat-box"><div class="stat-value">' + approved + '</div><div class="stat-label">Concluídos</div></div>' +
      '</div>';
  }

  function renderFilters() {
    var filters = [
      { id: 'all', label: 'Todos' },
      { id: 'open', label: 'Abertos' },
      { id: 'in_progress', label: 'Em andamento' },
      { id: 'awaiting_approval', label: 'Aprovação' },
      { id: 'approved', label: 'Concluídos' }
    ];
    return filters.map(function (f) {
      var on = statusFilter === f.id;
      return '<button class="btn btn-sm ' + (on ? 'btn-primary' : 'btn-ghost') + '" data-filter="' + f.id + '">' + f.label + '</button>';
    }).join('');
  }

  function renderTickets() {
    var t = (window.AppStore.tickets || []).slice();

    if (statusFilter !== 'all') {
      if (statusFilter === 'open') {
        t = t.filter(function (x) { return x.status === 'open' || x.status === 'published'; });
      } else if (statusFilter === 'in_progress') {
        t = t.filter(function (x) { return x.status === 'assigned' || x.status === 'in_progress' || x.status === 'awaiting_confirmation'; });
      } else {
        t = t.filter(function (x) { return x.status === statusFilter; });
      }
    }

    // Sort by createdAt desc
    t.sort(function (a, b) {
      var ta = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
      var tb = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
      return tb - ta;
    });

    if (t.length === 0) {
      return window.emptyState('📭', 'Nenhum chamado', 'Quando houver chamados, eles aparecerão aqui.');
    }

    var units = window.AppStore.units || [];

    return t.map(function (ticket) {
      var unit = units.find(function (u) { return u.id === ticket.unitId; });
      var unitName = unit ? unit.name : 'Unidade ' + (ticket.unitId || '').substring(0, 6);
      return ticketCard(ticket, unitName);
    }).join('');
  }

  function ticketCard(t, unitName) {
    return '' +
      '<a class="card" href="#ticket/' + window._safeAttr(t.id) + '" style="display:block;text-decoration:none;color:inherit;">' +
        '<div class="card-header">' +
          '<div class="card-title">' + window._safeHtml(t.title || 'Sem título') + '</div>' +
          statusBadge(t.status) +
        '</div>' +
        '<div class="text-small text-muted">' +
          window._safeHtml(unitName) + ' · ' + priorityLabel(t.priority) + ' · ' + window.formatTime(t.createdAt) +
        '</div>' +
        (t.description ? '<div class="text-small mt-2" style="color:var(--text-secondary);">' + window._safeHtml(t.description.substring(0, 140)) + (t.description.length > 140 ? '…' : '') + '</div>' : '') +
      '</a>';
  }

  function statusBadge(status) {
    var map = {
      open: { cls: 'badge-info', text: 'Aberto' },
      published: { cls: 'badge-info', text: 'Publicado' },
      assigned: { cls: 'badge-purple', text: 'Atribuído' },
      in_progress: { cls: 'badge-warning', text: 'Em andamento' },
      awaiting_confirmation: { cls: 'badge-warning', text: 'Aguard. confirmação' },
      awaiting_approval: { cls: 'badge-warning', text: 'Aguard. aprovação' },
      approved: { cls: 'badge-success', text: 'Aprovado' },
      rejected: { cls: 'badge-danger', text: 'Reprovado' },
      reopened: { cls: 'badge-danger', text: 'Reaberto' }
    };
    var s = map[status] || { cls: 'badge-gray', text: status || '—' };
    return '<span class="badge ' + s.cls + '">' + s.text + '</span>';
  }

  function priorityLabel(p) {
    if (p === 'high') return '🔴 Alta';
    if (p === 'medium') return '🟡 Média';
    if (p === 'low') return '🟢 Baixa';
    return '—';
  }

  function roleLabel(r) {
    if (r === 'admin') return '👔 Administrador';
    if (r === 'manager') return '🧑‍💼 Gestor';
    if (r === 'provider') return '🛠️ Prestador';
    return '';
  }

  function canCreateTicket(role) {
    return role === 'admin' || role === 'manager';
  }

  function detachListeners() {
    unsubscribers.forEach(function (fn) { try { fn(); } catch (e) {} });
    unsubscribers = [];
  }

  console.log('[fixou.app] dashboard.js loaded');
})();
