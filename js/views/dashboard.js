// fixou.app — Dashboard

(function () {
  'use strict';

  var statusFilter = 'all';
  var unsubscribers = [];

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function _safe(s) { return window._safeHtml(s || ''); }
  function _attr(s) { return window._safeAttr(String(s || '')); }

  var SPECIALTIES = [
    { id: 'eletrica',        label: '⚡ Elétrica' },
    { id: 'hidraulica',      label: '🚿 Hidráulica' },
    { id: 'pintura',         label: '🎨 Pintura' },
    { id: 'jardinagem',      label: '🌿 Jardinagem' },
    { id: 'limpeza',         label: '🧹 Limpeza' },
    { id: 'ar_condicionado', label: '❄️ Ar-condicionado' },
    { id: 'serralheria',     label: '🔩 Serralheria' },
    { id: 'marcenaria',      label: '🪚 Marcenaria' },
    { id: 'pedreiro',        label: '🧱 Alvenaria' },
    { id: 'tecnologia',      label: '💻 Tecnologia/TI' },
    { id: 'outros',          label: '🛠️ Outros' }
  ];

  function specLabel(id) {
    var s = SPECIALTIES.find(function (x) { return x.id === id; });
    return s ? s.label : (id || '—');
  }

  // ── Entry point ───────────────────────────────────────────────────────────────
  window.renderDashboard = function (container) {
    if (!window.AppStore.currentUser) return;
    detachListeners();
    if (!window.AppStore.currentOrgId) return renderHome(container);
    renderOrgDashboard(container);
  };

  // ════════════════════════════════════════════════════════════════════════════
  // HOME SCREEN — 2 boxes: Organizações | Serviços
  // ════════════════════════════════════════════════════════════════════════════

  function renderHome(container) {
    var u = window.AppStore.currentUser || {};
    var firstName = (u.displayName || '').split(' ')[0] || 'usuário';
    var memberships = window.AppStore.memberships || [];
    var adminOrgs = memberships.filter(function (m) { return m.role === 'admin'; });
    var services = ((window.AppStore.providerProfile || {}).services) || [];

    container.innerHTML =
      '<h1 class="page-title">Olá, ' + _safe(firstName) + '! 👋</h1>' +

      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;align-items:start;">' +

        // ── Organizações ──────────────────────────────────────────────────────
        '<div class="card">' +
          '<div class="flex items-center justify-between mb-3">' +
            '<h2 class="section-title" style="margin:0;">🏢 Organizações</h2>' +
            '<button class="btn btn-primary btn-sm" id="home-new-org">+ Nova organização</button>' +
          '</div>' +
          (adminOrgs.length === 0
            ? '<p class="text-muted text-small">Nenhuma organização ainda.<br>Crie a primeira para começar.</p>'
            : '<div id="home-orgs-list">' + adminOrgs.map(renderOrgItem).join('') + '</div>'
          ) +
        '</div>' +

        // ── Serviços ──────────────────────────────────────────────────────────
        '<div class="card">' +
          '<div class="flex items-center justify-between mb-3">' +
            '<h2 class="section-title" style="margin:0;">🛠️ Serviços</h2>' +
            '<button class="btn btn-primary btn-sm" id="home-new-service">+ Novo serviço</button>' +
          '</div>' +
          (services.length === 0
            ? '<p class="text-muted text-small">Nenhum serviço cadastrado.<br>Adicione os serviços que você presta.</p>'
            : services.map(function (s) { return renderServiceItem(s, memberships); }).join('')
          ) +
        '</div>' +

      '</div>' +

      '<div id="home-modal-slot"></div>';

    // Wire
    var btnNewOrg = document.getElementById('home-new-org');
    if (btnNewOrg) btnNewOrg.addEventListener('click', openNewOrgModal);

    var btnNewSvc = document.getElementById('home-new-service');
    if (btnNewSvc) btnNewSvc.addEventListener('click', openNewServiceModal);

    container.querySelectorAll('[data-enter-org]').forEach(function (el) {
      el.addEventListener('click', function () { window._dashEnterOrg(el.dataset.enterOrg); });
    });

    // Async: load units for each org
    loadAllUnits(adminOrgs);
  }

  // ── Org item (with async unit list) ──────────────────────────────────────────
  function renderOrgItem(m) {
    var name = m.orgName || m._resolvedName || ('Org ' + m.orgId.substring(0, 8));
    return '' +
      '<div style="margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid var(--border);" ' +
           'data-org-item="' + _attr(m.orgId) + '">' +
        '<button data-enter-org="' + _attr(m.orgId) + '" ' +
          'style="width:100%;text-align:left;background:none;border:none;cursor:pointer;' +
                 'display:flex;align-items:center;gap:8px;padding:0;">' +
          '<span style="font-size:1.1rem;">🏢</span>' +
          '<span style="font-weight:700;flex:1;" class="org-name-lbl">' + _safe(name) + '</span>' +
          '<span class="text-muted" style="font-size:0.85rem;">›</span>' +
        '</button>' +
        '<div id="units-of-' + _attr(m.orgId) + '" ' +
             'style="margin-top:6px;padding-left:26px;" ' +
             'class="text-small text-muted">…</div>' +
      '</div>';
  }

  function loadAllUnits(adminOrgs) {
    adminOrgs.forEach(function (m) {
      window.db.collection('units').where('orgId', '==', m.orgId).get()
        .then(function (qs) {
          var el = document.getElementById('units-of-' + m.orgId);
          if (!el) return;
          if (qs.empty) {
            el.textContent = 'Nenhuma unidade';
            return;
          }
          el.innerHTML = qs.docs.map(function (d) {
            return '<div>• ' + _safe((d.data() || {}).name || '—') + '</div>';
          }).join('');
        })
        .catch(function () {
          var el = document.getElementById('units-of-' + m.orgId);
          if (el) el.textContent = '';
        });
    });
  }

  // ── Service item ──────────────────────────────────────────────────────────────
  function renderServiceItem(s, memberships) {
    var linked = (memberships || []).filter(function (m) {
      return (s.linkedOrgIds || []).indexOf(m.orgId) !== -1;
    });
    var orgNames = linked.map(function (m) {
      return m.orgName || ('Org ' + m.orgId.substring(0, 8));
    }).join(', ');
    return '' +
      '<div style="margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid var(--border);">' +
        '<div style="font-weight:700;">' + _safe(specLabel(s.specialty)) + '</div>' +
        (s.description ? '<div class="text-small text-muted">' + _safe(s.description) + '</div>' : '') +
        '<div class="text-small" style="margin-top:4px;color:var(--text-muted);">' +
          (orgNames || 'Sem vínculo com organização') +
        '</div>' +
      '</div>';
  }

  // ── Enter org ─────────────────────────────────────────────────────────────────
  window._dashEnterOrg = function (orgId) {
    window.AppStore.setCurrentOrg(orgId);
    setTimeout(function () { window.routerRender(); }, 200);
  };

  // ════════════════════════════════════════════════════════════════════════════
  // MODAL — Nova organização
  // ════════════════════════════════════════════════════════════════════════════

  var _unitCounter = 1;

  function openNewOrgModal() {
    _unitCounter = 1;
    var slot = _getModalSlot();
    slot.innerHTML = '' +
      '<div class="modal-overlay active">' +
        '<div class="modal">' +
          '<div class="modal-header">' +
            '<h2 class="modal-title">🏢 Nova organização</h2>' +
            '<button class="modal-close" onclick="window._homeCloseModal()">×</button>' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label">Nome da organização</label>' +
            '<input type="text" id="new-org-name" ' +
              'placeholder="Ex.: Subway Luis Gois, Condomínio Solar, Casa de Praia">' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label">Unidades</label>' +
            '<div id="new-org-units">' + _unitRowHtml(0, true) + '</div>' +
            '<button class="btn btn-ghost btn-sm" style="margin-top:8px;" ' +
              'onclick="window._homeAddUnit()">+ Nova unidade</button>' +
          '</div>' +
          '<div class="flex gap-2" style="justify-content:flex-end;">' +
            '<button class="btn btn-ghost" onclick="window._homeCloseModal()">Cancelar</button>' +
            '<button class="btn btn-primary" id="new-org-confirm">Criar</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    var btn = document.getElementById('new-org-confirm');
    if (btn) btn.addEventListener('click', handleCreateOrg);
    setTimeout(function () {
      var el = document.getElementById('new-org-name');
      if (el) el.focus();
    }, 80);
  }

  function _unitRowHtml(i, isFirst) {
    return '' +
      '<div style="display:flex;gap:6px;margin-bottom:6px;" id="unit-row-' + i + '">' +
        '<input type="text" id="unit-name-' + i + '" ' +
          'placeholder="Nome da unidade" style="flex:1;">' +
        (!isFirst
          ? '<button class="btn btn-ghost btn-sm" ' +
              'onclick="window._homeRemoveUnit(' + i + ')">✕</button>'
          : '') +
      '</div>';
  }

  window._homeAddUnit = function () {
    var list = document.getElementById('new-org-units');
    if (!list) return;
    var wrap = document.createElement('div');
    wrap.innerHTML = _unitRowHtml(_unitCounter, false);
    list.appendChild(wrap.firstChild);
    _unitCounter++;
  };

  window._homeRemoveUnit = function (i) {
    var row = document.getElementById('unit-row-' + i);
    if (row) row.remove();
  };

  async function handleCreateOrg() {
    var nameEl = document.getElementById('new-org-name');
    var name = (nameEl ? nameEl.value : '').trim();
    if (!name) {
      window.showNotification('Atenção', 'Informe o nome da organização.', 'warning');
      return;
    }

    // Collect all visible unit name inputs
    var unitNames = [];
    document.querySelectorAll('[id^="unit-name-"]').forEach(function (el) {
      var v = el.value.trim();
      if (v) unitNames.push(v);
    });

    window.showLoading('Criando organização…');
    try {
      var orgId = await window.AppStore.createOrganization({ name: name });

      if (unitNames.length > 0) {
        var batch = window.db.batch();
        unitNames.forEach(function (uName) {
          var ref = window.db.collection('units').doc();
          batch.set(ref, {
            orgId: orgId,
            name: uName,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        });
        await batch.commit();
      }

      window.hideLoading();
      window._homeCloseModal();
      window.showNotification('Pronto!', 'Organização criada.', 'success');
      setTimeout(function () {
        window.AppStore.setCurrentOrg(orgId);
        window.routerRender();
      }, 700);
    } catch (err) {
      window.hideLoading();
      console.error('[dashboard] createOrg error:', err);
      window.showNotification('Erro', err.message || 'Não foi possível criar.', 'error');
    }
  }

  // Compat alias (used by old org-switcher reference in main.js)
  window._dashOpenCreateOrg = openNewOrgModal;

  // ════════════════════════════════════════════════════════════════════════════
  // MODAL — Novo serviço
  // ════════════════════════════════════════════════════════════════════════════

  var _selectedSpecialty = null;

  function openNewServiceModal() {
    _selectedSpecialty = null;
    var adminOrgs = (window.AppStore.memberships || []).filter(function (m) { return m.role === 'admin'; });
    var slot = _getModalSlot();

    var pillsHtml = SPECIALTIES.map(function (s) {
      return '<button class="badge" data-spec="' + _attr(s.id) + '" ' +
        'style="cursor:pointer;font-size:0.85rem;padding:7px 13px;' +
               'background:rgba(255,255,255,0.06);color:var(--text-secondary);' +
               'border:2px solid transparent;" ' +
        'onclick="window._homeSelectSpec(\'' + _attr(s.id) + '\')">' +
        s.label + '</button>';
    }).join('');

    var orgsHtml = adminOrgs.length === 0 ? '' :
      '<div class="form-group">' +
        '<div class="form-label">Vincular a organizações (opcional)</div>' +
        adminOrgs.map(function (m) {
          var name = m.orgName || ('Org ' + m.orgId.substring(0, 8));
          return '<label style="display:flex;align-items:center;gap:8px;margin-bottom:6px;cursor:pointer;">' +
            '<input type="checkbox" data-org-link="' + _attr(m.orgId) + '">' +
            '<span class="text-small">' + _safe(name) + '</span>' +
          '</label>';
        }).join('') +
      '</div>';

    slot.innerHTML = '' +
      '<div class="modal-overlay active">' +
        '<div class="modal">' +
          '<div class="modal-header">' +
            '<h2 class="modal-title">🛠️ Novo serviço</h2>' +
            '<button class="modal-close" onclick="window._homeCloseModal()">×</button>' +
          '</div>' +
          '<div class="form-group">' +
            '<div class="form-label">Tipo de serviço</div>' +
            '<div style="display:flex;flex-wrap:wrap;gap:6px;">' + pillsHtml + '</div>' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label" for="new-svc-desc">Descrição (opcional)</label>' +
            '<textarea id="new-svc-desc" rows="2" ' +
              'placeholder="Ex.: 10 anos de experiência, atendo emergências…"></textarea>' +
          '</div>' +
          orgsHtml +
          '<div class="flex gap-2" style="justify-content:flex-end;">' +
            '<button class="btn btn-ghost" onclick="window._homeCloseModal()">Cancelar</button>' +
            '<button class="btn btn-primary" id="new-svc-confirm">Salvar</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    var btn = document.getElementById('new-svc-confirm');
    if (btn) btn.addEventListener('click', handleCreateService);
  }

  window._homeSelectSpec = function (id) {
    _selectedSpecialty = id;
    document.querySelectorAll('[data-spec]').forEach(function (el) {
      var active = el.dataset.spec === id;
      el.style.background = active ? 'rgba(30,64,175,0.4)' : 'rgba(255,255,255,0.06)';
      el.style.color      = active ? 'white' : 'var(--text-secondary)';
      el.style.border     = active ? '2px solid var(--primary)' : '2px solid transparent';
    });
  };

  async function handleCreateService() {
    if (!_selectedSpecialty) {
      window.showNotification('Atenção', 'Selecione o tipo de serviço.', 'warning');
      return;
    }
    var u = window.AppStore.currentUser;
    if (!u) return;

    var desc = ((document.getElementById('new-svc-desc') || {}).value || '').trim();
    var linkedOrgIds = [];
    document.querySelectorAll('[data-org-link]').forEach(function (cb) {
      if (cb.checked) linkedOrgIds.push(cb.dataset.orgLink);
    });

    var existing = ((window.AppStore.providerProfile || {}).services) || [];
    var services = existing.concat([{
      id: 'svc_' + Date.now(),
      specialty: _selectedSpecialty,
      description: desc,
      linkedOrgIds: linkedOrgIds,
      createdAt: new Date().toISOString()
    }]);

    window.showLoading('Salvando…');
    try {
      await window.AppStore.saveProviderProfile(u.uid, { services: services });
      window.hideLoading();
      window._homeCloseModal();
      window.showNotification('Pronto!', 'Serviço cadastrado.', 'success');
      setTimeout(function () { window.routerRender(); }, 500);
    } catch (err) {
      window.hideLoading();
      console.error('[dashboard] createService error:', err);
      window.showNotification('Erro', err.message || 'Não foi possível salvar.', 'error');
    }
  }

  // ── Modal slot ────────────────────────────────────────────────────────────────
  function _getModalSlot() {
    var slot = document.getElementById('home-modal-slot');
    if (!slot) {
      slot = document.createElement('div');
      slot.id = 'home-modal-slot';
      document.body.appendChild(slot);
    }
    return slot;
  }

  window._homeCloseModal = function () {
    var slot = document.getElementById('home-modal-slot');
    if (slot) slot.innerHTML = '';
  };

  // ════════════════════════════════════════════════════════════════════════════
  // ORG DASHBOARD — entered org
  // ════════════════════════════════════════════════════════════════════════════

  function renderOrgDashboard(container) {
    var role = window.AppStore.currentOrgRole;
    var u = window.AppStore.currentUser || {};
    var firstName = (u.displayName || '').split(' ')[0] || 'usuário';
    var memberships = window.AppStore.memberships || [];
    var adminOrgs = memberships.filter(function (m) { return m.role === 'admin'; });

    var currentIdx = -1;
    adminOrgs.forEach(function (m, i) {
      if (m.orgId === window.AppStore.currentOrgId) currentIdx = i;
    });

    var orgName = (window.AppStore.currentOrg || {}).name ||
      (adminOrgs[currentIdx] && (adminOrgs[currentIdx].orgName || adminOrgs[currentIdx]._resolvedName)) ||
      '—';
    var hasPrev = currentIdx > 0;
    var hasNext = currentIdx !== -1 && currentIdx < adminOrgs.length - 1;

    container.innerHTML =
      // ← Início
      '<div class="mb-3">' +
        '<button class="btn btn-ghost btn-sm" id="btn-back-home">← Início</button>' +
      '</div>' +

      // Greeting + org navigator
      '<div class="flex items-center justify-between mb-2" style="flex-wrap:wrap;gap:12px;">' +
        '<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;flex:1;min-width:0;">' +
          '<h1 class="page-title" style="margin:0;">Olá, ' + _safe(firstName) + '! 👋</h1>' +
          '<div style="display:flex;align-items:center;gap:4px;">' +
            '<button id="btn-prev-org" class="btn btn-ghost btn-sm" ' +
              'style="padding:4px 10px;font-size:1.1rem;' + (!hasPrev ? 'opacity:0.25;cursor:default;' : '') + '"' +
              (!hasPrev ? ' disabled' : '') + '>‹</button>' +
            '<span style="font-weight:700;font-size:0.95rem;max-width:220px;' +
                         'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" ' +
                  'title="' + _attr(orgName) + '">' + _safe(orgName) + '</span>' +
            '<button id="btn-next-org" class="btn btn-ghost btn-sm" ' +
              'style="padding:4px 10px;font-size:1.1rem;' + (!hasNext ? 'opacity:0.25;cursor:default;' : '') + '"' +
              (!hasNext ? ' disabled' : '') + '>›</button>' +
          '</div>' +
        '</div>' +
        (canCreateTicket(role) ? '<button class="btn btn-primary" id="btn-new-ticket">+ Novo chamado</button>' : '') +
      '</div>' +
      '<div class="text-muted text-small mb-4">' + roleLabel(role) + '</div>' +

      renderStats() +

      '<div class="flex items-center justify-between mb-2 mt-4" style="gap:12px;flex-wrap:wrap;">' +
        '<h2 class="section-title" style="margin:0;">Chamados</h2>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;">' + renderFilters() + '</div>' +
      '</div>' +

      '<div id="tickets-list">' + renderTickets() + '</div>' +

      (role === 'admin'
        ? '<div class="mt-4 flex gap-2">' +
            '<a class="btn btn-secondary" href="#admin">⚙️ Administrar organização</a>' +
          '</div>'
        : '');

    // Wire
    var backBtn = document.getElementById('btn-back-home');
    if (backBtn) backBtn.addEventListener('click', function () {
      window.AppStore.setCurrentOrg(null);
      window.routerRender();
    });

    var prevBtn = document.getElementById('btn-prev-org');
    if (prevBtn && hasPrev) prevBtn.addEventListener('click', function () {
      window._dashEnterOrg(adminOrgs[currentIdx - 1].orgId);
    });

    var nextBtn = document.getElementById('btn-next-org');
    if (nextBtn && hasNext) nextBtn.addEventListener('click', function () {
      window._dashEnterOrg(adminOrgs[currentIdx + 1].orgId);
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

    var rerender = function () {
      var listEl = document.getElementById('tickets-list');
      if (listEl) listEl.innerHTML = renderTickets();
    };
    window.addEventListener('tickets-changed', rerender);
    unsubscribers.push(function () { window.removeEventListener('tickets-changed', rerender); });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // TICKET HELPERS
  // ════════════════════════════════════════════════════════════════════════════

  function renderStats() {
    var t = window.AppStore.tickets || [];
    var open     = t.filter(function (x) { return x.status === 'open' || x.status === 'published'; }).length;
    var inProg   = t.filter(function (x) { return x.status === 'assigned' || x.status === 'in_progress' || x.status === 'awaiting_confirmation'; }).length;
    var awaiting = t.filter(function (x) { return x.status === 'awaiting_approval'; }).length;
    var done     = t.filter(function (x) { return x.status === 'approved'; }).length;

    return '' +
      '<div class="grid grid-cols-auto">' +
        '<div class="stat-box"><div class="stat-value">' + open + '</div><div class="stat-label">Abertos</div></div>' +
        '<div class="stat-box"><div class="stat-value">' + inProg + '</div><div class="stat-label">Em andamento</div></div>' +
        '<div class="stat-box"><div class="stat-value">' + awaiting + '</div><div class="stat-label">Aguardando aprovação</div></div>' +
        '<div class="stat-box"><div class="stat-value">' + done + '</div><div class="stat-label">Concluídos</div></div>' +
      '</div>';
  }

  function renderFilters() {
    var filters = [
      { id: 'all',              label: 'Todos' },
      { id: 'open',             label: 'Abertos' },
      { id: 'in_progress',      label: 'Em andamento' },
      { id: 'awaiting_approval',label: 'Aprovação' },
      { id: 'approved',         label: 'Concluídos' }
    ];
    return filters.map(function (f) {
      var on = statusFilter === f.id;
      return '<button class="btn btn-sm ' + (on ? 'btn-primary' : 'btn-ghost') + '" ' +
        'data-filter="' + f.id + '">' + f.label + '</button>';
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
      var unitName = unit ? unit.name : (ticket.unitId ? 'Unidade ' + ticket.unitId.substring(0, 6) : '—');
      return ticketCard(ticket, unitName);
    }).join('');
  }

  function ticketCard(t, unitName) {
    return '' +
      '<a class="card" href="#ticket/' + _attr(t.id) + '" ' +
         'style="display:block;text-decoration:none;color:inherit;">' +
        '<div class="card-header">' +
          '<div class="card-title">' + _safe(t.title || 'Sem título') + '</div>' +
          statusBadge(t.status) +
        '</div>' +
        '<div class="text-small text-muted">' +
          _safe(unitName) + ' · ' + priorityLabel(t.priority) + ' · ' + window.formatTime(t.createdAt) +
        '</div>' +
        (t.description
          ? '<div class="text-small mt-2" style="color:var(--text-secondary);">' +
              _safe(t.description.substring(0, 140)) + (t.description.length > 140 ? '…' : '') +
            '</div>'
          : '') +
      '</a>';
  }

  function statusBadge(status) {
    var map = {
      open:                  { cls: 'badge-info',    text: 'Aberto' },
      published:             { cls: 'badge-info',    text: 'Publicado' },
      assigned:              { cls: 'badge-purple',  text: 'Atribuído' },
      in_progress:           { cls: 'badge-warning', text: 'Em andamento' },
      awaiting_confirmation: { cls: 'badge-warning', text: 'Aguard. confirmação' },
      awaiting_approval:     { cls: 'badge-warning', text: 'Aguard. aprovação' },
      approved:              { cls: 'badge-success', text: 'Aprovado' },
      rejected:              { cls: 'badge-danger',  text: 'Reprovado' },
      reopened:              { cls: 'badge-danger',  text: 'Reaberto' }
    };
    var s = map[status] || { cls: 'badge-gray', text: status || '—' };
    return '<span class="badge ' + s.cls + '">' + s.text + '</span>';
  }

  function priorityLabel(p) {
    if (p === 'high')   return '🔴 Alta';
    if (p === 'medium') return '🟡 Média';
    if (p === 'low')    return '🟢 Baixa';
    return '—';
  }

  function roleLabel(r) {
    if (r === 'admin')    return '👔 Administrador';
    if (r === 'manager')  return '🧑‍💼 Gestor';
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
