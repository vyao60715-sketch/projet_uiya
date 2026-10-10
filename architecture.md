# Architecture – Gestion du patrimoine mobilier UIYA

## 1. Vue d'ensemble

Le système repose sur **une API centrale** consommée par **deux clients** : une application web et une application mobile.

```
┌──────────────────────┐        ┌──────────────────────┐
│  Application web     │        │  Application mobile  │
│  React.js            │        │  Flutter             │
│  (admin, gestionnaire│        │  (agent, gestionnaire│
│   responsable)       │        │   responsable)       │
└──────────┬───────────┘        └──────────┬───────────┘
           │ HTTPS / JSON                  │ HTTPS / JSON
           │                               │ + stockage local SQLite/Hive
           └───────────────┬───────────────┘   (mode hors ligne)
                           ▼
              ┌──────────────────────────┐
              │  API REST – Laravel (PHP)│
              │  Auth (Sanctum) · RBAC   │
              │  Métier · Validation     │
              │  QR · PDF/Excel · Audit  │
              └──────┬─────────┬─────────┘
                     │         │
          ┌──────────▼──┐   ┌──▼──────────────────────┐
          │  MySQL      │   │ Tâches planifiées / Queue│
          │  (données)  │   │ alertes, e-mails (SMTP)  │
          └─────────────┘   └──────────────────────────┘
                     │
          ┌──────────▼──────────┐
          │ Stockage fichiers   │
          │ photos, étiquettes  │
          └─────────────────────┘
```

## 2. Choix techniques

| Couche | Technologie | Rôle |
| --- | --- | --- |
| Backend / API | Laravel 11 (PHP 8.2+) | Logique métier, API REST, sécurité |
| Authentification | Laravel Sanctum | Jetons d'API pour le web et le mobile |
| Rôles et permissions | spatie/laravel-permission | Contrôle d'accès par rôle (RBAC) |
| Codes QR | simplesoftwareio/simple-qrcode | Génération des QR codes |
| Exports | barryvdh/laravel-dompdf, maatwebsite/excel | Rapports PDF et Excel, import Excel |
| Interface web | React.js (Vite) + React Router + Axios | Écrans de gestion et tableaux de bord |
| Application mobile | Flutter + mobile_scanner + sqflite/Hive | Scan QR, inventaire hors ligne |
| Base de données | MySQL 8 | Stockage persistant |
| Notifications | Laravel Notifications + Scheduler + Queue | Alertes in-app et e-mail |

## 3. Organisation du code

```
uiya-patrimoine/
├── backend/                  # Laravel
│   ├── app/
│   │   ├── Models/           # Bien, Categorie, Affectation, Mouvement...
│   │   ├── Http/Controllers/Api/
│   │   ├── Http/Requests/    # validation des entrées
│   │   ├── Http/Resources/   # format des réponses JSON
│   │   ├── Policies/         # droits par ressource
│   │   ├── Services/         # logique métier (QrService, InventaireService...)
│   │   ├── Notifications/
│   │   └── Console/          # commandes planifiées (alertes)
│   ├── database/migrations/
│   ├── database/seeders/     # rôles, permissions, admin initial
│   ├── routes/api.php
│   └── tests/                # Feature + Unit
├── web/                      # React
│   └── src/
│       ├── api/              # appels Axios
│       ├── pages/            # un dossier par module
│       ├── components/
│       ├── hooks/
│       └── context/          # authentification, rôle courant
├── mobile/                   # Flutter
│   └── lib/
│       ├── data/             # API + base locale
│       ├── models/
│       ├── screens/          # scan, inventaire, fiche bien, demandes
│       ├── services/         # synchronisation, scanner
│       └── state/
└── docs/                     # ce dossier
```

## 4. Modèle de données (entités principales)

