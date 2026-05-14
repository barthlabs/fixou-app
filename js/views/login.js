// fixou.app — Login / Landing page
// Visual e fluxo inspirados no scoreplace.app

(function () {
  'use strict';

  var _emailMode = 'signin'; // 'signin' | 'signup' | 'reset'

  window.renderLogin = function (container) {
    _emailMode = 'signin';
    container.innerHTML = _buildPage();
    _wire();
  };

  // ── Page shell ────────────────────────────────────────────────────────────────

  function _buildPage() {
    return (
      '<style>' +
      '.lp-wrap{min-height:calc(100vh - var(--topbar-h,0px));display:flex;align-items:center;justify-content:center;padding:24px 16px;background:var(--bg-darkest);}' +
      '.lp-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);width:100%;max-width:420px;overflow:hidden;}' +
      '.lp-head{background:linear-gradient(160deg,#0a0e1a 0%,#1e3a8a 60%,#2563eb 100%);padding:32px 24px 24px;text-align:center;}' +
      '.lp-logo{font-size:3rem;display:block;margin-bottom:10px;filter:drop-shadow(0 4px 10px rgba(0,0,0,0.5));}' +
      '.lp-title{font-size:1.7rem;font-weight:900;background:linear-gradient(90deg,#bfdbfe,#f0f9ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:4px;}' +
      '.lp-sub{color:rgba(255,255,255,0.65);font-size:0.85rem;}' +
      '.lp-body{padding:24px;}' +
      '.lp-section-label{font-size:0.72rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;}' +
      '.lp-google-btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;background:#fff;color:#1f2937;border:none;border-radius:var(--radius);padding:13px 20px;font-size:0.9rem;font-weight:700;cursor:pointer;transition:transform .15s,box-shadow .15s;box-shadow:0 2px 10px rgba(0,0,0,0.35);}' +
      '.lp-google-btn:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,0.45);}' +
      '.lp-divider{display:flex;align-items:center;gap:12px;margin:18px 0;}' +
      '.lp-divider::before,.lp-divider::after{content:"";flex:1;height:1px;background:var(--border);}' +
      '.lp-divider span{color:var(--text-dim);font-size:0.7rem;}' +
      '.lp-mode-tabs{display:flex;gap:0;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;margin-bottom:14px;}' +
      '.lp-tab{flex:1;padding:8px 4px;font-size:0.78rem;font-weight:600;border:none;background:transparent;color:var(--text-muted);cursor:pointer;transition:background .15s,color .15s;}' +
      '.lp-tab.active{background:var(--primary);color:#fff;}' +
      '.lp-tab:not(.active):hover{background:var(--bg-card-hover);color:var(--text-primary);}' +
      '.lp-form-group{margin-bottom:10px;}' +
      '.lp-label{font-size:0.75rem;color:var(--text-secondary);margin-bottom:4px;display:block;}' +
      '.lp-input{width:100%;background:var(--bg-input);border:1px solid var(--border-strong);border-radius:var(--radius-sm);padding:10px 12px;font-size:0.88rem;color:var(--text-primary);outline:none;transition:border-color .15s;box-sizing:border-box;}' +
      '.lp-input:focus{border-color:var(--primary-light);}' +
      '.lp-btn-primary{width:100%;background:var(--primary);color:#fff;border:none;border-radius:var(--radius);padding:12px;font-size:0.9rem;font-weight:700;cursor:pointer;transition:background .15s,transform .1s;}' +
      '.lp-btn-primary:hover{background:var(--primary-hover);transform:translateY(-1px);}' +
      '.lp-links{display:flex;justify-content:center;gap:16px;margin-top:10px;font-size:0.75rem;}' +
      '.lp-links a{color:var(--text-muted);cursor:pointer;text-decoration:none;}' +
      '.lp-links a:hover{color:var(--primary-light);text-decoration:underline;}' +
      '.lp-terms{margin-top:16px;padding-top:14px;border-top:1px solid var(--border);font-size:0.68rem;color:var(--text-dim);text-align:center;line-height:1.5;}' +
      '.lp-terms a{color:var(--text-muted);}' +
      '.lp-terms a:hover{color:var(--primary-light);}' +
      '</style>' +

      '<div class="lp-wrap">' +
        '<div class="lp-card">' +

          // ── Header ──
          '<div class="lp-head">' +
            '<span class="lp-logo">🔧</span>' +
            '<div class="lp-title">fixou.app</div>' +
            '<div class="lp-sub">Gestão de manutenção simplificada</div>' +
          '</div>' +

          // ── Body ──
          '<div class="lp-body">' +

            // Google CTA
            '<div class="lp-section-label">Entrar com</div>' +
            '<button class="lp-google-btn" id="lp-google-btn">' +
              '<svg width="18" height="18" viewBox="0 0 48 48">' +
                '<path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>' +
                '<path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>' +
                '<path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 0 0 0 24c0 3.77.9 7.34 2.44 10.5l8.09-5.91z"/>' +
                '<path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>' +
              '</svg>' +
              'Continuar com Google' +
            '</button>' +

            // Divider
            '<div class="lp-divider"><span>ou</span></div>' +

            // Mode tabs: Entrar / Criar conta / Recuperar
            '<div class="lp-mode-tabs">' +
              '<button class="lp-tab active" id="lp-tab-signin" onclick="window._lpSetMode(\'signin\')">Entrar</button>' +
              '<button class="lp-tab" id="lp-tab-signup" onclick="window._lpSetMode(\'signup\')">Criar conta</button>' +
              '<button class="lp-tab" id="lp-tab-reset" onclick="window._lpSetMode(\'reset\')">Recuperar senha</button>' +
            '</div>' +

            // Email form container
            '<div id="lp-email-form">' + _buildEmailForm() + '</div>' +

            // Terms
            '<div class="lp-terms">' +
              'Ao continuar, você concorda com os ' +
              '<a href="#">Termos de Uso</a>' +
              ' e a ' +
              '<a href="#">Política de Privacidade</a>.' +
            '</div>' +

          '</div>' + // .lp-body
        '</div>' + // .lp-card
      '</div>' // .lp-wrap
    );
  }

  // ── Email form (by mode) ──────────────────────────────────────────────────────

  function _buildEmailForm() {
    if (_emailMode === 'signin') {
      return (
        '<form id="lp-form" novalidate onsubmit="event.preventDefault(); window._lpSubmit();">' +
          '<div class="lp-form-group">' +
            '<label class="lp-label" for="lp-email">E-mail</label>' +
            '<input class="lp-input" type="email" id="lp-email" autocomplete="email" placeholder="seu@email.com" required>' +
          '</div>' +
          '<div class="lp-form-group">' +
            '<label class="lp-label" for="lp-password">Senha</label>' +
            '<input class="lp-input" type="password" id="lp-password" autocomplete="current-password" placeholder="••••••••" required>' +
          '</div>' +
          '<button class="lp-btn-primary" type="submit">Entrar</button>' +
          '<div class="lp-links">' +
            '<a onclick="window._lpSetMode(\'signup\')">Criar conta</a>' +
            '<a onclick="window._lpSetMode(\'reset\')">Esqueci a senha</a>' +
          '</div>' +
        '</form>'
      );
    }

    if (_emailMode === 'signup') {
      return (
        '<form id="lp-form" novalidate onsubmit="event.preventDefault(); window._lpSubmit();">' +
          '<div class="lp-form-group">' +
            '<label class="lp-label" for="lp-name">Nome</label>' +
            '<input class="lp-input" type="text" id="lp-name" autocomplete="name" placeholder="Como prefere ser chamado" required>' +
          '</div>' +
          '<div class="lp-form-group">' +
            '<label class="lp-label" for="lp-email">E-mail</label>' +
            '<input class="lp-input" type="email" id="lp-email" autocomplete="email" placeholder="seu@email.com" required>' +
          '</div>' +
          '<div class="lp-form-group">' +
            '<label class="lp-label" for="lp-password">Senha</label>' +
            '<input class="lp-input" type="password" id="lp-password" autocomplete="new-password" placeholder="Mínimo 6 caracteres" required minlength="6">' +
          '</div>' +
          '<button class="lp-btn-primary" type="submit">Criar conta</button>' +
          '<div class="lp-links">' +
            '<a onclick="window._lpSetMode(\'signin\')">Já tenho conta</a>' +
          '</div>' +
        '</form>'
      );
    }

    // reset
    return (
      '<form id="lp-form" novalidate onsubmit="event.preventDefault(); window._lpSubmit();">' +
        '<div class="lp-form-group">' +
          '<label class="lp-label" for="lp-email">E-mail</label>' +
          '<input class="lp-input" type="email" id="lp-email" autocomplete="email" placeholder="seu@email.com" required>' +
        '</div>' +
        '<button class="lp-btn-primary" type="submit">Enviar link de recuperação</button>' +
        '<div class="lp-links">' +
          '<a onclick="window._lpSetMode(\'signin\')">Voltar ao login</a>' +
        '</div>' +
      '</form>'
    );
  }

  // ── Mode switch ───────────────────────────────────────────────────────────────

  window._lpSetMode = function (mode) {
    _emailMode = mode;

    // Update tabs
    ['signin', 'signup', 'reset'].forEach(function (m) {
      var tab = document.getElementById('lp-tab-' + m);
      if (tab) tab.classList.toggle('active', m === mode);
    });

    // Re-render form
    var slot = document.getElementById('lp-email-form');
    if (slot) slot.innerHTML = _buildEmailForm();
  };

  // ── Submit handler ────────────────────────────────────────────────────────────

  window._lpSubmit = function () {
    if (_emailMode === 'signin') {
      var email = (document.getElementById('lp-email') || {}).value.trim();
      var pwd   = (document.getElementById('lp-password') || {}).value;
      if (!email || !pwd) {
        window.showNotification('Atenção', 'Preencha e-mail e senha', 'warning');
        return;
      }
      window.showLoading('Entrando…');
      window.signInWithEmail(email, pwd).finally(window.hideLoading);

    } else if (_emailMode === 'signup') {
      var name = (document.getElementById('lp-name') || {}).value.trim();
      var em   = (document.getElementById('lp-email') || {}).value.trim();
      var pw   = (document.getElementById('lp-password') || {}).value;
      if (!name || !em || !pw) {
        window.showNotification('Atenção', 'Preencha todos os campos', 'warning');
        return;
      }
      if (pw.length < 6) {
        window.showNotification('Atenção', 'A senha precisa ter pelo menos 6 caracteres', 'warning');
        return;
      }
      window.showLoading('Criando conta…');
      window.signUpWithEmail(em, pw, name).finally(window.hideLoading);

    } else if (_emailMode === 'reset') {
      var re = (document.getElementById('lp-email') || {}).value.trim();
      if (!re) {
        window.showNotification('Atenção', 'Informe seu e-mail', 'warning');
        return;
      }
      window.sendPasswordReset(re).then(function () {
        window._lpSetMode('signin');
      });
    }
  };

  // ── Wire events ───────────────────────────────────────────────────────────────

  function _wire() {
    var googleBtn = document.getElementById('lp-google-btn');
    if (googleBtn) {
      googleBtn.addEventListener('click', function () {
        window.signInWithGoogle();
      });
    }
  }

  console.log('[fixou.app] login.js loaded');
})();
