# fixou.app — Projeto de Contexto

## O que é o fixou.app

Plataforma SaaS multi-tenant de gestão de manutenção. Permite que administradores (donos de loja, síndicos, diretores de clube etc.) cadastrem suas unidades, abram chamados de manutenção com fotos antes/depois, e contratem prestadores de serviço cadastrados na plataforma.

- **Versão atual:** `0.1.0-alpha`
- **URL principal (futura):** https://fixou.app
- **GitHub repo:** `barthlabs/fixou-app`
- **Firebase project:** `fixou-app26`
- **Conta operacional:** `contato@barthlabs.com`
- **Banco de dados:** Cloud Firestore (região southamerica-east1 / São Paulo)
- **Storage:** Firebase Storage (US-CENTRAL1)
- **Auth:** Firebase Auth multi-provider (Google, Facebook, Apple, Microsoft, Email/Senha, Phone/SMS)
- **Stack:** Vanilla JS (sem frameworks) — mesmo padrão do scoreplace.app

## Modelo de Negócio

- **Freemium SaaS** — versão gratuita para começar; planos pagos quando o uso crescer
- **3 tipos de usuário** que se cadastram livremente na plataforma:
  - **Administrador** — cria sua organização, cadastra unidades, convida gestores, contrata prestadores
  - **Gestor** — convidado por um admin a gerenciar unidades específicas; abre e acompanha chamados
  - **Prestador de Serviço** — cadastra seus serviços e disponibilidade; recebe chamados por atribuição direta ou via candidatura a chamados publicados
- **Convites horizontais** — qualquer pessoa pode convidar qualquer outra pra plataforma. A hierarquia existe apenas dentro de cada organização (admin controla quem é gestor naquela organização).
- **Multi-papel** — um mesmo usuário pode ser admin de uma organização e prestador para outra simultaneamente.

## Isolamento Multi-Tenant

- Admin A nunca vê dados do Admin B
- Gestor só vê unidades às quais foi vinculado
- Prestador só vê chamados quando atribuído ou ao se candidatar a chamados publicados
- Prestador NUNCA vê detalhes da unidade até ter acesso ao chamado específico
- Toda leitura passa por verificação de membership na organização
- Regras Firestore enforcement em `firestore.rules` (helper `memberOf`, `isAdminOf`, etc.)

## Modelo de Dados (Firestore)

### `users/{uid}`
Perfil global do usuário na plataforma.
```
{
  uid: string,
  email: string,
  displayName: string,
  photoURL: string,
  phone: string?,
  createdAt: timestamp,
  // perfis ativos (um usuário pode ter múltiplos)
  isAdmin: boolean,
  isManager: boolean,
  isProvider: boolean,
  defaultOrgId: string?  // org principal pra contexto inicial no dashboard
}
```

### `organizations/{orgId}`
Cada organização (empresa, condomínio, clube etc.).
```
{
  id: string,
  name: string,
  ownerUid: string,        // quem criou — admin original
  type: 'lojas' | 'condominio' | 'clube' | 'outro',
  createdAt: timestamp,
  plan: 'free' | 'pro',
  unitCount: number,       // denormalizado pra dashboards
  memberCount: number
}
```

### `memberships/{uid_orgId}`
Vinculação usuário ↔ organização. Doc ID = `${uid}_${orgId}` pra lookup O(1).
```
{
  uid: string,
  orgId: string,
  role: 'admin' | 'manager' | 'provider',
  unitIds: string[],       // pra gestores: unidades que gerencia
  invitedByUid: string?,
  createdAt: timestamp,
  status: 'active' | 'pending' | 'suspended'
}
```

### `units/{unitId}`
Unidade física (loja, bloco, quadra, sede). Pertence a 1 organização.
```
{
  id: string,
  orgId: string,
  name: string,             // "Loja Centro", "Bloco A", "Sede"
  address: string?,
  city: string?,
  state: string?,
  managerUids: string[],    // gestores responsáveis
  createdAt: timestamp,
  active: boolean
}
```

### `tickets/{ticketId}`
Chamado de manutenção.
```
{
  id: string,
  orgId: string,
  unitId: string,
  openedByUid: string,         // gestor que abriu
  assignedProviderUid: string?, // prestador atribuído
  title: string,
  description: string,
  priority: 'low' | 'medium' | 'high',
  status: 'open' | 'published' | 'assigned' | 'in_progress' | 'awaiting_confirmation' | 'awaiting_approval' | 'approved' | 'rejected' | 'reopened',
  photoBefore: string,         // Storage URL
  photoAfter: string?,         // Storage URL
  photoConfirmation: string?,  // Storage URL (gestor confirma após execução)
  candidates: string[],        // UIDs de prestadores que se candidataram
  createdAt: timestamp,
  updatedAt: timestamp,
  history: [
    { at: timestamp, byUid: string, action: string, note: string? }
  ]
}
```

### `providerProfiles/{uid}`
Perfil público de prestador (marketplace).
```
{
  uid: string,
  displayName: string,
  photoURL: string,
  specialties: string[],      // 'eletrica', 'hidraulica', 'pintura' etc.
  serviceRegions: string[],   // CEPs ou cidades atendidas
  rating: number,             // 0-5 (futuro)
  reviewCount: number,        // futuro
  bio: string,
  availability: string,       // texto livre
  createdAt: timestamp,
  active: boolean
}
```

