// fixou.app — Dashboard (flat layout: Pendências + Organizações e Unidades)

(function () {
  'use strict';

  // ── Module state ──────────────────────────────────────────────────────────────
  var _unsubTickets     = null;   // Firestore onSnapshot unsub
  var _membershipHandler = null;  // window event listener ref
  var _allTickets = {};           // docId → ticket
  var _units      = {};           // docId → unit
  var _orgs       = {};           // orgId → membership obj
  var _unitCounter = 1;

  // ── Helpers ───────────────────────────────────────────────────────────────────
  function _safe(s) {
    return window._safeHtml ? window._safeHtml(s || '') : String(s || '');
  }
  function _attr(s) {
    return window._safeAttr
      ? window._safeAttr(String(s || ''))
      : String(s || '').replace(/"/g, '&quot;');
  }
  function _empty(icon, title, msg) {
    if (window.emptyState) return window.emptyState(icon, title, msg);
    return '<div style="text-align:center;padding:40px 16px;color:var(--text-muted);">' +
      '<div style="font-size:2.2rem;margin-bottom:8px;">' + icon + '</div>' +
      '<div style="font-weight:700;margin-bottom:4px;">' + title + '</div>' +
      '<div style="font-size:0.88rem;">' + msg + '</div>' +
    '</div>';
  }

  // ── Entry point ───────────────────────────────────────────────────────────────
  window.renderDashboard = function (container) {
    if (!window.AppStore.currentUser) return;
    detach();
    render(container);
  };

  // ── Detach ────────────────────────────────────────────────────────────────────
  function detach() {
    if (_unsubTickets) {
      try { _unsubTickets(); } catch (e) {}
      _unsubTickets = null;
    }
    if (_membershipHandler) {
      window.removeEventListener('memberships-changed', _membershipHandler);
      _membershipHandler = null;
    }
    _allTickets = {};
    _units = {};
    _orgs = {};
  }

  // ── Main render ───────────────────────────────────────────────────────────────
  function render(container) {
    var u = window.AppStore.currentUser || {};
    var firstName = (u.displayName || '').split(' ')[0] || 'usuário';
    var memberships = window.AppStore.memberships || [];
    var adminOrgs = memberships.filter(function (m) { return m.role === 'admin'; });

    // Build lookup
    _orgs = {};
    adminOrgs.forEach(function (m) { _orgs[m.orgId] = m; });

    container.innerHTML =
      '<h1 class="page-title">Olá, ' + _safe(firstName) + '! 👋</h1>' +

      // ── Pendências ────────────────────────────────────────────────────────────
      '<div class="dash-section">' +
        '<div class="dash-section-header">' +
          '<h2 class="dash-section-title">📋 Pendências</h2>' +
          '<button class="btn btn-primary btn-sm" id="btn-new-ticket">+ Nova pendência</button>' +
        '</div>' +
        '<div id="dash-tickets">' +
          (adminOrgs.length === 0
            ? _empty('📋', 'Nenhuma pendência', 'Crie uma organização para começar a gerenciar chamados.')
            : '<div class="text-small text-muted" style="padding:8px 0;">Carregando…</div>') +
        '</div>' +
      '</div>' +

      // ── Organizações e Unidades ───────────────────────────────────────────────
      '<div class="dash-section">' +
        '<div class="dash-section-header">' +
          '<h2 class="dash-section-title">🏢 Organizações e Unidades</h2>' +
          '<button class="btn btn-ghost btn-sm" id="btn-new-org">+ Nova organização</button>' +
        '</div>' +
        '<div id="dash-orgs">' +
          (adminOrgs.length === 0
            ? _empty('🏢', 'Nenhuma organização', 'Crie sua primeira organização para começar.')
            : adminOrgs.map(renderOrgBlock).join('')) +
        '</div>' +
      '</div>' +

      '<div id="dash-modal-slot"></div>';

    // ── Wire buttons ─────────────────────────────────────────────────────────────
    var newTicketBtn = document.getElementById('btn-new-ticket');
    if (newTicketBtn) newTicketBtn.addEventListener('click', handleNewTicket);

    var newOrgBtn = document.getElementById('btn-new-org');
    if (newOrgBtn) newOrgBtn.addEventListener('click', openNewOrgModal);

    // Ticket click via event delegation
    var ticketsEl = document.getElementById('dash-tickets');
    if (ticketsEl) {
      ticketsEl.addEventListener('click', function (e) {
        var card = e.target.closest('[data-ticket-id]');
        if (!card) return;
        var tId = card.dataset.ticketId;
        var orgId = card.dataset.orgId;
        if (tId && orgId) {
          window.AppStore.setCurrentOrg(orgId);
          setTimeout(function () { window.location.hash = '#ticket/' + tId; }, 150);
        }
      });
    }

    // Wire "+ Nova unidade" buttons
    wireAddUnitButtons();

    // Load units then start ticket listener
    if (adminOrgs.length > 0) {
      loadUnitsForOrgs(adminOrgs, function () {
        fillUnitLists();
        startTicketListener(adminOrgs);
      });
    }

    // Listen for membership changes (org name backfill, new org created)
    _membershipHandler = function () {
      var updated = window.AppStore.memberships || [];
      var updatedAdminOrgs = updated.filter(function (m) { return m.role === 'admin'; });

      _orgs = {};
      updatedAdminOrgs.forEach(function (m) { _orgs[m.orgId] = m; });

      var orgsEl = document.getElementById('dash-orgs');
      if (orgsEl) {
        orgsEl.innerHTML = updatedAdminOrgs.length === 0
          ? _empty('🏢', 'Nenhuma organização', 'Crie sua primeira organização para começar.')
          : updatedAdminOrgs.map(renderOrgBlock).join('');
        wireAddUnitButtons();
      }

      if (updatedAdminOrgs.length > 0) {
        // Clear and reload units to pick up new orgs
        _units = {};
        loadUnitsForOrgs(updatedAdminOrgs, function () {
          fillUnitLists();
          startTicketListener(updatedAdminOrgs);
        });
      } else {
        renderTicketsList();
      }
    };
    window.addEventListener('memberships-changed', _membershipHandler);
  }

  // ── Org block ─────────────────────────────────────────────────────────────────
  function renderOrgBlock(m) {
    var name = m.orgName || m._resolvedName || ('Org ' + m.orgId.substring(0, 8));
    return '' +
      '<div class="dash-org-block" data-org-block="' + _attr(m.orgId) + '">' +
        '<div class="dash-org-header">' +
          '<div style="font-weight:700;font-size:1rem;display:flex;align-items:center;gap:8px;">' +
            '<span>🏢</span>' +
            '<span class="org-name-lbl">' + _safe(name) + '</span>' +
          '</div>' +
          '<button class="btn btn-ghost btn-sm" data-add-unit="' + _attr(m.orgId) + '">' +
            '+ Nova unidade' +
          '</button>' +
        '</div>' +
        '<div class="dash-units-list" id="units-list-' + _attr(m.orgId) + '">' +
          '<div class="text-small text-muted" style="padding:4px 0;">Carregando…</div>' +
        '</div>' +
      '</div>';
  }

  function wireAddUnitButtons() {
    document.querySelectorAll('[data-add-unit]').forEach(function (btn) {
      // Clone to remove any previous listeners
      var fresh = btn.cloneNode(true);
      btn.parentNode.replaceChild(fresh, btn);
      fresh.addEventListener('click', function () {
        openAddUnitModal(fresh.dataset.addUnit);
      });
    });
  }

  // ── Unit loading ──────────────────────────────────────────────────────────────
  function loadUnitsForOrgs(adminOrgs, cb) {
    if (adminOrgs.length === 0) { if (cb) cb(); return; }
    var remaining = adminOrgs.length;
    function done() { remaining--; if (remaining === 0 && cb) cb(); }
    adminOrgs.forEach(function (m) {
      window.db.collection('units').where('orgId', '==', m.orgId).get()
        .then(function (qs) {
          qs.docs.forEach(function (d) {
            _units[d.id] = Object.assign({ id: d.id }, d.data());
          });
          done();
        })
        .catch(function () { done(); });
    });
  }

  function fillUnitLists() {
    Object.keys(_orgs).forEach(function (orgId) {
      var el = document.getElementById('units-list-' + orgId);
      if (!el) return;
      var list = Object.values(_units).filter(function (u) { return u.orgId === orgId; });
      if (list.length === 0) {
        el.innerHTML = '<div class="text-small text-muted" style="padding:4px 0;">Nenhuma unidade cadastrada</div>';
        return;
      }
      el.innerHTML = list.map(function (u) {
        return '<div class="dash-unit-item">• ' + _safe(u.name || '—') + '</div>';
      }).join('');
    });
  }

  // ── Ticket listener ───────────────────────────────────────────────────────────
  function startTicketListener(adminOrgs) {
    if (_unsubTickets) { try { _unsubTickets(); } catch (e) {} _unsubTickets = null; }
    var orgIds = adminOrgs.map(function (m) { return m.orgId; }).slice(0, 30);
    if (orgIds.length === 0) { renderTicketsList(); return; }

    _allTickets = {};
    _unsubTickets = window.db
      .collection('tickets')
      .where('orgId', 'in', orgIds)
      .onSnapshot(
        function (qs) {
          _allTickets = {};
          qs.docs.forEach(function (d) {
            _allTickets[d.id] = Object.assign({ id: d.id }, d.data());
          });
          renderTicketsList();
        },
        function (err) { console.error('[dashboard] tickets listener:', err); }
      );
  }

  function renderTicketsList() {
    var el = document.getElementById('dash-tickets');
    if (!el) return;

    var pending = Object.values(_allTickets).filter(function (t) {
      return t.status !== 'approved' && t.status !== 'rejected';
    });

    pending.sort(function (a, b) {
      var ta = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
      var tb = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
      return tb - ta;
    });

    if (pending.length === 0) {
      el.innerHTML = _empty('📭', 'Tudo em dia!', 'Nenhuma pendência no momento.');
      return;
    }

    el.innerHTML = pending.map(function (t) {
      var unit = _units[t.unitId] || {};
      var org  = _orgs[t.orgId]  || {};
      var orgName = org.orgName || org._resolvedName || '';
      return ticketCard(t, unit.name, orgName);
    }).join('');
  }

  function ticketCard(t, unitName, orgName) {
    var prioBorder = {
      high:   'var(--danger)',
      medium: 'var(--warning)',
      low:    'var(--success)'
    };
    var border = prioBorder[t.priority] || 'var(--border-strong)';
    return '' +
      '<div class="card dash-ticket-card" ' +
           'data-ticket-id="' + _attr(t.id) + '" ' +
           'data-org-id="' + _attr(t.orgId) + '" ' +
           'style="border-left:3px solid ' + border + ';">' +
        '<div class="card-header">' +
          '<div class="card-title">' + _safe(t.title || 'Sem título') + '</div>' +
          statusBadge(t.status) +
        '</div>' +
        '<div class="text-small text-muted">' +
          (orgName ? _safe(orgName) + ' › ' : '') +
          _safe(unitName || '—') +
          ' · ' + priorityLabel(t.priority) +
          ' · ' + window.formatTime(t.createdAt) +
        '</div>' +
        (t.description
          ? '<div class="text-small mt-2" style="color:var(--text-secondary);">' +
              _safe(t.description.substring(0, 120)) + (t.description.length > 120 ? '…' : '') +
            '</div>'
          : '') +
      '</div>';
  }

  // ── "Nova pendência" flow ─────────────────────────────────────────────────────
  function handleNewTicket() {
    var memberships = window.AppStore.memberships || [];
    var adminOrgs = memberships.filter(function (m) { return m.role === 'admin'; });

    if (adminOrgs.length === 0) {
      window.showNotification('Atenção', 'Crie uma organização antes de abrir um chamado.', 'warning');
      return;
    }

    if (adminOrgs.length === 1) {
      var m = adminOrgs[0];
      var hasUnits = Object.values(_units).some(function (u) { return u.orgId === m.orgId; });
      if (!hasUnits) {
        window.showNotification('Atenção', 'Adicione uma unidade à organização antes de criar chamados.', 'warning');
        return;
      }
      window.AppStore.setCurrentOrg(m.orgId);
      setTimeout(function () { window.location.hash = '#ticket/new'; }, 300);
      return;
    }

    // Multiple orgs → picker
    openOrgPickerModal(adminOrgs);
  }

  function openOrgPickerModal(adminOrgs) {
    var slot = getModalSlot();
    var options = adminOrgs.map(function (m) {
      var name = m.orgName || m._resolvedName || ('Org ' + m.orgId.substring(0, 8));
      return '<option value="' + _attr(m.orgId) + '">' + _safe(name) + '</option>';
    }).join('');

    slot.innerHTML = '' +
      '<div class="modal-overlay active">' +
        '<div class="modal">' +
          '<div class="modal-header">' +
            '<h2 class="modal-title">📋 Nova pendência</h2>' +
            '<button class="modal-close" onclick="window._dashCloseModal()">×</button>' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label">Selecione a organização</label>' +
            '<select id="picker-org-id">' + options + '</select>' +
          '</div>' +
          '<div class="flex gap-2" style="justify-content:flex-end;">' +
            '<button class="btn btn-ghost" onclick="window._dashCloseModal()">Cancelar</button>' +
            '<button class="btn btn-primary" id="picker-confirm">Continuar →</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    var btn = document.getElementById('picker-confirm');
    if (btn) btn.addEventListener('click', function () {
      var sel = document.getElementById('picker-org-id');
      var orgId = sel ? sel.value : null;
      if (!orgId) return;
      var hasUnits = Object.values(_units).some(function (u) { return u.orgId === orgId; });
      if (!hasUnits) {
        window.showNotification('Atenção', 'Adicione uma unidade a esta organização antes de criar chamados.', 'warning');
        return;
      }
      window._dashCloseModal();
      window.AppStore.setCurrentOrg(orgId);
      setTimeout(function () { window.location.hash = '#ticket/new'; }, 300);
    });
  }

  // ── Modal: Nova organização ───────────────────────────────────────────────────
  function openNewOrgModal() {
    _unitCounter = 1;
    var slot = getModalSlot();
    slot.innerHTML = '' +
      '<div class="modal-overlay active">' +
        '<div class="modal">' +
          '<div class="modal-header">' +
            '<h2 class="modal-title">🏢 Nova organização</h2>' +
            '<button class="modal-close" onclick="window._dashCloseModal()">×</button>' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label">Nome da organização</label>' +
            '<input type="text" id="new-org-name" ' +
              'placeholder="Ex.: Subway Luis Gois, Condomínio Solar, Casa de Praia">' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label">Unidades</label>' +
            '<div id="new-org-units">' + unitRowHtml(0, true) + '</div>' +
            '<button class="btn btn-ghost btn-sm" style="margin-top:8px;" ' +
              'onclick="window._dashAddUnit()">+ Nova unidade</button>' +
          '</div>' +
          '<div class="flex gap-2" style="justify-content:flex-end;">' +
            '<button class="btn btn-ghost" onclick="window._dashCloseModal()">Cancelar</button>' +
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

  function unitRowHtml(i, isFirst) {
    return '' +
      '<div style="display:flex;gap:6px;margin-bottom:6px;" id="unit-row-' + i + '">' +
        '<input type="text" id="unit-name-' + i + '" placeholder="Nome da unidade" style="flex:1;">' +
        (!isFirst
          ? '<button class="btn btn-ghost btn-sm" ' +
              'onclick="window._dashRemoveUnit(' + i + ')">✕</button>'
          : '') +
      '</div>';
  }

  window._dashAddUnit = function () {
    var list = document.getElementById('new-org-units');
    if (!list) return;
    var wrap = document.createElement('div');
    wrap.innerHTML = unitRowHtml(_unitCounter, false);
    list.appendChild(wrap.firstChild);
    _unitCounter++;
  };
  window._homeAddUnit = window._dashAddUnit;   // compat alias

  window._dashRemoveUnit = function (i) {
    var row = document.getElementById('unit-row-' + i);
    if (row) row.remove();
  };
  window._homeRemoveUnit = window._dashRemoveUnit; // compat alias

  async function handleCreateOrg() {
    var nameEl = document.getElementById('new-org-name');
    var name = (nameEl ? nameEl.value : '').trim();
    if (!name) {
      window.showNotification('Atenção', 'Informe o nome da organização.', 'warning');
      return;
    }

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
        var newUnits = [];
        unitNames.forEach(function (uName) {
          var ref = window.db.collection('units').doc();
          newUnits.push({ id: ref.id, orgId: orgId, name: uName });
          batch.set(ref, {
            orgId: orgId,
            name: uName,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        });
        await batch.commit();
        // Pre-cache so fillUnitLists works immediately on memberships-changed
        newUnits.forEach(function (u) { _units[u.id] = u; });
      }

      window.hideLoading();
      window._dashCloseModal();
      window.showNotification('Pronto!', 'Organização "' + name + '" criada.', 'success');
      // memberships-changed event will refresh the UI automatically
    } catch (err) {
      window.hideLoading();
      console.error('[dashboard] createOrg error:', err);
      window.showNotification('Erro', err.message || 'Não foi possível criar.', 'error');
    }
  }

  // ── Modal: Nova unidade (existing org) ───────────────────────────────────────
  function openAddUnitModal(orgId) {
    var org = _orgs[orgId];
    var orgName = org ? (org.orgName || org._resolvedName || 'Organização') : 'Organização';
    var slot = getModalSlot();
    slot.innerHTML = '' +
      '<div class="modal-overlay active">' +
        '<div class="modal">' +
          '<div class="modal-header">' +
            '<h2 class="modal-title">Nova unidade</h2>' +
            '<button class="modal-close" onclick="window._dashCloseModal()">×</button>' +
          '</div>' +
          '<p class="text-small text-muted" style="margin-bottom:14px;">' +
            'Organização: <strong>' + _safe(orgName) + '</strong>' +
          '</p>' +
          '<div class="form-group">' +
            '<label class="form-label">Nome da unidade</label>' +
            '<input type="text" id="new-unit-name" ' +
              'placeholder="Ex.: Loja 1, Bloco A, Apt 101">' +
          '</div>' +
          '<div class="flex gap-2" style="justify-content:flex-end;">' +
            '<button class="btn btn-ghost" onclick="window._dashCloseModal()">Cancelar</button>' +
            '<button class="btn btn-primary" id="add-unit-confirm">Adicionar</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    var btn = document.getElementById('add-unit-confirm');
    if (btn) btn.addEventListener('click', function () { handleAddUnit(orgId); });
    setTimeout(function () {
      var el = document.getElementById('new-unit-name');
      if (el) el.focus();
    }, 80);
  }

  async function handleAddUnit(orgId) {
    var nameEl = document.getElementById('new-unit-name');
    var name = (nameEl ? nameEl.value : '').trim();
    if (!name) {
      window.showNotification('Atenção', 'Informe o nome da unidade.', 'warning');
      return;
    }

    window.showLoading('Adicionando unidade…');
    try {
      var ref = window.db.collection('units').doc();
      await ref.set({
        orgId: orgId,
        name: name,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      _units[ref.id] = { id: ref.id, orgId: orgId, name: name };
      window.hideLoading();
      window._dashCloseModal();
      window.showNotification('Pronto!', 'Unidade adicionada.', 'success');

      // Refresh this org's unit list in place
      var listEl = document.getElementById('units-list-' + orgId);
      if (listEl) {
        var orgUnits = Object.values(_units).filter(function (u) { return u.orgId === orgId; });
        listEl.innerHTML = orgUnits.map(function (u) {
          return '<div class="dash-unit-item">• ' + _safe(u.name || '—') + '</div>';
        }).join('');
      }
    } catch (err) {
      window.hideLoading();
      console.error('[dashboard] addUnit error:', err);
      window.showNotification('Erro', err.message || 'Não foi possível adicionar.', 'error');
    }
  }

  // ── Modal helpers ─────────────────────────────────────────────────────────────
  function getModalSlot() {
    var slot = document.getElementById('dash-modal-slot');
    if (!slot) {
      slot = document.createElement('div');
      slot.id = 'dash-modal-slot';
      document.body.appendChild(slot);
    }
    return slot;
  }

  window._dashCloseModal = function () {
    var slot = document.getElementById('dash-modal-slot');
    if (slot) slot.innerHTML = '';
    var homeSlot = document.getElementById('home-modal-slot');
    if (homeSlot) homeSlot.innerHTML = '';
  };
  window._homeCloseModal = window._dashCloseModal;   // compat alias

  // ── Status / priority helpers ─────────────────────────────────────────────────
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

  // ── Compat aliases ────────────────────────────────────────────────────────────
  window._dashOpenCreateOrg = openNewOrgModal;

  console.log('[fixou.app] dashboard.js loaded');
})();
