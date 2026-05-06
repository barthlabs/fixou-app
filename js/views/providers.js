// fixou.app — Providers marketplace (browse + filter)

(function () {
  'use strict';

  var searchTerm = '';

  window.renderProviders = function (container) {
    container.innerHTML = '' +
      '<div class="flex items-center gap-2 mb-4">' +
        '<a class="btn btn-ghost" href="#dashboard">← Voltar</a>' +
        '<h1 class="page-title" style="margin:0;">Prestadores</h1>' +
      '</div>' +

      '<div class="card mb-4">' +
        '<input type="text" id="prov-search" placeholder="🔎 Buscar por nome ou especialidade…" value="' + window._safeHtml(searchTerm) + '">' +
      '</div>' +

      '<div id="prov-list">' + window.emptyState('⏳', 'Carregando…', '') + '</div>';

    var input = document.getElementById('prov-search');
    if (input) {
      input.addEventListener('input', function (e) {
        searchTerm = e.target.value;
        loadProviders();
      });
    }

    loadProviders();
  };

  async function loadProviders() {
    var listEl = document.getElementById('prov-list');
    if (!listEl) return;

    try {
      var qs = await window.db.collection('providerProfiles')
        .where('active', '==', true)
        .limit(50)
        .get();

      var providers = qs.docs.map(function (d) {
        return Object.assign({ id: d.id }, d.data());
      });

      var term = (searchTerm || '').toLowerCase().trim();
      if (term) {
        providers = providers.filter(function (p) {
          var hay = (p.displayName || '').toLowerCase() + ' ' + (p.specialties || []).join(' ').toLowerCase() + ' ' + (p.bio || '').toLowerCase();
          return hay.indexOf(term) !== -1;
        });
      }

      if (providers.length === 0) {
        listEl.innerHTML = window.emptyState('🛠️', 'Nenhum prestador', term ? 'Tente outro termo.' : 'Ainda não há prestadores cadastrados.');
        return;
      }

      listEl.innerHTML = '<div class="grid grid-cols-auto">' + providers.map(providerCard).join('') + '</div>';
    } catch (err) {
      console.error('[providers] load error:', err);
      listEl.innerHTML = '<div class="card"><p class="text-muted">Erro ao carregar prestadores.</p></div>';
    }
  }

  function providerCard(p) {
    var initials = (p.displayName || 'P').split(' ').map(function (s) { return s[0]; }).slice(0, 2).join('');
    return '' +
      '<div class="card">' +
        '<div style="display:flex;gap:12px;align-items:center;margin-bottom:8px;">' +
          (p.photoURL
            ? '<img src="' + window._safeAttr(p.photoURL) + '" style="width:48px;height:48px;border-radius:50%;object-fit:cover;">'
            : '<div style="width:48px;height:48px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;">' + window._safeHtml(initials.toUpperCase()) + '</div>'
          ) +
          '<div>' +
            '<div style="font-weight:700;">' + window._safeHtml(p.displayName || 'Prestador') + '</div>' +
            (p.rating ? '<div class="text-small">⭐ ' + p.rating.toFixed(1) + ' (' + (p.reviewCount || 0) + ')</div>' : '<div class="text-small text-muted">sem avaliações</div>') +
          '</div>' +
        '</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:6px;">' +
          (p.specialties || []).map(function (s) {
            return '<span class="badge badge-info">' + window._safeHtml(s) + '</span>';
          }).join('') +
        '</div>' +
        (p.bio ? '<p class="text-small text-muted mt-2">' + window._safeHtml(p.bio.substring(0, 120)) + '</p>' : '') +
      '</div>';
  }

  console.log('[fixou.app] providers.js loaded');
})();
