// fixou.app — Login / Landing page

(function () {
  'use strict';

  var emailMode = 'signin'; // 'signin' | 'signup' | 'reset'
  var _emailSectionVisible = false;

  window.renderLogin = function (container) {
    _emailSectionVisible = false;
    emailMode = 'signin';
    container.innerHTML = buildLandingPage();
    wire(container);
  };

  // ── Landing page HTML ─────────────────────────────────────────────────────────

  function buildLandingPage() {
    return '' +
      '<style>' +
      '.lp-hero{background:linear-gradient(160deg,#0a0e1a 0%,#1e3a8a 55%,#2563eb 100%);' +
              'padding:72px 24px 48px;text-align:center;margin:-24px -16px 0;}' +
      '.lp-logo-icon{font-size:4rem;display:block;margin-bottom:14px;' +
                    'filter:drop-shadow(0 4px 12px rgba(0,0,0,0.5));}' +
      '.lp-title{font-size:2.6rem;font-weight:900;margin-bottom:10px;' +
                'background:linear-gradient(90deg,#bfdbfe,#f0f9ff);' +
                '-webkit-background-clip:text;-webkit-text-fill-color:transparent;' +
                'background-clip:text;}' +
      '.lp-subtitle{color:rgba(255,255,255,0.72);font-size:1.05rem;' +
                   'max-width:440px;margin:0 auto 28px;line-height:1.6;}' +
      '.lp-pills{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-bottom:36px;}' +
      '.lp-pill{background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);' +
               'border-radius:999px;padding:6px 16px;font-size:0.82rem;color:rgba(255,255,255,0.9);}' +
      '.lp-google-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;' +
                     'background:white;color:#1f2937;border:none;border-radius:10px;' +
                     'padding:14px 28px;font-size:1rem;font-weight:700;cursor:pointer;' +
                     'transition:transform 0.15s,box-shadow 0.15s;width:100%;max-width:360px;' +
                     'box-shadow:0 2px 12px rgba(0,0,0,0.45);}' +
      '.lp-google-btn:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.55);}' +
      '.lp-email-toggle{display:block;margin:16px auto 0;color:rgba(255,255,255,0.5);' +
                       'font-size:0.88rem;background:none;border:none;cursor:pointer;}' +
      '.lp-email-toggle:hover{color:rgba(255,255,255,0.88);text-decoration:underline;}' +
      '.lp-email-section{background:var(--bg-card);border-top:1px solid var(--border);' +
                        'padding:32px 24px;margin:0 -16px;}' +
      '.lp-email-inner{max-width:360px;margin:0 auto;}' +
      '.lp-features{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));' +
                   'gap:16px;padding:32px 16px;max-width:860px;margin:0 auto;}' +
      '.lp-feat-card{background:var(--bg-card);border:1px solid var(--border);' +
                    'border-radius:16px;padding:24px;}' +
      '.lp-feat-icon{font-size:2rem;margin-bottom:10px;display:block;}' +
      '.lp-feat-title{font-size:1rem;font-weight:700;margin-bottom:6px;}' +
      '.lp-feat-desc{font-size:0.88rem;color:var(--text-muted);line-height:1.55;}' +
      '.lp-footer{text-align:center;padding:16px 24px 32px;font-size:0.8rem;color:var(--text-dim);}' +
      '</style>' +

      // ── Hero ──────────────────────────────────────────────────────────────────
      '<div class="lp-hero">' +
        '<span class="lp-logo-icon">🔧</span>' +
        '<h1 class="lp-title">fixou.app</h1>' +
        '<p class="lp-subtitle">Gestão de manutenção para lojas, condomínios, clubes e muito mais</p>' +
        '<div class="lp-pills">' +
          '<span class="lp-pill">📋 Chamados centralizados</span>' +
          '<span class="lp-pill">🏢 Multi-organização</span>' +
          '<span class="lp-pill">🛠️ Prestadores qualificados</span>' +
        '</div>' +
        '<button class="lp-google-btn" id="lp-google-btn">' +
          '<svg width="20" height="20" viewBox="0 0 48 48" fill="none" ' +
               'xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 ' +
                     '13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 ' +
                     '24s9.4 21 21 21c10.5 0 20-7.5 20-21 0-1.4-.2-2.7-.5-4z" fill="#FFC107"/>' +
            '<path d="M6.3 14.7l7 5.1C15.2 16.1 19.2 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4' +
                     'C34.6 5.1 29.6 3 24 3c-7.7 0-14.3 4.7-17.7 11.7z" fill="#FF3D00"/>' +
            '<path d="M24 45c5.5 0 10.5-2 14.3-5.4l-6.6-5.6C29.7 35.7 27 36.7 24 36.7c-6 0-10.6' +
                     '-3.9-11.9-9.3l-7 5.4C8.1 40.4 15.5 45 24 45z" fill="#4CAF50"/>' +
            '<path d="M44.5 20H24v8.5h11.8c-.7 2.2-2 4.1-3.9 5.4l6.6 5.6C42.4 36.1 45 30.5 45 ' +
                     '24c0-1.4-.2-2.7-.5-4z" fill="#1976D2"/>' +
          '</svg>' +
          'Continuar com Google' +
        '</button>' +
        '<button class="lp-email-toggle" id="lp-email-toggle">Entrar com email</button>' +
      '</div>' +

      // ── Email section (hidden by default) ────────────────────────────────────
      '<div class="lp-email-section" id="lp-email-section" style="display:none;">' +
        '<div class="lp-email-inner">' +
          '<div id="lp-email-form">' + buildEmailForm() + '</div>' +
        '</div>' +
      '</div>' +

      // ── Feature cards ─────────────────────────────────────────────────────────
      '<div class="lp-features">' +
        '<div class="lp-feat-card">' +
          '<span class="lp-feat-icon">📋</span>' +
          '<div class="lp-feat-title">Pendências centralizadas</div>' +
          '<div class="lp-feat-desc">Todas as solicitações de manutenção em um único lugar, ' +
            'organizadas por prioridade e status — do aberto ao aprovado.</div>' +
        '</div>' +
        '<div class="lp-feat-card">' +
          '<span class="lp-feat-icon">🏢</span>' +
          '<div class="lp-feat-title">Por organização e unidade</div>' +
          '<div class="lp-feat-desc">Gerencie múltiplos imóveis, lojas ou unidades com controle ' +
            'total sobre cada espaço, com histórico completo.</div>' +
        '</div>' +
        '<div class="lp-feat-card">' +
          '<span class="lp-feat-icon">🛠️</span>' +
          '<div class="lp-feat-title">Prestadores qualificados</div>' +
          '<div class="lp-feat-desc">Conecte com prestadores de serviço e acompanhe cada etapa ' +
            'da execução — da atribuição à confirmação de conclusão.</div>' +
        '</div>' +
      '</div>' +

      '<div class="lp-footer">© ' + new Date().getFullYear() + ' fixou.app · Todos os direitos reservados</div>';
  }

  // ── Email form ────────────────────────────────────────────────────────────────

  function buildEmailForm() {
    if (emailMode === 'signin') {
      return '' +
        '<h3 style="margin-bottom:16px;font-size:1.05rem;font-weight:700;">Entrar com email</h3>' +
        '<div class="form-group">' +
          '<label class="form-label" for="login-email">Email</label>' +
          '<input type="email" id="login-email" autocomplete="email" placeholder="seu@email.com">' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label" for="login-password">Senha</label>' +
          '<input type="password" id="login-password" autocomplete="current-password">' +
        '</div>' +
        '<button class="btn btn-primary btn-block" id="email-submit">Entrar</button>' +
        '<div style="display:flex;justify-content:space-between;margin-top:10px;font-size:0.85rem;">' +
          '<button class="btn-ghost" id="switch-signup" style="padding:4px;">Criar conta</button>' +
          '<button class="btn-ghost" id="switch-reset" style="padding:4px;">Esqueci a senha</button>' +
        '</div>';
    }
    if (emailMode === 'signup') {
      return '' +
        '<h3 style="margin-bottom:16px;font-size:1.05rem;font-weight:700;">Criar conta</h3>' +
        '<div class="form-group">' +
          '<label class="form-label" for="signup-name">Nome</label>' +
          '<input type="text" id="signup-name" autocomplete="name" placeholder="Como prefere ser chamado">' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label" for="signup-email">Email</label>' +
          '<input type="email" id="signup-email" autocomplete="email" placeholder="seu@email.com">' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label" for="signup-password">Senha</label>' +
          '<input type="password" id="signup-password" autocomplete="new-password" ' +
            'placeholder="Mínimo 6 caracteres">' +
        '</div>' +
        '<button class="btn btn-primary btn-block" id="email-submit">Criar conta</button>' +
        '<div style="display:flex;justify-content:center;margin-top:10px;font-size:0.85rem;">' +
          '<button class="btn-ghost" id="switch-signin" style="padding:4px;">Já tenho conta</button>' +
        '</div>';
    }
    // reset
    return '' +
      '<h3 style="margin-bottom:16px;font-size:1.05rem;font-weight:700;">Recuperar senha</h3>' +
      '<div class="form-group">' +
        '<label class="form-label" for="reset-email">Email</label>' +
        '<input type="email" id="reset-email" autocomplete="email" placeholder="seu@email.com">' +
      '</div>' +
      '<button class="btn btn-primary btn-block" id="email-submit">Enviar link de recuperação</button>' +
      '<div style="display:flex;justify-content:center;margin-top:10px;font-size:0.85rem;">' +
        '<button class="btn-ghost" id="switch-signin" style="padding:4px;">Voltar ao login</button>' +
      '</div>';
  }

  // ── Wiring ────────────────────────────────────────────────────────────────────

  function wire(container) {
    var googleBtn = document.getElementById('lp-google-btn');
    if (googleBtn) {
      googleBtn.addEventListener('click', function () {
        window.signInWithGoogle();
      });
    }

    var emailToggle = document.getElementById('lp-email-toggle');
    if (emailToggle) {
      emailToggle.addEventListener('click', function () {
        _emailSectionVisible = !_emailSectionVisible;
        var section = document.getElementById('lp-email-section');
        if (section) {
          section.style.display = _emailSectionVisible ? 'block' : 'none';
          if (_emailSectionVisible) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
        emailToggle.textContent = _emailSectionVisible ? 'Ocultar email' : 'Entrar com email';
      });
    }

    wireEmailForm();
  }

  function wireEmailForm() {
    var submitBtn = document.getElementById('email-submit');
    if (submitBtn) submitBtn.addEventListener('click', handleEmailSubmit);

    var switchSignup = document.getElementById('switch-signup');
    if (switchSignup) switchSignup.addEventListener('click', function () {
      emailMode = 'signup'; rerenderEmailForm();
    });

    var switchSignin = document.getElementById('switch-signin');
    if (switchSignin) switchSignin.addEventListener('click', function () {
      emailMode = 'signin'; rerenderEmailForm();
    });

    var switchReset = document.getElementById('switch-reset');
    if (switchReset) switchReset.addEventListener('click', function () {
      emailMode = 'reset'; rerenderEmailForm();
    });
  }

  function rerenderEmailForm() {
    var slot = document.getElementById('lp-email-form');
    if (slot) {
      slot.innerHTML = buildEmailForm();
      wireEmailForm();
    }
  }

  function handleEmailSubmit() {
    if (emailMode === 'signin') {
      var email = document.getElementById('login-email').value.trim();
      var pwd = document.getElementById('login-password').value;
      if (!email || !pwd) {
        window.showNotification('Atenção', 'Preencha email e senha', 'warning');
        return;
      }
      window.showLoading('Entrando…');
      window.signInWithEmail(email, pwd).finally(window.hideLoading);
    } else if (emailMode === 'signup') {
      var name = document.getElementById('signup-name').value.trim();
      var em   = document.getElementById('signup-email').value.trim();
      var pw   = document.getElementById('signup-password').value;
      if (!name || !em || !pw) {
        window.showNotification('Atenção', 'Preencha todos os campos', 'warning');
        return;
      }
      if (pw.length < 6) {
        window.showNotification('Atenção', 'Senha precisa ter pelo menos 6 caracteres', 'warning');
        return;
      }
      window.showLoading('Criando conta…');
      window.signUpWithEmail(em, pw, name).finally(window.hideLoading);
    } else if (emailMode === 'reset') {
      var re = document.getElementById('reset-email').value.trim();
      if (!re) {
        window.showNotification('Atenção', 'Informe seu email', 'warning');
        return;
      }
      window.sendPasswordReset(re).then(function () {
        emailMode = 'signin';
        rerenderEmailForm();
      });
    }
  }

  console.log('[fixou.app] login.js loaded');
})();
