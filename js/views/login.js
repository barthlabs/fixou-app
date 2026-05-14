// fixou.app — Login / Landing page
// Layout copiado fielmente do scoreplace.app (setupLoginModal → page completa)

(function () {
  'use strict';

  // ── Utilitários ────────────────────────────────────────────────────────────────

  var _phoneCountries = [
    { code: '55',  flag: '🇧🇷', name: 'Brasil'    },
    { code: '1',   flag: '🇺🇸', name: 'EUA'       },
    { code: '351', flag: '🇵🇹', name: 'Portugal'  },
    { code: '54',  flag: '🇦🇷', name: 'Argentina' },
    { code: '598', flag: '🇺🇾', name: 'Uruguai'   },
    { code: '595', flag: '🇵🇾', name: 'Paraguai'  },
    { code: '56',  flag: '🇨🇱', name: 'Chile'     },
    { code: '57',  flag: '🇨🇴', name: 'Colômbia'  },
    { code: '34',  flag: '🇪🇸', name: 'Espanha'   },
    { code: '44',  flag: '🇬🇧', name: 'UK'        }
  ];

  function _detectInputModeRaw(value) {
    if (!value) return null;
    var v = String(value).trim();
    if (v.indexOf('@') !== -1) return 'email';
    var digits = v.replace(/\D/g, '');
    if (digits.length >= 8 && digits.length <= 15) return 'phone';
    return null;
  }

  // ── Render ─────────────────────────────────────────────────────────────────────

  window.renderLogin = function (container) {
    container.innerHTML = _buildPage();
    _wire();
  };

  function _buildPage() {
    var countryOpts = _phoneCountries.map(function (c) {
      return '<option value="' + c.code + '"' + (c.code === '55' ? ' selected' : '') + '>' +
             c.flag + ' +' + c.code + '</option>';
    }).join('');

    return (
      '<style>' +
      '.lp-wrap{min-height:calc(100vh - var(--topbar-h,0px));display:flex;align-items:center;justify-content:center;padding:24px 16px;background:var(--bg-darkest);}' +
      '.lp-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);width:100%;max-width:420px;overflow:hidden;}' +
      '.lp-head{background:linear-gradient(160deg,#0a0e1a 0%,#1e3a8a 60%,#2563eb 100%);padding:32px 24px 24px;text-align:center;}' +
      '.lp-logo{font-size:3rem;display:block;margin-bottom:10px;filter:drop-shadow(0 4px 10px rgba(0,0,0,0.5));}' +
      '.lp-title{font-size:1.7rem;font-weight:900;background:linear-gradient(90deg,#bfdbfe,#f0f9ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:4px;}' +
      '.lp-sub{color:rgba(255,255,255,0.65);font-size:0.85rem;}' +
      '.lp-body{padding:20px 24px 24px;}' +
      '.lp-fc{width:100%;background:var(--bg-input);border:1px solid var(--border-strong);border-radius:var(--radius-sm);padding:11px 12px;font-size:0.88rem;color:var(--text-primary);outline:none;transition:border-color .15s;box-sizing:border-box;}' +
      '.lp-fc:focus{border-color:var(--primary-light);}' +
      '.lp-label-sm{font-size:0.78rem;font-weight:600;color:var(--text-primary);margin-bottom:6px;}' +
      '.lp-helper{font-size:0.72rem;color:var(--text-muted);margin-top:6px;line-height:1.4;}' +
      '.lp-divider{display:flex;align-items:center;gap:12px;margin:14px 0;}' +
      '.lp-divider::before,.lp-divider::after{content:"";flex:1;height:1px;background:var(--border);}' +
      '.lp-divider span{color:var(--text-dim);font-size:0.7rem;}' +
      '.lp-terms{margin-top:14px;padding-top:12px;border-top:1px solid var(--border);font-size:0.7rem;color:var(--text-muted);text-align:center;line-height:1.5;}' +
      '.lp-terms a{color:var(--primary-light);}' +
      '</style>' +

      '<div class="lp-wrap">' +
        '<div class="lp-card">' +

          // ── Header ──
          '<div class="lp-head">' +
            '<span class="lp-logo">🔧</span>' +
            '<div class="lp-title">fixou.app</div>' +
            '<div class="lp-sub">Gestão de manutenção simplificada</div>' +
          '</div>' +

          '<div class="lp-body" id="lp-body">' +

            // ── 1. Entrar com 1 clique ──────────────────────────────────────
            '<div id="lp-unified-step" style="margin-bottom:4px;">' +
              '<div class="lp-label-sm">✉️📱 Entrar com 1 clique</div>' +
              '<form novalidate onsubmit="event.preventDefault(); window._lpSendUnified();">' +
                '<div id="lp-unified-row" style="display:grid;grid-template-columns:1fr auto;gap:6px;align-items:center;">' +
                  '<select id="lp-unified-country" aria-label="DDI" class="lp-fc"' +
                    ' style="display:none;width:auto;min-width:0;font-size:0.82rem;padding:9px 6px;cursor:pointer;">' +
                    countryOpts +
                  '</select>' +
                  '<input type="text" id="lp-unified" class="lp-fc"' +
                    ' placeholder="seu@email.com  ou  11 99999-8888"' +
                    ' autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false"' +
                    ' oninput="window._lpDetectMode()"' +
                    ' style="width:100%;min-width:0;box-sizing:border-box;font-size:0.92rem;padding:11px 12px;">' +
                  '<button type="submit"' +
                    ' style="background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;border:none;border-radius:var(--radius-sm);padding:9px 16px;font-size:0.78rem;font-weight:700;white-space:nowrap;cursor:pointer;width:auto;justify-self:end;">' +
                    'Enviar' +
                  '</button>' +
                '</div>' +
              '</form>' +
              '<div id="lp-unified-helper" class="lp-helper">' +
                'Aceita <b>e-mail</b> (recebe link mágico) ou <b>celular com DDD</b> (recebe SMS com código). Pra celular, o seletor de país aparece automaticamente — padrão 🇧🇷 +55.' +
              '</div>' +
              // hidden inputs que os handlers leem
              '<input type="hidden" id="lp-email-ml">' +
              '<input type="hidden" id="lp-phone-num">' +
              '<input type="hidden" id="lp-phone-country" value="55">' +
            '</div>' +

            // ── 2. Verificar código SMS (oculto) ─────────────────────────────
            '<div id="lp-sms-code-step" style="display:none;margin-bottom:4px;">' +
              '<div class="lp-label-sm">📱 Confirme o código</div>' +
              '<p style="color:var(--text-muted);font-size:0.78rem;margin-bottom:6px;">Digite o código de 6 dígitos recebido por SMS:</p>' +
              '<form onsubmit="event.preventDefault(); window._lpVerifyCode();">' +
                '<div style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;">' +
                  '<input type="tel" id="lp-sms-code" class="lp-fc"' +
                    ' placeholder="123456" maxlength="6" inputmode="numeric" autocomplete="one-time-code"' +
                    ' oninput="this.value=this.value.replace(/[^0-9]/g,\'\')"' +
                    ' style="width:100%;min-width:0;box-sizing:border-box;text-align:center;font-size:1.1rem;letter-spacing:6px;font-weight:700;">' +
                  '<button type="submit"' +
                    ' style="background:linear-gradient(135deg,#059669,#047857);color:#fff;border:none;border-radius:var(--radius-sm);padding:9px 14px;font-size:0.78rem;font-weight:700;white-space:nowrap;cursor:pointer;width:auto;justify-self:end;">' +
                    'Verificar' +
                  '</button>' +
                '</div>' +
              '</form>' +
              '<div style="text-align:center;margin-top:8px;">' +
                '<a href="#" onclick="event.preventDefault();window._lpResendSMS();" style="color:var(--text-muted);font-size:0.72rem;">Reenviar</a>' +
                '<span style="color:var(--text-muted);font-size:0.72rem;margin:0 6px;">|</span>' +
                '<a href="#" onclick="event.preventDefault();window._lpResetUnified();" style="color:var(--text-muted);font-size:0.72rem;">Voltar</a>' +
              '</div>' +
            '</div>' +

            '<div id="recaptcha-container"></div>' +

            // ── Divisor ──────────────────────────────────────────────────────
            '<div class="lp-divider"><span>ou</span></div>' +

            // ── 3. E-mail e Senha ─────────────────────────────────────────────
            '<div style="margin-bottom:4px;">' +
              '<div class="lp-label-sm">🔑 E-mail e Senha</div>' +

              // Modo login
              '<div id="lp-email-login-mode">' +
                '<form id="lp-form-login" novalidate onsubmit="event.preventDefault(); window._lpEmailLogin();">' +
                  '<div style="margin-bottom:6px;">' +
                    '<input type="email" id="lp-email" class="lp-fc" placeholder="seu@email.com" required' +
                      ' style="font-size:0.85rem;">' +
                  '</div>' +
                  '<div style="margin-bottom:6px;">' +
                    '<input type="password" id="lp-password" class="lp-fc" placeholder="Senha" required minlength="6"' +
                      ' autocomplete="current-password" style="font-size:0.85rem;">' +
                  '</div>' +
                  '<div style="display:flex;gap:8px;align-items:center;justify-content:flex-end;">' +
                    '<button type="submit"' +
                      ' style="background:var(--primary);color:#fff;border:none;border-radius:var(--radius-sm);padding:8px 18px;font-size:0.8rem;font-weight:700;white-space:nowrap;cursor:pointer;">' +
                      'Entrar' +
                    '</button>' +
                  '</div>' +
                '</form>' +
                '<div style="text-align:center;margin-top:6px;font-size:0.75rem;">' +
                  '<a href="#" onclick="event.preventDefault();window._lpToggleEmailMode(\'register\')"' +
                    ' style="color:var(--primary-light);font-weight:600;">Criar conta</a>' +
                  '<span style="color:var(--text-muted);margin:0 8px;">|</span>' +
                  '<a href="#" onclick="event.preventDefault();window._lpPasswordReset()"' +
                    ' style="color:var(--text-muted);">Esqueci a senha</a>' +
                '</div>' +
              '</div>' +

              // Modo cadastro (oculto)
              '<div id="lp-email-register-mode" style="display:none;">' +
                '<form id="lp-form-register" novalidate onsubmit="event.preventDefault(); window._lpEmailRegister();">' +
                  '<div style="margin-bottom:6px;">' +
                    '<input type="text" id="lp-name" class="lp-fc" placeholder="Seu nome" required' +
                      ' autocomplete="name" style="font-size:0.85rem;">' +
                  '</div>' +
                  '<div style="margin-bottom:6px;">' +
                    '<input type="email" id="lp-email-reg" class="lp-fc" placeholder="seu@email.com" required' +
                      ' autocomplete="email" style="font-size:0.85rem;">' +
                  '</div>' +
                  '<div style="margin-bottom:6px;">' +
                    '<input type="password" id="lp-password-reg" class="lp-fc" placeholder="Senha (mín. 6)" required minlength="6"' +
                      ' autocomplete="new-password" style="font-size:0.85rem;">' +
                  '</div>' +
                  '<div style="display:flex;gap:8px;align-items:center;justify-content:flex-end;">' +
                    '<button type="submit"' +
                      ' style="background:var(--primary);color:#fff;border:none;border-radius:var(--radius-sm);padding:8px 18px;font-size:0.8rem;font-weight:700;white-space:nowrap;cursor:pointer;">' +
                      'Criar Conta' +
                    '</button>' +
                  '</div>' +
                '</form>' +
                '<div style="text-align:center;margin-top:6px;">' +
                  '<a href="#" onclick="event.preventDefault();window._lpToggleEmailMode(\'login\')"' +
                    ' style="color:var(--primary-light);font-size:0.75rem;font-weight:600;">Já tem conta? Entrar</a>' +
                '</div>' +
              '</div>' +

            '</div>' + // fim E-mail e Senha

            // ── Divisor ──────────────────────────────────────────────────────
            '<div class="lp-divider"><span>ou</span></div>' +

            // ── 4. Google ─────────────────────────────────────────────────────
            '<div style="margin-bottom:4px;">' +
              '<button type="button" id="lp-google-btn"' +
                ' style="display:flex;align-items:center;justify-content:center;gap:10px;width:100%;background:#fff;color:#1f2937;border:none;border-radius:var(--radius);padding:13px 20px;font-size:0.9rem;font-weight:700;cursor:pointer;transition:transform .15s,box-shadow .15s;box-shadow:0 2px 10px rgba(0,0,0,0.35);"' +
                ' onmouseover="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 6px 20px rgba(0,0,0,0.45)\'"' +
                ' onmouseout="this.style.transform=\'\';this.style.boxShadow=\'0 2px 10px rgba(0,0,0,0.35)\'">' +
                '<svg width="18" height="18" viewBox="0 0 48 48">' +
                  '<path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>' +
                  '<path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>' +
                  '<path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 0 0 0 24c0 3.77.9 7.34 2.44 10.5l8.09-5.91z"/>' +
                  '<path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>' +
                '</svg>' +
                'Entrar com Google' +
              '</button>' +
            '</div>' +

            // ── Termos ────────────────────────────────────────────────────────
            '<div class="lp-terms">' +
              'Ao continuar, você concorda com os ' +
              '<a href="#">Termos de Uso</a>' +
              ' e a ' +
              '<a href="#">Política de Privacidade</a>.' +
            '</div>' +

          '</div>' + // .lp-body

        '</div>' + // .lp-card
      '</div>'    // .lp-wrap
    );
  }

  // ── Detecção de modo (email / phone) ──────────────────────────────────────────

  window._lpDetectMode = function () {
    var unifiedEl  = document.getElementById('lp-unified');
    var countryEl  = document.getElementById('lp-unified-country');
    var helperEl   = document.getElementById('lp-unified-helper');
    var rowEl      = document.getElementById('lp-unified-row');
    if (!unifiedEl) return;
    var mode = _detectInputModeRaw(unifiedEl.value);
    if (countryEl) countryEl.style.display = (mode === 'phone') ? '' : 'none';
    if (rowEl)     rowEl.style.gridTemplateColumns = (mode === 'phone') ? 'auto 1fr auto' : '1fr auto';
    if (helperEl) {
      if (mode === 'email') {
        helperEl.innerHTML = '✉️ Vamos enviar um <b>link de acesso</b> pro seu e-mail. Clique no link e entra direto.';
      } else if (mode === 'phone') {
        var ddi = (countryEl && countryEl.value) || '55';
        helperEl.innerHTML = '📱 Vamos enviar <b>SMS com código</b> pro <b>+' + ddi + '</b> + o número que você digitou.';
      } else {
        helperEl.innerHTML = 'Aceita <b>e-mail</b> (recebe link mágico) ou <b>celular com DDD</b> (recebe SMS com código). Pra celular, o seletor de país aparece automaticamente — padrão 🇧🇷 +55.';
      }
    }
  };

  // ── Enviar (unified) ──────────────────────────────────────────────────────────

  window._lpSendUnified = async function () {
    var unifiedEl = document.getElementById('lp-unified');
    var raw = unifiedEl ? unifiedEl.value.trim() : '';
    if (!raw) {
      window.showNotification('Atenção', 'Digite e-mail ou celular pra continuar.', 'warning');
      if (unifiedEl) unifiedEl.focus();
      return;
    }
    var mode = _detectInputModeRaw(raw);
    if (mode === 'email') {
      var emlHidden = document.getElementById('lp-email-ml');
      if (emlHidden) emlHidden.value = raw;
      await _lpHandleEmailLink(raw);
    } else if (mode === 'phone') {
      var phoneHidden    = document.getElementById('lp-phone-num');
      var countryVisible = document.getElementById('lp-unified-country');
      var countryHidden  = document.getElementById('lp-phone-country');
      if (phoneHidden) phoneHidden.value = raw;
      if (countryVisible && countryHidden) countryHidden.value = countryVisible.value;
      await _lpHandlePhoneSMS();
    } else {
      window.showNotification('Formato não reconhecido', 'Digite um e-mail (com @) ou celular com DDD (ex: 11 99999-8888).', 'warning');
      if (unifiedEl) unifiedEl.focus();
    }
  };

  // ── Magic link ────────────────────────────────────────────────────────────────

  async function _lpHandleEmailLink(email) {
    window.showLoading('Enviando link…');
    try {
      await window.sendMagicLink(email);
      window.hideLoading();
      // Substitui o corpo do card pelo painel de confirmação (igual scoreplace.app)
      var body = document.getElementById('lp-body');
      if (body) {
        var safe = email.replace(/&/g, '&amp;').replace(/</g, '&lt;');
        body.innerHTML =
          '<div style="text-align:center;padding:1rem 0;">' +
            '<div style="font-size:3rem;margin-bottom:0.5rem;">📬</div>' +
            '<div style="font-size:1.05rem;font-weight:800;color:var(--text-primary);margin-bottom:0.5rem;">Link enviado!</div>' +
            '<p style="font-size:0.88rem;color:var(--text-secondary);margin:0 0 1rem 0;">' +
              'Enviamos um link de acesso pra <b>' + safe + '</b>. Clique no link do e-mail pra entrar.' +
            '</p>' +
            '<div style="background:rgba(245,158,11,0.10);border:1px solid rgba(245,158,11,0.35);border-radius:10px;padding:10px 12px;margin-bottom:0.75rem;text-align:left;">' +
              '<div style="font-size:0.8rem;font-weight:700;color:#fbbf24;margin-bottom:4px;">⚠️ Não chegou? Cheque o spam.</div>' +
              '<div style="font-size:0.76rem;color:var(--text-muted);line-height:1.45;">' +
                'Primeira vez geralmente cai lá. Adicione o remetente aos contatos pra próximas vezes não cair no spam.' +
              '</div>' +
            '</div>' +
            '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">' +
              '<button style="background:transparent;color:var(--text-muted);border:1px solid var(--border);border-radius:var(--radius-sm);padding:7px 14px;font-size:0.82rem;cursor:pointer;"' +
                ' onclick="window.location.hash=\'#login\'">' +
                'Voltar' +
              '</button>' +
              '<button id="lp-resend-btn"' +
                ' style="background:var(--primary);color:#fff;border:none;border-radius:var(--radius-sm);padding:7px 14px;font-size:0.82rem;font-weight:700;cursor:pointer;"' +
                ' onclick="window._lpResendMagicLink()">' +
                'Reenviar' +
              '</button>' +
            '</div>' +
          '</div>';
        window._lpResendEmail = email;
      }
    } catch (_e) {
      window.hideLoading();
    }
  }

  window._lpResendMagicLink = async function () {
    var btn = document.getElementById('lp-resend-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Enviando…'; }
    try {
      await window.sendMagicLink(window._lpResendEmail || '');
      if (btn) { btn.disabled = false; btn.textContent = 'Enviado ✓'; }
    } catch (_e) {
      if (btn) { btn.disabled = false; btn.textContent = 'Reenviar'; }
    }
  };

  // ── SMS ───────────────────────────────────────────────────────────────────────

  async function _lpHandlePhoneSMS() {
    var digits  = (document.getElementById('lp-phone-num') || {}).value || '';
    var ddi     = (document.getElementById('lp-phone-country') || {}).value || '55';
    var phone   = '+' + ddi + digits.replace(/\D/g, '');
    window._lpLastPhone = phone;
    window.showLoading('Enviando SMS…');
    try {
      await window.sendPhoneSMS(phone);
      window.hideLoading();
      // Esconde unified step, mostra code step
      var unified = document.getElementById('lp-unified-step');
      var codeStep = document.getElementById('lp-sms-code-step');
      if (unified)  unified.style.display  = 'none';
      if (codeStep) codeStep.style.display = 'block';
      setTimeout(function () {
        var c = document.getElementById('lp-sms-code');
        if (c) c.focus();
      }, 80);
    } catch (_e) {
      window.hideLoading();
    }
  }

  window._lpVerifyCode = async function () {
    var codeEl = document.getElementById('lp-sms-code');
    var code = codeEl ? codeEl.value.trim() : '';
    if (code.length < 6) {
      window.showNotification('Atenção', 'Digite o código de 6 dígitos', 'warning');
      return;
    }
    window.showLoading('Verificando…');
    try {
      await window.confirmPhoneCode(code);
    } catch (_e) {
      // notification handled inside confirmPhoneCode
    }
  };

  window._lpResendSMS = async function () {
    var phone = window._lpLastPhone || '';
    if (!phone) { window._lpResetUnified(); return; }
    window.showLoading('Reenviando SMS…');
    try {
      await window.sendPhoneSMS(phone);
      window.hideLoading();
      var c = document.getElementById('lp-sms-code');
      if (c) c.value = '';
      window.showNotification('SMS reenviado', 'Aguarde o código chegar.', 'success');
    } catch (_e) {
      window.hideLoading();
    }
  };

  window._lpResetUnified = function () {
    window._lpLastPhone = '';
    var unified  = document.getElementById('lp-unified-step');
    var codeStep = document.getElementById('lp-sms-code-step');
    if (unified)  unified.style.display  = 'block';
    if (codeStep) codeStep.style.display = 'none';
    window._phoneConfirmResult = null;
  };

  // ── E-mail e Senha — toggle login / cadastro ──────────────────────────────────

  window._lpToggleEmailMode = function (mode) {
    var loginDiv    = document.getElementById('lp-email-login-mode');
    var registerDiv = document.getElementById('lp-email-register-mode');
    if (mode === 'register') {
      if (loginDiv)    loginDiv.style.display    = 'none';
      if (registerDiv) registerDiv.style.display = 'block';
    } else {
      if (loginDiv)    loginDiv.style.display    = 'block';
      if (registerDiv) registerDiv.style.display = 'none';
    }
  };

  window._lpEmailLogin = function () {
    var email = (document.getElementById('lp-email') || {}).value.trim();
    var pwd   = (document.getElementById('lp-password') || {}).value;
    if (!email || !pwd) {
      window.showNotification('Atenção', 'Preencha e-mail e senha', 'warning');
      return;
    }
    window.showLoading('Entrando…');
    window.signInWithEmail(email, pwd).finally(window.hideLoading);
  };

  window._lpEmailRegister = function () {
    var name = (document.getElementById('lp-name') || {}).value.trim();
    var em   = (document.getElementById('lp-email-reg') || {}).value.trim();
    var pw   = (document.getElementById('lp-password-reg') || {}).value;
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
  };

  window._lpPasswordReset = function () {
    var email = (document.getElementById('lp-email') || {}).value.trim();
    if (!email) {
      window.showNotification('Atenção', 'Informe seu e-mail no campo acima primeiro', 'warning');
      return;
    }
    window.sendPasswordReset(email).then(function () {
      window.showNotification('E-mail enviado', 'Verifique sua caixa de entrada.', 'success');
    });
  };

  // ── Wire ──────────────────────────────────────────────────────────────────────

  function _wire() {
    var googleBtn = document.getElementById('lp-google-btn');
    if (googleBtn) {
      googleBtn.addEventListener('click', function () {
        window.signInWithGoogle();
      });
    }
    setTimeout(function () {
      var inp = document.getElementById('lp-unified');
      if (inp) inp.focus();
    }, 80);
  }

  console.log('[fixou.app] login.js loaded');
})();
