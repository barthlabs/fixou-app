// fixou.app — AppStore (global state)

window.FIXOU_VERSION = '0.1.3-alpha';

(function () {
  'use strict';

  var store = {
    version: window.FIXOU_VERSION,

    // Auth
    currentUser: null,           // { uid, email, displayName, photoURL, ...userDoc }
    authReady: false,

    // Multi-tenant context
    memberships: [],             // all memberships for current user
    currentOrgId: null,          // active organization in dashboard
    currentOrgRole: null,        // 'admin' | 'manager' | 'provider' | null
    currentOrg: null,            // org doc

    // Cached data (per current org)
    units: [],
    tickets: [],
    members: [],

    // Provider data (when current user is a provider)
    providerProfile: null,

    // Listeners (to detach when switching orgs)
    _unsubscribers: {
      memberships: null,
      orgDoc: null,
      units: null,
      tickets: null,
      members: null,
      providerProfile: null
    },

    // === USER PROFILE ===

    loadUserDoc: async function (uid) {
      try {
        var snap = await window.db.collection('users').doc(uid).get();
        if (snap.exists) {
          return snap.data();
        }
        return null;
      } catch (err) {
        console.error('[store] loadUserDoc error:', err);
        return null;
      }
    },

    saveUserDoc: async function (uid, data) {
      try {
        var payload = Object.assign({}, data, {
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        if (!data.createdAt) {
          payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        }
        await window.db.collection('users').doc(uid).set(payload, { merge: true });
        return true;
      } catch (err) {
        console.error('[store] saveUserDoc error:', err);
        return false;
      }
    },

    // === MEMBERSHIPS ===

    listenMemberships: function () {
      if (!this.currentUser || !this.currentUser.uid) return;
      var self = this;
      if (this._unsubscribers.memberships) this._unsubscribers.memberships();

      this._unsubscribers.memberships = window.db
        .collection('memberships')
        .where('uid', '==', this.currentUser.uid)
        .onSnapshot(
          function (qs) {
            self.memberships = qs.docs.map(function (d) {
              return Object.assign({ id: d.id }, d.data());
            });
            window.dispatchEvent(new CustomEvent('memberships-changed'));
            // Fill in any missing orgName fields (legacy docs) and persist them
            self._backfillOrgNames(self.memberships);
          },
          function (err) {
            console.error('[store] memberships listener error:', err);
          }
        );
    },

    // Fetch org names for memberships that lack orgName, patch in-memory
    // objects, write back to Firestore and re-dispatch so all UI updates.
    _backfillOrgNames: function (memberships) {
      var self = this;
      var unresolved = memberships.filter(function (m) { return !m.orgName; });
      if (unresolved.length === 0) return;

      unresolved.forEach(function (m) {
        window.db.collection('organizations').doc(m.orgId).get()
          .then(function (snap) {
            if (!snap.exists) return;
            var name = (snap.data() || {}).name;
            if (!name) return;
            m.orgName = name;
            // Persist so future snapshots already have the name
            window.db.collection('memberships').doc(m.id)
              .update({ orgName: name })
              .catch(function () {});
            // Re-notify listeners so switcher / home screen refresh
            window.dispatchEvent(new CustomEvent('memberships-changed'));
          })
          .catch(function (e) {
            console.warn('[store] _backfillOrgNames failed for', m.orgId, e);
          });
      });
    },

    // === CURRENT ORG ===

    setCurrentOrg: function (orgId) {
      if (this.currentOrgId === orgId) return;
      this.currentOrgId = orgId;

      var m = this.memberships.find(function (m) { return m.orgId === orgId; });
      this.currentOrgRole = m ? m.role : null;

      // detach previous listeners
      ['orgDoc', 'units', 'tickets', 'members'].forEach(function (k) {
        if (this._unsubscribers[k]) {
          this._unsubscribers[k]();
          this._unsubscribers[k] = null;
        }
      }, this);

      if (orgId) {
        this._listenOrgDoc(orgId);
        this._listenUnits(orgId);
        this._listenTickets(orgId);
        if (this.currentOrgRole === 'admin') this._listenMembers(orgId);
      } else {
        this.currentOrg = null;
        this.units = [];
        this.tickets = [];
        this.members = [];
      }

      try { localStorage.setItem('fixou_currentOrgId', orgId || ''); } catch (e) {}
      window.dispatchEvent(new CustomEvent('current-org-changed'));
    },

    _listenOrgDoc: function (orgId) {
      var self = this;
      this._unsubscribers.orgDoc = window.db.collection('organizations').doc(orgId).onSnapshot(
        function (snap) {
          self.currentOrg = snap.exists ? Object.assign({ id: snap.id }, snap.data()) : null;
          window.dispatchEvent(new CustomEvent('current-org-doc-changed'));
        },
        function (err) { console.error('[store] orgDoc listener error:', err); }
      );
    },

    _listenUnits: function (orgId) {
      var self = this;
      this._unsubscribers.units = window.db
        .collection('units')
        .where('orgId', '==', orgId)
        .onSnapshot(
          function (qs) {
            self.units = qs.docs.map(function (d) {
              return Object.assign({ id: d.id }, d.data());
            });
            window.dispatchEvent(new CustomEvent('units-changed'));
          },
          function (err) { console.error('[store] units listener error:', err); }
        );
    },

    _listenTickets: function (orgId) {
      var self = this;
      this._unsubscribers.tickets = window.db
        .collection('tickets')
        .where('orgId', '==', orgId)
        .onSnapshot(
          function (qs) {
            self.tickets = qs.docs.map(function (d) {
              return Object.assign({ id: d.id }, d.data());
            });
            window.dispatchEvent(new CustomEvent('tickets-changed'));
          },
          function (err) { console.error('[store] tickets listener error:', err); }
        );
    },

    _listenMembers: function (orgId) {
      var self = this;
      this._unsubscribers.members = window.db
        .collection('memberships')
        .where('orgId', '==', orgId)
        .onSnapshot(
          function (qs) {
            self.members = qs.docs.map(function (d) {
              return Object.assign({ id: d.id }, d.data());
            });
            window.dispatchEvent(new CustomEvent('members-changed'));
          },
          function (err) { console.error('[store] members listener error:', err); }
        );
    },

    // === ORGANIZATIONS ===

    createOrganization: async function (data) {
      if (!this.currentUser || !this.currentUser.uid) throw new Error('Não autenticado');
      var uid = this.currentUser.uid;
      var orgRef = window.db.collection('organizations').doc();
      var orgId = orgRef.id;

      var orgPayload = {
        id: orgId,
        name: data.name,
        ownerUid: uid,
        plan: 'free',
        unitCount: 0,
        memberCount: 1,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      // Optional `type` only if provided — kept for forward-compat
      if (data.type) orgPayload.type = data.type;

      var membershipPayload = {
        uid: uid,
        orgId: orgId,
        orgName: data.name,
        role: 'admin',
        unitIds: [],
        status: 'active',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      var batch = window.db.batch();
      batch.set(orgRef, orgPayload);
      batch.set(window.db.collection('memberships').doc(uid + '_' + orgId), membershipPayload);
      await batch.commit();
      return orgId;
    },

    // === PROVIDER PROFILE ===

    listenProviderProfile: function (uid) {
      var self = this;
      if (this._unsubscribers.providerProfile) this._unsubscribers.providerProfile();
      this._unsubscribers.providerProfile = window.db
        .collection('providerProfiles')
        .doc(uid)
        .onSnapshot(
          function (snap) {
            self.providerProfile = snap.exists ? Object.assign({ id: snap.id }, snap.data()) : null;
            window.dispatchEvent(new CustomEvent('provider-profile-changed'));
          },
          function (err) { console.error('[store] providerProfile listener error:', err); }
        );
    },

    saveProviderProfile: async function (uid, data) {
      var payload = Object.assign({}, data, {
        uid: uid,
        active: data.active !== false,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      if (!data.createdAt) {
        payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      }
      await window.db.collection('providerProfiles').doc(uid).set(payload, { merge: true });
      return true;
    },

    // === CLEANUP ===

    detachAll: function () {
      Object.keys(this._unsubscribers).forEach(function (k) {
        if (this._unsubscribers[k]) {
          try { this._unsubscribers[k](); } catch (e) {}
          this._unsubscribers[k] = null;
        }
      }, this);
    },

    reset: function () {
      this.detachAll();
      this.currentUser = null;
      this.memberships = [];
      this.currentOrgId = null;
      this.currentOrgRole = null;
      this.currentOrg = null;
      this.units = [];
      this.tickets = [];
      this.members = [];
      this.providerProfile = null;
    }
  };

  window.AppStore = store;

  console.log('[fixou.app] store.js loaded — version', store.version);
})();
