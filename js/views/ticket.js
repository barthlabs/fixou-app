// fixou.app — Ticket view (create / detail / lifecycle)

(function () {
  'use strict';

  window.renderTicket = function (container, params) {
    var id = (params && params[0]) || 'new';
    if (id === 'new') return renderCreate(container);
    return renderDetail(container, id);
  };

  // ============= CREATE =============

  var newTicketState = { unitId: '', title: '', description: '', priority: 'medium', photoFile: null };

  function renderCreate(container) {
    var role = window.AppStore.currentOrgRole;
    if (role !== 'admin' && role !== 'manager') {
      container.innerHTML = '<div class="card"><h2>Sem permissão</h2><p class="text-muted">Apenas admins e gestores podem abrir chamados.</p><div class="mt-4"><a class="btn btn-primary" href="#dashboard">← Voltar</a></div></div>';
      return;
    }

    var units = window.AppStore.units || [];
    if (!newTicketState.unitId && units.length > 0) newTicketState.unitId = units[0].id;

    container.innerHTML = '' +
      '<div style="max-width:640px;margin:0 auto;">' +
        '<div class="flex items-center gap-2 mb-4">' +
          '<a class="btn btn-ghost" href="#dashboard">← Voltar</a>' +
          '<h1 class="page-title" style="margin:0;">Novo chamado</h1>' +
        '</div>' +

        (units.length === 0
          ? '<div class="card"><p>Nenhuma unidade cadastrada ainda.</p>' +
            (role === 'admin' ? '<div class="mt-4"><a class="btn btn-primary" href="#admin">Cadastrar unidade →</a></div>' : '<p class="text-small text-muted mt-4">Peça ao administrador para cadastrar uma unidade.</p>') +
            '</div>'
          : ''
        ) +

        (units.length > 0 ? '<div class="card">' +
          '<div class="form-group">' +
            '<label class="form-label" for="t-unit">Unidade</label>' +
            '<select id="t-unit">' +
              units.map(function (u) {
                return '<option value="' + window._safeAttr(u.id) + '"' + (u.id === newTicketState.unitId ? ' selected' : '') + '>' + window._safeHtml(u.name) + '</option>';
              }).join('') +
            '</select>' +
          '</div>' +

          '<div class="form-group">' +
            '<label class="form-label" for="t-title">Título</label>' +
            '<input type="text" id="t-title" placeholder="Ex.: Lâmpada queimada na recepção" value="' + window._safeHtml(newTicketState.title) + '">' +
          '</div>' +

          '<div class="form-group">' +
            '<label class="form-label" for="t-desc">Descrição</label>' +
            '<textarea id="t-desc" rows="4" placeholder="Detalhe o problema, localização, etc.">' + window._safeHtml(newTicketState.description) + '</textarea>' +
          '</div>' +

          '<div class="form-group">' +
            '<label class="form-label">Prioridade</label>' +
            '<div style="display:flex;gap:8px;">' +
              ['low', 'medium', 'high'].map(function (p) {
                var on = newTicketState.priority === p;
                var label = p === 'low' ? '🟢 Baixa' : p === 'medium' ? '🟡 Média' : '🔴 Alta';
                return '<button class="btn ' + (on ? 'btn-primary' : 'btn-secondary') + '" data-priority="' + p + '" type="button">' + label + '</button>';
              }).join('') +
            '</div>' +
          '</div>' +

          '<div class="form-group">' +
            '<label class="form-label" for="t-photo">Foto antes (recomendada)</label>' +
            '<input type="file" id="t-photo" accept="image/*" capture="environment">' +
            '<div class="form-help">Tire uma foto do problema antes de iniciar o chamado.</div>' +
          '</div>' +

          '<button class="btn btn-primary btn-block" id="btn-create">Criar chamado</button>' +
        '</div>' : '') +
      '</div>';

    if (units.length === 0) return;

    document.getElementById('t-unit').addEventListener('change', function (e) { newTicketState.unitId = e.target.value; });
    document.getElementById('t-title').addEventListener('input', function (e) { newTicketState.title = e.target.value; });
    document.getElementById('t-desc').addEventListener('input', function (e) { newTicketState.description = e.target.value; });
    document.querySelectorAll('[data-priority]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        newTicketState.priority = btn.dataset.priority;
        document.querySelectorAll('[data-priority]').forEach(function (b) {
          b.classList.toggle('btn-primary', b.dataset.priority === newTicketState.priority);
          b.classList.toggle('btn-secondary', b.dataset.priority !== newTicketState.priority);
        });
      });
    });
    document.getElementById('t-photo').addEventListener('change', function (e) {
      newTicketState.photoFile = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    });
    document.getElementById('btn-create').addEventListener('click', handleCreate);
  }

  async function handleCreate() {
    var u = window.AppStore.currentUser;
    var orgId = window.AppStore.currentOrgId;
    if (!u || !orgId) return;

    if (!newTicketState.unitId) { window.showNotification('Atenção', 'Selecione uma unidade', 'warning'); return; }
    if (!newTicketState.title.trim()) { window.showNotification('Atenção', 'Informe um título', 'warning'); return; }
    if (!newTicketState.description.trim()) { window.showNotification('Atenção', 'Descreva o problema', 'warning'); return; }

    window.showLoading('Criando chamado…');
    try {
      var ticketRef = window.db.collection('tickets').doc();
      var ticketId = ticketRef.id;

      var photoUrl = null;
      if (newTicketState.photoFile) {
        var path = 'tickets/' + orgId + '/' + ticketId + '/before-' + Date.now() + '.jpg';
        var snap = await window.storage.ref(path).put(newTicketState.photoFile);
        photoUrl = await snap.ref.getDownloadURL();
      }

      var payload = {
        id: ticketId,
        orgId: orgId,
        unitId: newTicketState.unitId,
        openedByUid: u.uid,
        title: newTicketState.title.trim(),
        description: newTicketState.description.trim(),
        priority: newTicketState.priority,
        status: 'open',
        photoBefore: photoUrl,
        photoAfter: null,
        photoConfirmation: null,
        candidates: [],
        assignedProviderUid: null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        history: [{ at: new Date().toISOString(), byUid: u.uid, action: 'created', note: null }]
      };
      await ticketRef.set(payload);

      // reset state
      newTicketState = { unitId: '', title: '', description: '', priority: 'medium', photoFile: null };

      window.hideLoading();
      window.showNotification('Pronto!', 'Chamado criado com sucesso.', 'success');
      window.location.hash = '#ticket/' + ticketId;
    } catch (err) {
      window.hideLoading();
      console.error('[ticket] create error:', err);
      window.showNotification('Erro', err.message || 'Não foi possível criar.', 'error');
    }
  }

  // ============= DETAIL =============

  function renderDetail(container, id) {
    container.innerHTML = '<div class="card text-center"><span style="font-size:2rem;">⏳</span><p class="mt-2 text-muted">Carregando chamado…</p></div>';

    window.db.collection('tickets').doc(id).get().then(function (snap) {
      if (!snap.exists) {
        container.innerHTML = '<div class="card"><h2>Chamado não encontrado</h2><div class="mt-4"><a class="btn btn-primary" href="#dashboard">← Voltar</a></div></div>';
        return;
      }
      var ticket = Object.assign({ id: snap.id }, snap.data());
      drawDetail(container, ticket);
    }).catch(function (err) {
      console.error('[ticket] load error:', err);
      container.innerHTML = '<div class="card"><h2>Erro ao carregar</h2><p class="text-muted">' + window._safeHtml(err.message) + '</p></div>';
    });
  }

  function drawDetail(container, t) {
    var role = window.AppStore.currentOrgRole;
    var u = window.AppStore.currentUser;
    var isProvider = u && u.uid === t.assignedProviderUid;

    var units = window.AppStore.units || [];
    var unit = units.find(function (x) { return x.id === t.unitId; });

    container.innerHTML = '' +
      '<div style="max-width:760px;margin:0 auto;">' +
        '<div class="flex items-center gap-2 mb-4">' +
          '<a class="btn btn-ghost" href="#dashboard">← Voltar</a>' +
        '</div>' +

        '<div class="card">' +
          '<div class="card-header">' +
            '<div>' +
              '<h1 style="font-size:1.4rem;font-weight:800;">' + window._safeHtml(t.title) + '</h1>' +
              '<div class="text-small text-muted mt-2">' + window._safeHtml((unit && unit.name) || '—') + ' · ' + priorityLabel(t.priority) + ' · ' + window.formatTime(t.createdAt) + '</div>' +
            '</div>' +
            statusBadge(t.status) +
          '</div>' +
          '<p class="mt-2" style="white-space:pre-wrap;">' + window._safeHtml(t.description) + '</p>' +
        '</div>' +

        renderPhotos(t) +

        renderActions(t, role, isProvider, u) +

        renderHistory(t);
    wireActions(t);
  }

  function renderPhotos(t) {
    var slots = [
      { key: 'photoBefore', label: 'Antes', url: t.photoBefore },
      { key: 'photoAfter', label: 'Depois', url: t.photoAfter },
      { key: 'photoConfirmation', label: 'Confirmação', url: t.photoConfirmation }
    ];
    return '' +
      '<h3 class="section-title">Fotos</h3>' +
      '<div class="grid grid-cols-3">' +
        slots.map(function (s) {
          if (s.url) {
            return '<a href="' + window._safeAttr(s.url) + '" target="_blank" rel="noopener" style="display:block;border-radius:var(--radius);overflow:hidden;border:1px solid var(--border);">' +
              '<img src="' + window._safeAttr(s.url) + '" alt="' + s.label + '" style="width:100%;height:160px;object-fit:cover;display:block;">' +
              '<div class="text-small text-center" style="padding:6px;background:var(--bg-card);">' + s.label + '</div>' +
            '</a>';
          }
          return '<div class="card text-center text-muted text-small" style="padding:32px 8px;">📷<br>' + s.label + '</div>';
        }).join('') +
      '</div>';
  }

  function renderActions(t, role, isProvider, u) {
    var canManage = role === 'admin' || role === 'manager';
    var isAdmin = role === 'admin';
    var actions = [];

    if (t.status === 'open' && canManage) {
      actions.push({ id: 'publish', label: '📢 Publicar para prestadores', cls: 'btn-secondary' });
      actions.push({ id: 'assign', label: '👤 Atribuir a prestador', cls: 'btn-primary' });
    }
    if (t.status === 'published' && canManage) {
      actions.push({ id: 'view-candidates', label: '👀 Ver candidatos (' + (t.candidates ? t.candidates.length : 0) + ')', cls: 'btn-secondary' });
    }
    if (t.status === 'assigned' && isProvider) {
      actions.push({ id: 'start', label: '▶️ Iniciar execução', cls: 'btn-primary' });
    }
    if (t.status === 'in_progress' && isProvider) {
      actions.push({ id: 'complete', label: '✅ Concluir + foto depois', cls: 'btn-success' });
    }
    if (t.status === 'awaiting_confirmation' && canManage) {
      actions.push({ id: 'confirm', label: '👍 Confirmar serviço', cls: 'btn-success' });
    }
    if (t.status === 'awaiting_approval' && isAdmin) {
      actions.push({ id: 'approve', label: '✔️ Aprovar', cls: 'btn-success' });
      actions.push({ id: 'reject', label: '✖️ Reprovar', cls: 'btn-danger' });
    }

    if (actions.length === 0) return '';

    return '' +
      '<h3 class="section-title">Ações</h3>' +
      '<div class="flex gap-2" style="flex-wrap:wrap;">' +
        actions.map(function (a) {
          return '<button class="btn ' + a.cls + '" data-ticket-action="' + a.id + '">' + a.label + '</button>';
        }).join('') +
      '</div>';
  }

  function renderHistory(t) {
    if (!t.history || !t.history.length) return '';
    return '' +
      '<details class="card mt-4">' +
        '<summary style="cursor:pointer;font-weight:700;">📜 Histórico (' + t.history.length + ')</summary>' +
        '<ul style="margin-top:10px;list-style:none;padding:0;">' +
          t.history.slice().reverse().map(function (h) {
            return '<li class="text-small text-muted" style="padding:4px 0;border-bottom:1px solid var(--border);">' +
              '<strong>' + window._safeHtml(h.action) + '</strong> · ' + window._safeHtml(h.at || '') +
              (h.note ? ' — ' + window._safeHtml(h.note) : '') +
            '</li>';
          }).join('') +
        '</ul>' +
      '</details>';
  }

  function wireActions(t) {
    document.querySelectorAll('[data-ticket-action]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var act = btn.dataset.ticketAction;
        handleAction(t, act);
      });
    });
  }

  async function handleAction(t, action) {
    // Simplified actions for MVP — full ticket lifecycle expanded later
    var u = window.AppStore.currentUser;
    if (!u) return;

    var updates = {
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    var historyEntry = { at: new Date().toISOString(), byUid: u.uid, action: action, note: null };
    var photoNeeded = false;
    var photoField = null;

    if (action === 'publish') updates.status = 'published';
    else if (action === 'start') updates.status = 'in_progress';
    else if (action === 'complete') { updates.status = 'awaiting_confirmation'; photoNeeded = true; photoField = 'photoAfter'; }
    else if (action === 'confirm') { updates.status = 'awaiting_approval'; photoNeeded = true; photoField = 'photoConfirmation'; }
    else if (action === 'approve') updates.status = 'approved';
    else if (action === 'reject') {
      var note = prompt('Motivo da reprovação:');
      if (!note) return;
      updates.status = 'reopened';
      historyEntry.note = note;
    }
    else if (action === 'assign') {
      window.showNotification('Em breve', 'Atribuição direta de prestador será habilitada em breve.', 'info');
      return;
    }
    else if (action === 'view-candidates') {
      window.showNotification('Em breve', 'Lista de candidatos será habilitada em breve.', 'info');
      return;
    }

    var photoFile = null;
    if (photoNeeded) {
      photoFile = await pickPhoto();
      if (!photoFile) { window.showNotification('Atenção', 'Foto é obrigatória para esta etapa.', 'warning'); return; }
    }

    window.showLoading('Atualizando…');
    try {
      if (photoFile && photoField) {
        var path = 'tickets/' + t.orgId + '/' + t.id + '/' + photoField + '-' + Date.now() + '.jpg';
        var snap = await window.storage.ref(path).put(photoFile);
        updates[photoField] = await snap.ref.getDownloadURL();
      }

      updates.history = firebase.firestore.FieldValue.arrayUnion(historyEntry);
      await window.db.collection('tickets').doc(t.id).update(updates);
      window.hideLoading();
      window.showNotification('Atualizado', 'Status atualizado para ' + (updates.status || '—'), 'success');
      // re-render
      window.routerRender();
    } catch (err) {
      window.hideLoading();
      console.error('[ticket] action error:', err);
      window.showNotification('Erro', err.message || 'Não foi possível atualizar.', 'error');
    }
  }

  function pickPhoto() {
    return new Promise(function (resolve) {
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      input.addEventListener('change', function () {
        resolve(input.files && input.files[0] ? input.files[0] : null);
      });
      input.click();
    });
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

  console.log('[fixou.app] ticket.js loaded');
})();
