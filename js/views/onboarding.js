// fixou.app — Onboarding (3 steps)

(function () {
  'use strict';

  var step = 1;
  var formData = {
    displayName: '',
    phone: '',
    role: null,           // 'admin' | 'manager' | 'provider'
    orgName: '',
    orgType: 'lojas',
    specialties: []
  };

  var SPECIALTIES = [
    { id: 'eletrica', label: '⚡ Elétrica' },
    { id: 'hidraulica', label: '🚿 Hidráulica' },
    { id: 'pintura', label: '🎨 Pintura' },
    { id: 'jardinagem', label: '🌿 Jardinagem' },
    { id: 'limpeza', label: '🧹 Limpeza' },
    { id: 'ar_condicionado', label: '❄️ Ar-condicionado' },
    { id: 'serralheria', label: '🔩 Serralheria' },
    { id: 'marcenaria', label: '🪚 Marcenaria' },
    { id: 'pedreiro', label: '🧱 Alvenaria/Pedreiro' },
    { id: 'tecnologia', label: '💻 Tecnologia/TI' },
    { id: 'outros', label: '🛠️ Outros' }
  ];

  window.renderOnboarding = function (container) {
    var u = window.AppStore.currentUser || {};
    if (!formData.displayName) formData.displayName = u.displayName || '';
    if (!formData.phone) formData.phone = u.phone || '';

    container.innerHTML = '' +
      '<div style="max-width:560px;margin:0 auto;">' +
        '<div class="text-muted text-small mb-2">Passo ' + step + ' de 3</div>' +
        renderStep() +
      '</div>';

    wire();
  };

  function renderStep() {
    if (step === 1) return renderStep1();
    if (step === 2) return renderStep2();
    return renderStep3();
  }

  function renderStep1() {
    return '' +
      '<h1 class="page-title">Bem-vindo ao fixou.app! 👋</h1>' +
      '<p class="page-subtitle">Vamos configurar sua conta. Como prefere ser chamado?</p>' +
      '<div class="card">' +
        '<div class="form-group">' +
          '<label class="form-label" for="ob-name">Nome de exibição</label>' +
          '<input type="text" id="ob-name" value="' + window._safeHtml(formData.displayName) + '">' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label" for="ob-phone">Telefone (opcional)</label>' +
          '<input type="tel" id="ob-phone" value="' + window._safeHtml(formData.phone) + '" placeholder="(11) 99999-9999">' +
        '</div>' +
        '<button class="btn btn-primary btn-block" id="ob-next">Continuar</button>' +
      '</div>';
  }

  function renderStep2() {
    return '' +
      '<h1 class="page-title">Como você vai usar o fixou.app?</h1>' +
      '<p class="page-subtitle">Escolha um perfil. Você pode adicionar outros depois.</p>' +
      '<div class="grid grid-cols-auto">' +
        roleCard('admin', '👔', 'Administrador', 'Gerencio uma ou mais unidades (lojas, condomínio, clube etc.) e quero organizar a manutenção.') +
        roleCard('manager', '🧑‍💼', 'Gestor', 'Sou responsável por uma unidade e quero abrir e acompanhar chamados de manutenção.') +
        roleCard('provider', '🛠️', 'Prestador de Serviço', 'Ofereço serviços de manutenção e quero receber chamados pela plataforma.') +
      '</div>' +
      '<div class="flex gap-2 mt-4">' +
        '<button class="btn btn-ghost" id="ob-back">Voltar</button>' +
        '<button class="btn btn-primary" id="ob-next" ' + (formData.role ? '' : 'disabled') + '>Continuar</button>' +
      '</div>';
  }

  function roleCard(id, icon, label, desc) {
    var selected = formData.role === id;
    return '' +
      '<button class="card" data-role="' + id + '" style="text-align:left;cursor:pointer;border:2px solid ' + (selected ? 'var(--primary)' : 'var(--border)') + ';">' +
        '<div style="font-size:2rem;margin-bottom:6px;">' + icon + '</div>' +
        '<div style="font-weight:700;font-size:1.05rem;margin-bottom:4px;">' + label + '</div>' +
        '<div class="text-small text-muted">' + desc + '</div>' +
      '</button>';
  }

  function renderStep3() {
    if (formData.role === 'admin') return renderStep3Admin();
    if (formData.role === 'manager') return renderStep3Manager();
    if (formData.role === 'provider') return renderStep3Provider();
    return '<p class="text-muted">Volte e escolha um perfil.</p>';
  }

  function renderStep3Admin() {
    return '' +
      '<h1 class="page-title">Sua organização</h1>' +
      '<p class="page-subtitle">Crie a primeira organização. Você poderá adicionar unidades, gestores e prestadores em seguida.</p>' +
      '<div class="card">' +
        '<div class="form-group">' +
          '<label class="form-label" for="ob-org-name">Nome da organização</label>' +
          '<input type="text" id="ob-org-name" value="' + window._safeHtml(formData.orgName) + '" placeholder="Ex.: Lojas Bella, Condomínio Solar, Clube Atlético">' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label" for="ob-org-type">Tipo</label>' +
          '<select id="ob-org-type">' +
            optionTag('lojas', 'Rede de lojas', formData.orgType) +
            optionTag('condominio', 'Condomínio', formData.orgType) +
            optionTag('clube', 'Clube', formData.orgType) +
            optionTag('outro', 'Outro', formData.orgType) +
          '</select>' +
        '</div>' +
      '</div>' +
      '<div class="flex gap-2 mt-4">' +
        '<button class="btn btn-ghost" id="ob-back">Voltar</button>' +
        '<button class="btn btn-primary" id="ob-finish">Finalizar</button>' +
      '</div>';
  }

  function renderStep3Manager() {
    return '' +
      '<h1 class="page-title">Aguardando convite</h1>' +
      '<p class="page-subtitle">Como gestor, você precisa ser convidado por um administrador para gerenciar uma unidade.</p>' +
      '<div class="card">' +
        '<p>Peça ao administrador da sua organização para convidá-lo usando este email:</p>' +
        '<div class="stat-box mt-4">' +
          '<div class="stat-value" style="font-size:1.1rem;">' + window._safeHtml((window.AppStore.currentUser || {}).email || '') + '</div>' +
          '<div class="stat-label">seu email cadastrado</div>' +
        '</div>' +
        '<p class="text-small text-muted mt-4">Quando o convite for enviado, você receberá uma notificação e poderá entrar na organização.</p>' +
      '</div>' +
      '<div class="flex gap-2 mt-4">' +
        '<button class="btn btn-ghost" id="ob-back">Voltar</button>' +
        '<button class="btn btn-primary" id="ob-finish">Concluir cadastro</button>' +
      '</div>';
  }

  function renderStep3Provider() {
    return '' +
      '<h1 class="page-title">Seu perfil de prestador</h1>' +
      '<p class="page-subtitle">Selecione suas especialidades. Você poderá adicionar mais detalhes depois no perfil.</p>' +
      '<div class="card">' +
        '<div class="form-label">Especialidades</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:8px;">' +
          SPECIALTIES.map(function (s) {
            var on = formData.specialties.indexOf(s.id) !== -1;
            return '<button class="badge" data-spec="' + s.id + '" style="cursor:pointer;font-size:0.9rem;padding:8px 14px;background:' +
              (on ? 'rgba(30,64,175,0.4)' : 'rgba(255,255,255,0.06)') + ';color:' + (on ? 'white' : 'var(--text-secondary)') +
              ';border:2px solid ' + (on ? 'var(--primary)' : 'transparent') + ';">' + s.label + '</button>';
          }).join('') +
        '</div>' +
      '</div>' +
      '<div class="flex gap-2 mt-4">' +
        '<button class="btn btn-ghost" id="ob-back">Voltar</button>' +
        '<button class="btn btn-primary" id="ob-finish" ' + (formData.specialties.length ? '' : 'disabled') + '>Finalizar</button>' +
      '</div>';
  }

  function optionTag(value, label, current) {
    return '<option value="' + value + '"' + (value === current ? ' selected' : '') + '>' + label + '</option>';
  }

  function wire() {
    var nextBtn = document.getElementById('ob-next');
    var backBtn = document.getElementById('ob-back');
    var finishBtn = document.getElementById('ob-finish');

    if (step === 1 && nextBtn) {
      nextBtn.addEventListener('click', function () {
        var name = document.getElementById('ob-name').value.trim();
        var phone = document.getElementById('ob-phone').value.trim();
        if (!name) { window.showNotification('Atenção', 'Informe seu nome', 'warning'); return; }
        formData.displayName = name;
        formData.phone = phone;
        step = 2;
        window.routerRender();
      });
    }

    if (step === 2) {
      document.querySelectorAll('[data-role]').forEach(function (el) {
        el.addEventListener('click', function () {
          formData.role = el.dataset.role;
          window.routerRender();
        });
      });
      if (backBtn) backBtn.addEventListener('click', function () { step = 1; window.routerRender(); });
      if (nextBtn) nextBtn.addEventListener('click', function () {
        if (!formData.role) return;
        step = 3;
        window.routerRender();
      });
    }

    if (step === 3) {
      if (backBtn) backBtn.addEventListener('click', function () { step = 2; window.routerRender(); });

      if (formData.role === 'provider') {
        document.querySelectorAll('[data-spec]').forEach(function (el) {
          el.addEventListener('click', function () {
            var id = el.dataset.spec;
            var idx = formData.specialties.indexOf(id);
            if (idx === -1) formData.specialties.push(id);
            else formData.specialties.splice(idx, 1);
            window.routerRender();
          });
        });
      }

      if (finishBtn) finishBtn.addEventListener('click', handleFinish);
    }
  }

  async function handleFinish() {
    var u = window.AppStore.currentUser;
    if (!u) return;

    // Read current values from the DOM (in case user typed without triggering oninput)
    if (formData.role === 'admin') {
      var orgNameEl = document.getElementById('ob-org-name');
      var orgTypeEl = document.getElementById('ob-org-type');
      if (orgNameEl) formData.orgName = (orgNameEl.value || '').trim();
      if (orgTypeEl) formData.orgType = orgTypeEl.value || 'lojas';
      if (!formData.orgName) {
        window.showNotification('Atenção', 'Informe o nome da organização', 'warning');
        return;
      }
    }

    window.showLoading('Configurando sua conta…');
    try {
      var userPatch = {
        displayName: formData.displayName,
        phone: formData.phone || null,
        isAdmin: formData.role === 'admin',
        isManager: formData.role === 'manager',
        isProvider: formData.role === 'provider'
      };
      await window.AppStore.saveUserDoc(u.uid, userPatch);

      if (formData.role === 'admin' && formData.orgName) {
        var orgId = await window.AppStore.createOrganization({
          name: formData.orgName.trim(),
          type: formData.orgType
        });
        userPatch.defaultOrgId = orgId;
        await window.AppStore.saveUserDoc(u.uid, { defaultOrgId: orgId });
      }

      if (formData.role === 'provider') {
        await window.AppStore.saveProviderProfile(u.uid, {
          uid: u.uid,
          displayName: formData.displayName,
          photoURL: u.photoURL || null,
          specialties: formData.specialties.slice(),
          serviceRegions: [],
          rating: 0,
          reviewCount: 0,
          bio: '',
          availability: ''
        });
      }

      // refresh local user
      Object.assign(window.AppStore.currentUser, userPatch, { userDocLoaded: true });

      step = 1; // reset for next time
      formData = { displayName: '', phone: '', role: null, orgName: '', orgType: 'lojas', specialties: [] };

      window.hideLoading();
      window.showNotification('Pronto!', 'Conta configurada. Bem-vindo ao fixou.app.', 'success');
      window.location.hash = '#dashboard';
    } catch (err) {
      window.hideLoading();
      console.error('[onboarding] finish error:', err);
      window.showNotification('Erro', err.message || 'Não foi possível finalizar.', 'error');
    }
  }

  console.log('[fixou.app] onboarding.js loaded');
})();
