# Découpage du projet en phases

> Le projet est découpé en **9 phases**. Chacune produit quelque chose qui fonctionne et se termine par un critère vérifiable. On ne commence une phase que lorsque la précédente est terminée (sauf indication contraire). Cocher les tâches au fur et à mesure (voir `cycl.md`, étape 8).

| Phase | Nom | Modules / exigences | Dépend de |
| --- | --- | --- | --- |
| 0 | Cadrage | Cahier des charges | — |
| 1 | Conception | UML, base de données, maquettes | 0 |
| 2 | Socle technique et authentification | M1, M2 (EF-01 à EF-08) | 1 |
| 3 | Gestion des biens et codes QR | M3, M4 (EF-09 à EF-19) | 2 |
| 4 | Affectations et mouvements | M5 (EF-20 à EF-24) | 3 |
| 5 | Demandes, maintenance et alertes | M6, M7, M9 (EF-25 à EF-32, EF-39) | 4 |
| 6 | Application mobile et inventaire | M8 (EF-33 à EF-38) | 3, 4 |
| 7 | Tableaux de bord, rapports et audit | M9 (EF-40 à EF-42) | 5, 6 |
| 8 | Recette, déploiement et formation | Tout | 7 |

---

## Phase 0 – Cadrage ✅

- [x] Analyser l'existant à l'UIYA
- [x] Rédiger le cahier des charges fonctionnel
- [x] Créer les fichiers de pilotage (`memoire.md`, `architecture.md`, `cycl.md`, `securite.md`, `phase.md`)
- [ ] Faire valider le cahier des charges par l'UIYA

**Terminé quand :** le cahier des charges est validé.

---

## Phase 1 – Conception

- [ ] Diagramme de cas d'utilisation (par acteur)
- [ ] Diagramme de classes
- [ ] Diagrammes de séquence : enregistrement d'un bien, scan QR, demande + validation, synchronisation d'inventaire
- [ ] Diagramme d'états du bien (6 statuts)
- [ ] MCD / MLD / MPD et script de la base
- [x] Maquettes des écrans web principaux (voir `interfaces/`)
- [x] Maquettes des écrans mobiles (voir `interfaces/`)
- [ ] Fixer les conventions de nommage (voir `memoire.md`, section 6)

**Livrable :** dossier de conception.
**Terminé quand :** chaque exigence P1 est couverte par au moins un diagramme ou une maquette.

---

## Phase 2 – Socle technique et authentification

