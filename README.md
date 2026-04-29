# Vinyl Swap — Plateforme d'échange de vinyles

Vinyl Swap est une application web permettant à des utilisateurs d'échanger des vinyles entre eux. Un utilisateur peut parcourir le catalogue, proposer un échange contre un de ses propres vinyles, négocier par messagerie, puis accepter ou refuser la proposition.

## Stack technique

| Couche | Technologie |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| UI | React 19, TailwindCSS v4, shadcn/ui |
| Langage | TypeScript |
| Base de données | PostgreSQL via Neon Serverless |
| Tests fonctionnels | Playwright |
| Tests unitaires | Vitest |

---

## Prérequis

- Node.js >= 20.19.0
- Un projet [Neon](https://neon.tech) avec la base initialisée (voir section [Base de données](#base-de-données))

---

## Installation

```bash
git clone https://github.com/OPET-Projects/mvp-tests-fonctionnels.git
cd mvp-tests-fonctionnels
npm install
```

### Variables d'environnement

> Section à compléter avec les détails de connexion à la base de données Neon et toute autre variable nécessaire.

---

## Lancer le projet

```bash
# Serveur de développement
npm run dev

# Build de production
npm run build
npm run start
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000).

---

## Scripts disponibles

| Commande | Description |
| --- | --- |
| `npm run dev` | Serveur de développement avec hot-reload |
| `npm run build` | Build de production |
| `npm run start` | Démarre le build de production |
| `npm run lint` | Vérifie le code avec ESLint |
| `npm run test:e2e` | Lance les tests Playwright en headless |
| `npm run test:e2e:ui` | Lance les tests avec l'UI interactive Playwright |
| `npm run test:e2e:report` | Ouvre le rapport HTML du dernier run de tests |
| `npm run test:unit` | Lance les tests unitaires Vitest (run unique) |
| `npm run test:unit:watch` | Lance les tests unitaires en mode watch |

---

## Base de données

### Schéma

```sql
CREATE TABLE users (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(10)  NOT NULL UNIQUE
);

CREATE TABLE vinyls (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  artist      VARCHAR(255) NOT NULL,
  description TEXT,
  file_url    TEXT,
  ean         BIGINT,
  available   BOOLEAN NOT NULL DEFAULT true,
  user_id     INTEGER NOT NULL REFERENCES users(id),
  genre       VARCHAR(50)
);

CREATE TABLE requests (
  id      SERIAL PRIMARY KEY,
  status  VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  vinyl_a INTEGER NOT NULL REFERENCES vinyls(id),
  vinyl_b INTEGER NOT NULL REFERENCES vinyls(id)
);

CREATE TABLE messages (
  id         SERIAL PRIMARY KEY,
  content    TEXT    NOT NULL,
  user_id    INTEGER NOT NULL REFERENCES users(id),
  request_id INTEGER NOT NULL REFERENCES requests(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Gestion des données (rôle administrateur)

Les utilisateurs et les vinyles sont gérés directement en base. Exemples :

```sql
-- Ajouter un utilisateur
INSERT INTO users (name, code) VALUES ('Alice', 'ABC123');

-- Ajouter un vinyle et l'attribuer à un utilisateur
INSERT INTO vinyls (title, artist, description, genre, user_id)
VALUES ('Kind of Blue', 'Miles Davis', 'Jazz modal classique', 'Jazz', 1);

-- Changer la disponibilité d'un vinyle
UPDATE vinyls SET available = false WHERE id = 1;
```

### Genres disponibles

`Rock` `Pop` `Jazz` `Métal` `Rap` `Indie` `Classique` `Électronique` `R&B` `Reggae`

---

## Pages

| Route | Description |
| --- | --- |
| `/` | Connexion par code utilisateur |
| `/vinyls` | Catalogue des vinyles disponibles (hors les siens) |
| `/my-vinyls` | Mes vinyles |
| `/barter/[id]` | Formulaire de proposition d'échange pour un vinyle donné |
| `/exchanges` | Liste des demandes envoyées et reçues |
| `/exchanges/[id]` | Détail d'un échange : récapitulatif, négociation, actions |

---

## API Routes

### Utilisateurs

| Méthode | Route | Description |
| --- | --- | --- |
| `POST` | `/api/users` | Identifier un utilisateur par son code — body : `{ "code": "ABC123" }` |
| `GET` | `/api/users/[id]` | Récupérer un utilisateur par son id |

### Vinyles

| Méthode | Route | Description |
| --- | --- | --- |
| `POST` | `/api/vinyls` | Lister les vinyles disponibles hors ceux de l'utilisateur — body : `{ "id": 1 }` |
| `GET` | `/api/vinyls/[id]` | Récupérer un vinyle par son id |
| `GET` | `/api/vinyls/user/[id]` | Lister les vinyles d'un utilisateur |

### Demandes d'échange

| Méthode | Route | Description |
| --- | --- | --- |
| `POST` | `/api/barter` | Créer une ou plusieurs demandes d'échange — body : `{ "vinyl": "10", "items": ["5"], "message": "..." }` |
| `POST` | `/api/requests` | Créer une demande unitaire |
| `GET` | `/api/requests/[id]` | Récupérer une demande par son id |
| `PUT` | `/api/requests/[id]` | Mettre à jour le statut — body : `{ "status": "ACCEPTED" \| "REJECTED" }` |
| `GET` | `/api/requests/sender/[id]` | Demandes envoyées par un utilisateur |
| `GET` | `/api/requests/receiver/[id]` | Demandes reçues par un utilisateur |

### Messages

| Méthode | Route | Description |
| --- | --- | --- |
| `POST` | `/api/messages` | Envoyer un message — body : `{ "content": "...", "user_id": 1, "request_id": 42 }` |
| `GET` | `/api/messages/[request_id]` | Historique des messages d'une demande |

---

## Architecture — CQRS

La logique métier est séparée en services server-side suivant le patron CQRS :

| Service | Rôle | Méthodes |
| --- | --- | --- |
| `NegotiationCommandService` | Mutations sur les échanges | `proposeExchange`, `sendMessage`, `acceptExchange`, `rejectExchange` |
| `NegotiationQueryService` | Lectures sur les échanges | `getExchangeById`, `getExchangesBySender`, `getExchangesByReceiver`, `getExchangesByVinyl`, `getMessageHistory` |
| `VinylQueryService` | Lectures sur les vinyles | `getAvailableVinyls`, `getVinylsByUser`, `getVinylById` |
| `UserQueryService` | Lectures sur les utilisateurs | `getUserByCode`, `getUserById` |

Les routes API n'embarquent aucun SQL — elles instancient le service adapté et délèguent.

---

## Statuts d'une demande

| Statut | Description |
| --- | --- |
| `PENDING` | En attente — négociation en cours, messages possibles |
| `ACCEPTED` | Accepté — les deux vinyles sont marqués indisponibles |
| `REJECTED` | Refusé |

---

## Authentification

L'identification se fait par un **code alphanumérique** attribué à chaque utilisateur en base. Il n'y a pas d'inscription, de récupération de mot de passe, ni de déconnexion. L'`id` de l'utilisateur connecté est conservé dans le `localStorage` du navigateur.

---

## Tests fonctionnels

Les tests couvrent les parcours **catalogue** et **négociation** avec des mocks d'API (pas de base de données réelle).

```bash
# Lancer les tests (le serveur de dev démarre automatiquement)
npm run test:e2e

# Mode interactif avec trace et debug
npm run test:e2e:ui
```

**Couverture :**

- Login : connexion valide, code invalide, champ vide
- Catalogue : affichage des vinyles, badge genre, navigation vers barter, liste vide, erreur API
- Proposition d'échange : soumission valide, validations formulaire, erreur API
- Négociation : récapitulatif, historique messages, envoi message, actions accept/refus selon rôle, état non-PENDING, erreur API

---

## Tests unitaires

Les tests unitaires couvrent les quatre services CQRS. Le client SQL est injecté par constructeur — aucun mock de module, aucune base de données réelle.

```bash
npm run test:unit
```

**66 tests répartis sur 4 fichiers :**

| Fichier | Service testé | Tests |
| --- | --- | --- |
| `NegotiationCommandService.test.ts` | `NegotiationCommandService` | 20 |
| `NegotiationQueryService.test.ts` | `NegotiationQueryService` | 25 |
| `VinylQueryService.test.ts` | `VinylQueryService` | 12 |
| `UserQueryService.test.ts` | `UserQueryService` | 9 |

**Ce que les tests vérifient :**
- Ordre et valeurs des paramètres SQL (pas d'inversion vinylA/vinylB, etc.)
- Retour de tous les résultats (pas seulement le premier)
- Atomicité de `acceptExchange` : la mise à jour des vinyls n'a pas lieu si celle de la demande échoue
- Distinction sender/receiver (JOIN sur `vinyl_a` vs `vinyl_b`)
- Propagation des erreurs DB sans les avaler

## CI GitHub Actions (.github/workflows/ci.yml)

Le workflow se déclenche sur tous les push et pull_request. Il comporte 3 jobs :

| Job | Outil | Declencheur


┌────────────┬─────────────────────────┬──────────────────┐                                                                                            
│    Job     │          Outil          │   Déclencheur    │                                                                                            
├────────────┼─────────────────────────┼──────────────────┤                                                                                            
│ unit-tests │ Vitest                  │ Toujours         │                                                                                            
├────────────┼─────────────────────────┼──────────────────┤
│ e2e-tests  │ Playwright (Chromium)   │ Après unit-tests │                                                                                            
├────────────┼─────────────────────────┼──────────────────┤
│ load-tests │ Vitest (config séparée) │ Après unit-tests │                                                                                            
└────────────┴─────────────────────────┴──────────────────┘

Chaque étape utilise npm ci (reproductible) + actions/setup-node@v4 avec cache npm. Le job E2E fait un npm run build avant les tests et publie le      
rapport Playwright comme artefact. Un échec dans n'importe quelle étape interrompt le pipeline (exit code != 0 → GitHub Actions stoppe le job).

La variable DATABASE_URL est lue depuis les secrets GitHub pour les E2E (les mocks Playwright ne l'utilisent pas, mais le build en a besoin si Next.js
y accède au démarrage).
                                                                                                                                                         
---                                                       
## Tests de charge (tests/load/negotiation.load.test.ts)

6 scénarios avec 50 opérations concurrentes via Promise.all sur un faux client SQL partagé en mémoire :

1. 50 proposeExchange simultanés → 50 lignes, IDs uniques, tous PENDING
2. 50 sendMessage simultanés sur la même demande → pas de perte, timestamps valides
3. 50 acceptExchange simultanés sur la même demande → statut final ACCEPTED, les deux vinyles available = false (pas de double-toggle)
4. Propositions entrelacées sur 3 paires de vinyles → chaque demande pointe sur la bonne paire, pas de croisement
5. Accepter/Refuser en parallèle des demandes distinctes → statuts cohérents, pas d'inversion
6. 50 demandes × 5 messages chacune → historique complet, aucun message orphelin 