### `invites/{inviteId}`
Convites horizontais entre usuários.
```
{
  id: string,
  fromUid: string,
  toEmail: string,
  toPhone: string?,
  orgId: string?,             // se for convite pra entrar numa org
  proposedRole: 'admin' | 'manager' | 'provider'?,
  unitIds: string[]?,         // pra gestor
  status: 'pending' | 'accepted' | 'rejected' | 'expired',
  createdAt: timestamp,
  expiresAt: timestamp
}
```

## Fluxo de Chamado (Ticket Lifecycle)

1. **Gestor abre** → status `open` → upload foto antes
2. **Gestor publica OU atribui direto a prestador**
   - Atribui direto → status `assigned`
   - Publica → status `published` → prestadores podem se candidatar (`candidates[]`)
3. **Admin/gestor escolhe candidato** → status `assigned`
4. **Prestador inicia execução** → status `in_progress`
5. **Prestador conclui + foto depois** → status `awaiting_confirmation`
6. **Gestor confirma + foto adicional** → status `awaiting_approval`
7. **Admin aprova** → status `approved` (encerrado)
   - **Admin reprova** → status `reopened` (volta pra `assigned` com nota do motivo)

## Autenticação

Firebase Auth compat SDK com 6 providers:
- Google (✅ ativo)
- Facebook (pendente — exige Facebook Developer App)
- Apple (pendente — exige Apple Developer Program $99/ano)
- Microsoft (pendente — Azure AD app)
- Email/Senha (pendente — ativar no console)
- Phone/SMS (pendente — ativar + reCAPTCHA)

Pra MVP basta Google + Email/Senha. Outros providers entram conforme demanda.

## Estrutura de Arquivos

```
fixou.app/
├── CLAUDE.md                    # este documento
├── firestore.rules              # regras Firestore
├── storage.rules                # regras Storage
├── index.html                   # entry SPA
├── icons/                       # PWA icons
├── css/
│   ├── style.css                # variáveis, base, componentes
│   └── responsive.css           # mobile-first
└── js/
    ├── firebase-config.js       # init Firebase + auth/db/storage globals
    ├── store.js                 # AppStore — estado global, currentUser, currentOrg
    ├── auth.js                  # multi-provider login, signup, signout
    ├── ui.js                    # showNotification, modais, helpers
    ├── router.js                # hash-based SPA routing
    ├── main.js                  # bootstrap, listeners onAuthStateChanged
    └── views/
        ├── login.js             # tela de login com 6 providers
        ├── onboarding.js        # 3 passos: perfil → papel → detalhes
        ├── dashboard.js         # painel com seletor de org, stats, tickets
        ├── ticket.js            # detalhe + ciclo completo de status
        ├── admin.js             # gestão da org (3 abas: Unidades, Membros, Convites)
        ├── providers.js         # marketplace de prestadores
        └── profile.js           # perfil do usuário + perfil de prestador
```

## Padrão de Código

### Roteamento
Hash-based SPA. Rotas: `#login`, `#onboarding`, `#dashboard`, `#ticket/{id}`, `#admin`, `#providers`, `#profile`.

### Estado Global
`window.AppStore` em `store.js`:
- `currentUser` — Firebase user object + dados do `/users/{uid}`
- `currentOrgId` — qual org está em foco no dashboard
- `memberships` — todas as memberships do usuário
- `currentRole` — papel na `currentOrgId`
- `units`, `tickets`, `providerProfiles` — caches pop por listeners onSnapshot
- Métodos: `setCurrentOrg(id)`, `loadUserData(uid)`, `signOut()`, etc.

### CSS / Tema
- Mobile-first
- Paleta: azul-petróleo (`--primary: #1e40af`) + acentos âmbar para alertas
- Modais viram bottom-sheets em mobile
- Variáveis CSS em `:root`

### Segurança
- **NUNCA** confiar em dado vindo do cliente sem validar regras
- **SEMPRE** sanitizar HTML em onclick/innerHTML (helper `_safeHtml`)
- **NUNCA** deixar `<script>` sem `</script>` (auditar com `grep -c "<script" index.html`)

## Versionamento

`window.FIXOU_VERSION` em `store.js`. Padrão `MAJOR.MINOR.PATCH-channel`.
- `0.1.x-alpha` — fase atual, dados descartáveis
- `0.x.x-alpha` — features incrementais
- `1.0.0-beta` — quando dados reais começarem a importar
- `1.0.0` — release estável

## Deploy

Mesmo fluxo do scoreplace.app:
1. Editar arquivos localmente
2. Validar sintaxe: `for f in $(find js/ -name '*.js'); do node --check "$f" 2>&1 || echo "ERRO em $f"; done`
3. Atualizar cache-busters em `index.html` (`?v=0.1.x`)
4. Bump versão em `store.js`
5. Commit + push pra `barthlabs/fixou-app` (branch `main`)
6. GitHub Pages serve em `https://barthlabs.github.io/fixou-app/` (futuramente migrar pra `fixou.app` com CNAME)

## Status atual

✅ Repo GitHub criado: `barthlabs/fixou-app`
✅ Firebase project: `fixou-app26`
✅ `firebase-config.js` plugado com credenciais reais
✅ `firestore.rules` escrito (precisa publicar no Console)
✅ `storage.rules` escrito (precisa publicar no Console)
⏳ Authentication: Google ativado; outros providers pendentes
⏳ Firestore: ativar em São Paulo + publicar regras
⏳ Storage: upgrade Blaze + ativar + publicar regras
⏳ Código (HTML/CSS/JS): em construção