- [x] Créer le dépôt Git et les projets backend et web *(mobile Flutter : phase 6, pas encore créé)*
- [x] Configurer `.env`, base MySQL, HTTPS en local *(HTTP en local pour l'instant ; HTTPS prévu au déploiement, phase 8)*
- [x] Migrations : users, services, bâtiments, salles, catégories, fournisseurs, journal_audit
- [x] Installer Sanctum et spatie/laravel-permission ; seeder des 4 rôles et de l'admin
- [x] API : connexion, déconnexion, mot de passe oublié, profil (EF-01 à EF-03)
- [x] API : gestion des comptes (EF-04), blocage après 5 échecs (EF-05)
- [x] API : référentiels (EF-06 à EF-08)
- [x] Web : écran de connexion, menu selon le rôle, écrans des référentiels
- [x] Mise en place du journal d'audit (service générique)
- [x] Tests : connexion, droits par rôle (403), validation

**Terminé quand :** chaque rôle se connecte et ne voit que son menu ; l'admin gère comptes et référentiels.

---

## Phase 3 – Gestion des biens et codes QR

- [x] Migration et modèle `biens` avec statuts
- [x] Enregistrement d'un bien (EF-09) avec photo
- [x] Numéro d'inventaire automatique (EF-10)
- [x] Calcul fin de garantie et prochaine maintenance (EF-11)
- [x] **Attribution automatique du QR juste après l'enregistrement** (EF-16)
- [x] Étiquettes PDF à l'unité et en planche (EF-17)
- [x] Route de fiche par UUID (EF-18) et recherche manuelle (EF-19)
- [x] Recherche et filtres (EF-13), fiche détaillée (EF-14)
- [ ] Saisie par lot (EF-12) et import Excel (EF-15) — P2, pas encore fait
- [x] Web : liste, formulaire, fiche, impression des étiquettes
- [x] Tests : unicité du QR, calcul des dates, droits (403 responsable)

**Terminé quand :** un bien créé reçoit son QR, son étiquette s'imprime et le scan (web) ouvre la bonne fiche.

---

## Phase 4 – Affectations et mouvements

- [ ] Migrations `affectations` et `mouvements`
- [ ] Service central des statuts (`BienStatutService`) avec transitions autorisées
- [ ] Affectation (EF-20), transfert (EF-21), prêt et retour (EF-22)
- [ ] Historique automatique (EF-23)
- [ ] Fiche de mouvement imprimable (EF-24) — P3
- [ ] Web : écrans d'affectation, de transfert, de prêt ; onglet historique
- [ ] Tests : règles RG-03, RG-04, RG-07

**Terminé quand :** chaque mouvement apparaît dans l'historique et les transitions interdites sont refusées.

---

## Phase 5 – Demandes, maintenance et alertes

- [ ] Migration `demandes` ; création par le responsable (EF-25)
- [ ] Validation / rejet motivé par le gestionnaire (EF-26)
- [ ] Mise à jour automatique du bien (EF-27) ; suivi des demandes (EF-28)
- [ ] Migration `maintenances` ; planification (EF-29) et interventions (EF-30)
- [ ] Garantie (EF-31) et proposition de réforme (EF-32) — P2
- [ ] Notifications in-app et e-mail (EF-39) via file d'attente
- [ ] Commande planifiée quotidienne : garanties J-30, maintenances J-15, prêts J-1 / J / retard
- [ ] Web : écrans demandes, maintenances, centre de notifications
- [ ] Tests : circuit complet d'une demande, déclenchement des alertes

**Terminé quand :** une demande suit tout le circuit et les alertes partent aux bonnes dates.

---

## Phase 6 – Application mobile et inventaire

- [ ] Projet Flutter : connexion, stockage sécurisé du jeton
- [ ] Scan QR et fiche du bien ; saisie manuelle de secours
- [ ] Signalements du responsable depuis le mobile
- [ ] API et web : création de campagne (EF-33)
- [ ] Mobile : téléchargement de la liste (EF-34), contrôle par scan (EF-35)
- [ ] Base locale et mode hors ligne (EF-36)
- [ ] Synchronisation idempotente et gestion des conflits
- [ ] Bien non répertorié (EF-37) — P2
- [ ] Clôture et rapport d'écarts (EF-38)
- [ ] Tests : inventaire coupé du réseau puis synchronisé sans perte ni doublon

**Terminé quand :** une campagne complète se fait sans réseau et produit le bon rapport d'écarts.

---

## Phase 7 – Tableaux de bord, rapports et audit

- [ ] Tableau de bord par rôle (EF-40)
- [ ] Rapports : liste générale, par service, mouvements, maintenances, garanties, inventaire, réformés / perdus, statistiques
- [ ] Exports PDF et Excel (EF-41)
- [ ] Écran de consultation du journal d'audit (EF-42)
- [ ] Tests : exactitude des chiffres sur un jeu de données connu

**Terminé quand :** chaque rapport s'exporte avec les bons filtres et les bons chiffres.

---

## Phase 8 – Recette, déploiement et formation

- [ ] Dérouler les critères de recette du cahier des charges
- [ ] Audit de sécurité avec la checklist de `securite.md`
- [ ] Déployer sur le serveur cible (HTTPS, cron, file d'attente, sauvegardes)
- [ ] Importer les biens existants et imprimer les étiquettes
- [ ] Générer l'APK Android
- [ ] Rédiger les guides (un par profil) et le guide d'installation
- [ ] Former les utilisateurs

**Livrables :** application en production, APK, documentation, cahier de recette.
**Terminé quand :** toutes les exigences P1 passent la recette sur des données réelles de l'UIYA.
