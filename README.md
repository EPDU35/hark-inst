# Hackathon L1 — Site d'inscription
**Organisé par Eliel Poster x le BDE MIAGE-GI**

## Structure du projet

```
hackathon/
├── public/
│   ├── index.html      # Page principale (accueil + formulaire)
│   ├── admin.html      # Tableau de bord admin
│   ├── style.css       # Styles complets
│   └── app.js          # JavaScript frontend
├── data/               # Créé automatiquement (SQLite)
├── server.js           # Serveur Express + API
├── package.json
└── README.md
```

## Installation

```bash
cd hackathon
npm install
npm start
```

Le serveur démarre sur **http://localhost:3000**

## Pages

| URL | Description |
|-----|-------------|
| `/` | Page d'accueil + formulaire d'inscription |
| `/admin.html` | Tableau de bord administrateur |

## API

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/api/register` | Créer une inscription |
| `GET` | `/api/admin/registrations` | Lister toutes les inscriptions |
| `GET` | `/api/admin/registrations/:ref` | Détail d'une inscription |
| `PATCH` | `/api/admin/registrations/:ref/paid` | Marquer comme payé |

## Base de données

SQLite via `better-sqlite3`. Le fichier `data/hackathon.db` est créé automatiquement au premier démarrage.

### Schéma `registrations`

| Colonne | Type | Description |
|---------|------|-------------|
| `reference` | TEXT | Code unique (ex: HCK-3A9F2C) |
| `nom` / `prenom` | TEXT | Identité du participant |
| `email` | TEXT | Email (unique) |
| `mode` | TEXT | `solo` ou `groupe` |
| `teammates` | TEXT | JSON des coéquipiers |
| `payment_method` | TEXT | `mobile_money` ou `cash` |
| `transaction_id` | TEXT | Code de transaction Mobile Money |
| `total` | INTEGER | Montant en XOF |
| `paid` | INTEGER | 0 = en attente, 1 = confirmé |
| `created_at` | TEXT | Date d'inscription |

## Tarification

- **1 000 XOF par personne**
- Solo : 1 000 XOF
- Duo : 2 000 XOF
- Trio : 3 000 XOF