| Entité | Champs clés | Relations |
| --- | --- | --- |
| users | nom, email, mot_de_passe, service_id, actif | a un rôle, appartient à un service |
| services | nom, code | a des salles, des utilisateurs, des biens |
| batiments / salles | nom, code | une salle appartient à un bâtiment |
| categories | nom, code (3 lettres, pour le numéro d'inventaire), duree_garantie_mois, periodicite_maintenance_mois | a des biens |
| fournisseurs | nom, contact, type (fournisseur / prestataire) | — |
| biens | numero_inventaire, uuid_qr, designation, marque, modele, numero_serie, date_acquisition, prix, etat, statut, fin_garantie, prochaine_maintenance, photo | catégorie, fournisseur, affectation courante |
| affectations | bien_id, service_id, salle_id, responsable_id, type (permanente / pret), date_debut, date_retour_prevue, date_retour_effective | — |
| mouvements | bien_id, type, origine, destination, motif, auteur_id, date | historique non modifiable |
| demandes | bien_id, type (transfert / panne / perte), motif, photo, statut, decision_motif, demandeur_id, traite_par | — |
| maintenances | bien_id, type (preventive / corrective), date, prestataire_id, cout, pieces, resultat, sous_garantie | — |
| campagnes_inventaire | nom, date_debut, date_fin, statut, perimetre | a des agents, des contrôles |
| controles_inventaire | campagne_id, bien_id, agent_id, present, etat, salle_constatee, observation, photo, date_controle, synchronise | — |
| notifications | Laravel standard | — |
| journal_audit | user_id, action, entite, entite_id, avant (JSON), apres (JSON), ip, date | non modifiable |

## 5. Points d'architecture importants

### 5.1 Code QR
- Le code QR est **attribué automatiquement** juste après l'enregistrement d'un bien (événement `created` du modèle `Bien` → `QrService`).
- Le QR contient **uniquement un identifiant opaque** (UUID) ou une URL du type `https://patrimoine.uiya.ci/b/{uuid}`, jamais de données sensibles.
- Le numéro d'inventaire suit un format fixe, par exemple `UIYA-{CAT}-{ANNEE}-{SEQ}`.

### 5.2 Mode hors ligne (mobile)
1. Avant la campagne, l'agent télécharge la liste des biens de son périmètre dans la base locale.
2. Les contrôles sont enregistrés localement avec un identifiant client (UUID) et un horodatage.
3. Au retour du réseau, l'application envoie les contrôles en lot à `POST /api/inventaires/{id}/sync`.
4. Le serveur traite chaque contrôle de façon **idempotente** (même UUID = pas de doublon) et renvoie les conflits au gestionnaire.

### 5.3 Alertes
- Une commande planifiée s'exécute chaque jour (`schedule:run` via cron).
- Elle recherche : garanties à J-30, maintenances à J-15, prêts à J-1 / J et prêts en retard.
- Les e-mails partent par une file d'attente (queue) pour ne pas bloquer l'API.

### 5.4 Statuts d'un bien
`Disponible → Affecté / En prêt → En maintenance → Perdu / Réformé`. Les transitions autorisées sont centralisées dans un seul service (`BienStatutService`) ; aucun contrôleur ne modifie le statut directement.

## 6. API REST (principales routes)

| Méthode | Route | Rôle |
| --- | --- | --- |
| POST | /api/login, /api/logout | Authentification |
| POST | /api/password/forgot, /api/password/reset | Mot de passe oublié |
| GET/POST/PUT/DELETE | /api/users | Comptes (admin) |
| GET/POST/PUT/DELETE | /api/categories, /api/services, /api/salles, /api/fournisseurs | Référentiels |
| GET/POST/PUT/DELETE | /api/biens | Biens |
| GET | /api/biens/qr/{uuid} | Fiche d'un bien après scan |
| GET | /api/biens/{id}/etiquette | Étiquette PDF |
| POST | /api/biens/{id}/affecter, /transferer, /preter, /retour | Mouvements |
| GET | /api/biens/{id}/historique | Historique |
| GET/POST | /api/demandes ; POST /api/demandes/{id}/valider, /rejeter | Circuit de validation |
| GET/POST | /api/maintenances | Maintenance |
| GET/POST | /api/inventaires ; POST /api/inventaires/{id}/sync, /cloturer | Inventaire |
| GET | /api/dashboard | Indicateurs selon le rôle |
| GET | /api/rapports/{type}?format=pdf|xlsx | Rapports |
| GET | /api/notifications | Notifications de l'utilisateur |

Toutes les routes, sauf la connexion et le mot de passe oublié, exigent un jeton valide.
