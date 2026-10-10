# Démarrer le projet UIYA en local

> **État actuel :** Phases 0–6 terminées. Backend Laravel + React web + Flutter mobile.

## 1. Prérequis (une seule fois par session)

**XAMPP – MySQL**
Ouvrir le panneau XAMPP et cliquer **Start** sur le module **MySQL** (Apache n'est pas nécessaire).

---

## 2. Backend — terminal n°1

```powershell
cd c:\xampp\htdocs\projet-uiya\backend
php artisan serve
```

→ API disponible sur **http://localhost:8000**

**Première fois ou après `git pull` :**

```powershell
composer install
php artisan migrate --seed
```

---

## 3. Frontend web (React) — terminal n°2

```powershell
cd c:\xampp\htdocs\projet-uiya\web
npm run dev
```

→ Application web sur **http://localhost:5173**

**Première fois :**

```powershell
npm install
```

---

## 4. Application mobile Flutter — terminal n°3 *(optionnel)*

Requis : Android Studio + émulateur démarré, ou téléphone connecté en USB.

```powershell
cd c:\xampp\htdocs\projet-uiya\mobile
flutter run
```

> **URL du serveur pour l'émulateur Android :** `http://10.0.2.2:8000/api` (déjà configurée par défaut).
> Pour un vrai téléphone sur le même Wi-Fi, aller dans les paramètres de l'appli et saisir `http://192.168.x.x:8000/api`.

**Première fois :**

```powershell
flutter pub get
```

---

## 5. Se connecter (web et mobile)

| Champ | Valeur |
| --- | --- |
| E-mail | `admin@uiya.ci` |
| Mot de passe | `Admin@2026` |

Ouvrir **http://localhost:5173/connexion** pour le web.

---

## 6. Alertes quotidiennes (scheduler)

En production, le scheduler Laravel envoie les alertes à 07h00 (garanties J-30, maintenances J-15, prêts en retard).
Pour tester manuellement :

```powershell
cd c:\xampp\htdocs\projet-uiya\backend
php artisan uiya:alertes
```

Pour simuler le scheduler en local (toutes les minutes) :

```powershell
php artisan schedule:work
```

---

## 7. Arrêter

`Ctrl+C` dans chaque terminal ouvert. MySQL (XAMPP) peut rester actif entre sessions.

---

## Dépannage rapide

| Problème | Cause probable | Solution |
| --- | --- | --- |
| API inaccessible depuis le frontend | Backend pas lancé | Vérifier que `php artisan serve` tourne sur le port 8000 |
| Erreur 419 / CORS | Port Vite différent de 5173 | Le fichier `config/cors.php` accepte tous les ports `localhost:*` — vérifier que `APP_URL` et `SANCTUM_STATEFUL_DOMAINS` dans `.env` sont corrects |
| Erreur de connexion MySQL | MySQL arrêté | Démarrer MySQL dans XAMPP |
| `Unknown database 'uiya_biens'` | Base absente | Dans phpMyAdmin : créer la base `uiya_biens` (utf8mb4_unicode_ci), puis `php artisan migrate --seed` |
| Page blanche sur :5173 | Dépendances npm manquantes | `npm install` dans `web/` |
| Bien sans QR code | Extension `gd` absente | Activer `extension=gd` dans `C:\PHP\php.ini` |
| Tests échouent avec "could not find driver" | Extension SQLite absente | Activer `extension=pdo_sqlite` dans `C:\PHP\php.ini` |
| Flutter : "Unable to connect" | Mauvaise URL serveur | Sur émulateur : utiliser `10.0.2.2` à la place de `localhost` |
| Notifications non reçues | File d'attente non démarrée | `php artisan queue:work` dans un terminal dédié |

---

## Comptes de test

| Rôle | E-mail | Mot de passe |
| --- | --- | --- |
| Administrateur | `admin@uiya.ci` | `Admin@2026` |

Les autres comptes sont créés via **Administration → Comptes et rôles → + Nouveau compte**.
