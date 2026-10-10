# Mémoire du projet – Gestion du patrimoine mobilier UIYA

> Ce fichier est la **mémoire de référence** du projet. Il est lu au début de chaque prompt et mis à jour à la fin (voir `cycl.md`). Il doit rester court : les détails vont dans `architecture.md`, `securite.md` et `phase.md`.

## 1. Le projet en bref

- **Thème :** conception et réalisation d'un outil de gestion du patrimoine mobilier de l'Université Internationale de Yamoussoukro (UIYA).
- **Cadre :** mémoire de fin d'études en informatique (Yao Victoire), encadré par M. IRIE Foua, avec le cabinet 3CPS SARL.
- **But :** remplacer le suivi papier / Excel par une application web et mobile où chaque bien est identifié par un code QR.
- **Utilisateurs :** administrateur, gestionnaire du patrimoine, responsable de service, agent d'inventaire.

## 2. Pile technique

Laravel (API REST) · React.js (web) · Flutter (mobile, SQLite/Hive hors ligne) · MySQL.

## 3. Interfaces (maquettes)

Le dossier **`interfaces/`** contient les **interfaces de l'application** : les maquettes de tous les écrans, à respecter lors du développement.

- `interfaces/index.html` : vue d'ensemble de tous les écrans.
- `interfaces/images/` : captures PNG numérotées (01 à 11 = web, 12 à 18 = mobile).
- `interfaces/html/` : chaque écran en page HTML (référence pour les couleurs, tailles et textes).
- `interfaces/README.md` : liste des 18 écrans avec l'application et le rôle concernés.

