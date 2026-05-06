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
