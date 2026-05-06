// fixou.app — Login view

(function () {
  'use strict';

  var emailMode = 'signin'; // 'signin' | 'signup' | 'reset'

  window.renderLogin = function (container) {
    container.innerHTML = '' +
      '<div class="login-container">' +
        '<div class="login-card">' +
          '<div class="login-header">' +
            '<div style="font-size:3rem;margin-bottom:8px;">🔧</div>' +
            '<h1 class="login-title">fixou.app</h1>' +
            '<p class="login-subtitle">Gestão de manutenção, simples e segura</p>' +
          '</div>' +

          '<button class="provider-btn provider-btn-google" data-provider="google">' +
            '<span class="provider-icon">🇬</span>' +
            '<span>Continuar com Google</span>' +
          '</button>' +
          '<button class="provider-btn provider-btn-apple" data-provider="apple">' +
            '<span class="provider-icon">🍎</span>' +
            '<span>Continuar com Apple</span>' +
          '</button>' +
          '<button class="provider-btn provider-btn-microsoft" data-provider="microsoft">' +
            '<span class="provider-icon">⊞</span>' +
            '<span>Continuar com Microsoft</span>' +
          '</button>' +
          '<button class="provider-btn provider-btn-facebook" data-provider="facebook">' +
            '<span class="provider-icon">f</span>' +
            '<span>Continuar com Facebook</span>' +
          '</button>' +

          '<div class="divider">ou com email</div>' +

          '<div id="email-form">' + buildEmailForm() + '</div>' +

          '<p class="text-small text-muted text-center mt-4" style="margin-top:16px;">' +
            'Ao continuar, você concorda com nossos termos de uso e política de privacidade.' +
          '</p>' +
        '</div>' +
      '</div>';

    // wire provider buttons
    container.querySelectorAll('[data-provider]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var p = btn.dataset.provider;
        if (p === 'google') return window.signInWithGoogle();
        if (p === 'apple') return window.signInWithApple();
        if (p === 'microsoft') return window.signInWithMicrosoft();
        if (p === 'facebook') return window.signInWithFacebook();
      });
    });

    wireEmailForm();
  };

  function buildEmailForm() {
    if (emailMode === 'signin') {
      return '' +
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
          '<input type="password" id="signup-password" autocomplete="new-password" placeholder="Mínimo 6 caracteres">' +
        '</div>' +
        '<button class="btn btn-primary btn-block" id="email-submit">Criar conta</button>' +
        '<div style="display:flex;justify-content:center;margin-top:10px;font-size:0.85rem;">' +
          '<button class="btn-ghost" id="switch-signin" style="padding:4px;">Já tenho conta</button>' +
        '</div>';
    }
    // reset
    return '' +
      '<div class="form-group">' +
        '<label class="form-label" for="reset-email">Email</label>' +
        '<input type="email" id="reset-email" autocomplete="email" placeholder="seu@email.com">' +
      '</div>' +
      '<button class="btn btn-primary btn-block" id="email-submit">Enviar link de recuperação</button>' +
      '<div style="display:flex;justify-content:center;margin-top:10px;font-size:0.85rem;">' +
        '<button class="btn-ghost" id="switch-signin" style="padding:4px;">Voltar ao login</button>' +
      '</div>';
  }

  function wireEmailForm() {
    var submitBtn = document.getElementById('email-submit');
    if (submitBtn) submitBtn.addEventListener('click', handleEmailSubmit);

    var switchSignup = document.getElementById('switch-signup');
    if (switchSignup) switchSignup.addEventListener('click', function () { emailMode = 'signup'; rerenderEmailForm(); });

    var switchSignin = document.getElementById('switch-signin');
    if (switchSignin) switchSignin.addEventListener('click', function () { emailMode = 'signin'; rerenderEmailForm(); });

    var switchReset = document.getElementById('switch-reset');
    if (switchReset) switchReset.addEventListener('click', function () { emailMode = 'reset'; rerenderEmailForm(); });
  }

  function rerenderEmailForm() {
    var slot = document.getElementById('email-form');
    if (slot) {
      slot.innerHTML = buildEmailForm();
      wireEmailForm();
    }
  }

  function handleEmailSubmit() {
    if (emailMode === 'signin') {
      var email = document.getElementById('login-email').value.trim();
      var pwd = document.getElementById('login-password').value;
      if (!email || !pwd) { window.showNotification('Atenção', 'Preencha email e senha', 'warning'); return; }
      window.showLoading('Entrando…');
      window.signInWithEmail(email, pwd).finally(window.hideLoading);
    } else if (emailMode === 'signup') {
      var name = document.getElementById('signup-name').value.trim();
      var em = document.getElementById('signup-email').value.trim();
      var pw = document.getElementById('signup-password').value;
      if (!name || !em || !pw) { window.showNotification('Atenção', 'Preencha todos os campos', 'warning'); return; }
      if (pw.length < 6) { window.showNotification('Atenção', 'Senha precisa ter pelo menos 6 caracteres', 'warning'); return; }
      window.showLoading('Criando conta…');
      window.signUpWithEmail(em, pw, name).finally(window.hideLoading);
    } else if (emailMode === 'reset') {
      var re = document.getElementById('reset-email').value.trim();
      if (!re) { window.showNotification('Atenção', 'Informe seu email', 'warning'); return; }
      window.sendPasswordReset(re).then(function () { emailMode = 'signin'; rerenderEmailForm(); });
    }
  }

  console.log('[fixou.app] login.js loaded');
})();
