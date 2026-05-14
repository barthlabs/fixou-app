// fixou.app — Authentication (Google + Email/Senha for MVP; others stub)

(function () {
  'use strict';

  // === GOOGLE ===
  window.signInWithGoogle = async function () {
    var provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      var result = await window.auth.signInWithPopup(provider);
      return result.user;
    } catch (err) {
      console.error('[auth] Google sign-in error:', err);
      if (err.code === 'auth/popup-blocked') {
        // fallback redirect
        await window.auth.signInWithRedirect(provider);
        return null;
      }
      window.showNotification('Erro no login', err.message || 'Tente novamente', 'error');
      throw err;
    }
  };

  // === EMAIL/SENHA ===
  window.signInWithEmail = async function (email, password) {
    try {
      var result = await window.auth.signInWithEmailAndPassword(email, password);
      return result.user;
    } catch (err) {
      console.error('[auth] Email sign-in error:', err);
      var msg = 'Email ou senha inválidos';
      if (err.code === 'auth/user-not-found') msg = 'Usuário não encontrado';
      if (err.code === 'auth/wrong-password') msg = 'Senha incorreta';
      if (err.code === 'auth/invalid-email') msg = 'Email inválido';
      if (err.code === 'auth/too-many-requests') msg = 'Muitas tentativas. Aguarde alguns minutos.';
      window.showNotification('Erro no login', msg, 'error');
      throw err;
    }
  };

  window.signUpWithEmail = async function (email, password, displayName) {
    try {
      var result = await window.auth.createUserWithEmailAndPassword(email, password);
      if (displayName && result.user) {
        await result.user.updateProfile({ displayName: displayName });
      }
      return result.user;
    } catch (err) {
      console.error('[auth] Email sign-up error:', err);
      var msg = 'Erro ao criar conta';
      if (err.code === 'auth/email-already-in-use') msg = 'Email já cadastrado. Faça login.';
      if (err.code === 'auth/weak-password') msg = 'Senha muito fraca (mínimo 6 caracteres)';
      if (err.code === 'auth/invalid-email') msg = 'Email inválido';
      window.showNotification('Erro no cadastro', msg, 'error');
      throw err;
    }
  };

  window.sendPasswordReset = async function (email) {
    try {
      await window.auth.sendPasswordResetEmail(email);
      window.showNotification('Email enviado', 'Verifique sua caixa de entrada.', 'success');
      return true;
    } catch (err) {
      console.error('[auth] Password reset error:', err);
      window.showNotification('Erro', err.message || 'Tente novamente', 'error');
      return false;
    }
  };

  // === MAGIC LINK ===
  window.sendMagicLink = async function (email) {
    var actionCodeSettings = {
      url: window.location.origin + '/',
      handleCodeInApp: true
    };
    try {
      await window.auth.sendSignInLinkToEmail(email, actionCodeSettings);
      try { localStorage.setItem('fixou_emailForSignIn', email); } catch (_e) {}
      window.showNotification('Link enviado! 📬', 'Verifique seu e-mail e clique no link para entrar.', 'success');
      return true;
    } catch (err) {
      console.error('[auth] magic link send error:', err);
      var msg = 'Não foi possível enviar o link';
      if (err.code === 'auth/invalid-email') msg = 'E-mail inválido';
      if (err.code === 'auth/operation-not-allowed') msg = 'Link mágico não habilitado — tente outro método';
      window.showNotification('Erro', msg, 'error');
      throw err;
    }
  };

  // Detecta retorno de magic link na abertura da página
  (function _handleMagicLinkReturn() {
    try {
      if (!window.auth || typeof window.auth.isSignInWithEmailLink !== 'function') return;
      if (!window.auth.isSignInWithEmailLink(window.location.href)) return;
      var email = '';
      try { email = localStorage.getItem('fixou_emailForSignIn') || ''; } catch (_e) {}
      if (!email) email = prompt('Confirme seu e-mail para entrar:') || '';
      if (!email) return;
      if (typeof window.showLoading === 'function') window.showLoading('Entrando…');
      window.auth.signInWithEmailLink(email, window.location.href)
        .then(function () {
          try { localStorage.removeItem('fixou_emailForSignIn'); } catch (_e) {}
          window.history.replaceState(null, '', window.location.pathname);
          if (typeof window.hideLoading === 'function') window.hideLoading();
        })
        .catch(function (err) {
          if (typeof window.hideLoading === 'function') window.hideLoading();
          console.error('[auth] magic link confirm error:', err);
          window.history.replaceState(null, '', window.location.pathname);
          if (typeof window.showNotification === 'function') {
            window.showNotification('Link inválido', 'Link expirado ou já usado. Solicite um novo.', 'error');
          }
        });
    } catch (e) {
      console.error('[auth] magic link return handler crashed:', e);
    }
  })();

  // === PHONE / SMS ===
  window.sendPhoneSMS = async function (phoneNumber) {
    try {
      if (!window._recaptchaVerifier) {
        var container = document.getElementById('recaptcha-container');
        if (!container) {
          container = document.createElement('div');
          container.id = 'recaptcha-container';
          document.body.appendChild(container);
        }
        window._recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
          size: 'invisible',
          callback: function () {}
        });
      }
      var result = await window.auth.signInWithPhoneNumber(phoneNumber, window._recaptchaVerifier);
      window._phoneConfirmResult = result;
      return true;
    } catch (err) {
      console.error('[auth] phone SMS error:', err);
      var msg = 'Não foi possível enviar o SMS';
      if (err.code === 'auth/invalid-phone-number') msg = 'Número de telefone inválido';
      if (err.code === 'auth/too-many-requests') msg = 'Muitas tentativas. Aguarde alguns minutos.';
      if (err.code === 'auth/operation-not-allowed') msg = 'Login por SMS não habilitado — tente outro método';
      window.showNotification('Erro', msg, 'error');
      try { window._recaptchaVerifier.clear(); window._recaptchaVerifier = null; } catch (_e) {}
      throw err;
    }
  };

  window.confirmPhoneCode = async function (code) {
    if (!window._phoneConfirmResult) {
      window.showNotification('Sessão expirada', 'Solicite o código novamente.', 'error');
      return;
    }
    try {
      window.showLoading('Verificando…');
      var result = await window._phoneConfirmResult.confirm(code);
      window._phoneConfirmResult = null;
      window.hideLoading();
      return result.user;
    } catch (err) {
      window.hideLoading();
      console.error('[auth] phone confirm error:', err);
      window.showNotification('Código inválido', 'Verifique o código e tente novamente.', 'error');
      throw err;
    }
  };

  // === FACEBOOK / APPLE / MICROSOFT — stubs ===
  // Habilitar quando as credenciais dos providers estiverem registradas no Console.
  window.signInWithFacebook = async function () {
    window.showNotification('Em breve', 'Login com Facebook será habilitado em breve.', 'info');
  };
  window.signInWithApple = async function () {
    window.showNotification('Em breve', 'Login com Apple será habilitado em breve.', 'info');
  };
  window.signInWithMicrosoft = async function () {
    window.showNotification('Em breve', 'Login com Microsoft será habilitado em breve.', 'info');
  };
  window.signInWithPhone = async function () {
    window.showNotification('Em breve', 'Login por telefone será habilitado em breve.', 'info');
  };

  // === SIGN OUT ===
  window.signOutUser = async function () {
    try {
      window.AppStore.reset();
      await window.auth.signOut();
      window.location.hash = '#login';
    } catch (err) {
      console.error('[auth] Sign out error:', err);
    }
  };

  console.log('[fixou.app] auth.js loaded');
})();
