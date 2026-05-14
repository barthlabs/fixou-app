// fixou.app — Login / Landing page

(function () {
  'use strict';

  var _emailMode = 'signin'; // 'signin' | 'signup' | 'reset'
  var _lpStep    = 'unified'; // 'unified' | 'email-sent' | 'sms-code'
  var _lpSentEmail = '';
  var _lpSentPhone = '';

  window.renderLogin = function (container) {
    _emailMode   = 'signin';
    _lpStep      = 'unified';
    _lpSentEmail = '';
    _lpSentPhone = '';
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

      /* ── Unified row ── */
      '.lp-unified-row{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;margin-bottom:6px;}' +
      '.lp-unified-row.has-ddi{grid-template-columns:auto 1fr auto;}' +
      '.lp-ddi-select{background:var(--bg-input);border:1px solid var(--border-strong);border-radius:var(--radius-sm);padding:10px 8px;font-size:0.88rem;color:var(--text-primary);outline:none;cursor:pointer;white-space:nowrap;}' +
      '.lp-input{width:100%;background:var(--bg-input);border:1px solid var(--border-strong);border-radius:var(--radius-sm);padding:10px 12px;font-size:0.88rem;color:var(--text-primary);outline:none;transition:border-color .15s;box-sizing:border-box;}' +
      '.lp-input:focus{border-color:var(--primary-light);}' +
      '.lp-btn-send{background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;border:none;border-radius:var(--radius-sm);padding:10px 18px;font-size:0.85rem;font-weight:700;cursor:pointer;white-space:nowrap;transition:opacity .15s;}' +
      '.lp-btn-send:hover{opacity:.88;}' +
      '.lp-btn-send:disabled{opacity:.5;cursor:not-allowed;}' +
      '.lp-helper{font-size:0.72rem;color:var(--text-dim);margin-bottom:4px;line-height:1.4;}' +

      /* ── Panels ── */
      '.lp-panel{background:rgba(37,99,235,0.07);border:1px solid rgba(37,99,235,0.25);border-radius:var(--radius);padding:16px;margin-bottom:4px;}' +
      '.lp-panel-icon{font-size:1.8rem;display:block;margin-bottom:8px;}' +
      '.lp-panel-title{font-size:0.95rem;font-weight:700;color:var(--text-primary);margin-bottom:4px;}' +
      '.lp-panel-sub{font-size:0.78rem;color:var(--text-secondary);margin-bottom:12px;line-height:1.5;}' +
      '.lp-panel-links{display:flex;gap:16px;font-size:0.74rem;}' +
      '.lp-panel-links a{color:var(--primary-light);cursor:pointer;text-decoration:underline;}' +
      '.lp-code-row{display:grid;grid-template-columns:1fr auto;gap:8px;margin-bottom:10px;}' +
      '.lp-code-input{background:var(--bg-input);border:1px solid var(--border-strong);border-radius:var(--radius-sm);padding:12px;font-size:1.1rem;font-weight:700;letter-spacing:.25em;color:var(--text-primary);outline:none;text-align:center;box-sizing:border-box;}' +
      '.lp-code-input:focus{border-color:var(--primary-light);}' +
      '.lp-btn-verify{background:linear-gradient(135deg,#059669,#047857);color:#fff;border:none;border-radius:var(--radius-sm);padding:12px 20px;font-size:0.88rem;font-weight:700;cursor:pointer;transition:opacity .15s;}' +
      '.lp-btn-verify:hover{opacity:.88;}' +

      /* ── Google ── */
      '.lp-google-btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;background:#fff;color:#1f2937;border:none;border-radius:var(--radius);padding:13px 20px;font-size:0.9rem;font-weight:700;cursor:pointer;transition:transform .15s,box-shadow .15s;box-shadow:0 2px 10px rgba(0,0,0,0.35);}' +
      '.lp-google-btn:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,0.45);}' +

      /* ── Divider ── */
      '.lp-divider{display:flex;align-items:center;gap:12px;margin:18px 0;}' +
      '.lp-divider::before,.lp-divider::after{content:"";flex:1;height:1px;background:var(--border);}' +
      '.lp-divider span{color:var(--text-dim);font-size:0.7rem;}' +

      /* ── Email/password tabs ── */
      '.lp-mode-tabs{display:flex;gap:0;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;margin-bottom:14px;}' +
      '.lp-tab{flex:1;padding:8px 4px;font-size:0.78rem;font-weight:600;border:none;background:transparent;color:var(--text-muted);cursor:pointer;transition:background .15s,color .15s;}' +
      '.lp-tab.active{background:var(--primary);color:#fff;}' +
      '.lp-tab:not(.active):hover{background:var(--bg-card-hover);color:var(--text-primary);}' +
      '.lp-form-group{margin-bottom:10px;}' +
      '.lp-label{font-size:0.75rem;color:var(--text-secondary);margin-bottom:4px;display:block;}' +
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

            // === UNIFIED INPUT — always visible until step changes ===
            '<div id="lp-unified-section">' +
              '<div class="lp-section-label">Entrar com 1 clique</div>' +
              '<div class="lp-unified-row" id="lp-unified-row">' +
                '<input class="lp-input" type="text" id="lp-unified-input"' +
                  ' autocomplete="email" placeholder="E-mail ou celular com DDD" autocorrect="off"' +
                  ' autocapitalize="none" spellcheck="false"' +
                  ' oninput="window._lpDetectInputMode()"' +
                  ' onkeydown="if(event.key===\'Enter\')window._lpSendUnified()">' +
                '<button class="lp-btn-send" id="lp-unified-btn" onclick="window._lpSendUnified()">Enviar</button>' +
              '</div>' +
              '<p class="lp-helper" id="lp-helper-text">Aceita e-mail (link mágico) ou celular com DDD (código SMS). Para celular, o seletor de país aparece automaticamente — padrão 🇧🇷 +55.</p>' +
            '</div>' +

            // === EMAIL SENT PANEL (hidden initially) ===
            '<div id="lp-email-sent-panel" hidden>' +
              '<div class="lp-panel">' +
                '<span class="lp-panel-icon">📬</span>' +
                '<div class="lp-panel-title">Link enviado!</div>' +
                '<div class="lp-panel-sub" id="lp-email-sent-sub">Verifique seu e-mail e clique no link para entrar. Cheque também a pasta de spam.</div>' +
                '<div class="lp-panel-links">' +
                  '<a onclick="window._lpResendMagicLink()">Reenviar link</a>' +
                  '<a onclick="window._lpBackToUnified()">Usar outro método</a>' +
                '</div>' +
              '</div>' +
            '</div>' +

            // === SMS CODE PANEL (hidden initially) ===
            '<div id="lp-sms-panel" hidden>' +
              '<div class="lp-panel">' +
                '<span class="lp-panel-icon">📱</span>' +
                '<div class="lp-panel-title">Código enviado</div>' +
                '<div class="lp-panel-sub" id="lp-sms-sub">Digite o código de 6 dígitos enviado por SMS.</div>' +
                '<div class="lp-code-row">' +
                  '<input class="lp-code-input" type="tel" id="lp-sms-code" maxlength="6" placeholder="000000"' +
                    ' oninput="this.value=this.value.replace(/[^0-9]/g,\'\')"' +
                    ' onkeydown="if(event.key===\'Enter\')window._lpVerifyCode()">' +
                  '<button class="lp-btn-verify" onclick="window._lpVerifyCode()">Verificar</button>' +
                '</div>' +
                '<div class="lp-panel-links">' +
                  '<a onclick="window._lpResendSMS()">Reenviar SMS</a>' +
                  '<a onclick="window._lpBackToUnified()">Usar outro método</a>' +
                '</div>' +
              '</div>' +
            '</div>' +

            // ── Divider ──
            '<div class="lp-divider"><span>ou</span></div>' +

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

            // ── Divider ──
            '<div class="lp-divider"><span>ou com e-mail e senha</span></div>' +

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
      '</div>' + // .lp-wrap

      // reCAPTCHA (invisible) — must be in DOM before sendPhoneSMS
      '<div id="recaptcha-container"></div>'
    );
  }

  // ── Email/password form (by mode) ─────────────────────────────────────────────

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

  // ── Unified input: auto-detect email vs phone ────────────────────────────────

  window._lpDetectInputMode = function () {
    var input = document.getElementById('lp-unified-input');
    var row   = document.getElementById('lp-unified-row');
    if (!input || !row) return;

    var val    = input.value;
    var digits = val.replace(/\D/g, '');
    var isPhone = digits.length >= 8 && !val.includes('@');

    var ddiWrap = document.getElementById('lp-ddi-wrap');

    if (isPhone) {
      // Show DDI selector
      if (!ddiWrap) {
        ddiWrap = _buildDDISelect();
        row.insertBefore(ddiWrap, input);
      }
      row.className = 'lp-unified-row has-ddi';
    } else {
      // Hide DDI selector
      if (ddiWrap) { ddiWrap.remove(); }
      row.className = 'lp-unified-row';
    }
  };

  function _buildDDISelect() {
    var wrap = document.createElement('div');
    wrap.id = 'lp-ddi-wrap';
    var sel = document.createElement('select');
    sel.id = 'lp-ddi';
    sel.className = 'lp-ddi-select';
    var countries = [
      { label: '🇧🇷 +55', value: '+55' },
      { label: '🇺🇸 +1',  value: '+1'  },
      { label: '🇵🇹 +351', value: '+351'},
      { label: '🇦🇷 +54', value: '+54' },
      { label: '🇲🇽 +52', value: '+52' },
      { label: '🇪🇸 +34', value: '+34' }
    ];
    countries.forEach(function (c) {
      var opt = document.createElement('option');
      opt.value = c.value;
      opt.textContent = c.label;
      sel.appendChild(opt);
    });
    wrap.appendChild(sel);
    return wrap;
  }

  // ── Send unified (email → magic link, phone → SMS) ───────────────────────────

  window._lpSendUnified = async function () {
    var input = document.getElementById('lp-unified-input');
    if (!input) return;
    var val = (input.value || '').trim();
    if (!val) {
      window.showNotification('Atenção', 'Informe seu e-mail ou celular', 'warning');
      return;
    }

    var btn = document.getElementById('lp-unified-btn');
    if (btn) btn.disabled = true;

    var digits = val.replace(/\D/g, '');
    var isPhone = digits.length >= 8 && !val.includes('@');

    if (isPhone) {
      // Phone / SMS flow
      var ddiSel = document.getElementById('lp-ddi');
      var ddi    = ddiSel ? ddiSel.value : '+55';
      var phone  = ddi + digits;
      _lpSentPhone = phone;
      window.showLoading('Enviando SMS…');
      try {
        await window.sendPhoneSMS(phone);
        window.hideLoading();
        _lpShowStep('sms-code');
        var sub = document.getElementById('lp-sms-sub');
        if (sub) sub.textContent = 'Digite o código de 6 dígitos enviado para ' + phone + '.';
      } catch (_err) {
        window.hideLoading();
        if (btn) btn.disabled = false;
      }
    } else {
      // Email / magic link flow
      _lpSentEmail = val;
      window.showLoading('Enviando link…');
      try {
        await window.sendMagicLink(val);
        window.hideLoading();
        _lpShowStep('email-sent');
        var sub2 = document.getElementById('lp-email-sent-sub');
        if (sub2) sub2.textContent = 'Verifique o e-mail ' + val + ' e clique no link para entrar. Cheque também a pasta de spam.';
      } catch (_err) {
        window.hideLoading();
        if (btn) btn.disabled = false;
      }
    }
  };

  // ── Verify SMS code ───────────────────────────────────────────────────────────

  window._lpVerifyCode = async function () {
    var codeEl = document.getElementById('lp-sms-code');
    var code   = codeEl ? (codeEl.value || '').trim() : '';
    if (code.length < 6) {
      window.showNotification('Atenção', 'Digite o código de 6 dígitos', 'warning');
      return;
    }
    window.showLoading('Verificando…');
    try {
      await window.confirmPhoneCode(code);
      // onAuthStateChanged in main.js will redirect to dashboard
    } catch (_err) {
      // error notification handled inside confirmPhoneCode
    }
  };

  // ── Resend helpers ────────────────────────────────────────────────────────────

  window._lpResendMagicLink = async function () {
    if (!_lpSentEmail) { window._lpBackToUnified(); return; }
    window.showLoading('Reenviando…');
    try {
      await window.sendMagicLink(_lpSentEmail);
      window.hideLoading();
    } catch (_e) {
      window.hideLoading();
    }
  };

  window._lpResendSMS = async function () {
    if (!_lpSentPhone) { window._lpBackToUnified(); return; }
    window.showLoading('Reenviando SMS…');
    try {
      await window.sendPhoneSMS(_lpSentPhone);
      window.hideLoading();
      var codeEl = document.getElementById('lp-sms-code');
      if (codeEl) codeEl.value = '';
      window.showNotification('SMS reenviado', 'Aguarde o código chegar.', 'success');
    } catch (_e) {
      window.hideLoading();
    }
  };

  // ── Step visibility ───────────────────────────────────────────────────────────

  function _lpShowStep(step) {
    _lpStep = step;
    var unified   = document.getElementById('lp-unified-section');
    var emailSent = document.getElementById('lp-email-sent-panel');
    var smsPanel  = document.getElementById('lp-sms-panel');

    if (unified)   unified.hidden   = (step !== 'unified');
    if (emailSent) emailSent.hidden = (step !== 'email-sent');
    if (smsPanel)  smsPanel.hidden  = (step !== 'sms-code');

    if (step === 'sms-code') {
      setTimeout(function () {
        var c = document.getElementById('lp-sms-code');
        if (c) c.focus();
      }, 80);
    }
  }

  window._lpBackToUnified = function () {
    _lpSentEmail = '';
    _lpSentPhone = '';
    _lpShowStep('unified');
    var btn = document.getElementById('lp-unified-btn');
    if (btn) btn.disabled = false;
    var input = document.getElementById('lp-unified-input');
    if (input) { input.value = ''; input.focus(); }
  };

  // ── Mode switch (email/password tabs) ────────────────────────────────────────

  window._lpSetMode = function (mode) {
    _emailMode = mode;

    ['signin', 'signup', 'reset'].forEach(function (m) {
      var tab = document.getElementById('lp-tab-' + m);
      if (tab) tab.classList.toggle('active', m === mode);
    });

    var slot = document.getElementById('lp-email-form');
    if (slot) slot.innerHTML = _buildEmailForm();
  };

  // ── Email/password submit ─────────────────────────────────────────────────────

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

    // Auto-focus unified input
    setTimeout(function () {
      var inp = document.getElementById('lp-unified-input');
      if (inp) inp.focus();
    }, 80);
  }

  console.log('[fixou.app] login.js loaded');
})();
