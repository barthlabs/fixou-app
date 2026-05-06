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

    // No org context yet — show home with action cards
    if (!hasOrg) return renderHome(container);

    container.innerHTML = '' +
      '<div class="flex items-center justify-between mb-4" style="flex-wrap:wrap;gap:12px;">' +
        '<div>' +
          '<h1 class="page-title" style="margin-bottom:2px;">' + window._safeHtml((window.AppStore.currentOrg || {}).name || '—') + '</h1>' +
          '<div class="text-muted text-small">' + roleLabel(role) + '</div>' +
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

  // Unified home for users without an active org context.
  // Shows current memberships (if any), provider profile (if any), and 3 actions:
  //  1. Create organization, 2. Become provider, 3. Wait for invite (info)
  function renderHome(container) {
    var u = window.AppStore.currentUser || {};
    var firstName = (u.displayName || '').split(' ')[0] || 'usuário';
    var memberships = window.AppStore.memberships || [];
    var hasMemberships = memberships.length > 0;
    var hasProvider = !!window.AppStore.providerProfile;

    container.innerHTML = '' +
      '<h1 class="page-title">Olá, ' + window._safeHtml(firstName) + '! 👋</h1>' +
      '<p class="page-subtitle">O que você quer fazer no fixou.app hoje?</p>' +

      (hasMemberships ? renderMembershipsBlock(memberships) : '') +

      '<h2 class="section-title" style="margin-top:24px;">Adicionar uma função</h2>' +
      '<div class="grid grid-cols-auto">' +

        // Card 1: Create organization
        actionCard('🏢', 'Administrar uma organização',
          'Você é dono ou síndico de uma rede de lojas, condomínio, clube etc.? Crie aqui sua organização e cadastre as unidades.',
          'create-org') +

        // Card 2: Become provider
        (hasProvider
          ? '<div class="card" style="border:1px solid var(--success);">' +
              '<div style="font-size:2rem;margin-bottom:6px;">🛠️</div>' +
              '<div style="font-weight:700;font-size:1.05rem;margin-bottom:4px;">Prestador de serviço</div>' +
              '<div class="text-small text-muted mb-4">Seu perfil de prestador está ativo. Edite suas especialidades no perfil.</div>' +
              '<a class="btn btn-secondary btn-sm" href="#profile">Editar perfil de prestador →</a>' +
            '</div>'
          : actionCard('🛠️', 'Oferecer serviços',
              'Você é eletricista, encanador, pintor, técnico? Cadastre-se como prestador e receba chamados de organizações que precisam dos seus serviços.',
              'become-provider')
        ) +

        // Card 3: Pending invites
        '<div class="card">' +
          '<div style="font-size:2rem;margin-bottom:6px;">💌</div>' +
          '<div style="font-weight:700;font-size:1.05rem;margin-bottom:4px;">Convites recebidos</div>' +
          '<div class="text-small text-muted mb-4">Quando alguém convidar você pra gerenciar uma organização ou unidade, os convites aparecerão aqui.</div>' +
          '<div id="invites-slot" class="text-small text-muted">Sem convites no momento.</div>' +
        '</div>' +
      '</div>' +

      // Inline modal slot for action overlays
      '<div id="action-modal-slot"></div>';

    // Wire action cards
    var btnCreateOrg = document.querySelector('[data-action="create-org"]');
    if (btnCreateOrg) btnCreateOrg.addEventListener('click', openCreateOrgModal);

    var btnBecomeProvider = document.querySelector('[data-action="become-provider"]');
    if (btnBecomeProvider) btnBecomeProvider.addEventListener('click', openBecomeProviderModal);
  }

  function actionCard(icon, title, desc, action) {
    return '<button class="card" data-action="' + action + '" ' +
      'style="text-align:left;cursor:pointer;display:flex;flex-direction:column;align-items:flex-start;width:100%;">' +
      '<div style="font-size:2rem;margin-bottom:6px;">' + icon + '</div>' +
      '<div style="font-weight:700;font-size:1.05rem;margin-bottom:4px;">' + window._safeHtml(title) + '</div>' +
      '<div class="text-small text-muted mb-4">' + window._safeHtml(desc) + '</div>' +
      '<span class="btn btn-primary btn-sm" style="margin-top:auto;">Começar →</span>' +
    '</button>';
  }

  function renderMembershipsBlock(memberships) {
    return '' +
      '<h2 class="section-title">Suas organizações</h2>' +
      '<div class="grid grid-cols-auto">' +
        memberships.map(function (m) {
          return '<button class="card" onclick="window._dashEnterOrg(\'' + window._safeAttr(m.orgId) + '\')" ' +
            'style="text-align:left;cursor:pointer;width:100%;">' +
            '<div style="font-weight:700;">' + window._safeHtml(m.orgId.substring(0, 12)) + '…</div>' +
            '<div class="text-small text-muted">' + roleLabel(m.role) + '</div>' +
            '<span class="btn btn-secondary btn-sm mt-2">Entrar →</span>' +
          '</button>';
        }).join('') +
      '</div>';
  }

  // Switch to a specific org and re-render
  window._dashEnterOrg = function (orgId) {
    window.AppStore.setCurrentOrg(orgId);
    setTimeout(function () { window.routerRender(); }, 200);
  };

  // ============= CREATE ORG MODAL =============

  function openCreateOrgModal() {
    var slot = document.getElementById('action-modal-slot');
    if (!slot) return;
    slot.innerHTML = '' +
      '<div class="modal-overlay active" id="create-org-overlay">' +
        '<div class="modal">' +
          '<div class="modal-header">' +
            '<h2 class="modal-title">🏢 Nova organização</h2>' +
            '<button class="modal-close" onclick="window._closeActionModal()">×</button>' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label" for="co-name">Nome</label>' +
            '<input type="text" id="co-name" placeholder="Ex.: Lojas Bella, Condomínio Solar, Casa de Praia">' +
            '<div class="form-help">Pode ser sua casa, sua empresa, um condomínio que você administra etc.</div>' +
          '</div>' +
          '<div class="flex gap-2" style="justify-content:flex-end;">' +
            '<button class="btn btn-ghost" onclick="window._closeActionModal()">Cancelar</button>' +
            '<button class="btn btn-primary" id="co-confirm">Criar</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    setTimeout(function () {
      var nameEl = document.getElementById('co-name');
      if (nameEl) nameEl.focus();
    }, 100);

    var confirmBtn = document.getElementById('co-confirm');
    if (confirmBtn) confirmBtn.addEventListener('click', handleCreateOrg);
  }

  window._closeActionModal = function () {
    var slot = document.getElementById('action-modal-slot');
    if (slot) slot.innerHTML = '';
  };

  async function handleCreateOrg() {
    var name = (document.getElementById('co-name') || {}).value;
    name = (name || '').trim();
    if (!name) { window.showNotification('Atenção', 'Informe um nome', 'warning'); return; }

    window.showLoading('Criando organização…');
    try {
      var orgId = await window.AppStore.createOrganization({ name: name });
      var u = window.AppStore.currentUser;
      if (u && u.uid) await window.AppStore.saveUserDoc(u.uid, { defaultOrgId: orgId });
      window.hideLoading();
      window._closeActionModal();
      window.showNotification('Pronto!', 'Organização criada.', 'success');
      setTimeout(function () {
        var ms = window.AppStore.memberships || [];
        if (ms.find(function (m) { return m.orgId === orgId; })) {
          window.AppStore.setCurrentOrg(orgId);
        }
        window.routerRender();
      }, 700);
    } catch (err) {
      window.hideLoading();
      console.error('[dashboard] createOrg error:', err);
      window.showNotification('Erro', err.message || 'Não foi possível criar.', 'error');
    }
  }

  // ============= BECOME PROVIDER MODAL =============

  var SPECIALTIES = [
    { id: 'eletrica', label: '⚡ Elétrica' },
    { id: 'hidraulica', label: '🚿 Hidráulica' },
    { id: 'pintura', label: '🎨 Pintura' },
    { id: 'jardinagem', label: '🌿 Jardinagem' },
    { id: 'limpeza', label: '🧹 Limpeza' },
    { id: 'ar_condicionado', label: '❄️ Ar-condicionado' },
    { id: 'serralheria', label: '🔩 Serralheria' },
    { id: 'marcenaria', label: '🪚 Marcenaria' },
    { id: 'pedreiro', label: '🧱 Alvenaria' },
    { id: 'tecnologia', label: '💻 Tecnologia/TI' },
    { id: 'outros', label: '🛠️ Outros' }
  ];
  var providerSpecs = [];

  function openBecomeProviderModal() {
    providerSpecs = [];
    var slot = document.getElementById('action-modal-slot');
    if (!slot) return;
    slot.innerHTML = '' +
      '<div class="modal-overlay active">' +
        '<div class="modal">' +
          '<div class="modal-header">' +
            '<h2 class="modal-title">🛠️ Cadastrar como prestador</h2>' +
            '<button class="modal-close" onclick="window._closeActionModal()">×</button>' +
          '</div>' +
          '<div class="form-group">' +
            '<div class="form-label">Especialidades (selecione uma ou mais)</div>' +
            '<div id="prov-spec-pills" style="display:flex;flex-wrap:wrap;gap:8px;">' +
              SPECIALTIES.map(function (s) {
                return '<button class="badge" data-spec="' + s.id + '" style="cursor:pointer;font-size:0.9rem;padding:8px 14px;background:rgba(255,255,255,0.06);color:var(--text-secondary);border:2px solid transparent;">' +
                  s.label + '</button>';
              }).join('') +
            '</div>' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label" for="prov-bio">Sobre você (opcional)</label>' +
            '<textarea id="prov-bio" rows="3" placeholder="Ex.: 10 anos de experiência em manutenção predial. Atendo emergências."></textarea>' +
          '</div>' +
          '<div class="flex gap-2" style="justify-content:flex-end;">' +
            '<button class="btn btn-ghost" onclick="window._closeActionModal()">Cancelar</button>' +
            '<button class="btn btn-primary" id="prov-confirm">Cadastrar</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.querySelectorAll('[data-spec]').forEach(function (el) {
      el.addEventListener('click', function () {
        var id = el.dataset.spec;
        var idx = providerSpecs.indexOf(id);
        if (idx === -1) {
          providerSpecs.push(id);
          el.style.background = 'rgba(30,64,175,0.4)';
          el.style.color = 'white';
          el.style.border = '2px solid var(--primary)';
        } else {
          providerSpecs.splice(idx, 1);
          el.style.background = 'rgba(255,255,255,0.06)';
          el.style.color = 'var(--text-secondary)';
          el.style.border = '2px solid transparent';
        }
      });
    });

    var confirmBtn = document.getElementById('prov-confirm');
    if (confirmBtn) confirmBtn.addEventListener('click', handleBecomeProvider);
  }

  async function handleBecomeProvider() {
    if (providerSpecs.length === 0) {
      window.showNotification('Atenção', 'Selecione ao menos uma especialidade', 'warning');
      return;
    }
    var u = window.AppStore.currentUser;
    if (!u) return;
    var bio = ((document.getElementById('prov-bio') || {}).value || '').trim();

    window.showLoading('Cadastrando…');
    try {
      await window.AppStore.saveProviderProfile(u.uid, {
        uid: u.uid,
        displayName: u.displayName,
        photoURL: u.photoURL || null,
        specialties: providerSpecs.slice(),
        serviceRegions: [],
        rating: 0,
        reviewCount: 0,
        bio: bio,
        availability: ''
      });
      window.hideLoading();
      window._closeActionModal();
      window.showNotification('Pronto!', 'Você está listado como prestador.', 'success');
      setTimeout(function () { window.routerRender(); }, 500);
    } catch (err) {
      window.hideLoading();
      console.error('[dashboard] become provider error:', err);
      window.showNotification('Erro', err.message || 'Não foi possível cadastrar.', 'error');
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
