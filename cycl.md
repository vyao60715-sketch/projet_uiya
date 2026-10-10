# Cycle d'exécution d'un prompt

> Ce fichier décrit **comment chaque demande (prompt) est traitée**, du moment où elle arrive jusqu'au moment où le travail est livré. Il s'applique à toute session de développement sur le projet, qu'elle soit faite par un développeur ou par un assistant IA.

## Vue d'ensemble

```
 Prompt reçu
     │
     ▼
 1. Lire le contexte ──► memoire.md, phase.md, architecture.md, securite.md
     │
     ▼
 2. Comprendre la demande ──► quelle phase ? quelle exigence (EF-xx) ? quelle règle (RG-xx) ?
     │
     ├── Ambigu ou contraire à une décision ? ──► 3. Poser la question, puis attendre
     │
     ▼
 4. Planifier ──► liste courte des fichiers à créer / modifier
     │
     ▼
 5. Implémenter ──► petites étapes, conventions de memoire.md
     │
     ▼
 6. Tester ──► tests automatiques + vérification manuelle
     │
     ├── Échec ? ──► retour à 5
     │
     ▼
 7. Contrôle sécurité ──► checklist de securite.md
     │
     ▼
 8. Mettre à jour la mémoire ──► memoire.md (journal, décisions), phase.md (cases cochées)
     │
     ▼
 9. Rendre compte ──► ce qui est fait, ce qui reste, points à valider
```

## Étapes détaillées

### 1. Lire le contexte
- Lire `memoire.md` en entier (décisions, règles, conventions, état).
- Lire dans `phase.md` la phase en cours et ses tâches.
- Ouvrir `architecture.md` et `securite.md` seulement pour les parties concernées.
- Regarder le code existant qui sera touché avant d'écrire quoi que ce soit.

### 2. Comprendre la demande
Répondre à ces questions avant de coder :
- À quelle **phase** appartient la demande ?
- Quelles **exigences** (EF-xx) et **règles de gestion** (RG-xx) sont concernées ?
- Quels **rôles** ont le droit de faire cette action ?
- Qu'est-ce qui prouvera que c'est terminé ?

### 3. Clarifier si nécessaire
On pose une question **avant** de coder si :
- la demande contredit une décision de `memoire.md` ou une règle de gestion ;
- elle touche une phase non encore commencée ;
- elle est ambiguë et une mauvaise interprétation coûterait cher à défaire (base de données, sécurité).

Sinon, on choisit l'interprétation la plus raisonnable et on la note dans le compte rendu.

### 4. Planifier
- Lister les fichiers à créer ou modifier (migration, modèle, contrôleur, requête, policy, test, écran).
- Découper en étapes vérifiables une par une.
- Ne pas faire plus que ce qui est demandé.

### 5. Implémenter
- Respecter l'organisation de `architecture.md` (contrôleur fin, logique dans les services).
- Valider toutes les entrées (Form Request côté Laravel).
- Vérifier les droits (Policy) pour chaque action.
- Écrire dans le journal d'audit pour toute action sensible.

### 6. Tester
- Lancer les tests existants : `php artisan test` (backend), `npm test` (web), `flutter test` (mobile).
- Ajouter au moins un test pour chaque exigence touchée : cas normal, cas refusé (droits), cas invalide (validation).
- Vérifier à la main le parcours principal dans l'interface.

### 7. Contrôle sécurité
Passer la **checklist rapide** de `securite.md` (section 9) sur le code modifié.

### 8. Mettre à jour la mémoire
- `memoire.md` : ajouter une ligne au journal des sessions ; ajouter toute nouvelle décision (D-xx) ; mettre à jour l'état d'avancement et les questions ouvertes.
- `phase.md` : cocher les tâches terminées.
- `architecture.md` : modifier si une route, une table ou un composant a changé.

### 9. Rendre compte
Un compte rendu court :
- **Fait :** ce qui fonctionne maintenant (avec les EF-xx couvertes).
- **Tests :** ce qui a été testé et le résultat.
- **Reste à faire / limites :** ce qui n'est pas couvert.
- **À valider :** les choix faits sans confirmation.

## Modèle de prompt

```
Phase : <numéro et nom de la phase>
Tâche : <ce qu'il faut faire>
Exigences : <EF-xx, RG-xx concernées>
Contraintes : <rôles, écrans, délais, ce qu'il ne faut pas toucher>
Terminé quand : <critère vérifiable>
```

**Exemple :**

```
Phase : 3 – Gestion des biens et codes QR
Tâche : créer l'enregistrement d'un bien avec attribution automatique du QR
Exigences : EF-09, EF-10, EF-11, EF-16, RG-01, RG-05, RG-06
Contraintes : seul le gestionnaire peut créer ; photo facultative, 2 Mo max
Terminé quand : un bien créé via POST /api/biens a un numéro d'inventaire,
un QR unique, une fin de garantie calculée, et les tests passent
```

## Règles d'or

1. Ne jamais commencer sans avoir lu `memoire.md`.
2. Ne jamais terminer sans avoir mis à jour `memoire.md` et `phase.md`.
3. Une règle de gestion ou une décision ne change que si elle est notée comme nouvelle décision.
4. Pas de code sans test pour une exigence P1.
5. Ne jamais affaiblir la sécurité pour aller plus vite.
