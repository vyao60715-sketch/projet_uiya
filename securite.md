# Sécurité – Gestion du patrimoine mobilier UIYA

> Objectif : seules les bonnes personnes voient et modifient les bonnes données, et chaque action laisse une trace.

## 1. Authentification

- Connexion par e-mail + mot de passe ; jetons d'API **Laravel Sanctum** pour le web et le mobile.
- Mots de passe hachés avec **bcrypt / argon2** (jamais stockés en clair, jamais renvoyés par l'API).
- Mot de passe : 8 caractères minimum, avec lettres et chiffres.
- **Blocage** temporaire du compte après 5 tentatives échouées (limitation de débit `throttle` sur `/api/login`).
- Réinitialisation par lien e-mail **à usage unique**, valable 60 minutes.
- Jetons révoqués à la déconnexion et quand un compte est désactivé.
- Expiration des jetons : 8 h sur le web ; plus longue sur le mobile, avec révocation possible par l'administrateur.

## 2. Autorisations (contrôle d'accès)

- Rôles et permissions gérés avec **spatie/laravel-permission**.
- **Chaque route** de l'API vérifie la permission côté serveur (middleware + Policy). Masquer un bouton dans l'interface ne suffit pas.
- Filtrage par périmètre :
  - un **responsable** ne voit que les biens de son service ;
  - un **agent** ne voit que les biens des campagnes qui lui sont assignées.
- Protection contre l'accès direct par identifiant (IDOR) : la Policy vérifie que l'utilisateur a le droit sur **cet** objet, pas seulement sur ce type d'objet.
- Matrice des droits : voir le cahier des charges, section 3.

## 3. Validation des données

- Toutes les entrées passent par des **Form Requests** Laravel (types, longueurs, formats, existence des clés étrangères).
- Requêtes SQL via Eloquent / requêtes préparées uniquement → protection contre l'**injection SQL**.
- Affichage React par défaut échappé → protection contre le **XSS** ; ne jamais utiliser `dangerouslySetInnerHTML` avec des données utilisateur.
- Les règles de gestion (statuts autorisés, dates de prêt) sont vérifiées **côté serveur**, même si l'interface les vérifie déjà.

## 4. Codes QR

- Le QR ne contient qu'un **UUID** (ou une URL avec cet UUID), jamais de prix, de nom ou d'autre donnée.
- Scanner un QR ne donne aucun droit : la fiche n'est affichée qu'après authentification, selon le rôle.
- UUID aléatoire (v4), impossible à deviner à partir du numéro d'inventaire.

## 5. Fichiers (photos, imports)

- Types acceptés : JPEG, PNG pour les photos ; XLSX pour les imports.
- Taille maximale : 2 Mo par photo, 5 Mo par import.
- Vérification du type réel du fichier (MIME), pas seulement de l'extension.
- Fichiers renommés par le serveur et stockés **hors du dossier public** ; servis par une route contrôlée.

## 6. Communications

- **HTTPS obligatoire** partout (certificat TLS) ; redirection HTTP → HTTPS.
- CORS limité au domaine de l'application web.
- En-têtes de sécurité : `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`.
- Secrets (clé d'application, mot de passe de la base, SMTP) uniquement dans `.env`, **jamais** dans Git.

## 7. Application mobile

- Jeton stocké dans un stockage sécurisé (`flutter_secure_storage`), pas en clair.
- Base locale hors ligne limitée aux biens de la campagne en cours, **vidée** après synchronisation et à la déconnexion.
- Synchronisation idempotente : un même contrôle envoyé deux fois ne crée pas de doublon.
- Le serveur revérifie les droits de l'agent sur chaque contrôle synchronisé.

## 8. Traçabilité, sauvegarde et exploitation

- **Journal d'audit** : qui, quoi, quand, valeurs avant / après, adresse IP ; table en ajout seul (aucune modification ni suppression par l'application) ; conservé au moins 5 ans.
- Actions journalisées : connexion, échec de connexion, création / modification / suppression de bien, mouvement, décision sur une demande, réforme, changement de rôle, export de rapport.
- **Sauvegarde** quotidienne de la base et des fichiers, copie hors du serveur, test de restauration chaque mois.
- Mode debug désactivé en production (`APP_DEBUG=false`) ; erreurs détaillées uniquement dans les journaux serveur.
- Dépendances mises à jour régulièrement (`composer audit`, `npm audit`).

## 9. Checklist rapide (à chaque modification)

- [ ] La route exige un jeton (sauf connexion / mot de passe oublié).
- [ ] La permission et la Policy sont vérifiées côté serveur.
- [ ] Le périmètre (service, campagne) est filtré.
- [ ] Toutes les entrées sont validées par une Form Request.
- [ ] Aucune donnée sensible dans la réponse (mot de passe, jeton, champs internes).
- [ ] L'action sensible est écrite dans le journal d'audit.
- [ ] Aucun secret dans le code ou dans Git.
- [ ] Un test vérifie qu'un utilisateur sans droit reçoit 403.

## 10. Risques principaux

| Risque | Mesure |
| --- | --- |
| Vol de mot de passe | Hachage, blocage après échecs, HTTPS |
| Responsable qui consulte les biens d'un autre service | Filtrage par périmètre + Policy |
| Téléphone d'agent perdu | Jeton révocable, base locale vidée, stockage sécurisé |
| Faux signalement de perte | Validation obligatoire par le gestionnaire |
| Perte de la base | Sauvegarde quotidienne hors serveur |
| Modification cachée d'un bien | Journal d'audit non modifiable |