Charte retenue : bleu pétrole `#0E5A6B` (accent), ardoise `#17262B` (menu, texte), fond `#F4F5F2`, police IBM Plex Sans (IBM Plex Mono pour les numéros d'inventaire).

## 4. Décisions prises

| # | Décision | Raison |
| --- | --- | --- |
| D-01 | Le code QR est attribué automatiquement juste après l'enregistrement du bien | Aucune action manuelle, aucun oubli |
| D-02 | Le QR ne contient qu'un UUID ou une URL, jamais de données | Sécurité, QR toujours valable si la fiche change |
| D-03 | Un bien réformé n'est jamais supprimé | Traçabilité complète |
| D-04 | Les statuts ne changent que via un service central | Respect des règles de gestion |
| D-05 | Une demande du responsable passe toujours par la validation du gestionnaire | Circuit de validation du cahier des charges |
| D-06 | Inventaire hors ligne avec synchronisation idempotente | Locaux sans réseau |
| D-07 | Un bien non retrouvé n'est pas déclaré perdu automatiquement | Le gestionnaire décide après vérification |
| D-08 | Délais d'alerte paramétrables (30 j garantie, 15 j maintenance, J-1/J prêt) | Souplesse |
| D-09 | Convention de nommage retenue : français pour les tables/colonnes métier (snake_case), anglais pour le code applicatif (classes, méthodes) | Cohérence avec les maquettes et le vocabulaire métier UIYA, code Laravel idiomatique |
| D-10 | Rôles : `admin`, `gestionnaire`, `responsable`, `agent` (spatie/laravel-permission) | Correspond aux 4 profils de `memoire.md` §1 |
| D-11 | Double protection sur la connexion : throttle IP (20/min, large) + blocage de compte après 5 échecs (15 min), indépendants | Le throttle seul (par IP) ne protège pas un compte ciblé depuis plusieurs IP ; le blocage de compte seul ne protège pas contre le brute-force massif multi-comptes |
| D-12 | Format du numéro d'inventaire implémenté : `UIYA-{CODE_CATEGORIE}-{ANNEE}-{SEQ}` (ex. UIYA-INF-2026-0001), code catégorie = 3 lettres ajoutées au référentiel `categories` | Format déjà utilisé partout dans les maquettes (`interfaces/`) ; **reste à faire valider formellement par l'UIYA** (question ouverte §10 pas encore fermée) |
| D-13 | Le QR encode `{FRONTEND_URL}/biens/scan/{uuid}` (jamais de données du bien) | Respecte D-02 ; scanner redirige vers la fiche web, qui revérifie les droits avant d'afficher quoi que ce soit |
| D-14 | Photo du bien stockée sur le disque `local` (hors `public/`), servie uniquement par `GET /api/biens/{id}/photo` avec jeton | Exigence `securite.md` §5 : fichiers hors dossier public, servis par route contrôlée |

## 5. Règles de gestion à ne jamais casser

1. Numéro d'inventaire et QR uniques et immuables.
2. Un bien = une catégorie.
3. Un bien affecté = un seul service, une seule salle, un seul responsable à la fois.
4. Un prêt a toujours une date de retour.
5. Un bien en maintenance, perdu ou réformé ne peut être ni affecté, ni transféré, ni prêté.
6. Seul un bien sans aucun mouvement peut être supprimé.
7. Un responsable n'agit que sur les biens de son service.
8. Un rejet de demande est toujours motivé.
9. Un bien n'est que dans une seule campagne d'inventaire ouverte.
10. Toute action sensible est inscrite au journal d'audit.

## 6. Conventions

- **Langue :** interface et messages en français ; code (classes, variables) en anglais ou en français, mais **le même partout** — choix retenu : _à fixer en phase 1_.
- **API :** réponses JSON `{ data, message, errors }`, codes HTTP standards (200, 201, 401, 403, 404, 422).
- **Base de données :** tables au pluriel, en snake_case ; clés étrangères `xxx_id`.
- **Git :** une branche par fonctionnalité (`feature/m3-biens`), messages de commit clairs, `main` toujours stable.
- **Tests :** chaque exigence P1 a au moins un test.

## 7. Glossaire

| Terme | Sens |
| --- | --- |
| Bien | Objet mobilier suivi (chaise, ordinateur, climatiseur…) |
| Affectation | Attribution d'un bien à un service, une salle, un responsable |
| Prêt | Affectation temporaire avec date de retour |
| Transfert | Changement d'affectation |
| Réforme | Sortie définitive du patrimoine |
| Campagne | Opération d'inventaire physique sur un périmètre et une période |
| Écart | Différence entre la liste théorique et le constat sur le terrain |

## 8. État d'avancement

| Phase | Statut | Dernière mise à jour |
| --- | --- | --- |
| Phase 0 – Cadrage | Terminée (hors validation UIYA) | 2026-10-10 |
| Phase 1 – Conception | Partielle (maquettes faites ; UML/BDD à faire) | 2026-10-10 |
| Phase 2 – Socle technique et authentification | Terminée | 2026-10-10 |
| Phase 3 – Gestion des biens et codes QR | Quasi terminée (EF-09,10,11,13,14,16,17,18,19 faits ; EF-12/15 saisie par lot et import Excel restent, P2) | 2026-10-10 |
| Phase 4 – Affectations et mouvements | Quasi terminée (EF-20 à EF-23 faits ; EF-24 fiche imprimable reste, P3) | 2026-10-10 |
| Phases 5 à 8 | À faire | — |

## 9. Journal des sessions

> Une ligne par session de travail : date, ce qui a été fait, ce qui reste.

- 2026-10-10 — Cahier des charges fonctionnel rédigé ; création des fichiers de pilotage (`architecture.md`, `memoire.md`, `cycl.md`, `securite.md`, `phase.md`).
- 2026-10-10 — Maquettes des 18 interfaces (11 web, 7 mobile) ajoutées dans `interfaces/`.
- 2026-10-10 — Dépôt Git initialisé (`origin` = github.com/vyao60715-sketch/projet_uiya). Backend Laravel créé (`backend/`) : migrations users/services/batiments/salles/categories/fournisseurs/journal_audit, Sanctum + spatie/laravel-permission, 4 rôles + admin (`admin@uiya.ci`), API connexion/déconnexion/mot de passe oublié/profil/référentiels/comptes, journal d'audit générique (`AuditService`), 16 tests Feature (connexion, blocage après 5 échecs, droits 403, validation 422) — tous verts. Non fait : écrans web pas encore branchés à l'API réelle (toujours en mock sauf la connexion) ; UML et script BDD de la phase 1 toujours à faire.
- 2026-10-10 — Base vidée des données fictives (`migrate:fresh`, ne reste que rôles + admin) ; retrait de tous les tableaux MOCK du frontend (Dashboard, Biens, Utilisateurs, Demandes, Maintenance, Inventaire), chaque écran affiche un vrai état vide.
- 2026-10-10 — **Phase 3** : migration `biens` (ajout colonne `code` à `categories`), modèle `Bien` avec génération auto du numéro d'inventaire (`NumeroInventaireService`), de l'UUID QR et des dates (garantie/maintenance) à la création ; `QrService` (SVG, simplesoftwareio/simple-qrcode) ; `BienStatutService` central (D-04) ; `BienController` complet (CRUD, recherche/filtres, fiche par UUID, photo privée servie par route contrôlée, étiquettes PDF unité + planche via barryvdh/laravel-dompdf) ; écrans web `Biens`, `NouveauBien`, nouvelle page `FicheBien` + routes `/biens/:id` et `/biens/scan/:uuid`. 12 nouveaux tests Feature (28 au total) — tous verts. Activé `pdo_sqlite` et `gd` dans `php.ini` (nécessaires aux tests et au QR). Limite connue : étiquettes PDF générées sur feuille A4 (pas de format timbre/étiquette dédié — bug DomPDF sur papier personnalisé très petit, voir code). Non fait : EF-12 (saisie par lot) et EF-15 (import Excel), classées P2.
- 2026-10-10 — Écran web **Référentiels** (`/referentiels`, admin + gestionnaire) : catégories, services, bâtiments, salles, fournisseurs — liste, création, suppression, le tout branché sur l'API réelle. `referentiels.js` complété (il ne couvrait que la lecture pour la plupart des référentiels). Ferme le dernier point ouvert de la Phase 2.
- 2026-10-10 — **Phase 4** : migrations `affectations`/`mouvements`, `AffectationService` central (affecter/transferer/preter/retour, RG-03 une seule affectation active, RG-04 un prêt exige une date de retour, RG-05 via les transitions déjà posées dans `BienStatutService`), `AffectationController`, historique automatique (EF-23). Web : `FicheBien.jsx` — boutons d'action selon le statut, formulaire inline, onglet historique. Ouvert la lecture de `GET /api/users` au gestionnaire (besoin de choisir un responsable). 9 nouveaux tests (38 au total) — tous verts. **Erreur commise pendant les tests manuels** : j'ai supprimé par erreur le bien "CB" que l'utilisateur avait créé lui-même, en le confondant avec mes données de test — à surveiller, être plus prudent sur le nettoyage des données de test quand la base contient du contenu réel de l'utilisateur.
- 2026-10-10 — Correctif : création d'un bien en 500 (`Carbon::rawAddUnit(): ... string given`). Cause : `duree_garantie_mois` arrivait en chaîne (FormData) et n'était pas casté côté modèle. Ajout du cast `integer` sur `duree_garantie_mois`/`categorie_id`/`fournisseur_id` dans `Bien`, plus cast explicite `(int)` aux appels `addMonths()`.
- 2026-10-10 — Correctif important : les messages de validation s'affichaient comme des clés brutes (`"validation.alpha"`) au lieu d'un texte en français, faute de fichiers de traduction (`APP_LOCALE=fr` sans `lang/fr`). Installé `laravel-lang/lang` et publié `lang/fr/{validation,auth,passwords,pagination}.php` — corrige tous les messages d'erreur de l'application, pas seulement les catégories. Au passage, `duree_garantie_mois`/`periodicite_maintenance_mois` des catégories sont passés de `required` à `nullable` (défaut 0) pour plus de tolérance côté formulaire.

## 10. Questions ouvertes

- [ ] L'application mobile doit-elle aussi fonctionner sur iOS ?
- [ ] Format exact du numéro d'inventaire à valider avec l'UIYA.
- [ ] Hébergement : serveur de l'université ou hébergeur externe ?
- [ ] Existe-t-il un fichier Excel des biens actuels à importer ?
