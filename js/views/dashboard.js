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
      '<div class="mb-3">' +
        '<button class="btn btn-ghost btn-sm" id="btn-back-home">← Início</button>' +
      '</div>' +
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
    var backBtn = document.getElementById('btn-back-home');
    if (backBtn) backBtn.addEventListener('click', function () {
      window.AppStore.setCurrentOrg(null);
      window.routerRender();
    });

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

  // Home screen — shown when user has no active org context.
  // Layout:
  //   1. 4 aggregate stat boxes (async loaded from all orgs)
  //   2. "Organizações que administro" + "+ Nova organização" button
  //   3. "Serviços que presto" + "+ Oferecer serviços" or "Editar perfil" button
  function renderHome(container) {
    var u = window.AppStore.currentUser || {};
    var firstName = (u.displayName || '').split(' ')[0] || 'usuário';
    var memberships = window.AppStore.memberships || [];
    var providerProfile = window.AppStore.providerProfile;

    var adminOrgs = memberships.filter(function (m) { return m.role === 'admin'; });

    container.innerHTML = '' +
      '<h1 class="page-title">Olá, ' + window._safeHtml(firstName) + '! 👋</h1>' +

      // Aggregate stats (async — start with 0s)
      '<div class="grid grid-cols-auto mb-4">' +
        '<div class="stat-box"><div class="stat-value" id="hs-open">0</div><div class="stat-label">Abertos</div></div>' +
        '<div class="stat-box"><div class="stat-value" id="hs-prog">0</div><div class="stat-label">Em andamento</div></div>' +
        '<div class="stat-box"><div class="stat-value" id="hs-await">0</div><div class="stat-label">Aguardando</div></div>' +
        '<div class="stat-box"><div class="stat-value" id="hs-done">0</div><div class="stat-label">Concluídos</div></div>' +
      '</div>' +

      // Admin orgs section
      '<div class="flex items-center justify-between mb-2" style="gap:12px;flex-wrap:wrap;">' +
        '<h2 class="section-title" style="margin:0;">Organizações que administro</h2>' +
        '<button class="btn btn-primary btn-sm" id="home-new-org">+ Nova organização</button>' +
      '</div>' +
      (adminOrgs.length === 0
        ? '<div class="card mb-4">' +
            '<div class="text-muted text-small">Você ainda não administra nenhuma organização. Crie a sua ou aguarde um convite.</div>' +
          '</div>'
        : '<div class="grid grid-cols-auto mb-4" id="home-admin-grid">' +
            adminOrgs.map(function (m) { return homeOrgCard(m); }).join('') +
          '</div>'
      ) +

      // Provider section
      '<div class="flex items-center justify-between mb-2" style="gap:12px;flex-wrap:wrap;">' +
        '<h2 class="section-title" style="margin:0;">Serviços que presto</h2>' +
        (providerProfile
          ? '<button class="btn btn-secondary btn-sm" id="home-edit-provider">✏️ Editar perfil</button>'
          : '<button class="btn btn-secondary btn-sm" id="home-become-provider">+ Oferecer serviços</button>'
        ) +
      '</div>' +
      (providerProfile
        ? homeProviderCard(providerProfile)
        : '<div class="card mb-4">' +
            '<div class="text-muted text-small">Eletricistas, encanadores, pintores e outros profissionais podem receber chamados aqui. Cadastre-se para aparecer para as organizações que precisam dos seus serviços.</div>' +
          '</div>'
      ) +

      '<div id="action-modal-slot"></div>';

    // Wire buttons
    var btnNewOrg = document.getElementById('home-new-org');
    if (btnNewOrg) btnNewOrg.addEventListener('click', openCreateOrgModal);

    var btnBecomeProvider = document.getElementById('home-become-provider');
    if (btnBecomeProvider) btnBecomeProvider.addEventListener('click', openBecomeProviderModal);

    var btnEditProvider = document.getElementById('home-edit-provider');
    if (btnEditProvider) btnEditProvider.addEventListener('click', openBecomeProviderModal);

    // Wire org entry buttons
    container.querySelectorAll('[data-enter-org]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        window._dashEnterOrg(btn.dataset.enterOrg);
      });
    });

    // Async: resolve org names for memberships that don't have them cached
    resolveOrgNames(adminOrgs);

    // Async: load aggregate ticket stats from all orgs
    loadHomeStats(memberships);
  }

  function homeOrgCard(m) {
    var name = m.orgName || m._resolvedName || ('Org ' + m.orgId.substring(0, 8));
    return '<button class="card" data-org-card="' + window._safeAttr(m.orgId) + '" data-enter-org="' + window._safeAttr(m.orgId) + '" ' +
      'style="display:flex;align-items:center;gap:12px;cursor:pointer;width:100%;text-align:left;">' +
      '<div style="font-size:1.5rem;flex-shrink:0;">🏢</div>' +
      '<div style="flex:1;min-width:0;">' +
        '<div style="font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" class="org-name-label">' + window._safeHtml(name) + '</div>' +
        '<div class="text-small text-muted">Administrador</div>' +
      '</div>' +
      '<span class="text-muted" style="font-size:1rem;">›</span>' +
    '</button>';
  }

  function homeProviderCard(p) {
    var specs = (p.specialties || []).map(function (s) {
      var spec = SPECIALTIES.find(function (x) { return x.id === s; });
      return '<span class="badge badge-info">' + window._safeHtml(spec ? spec.label : s) + '</span>';
    }).join('');
    return '<div class="card mb-4">' +
      (specs
        ? '<div style="display:flex;flex-wrap:wrap;gap:6px;">' + specs + '</div>'
        : '<div class="text-small text-muted">Nenhuma especialidade cadastrada.</div>'
      ) +
      (p.bio ? '<p class="text-small text-muted mt-2">' + window._safeHtml(p.bio) + '</p>' : '') +
    '</div>';
  }

  // Fetch org names from Firestore for memberships that don't have orgName cached
  function resolveOrgNames(memberships) {
    memberships.forEach(function (m) {
      if (m.orgName || m._resolvedName) return;
      window.db.collection('organizations').doc(m.orgId).get()
        .then(function (snap) {
          if (!snap.exists) return;
          var name = (snap.data() || {}).name;
          if (!name) return;
          m._resolvedName = name;
          // Update in-place in DOM
          var card = document.querySelector('[data-org-card="' + m.orgId + '"]');
          if (card) {
            var lbl = card.querySelector('.org-name-label');
            if (lbl) lbl.textContent = name;
          }
        })
        .catch(function (e) { console.warn('[home] resolveOrgName failed', m.orgId, e); });
    });
  }

  // Aggregate ticket stats across all orgs the user belongs to
  function loadHomeStats(memberships) {
    var orgIds = memberships.map(function (m) { return m.orgId; }).filter(Boolean);
    if (orgIds.length === 0) return;

    var counts = { open: 0, prog: 0, await: 0, done: 0 };
    var pending = orgIds.length;

    orgIds.forEach(function (orgId) {
      window.db.collection('tickets').where('orgId', '==', orgId).get()
        .then(function (qs) {
          qs.docs.forEach(function (doc) {
            var s = (doc.data() || {}).status;
            if (s === 'open' || s === 'published') counts.open++;
            else if (s === 'assigned' || s === 'in_progress' || s === 'awaiting_confirmation') counts.prog++;
            else if (s === 'awaiting_approval') counts.await++;
            else if (s === 'approved') counts.done++;
          });
        })
        .catch(function (e) { console.warn('[home] stats fetch failed', orgId, e); })
        .finally(function () {
          pending--;
          if (pending === 0) applyHomeStats(counts);
        });
    });
  }

  function applyHomeStats(counts) {
    var elOpen  = document.getElementById('hs-open');
    var elProg  = document.getElementById('hs-prog');
    var elAwait = document.getElementById('hs-await');
    var elDone  = document.getElementById('hs-done');
    if (elOpen)  elOpen.textContent  = counts.open;
    if (elProg)  elProg.textContent  = counts.prog;
    if (elAwait) elAwait.textContent = counts.await;
    if (elDone)  elDone.textContent  = counts.done;
  }

  // Switch to a specific org and re-render
  window._dashEnterOrg = function (orgId) {
    window.AppStore.setCurrentOrg(orgId);
    setTimeout(function () { window.routerRender(); }, 200);
  };

  // ============= CREATE ORG MODAL =============

  // Exposed globally so org switcher (in main.js) can call it
  window._dashOpenCreateOrg = function () { openCreateOrgModal(true); };

  function openCreateOrgModal(useGlobalSlot) {
    // When called from outside dashboard view (e.g. org switcher),
    // we may not have an action-modal-slot yet — create one on body.
    var slot = document.getElementById('action-modal-slot');
    if (!slot) {
      slot = document.createElement('div');
      slot.id = 'action-modal-slot';
      document.body.appendChild(slot);
    }
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
    providerSpecs = (window.AppStore.providerProfile && window.AppStore.providerProfile.specialties)
      ? window.AppStore.providerProfile.specialties.slice()
      : [];
    var slot = document.getElementById('action-modal-slot');
    if (!slot) {
      slot = document.createElement('div');
      slot.id = 'action-modal-slot';
      document.body.appendChild(slot);
    }
    slot.innerHTML = '' +
      '<div class="modal-overlay active">' +
        '<div class="modal">' +
          '<div class="modal-header">' +
            '<h2 class="modal-title">🛠️ ' + (window.AppStore.providerProfile ? 'Editar perfil de prestador' : 'Cadastrar como prestador') + '</h2>' +
            '<button class="modal-close" onclick="window._closeActionModal()">×</button>' +
          '</div>' +
          '<div class="form-group">' +
            '<div class="form-label">Especialidades (selecione uma ou mais)</div>' +
            '<div id="prov-spec-pills" style="display:flex;flex-wrap:wrap;gap:8px;">' +
              SPECIALTIES.map(function (s) {
                var active = providerSpecs.indexOf(s.id) !== -1;
                return '<button class="badge" data-spec="' + s.id + '" style="cursor:pointer;font-size:0.9rem;padding:8px 14px;' +
                  (active ? 'background:rgba(30,64,175,0.4);color:white;border:2px solid var(--primary);' : 'background:rgba(255,255,255,0.06);color:var(--text-secondary);border:2px solid transparent;') + '">' +
                  s.label + '</button>';
              }).join('') +
            '</div>' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label" for="prov-bio">Sobre você (opcional)</label>' +
            '<textarea id="prov-bio" rows="3" placeholder="Ex.: 10 anos de experiência em manutenção predial. Atendo emergências.">' + window._safeHtml((window.AppStore.providerProfile && window.AppStore.providerProfile.bio) || '') + '</textarea>' +
          '</div>' +
          '<div class="flex gap-2" style="justify-content:flex-end;">' +
            '<button class="btn btn-ghost" onclick="window._closeActionModal()">Cancelar</button>' +
            '<button class="btn btn-primary" id="prov-confirm">' + (window.AppStore.providerProfile ? 'Salvar alterações' : 'Cadastrar') + '</button>' +
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
      window.showNotification('Pronto!', window.AppStore.providerProfile ? 'Perfil atualizado.' : 'Você está listado como prestador.', 'success');
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
