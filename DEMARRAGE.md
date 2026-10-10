# Démarrer le projet UIYA en local

## 1. Prérequis à lancer une seule fois par session

**XAMPP – MySQL**
Ouvrir le panneau XAMPP et cliquer **Start** sur le module **MySQL** (Apache n'est pas nécessaire, le backend utilise son propre serveur).

## 2. Backend (API Laravel) — terminal n°1

```powershell
cd c:\xampp\htdocs\projet-uiya\backend
php artisan serve
```

→ API disponible sur **http://localhost:8000**

Première fois seulement (ou après un `git pull` qui change les dépendances) :

```powershell
composer install
php artisan migrate --seed
```

## 3. Frontend (React) — terminal n°2

```powershell
cd c:\xampp\htdocs\projet-uiya\web
npm run dev
```

→ Application disponible sur **http://localhost:5173**

Première fois seulement :

```powershell
npm install
```

## 4. Se connecter

Ouvrir **http://localhost:5173/connexion**

| Champ | Valeur |
| --- | --- |
| E-mail | `admin@uiya.ci` |
| Mot de passe | `Admin@2026` |

## 5. Arrêter

`Ctrl+C` dans chaque terminal. Pas besoin d'arrêter MySQL (XAMPP) entre deux sessions.

## Dépannage rapide

| Problème | Cause probable | Solution |
| --- | --- | --- |
| Le frontend n'arrive pas à se connecter à l'API | Backend pas lancé | Vérifier que `php artisan serve` tourne sur le port 8000 |
| Erreur de connexion à la base | MySQL arrêté | Démarrer MySQL dans XAMPP |
| `SQLSTATE[HY000] [1049] Unknown database` | Base `uiya_biens` absente | Dans phpMyAdmin, créer la base `uiya_biens` (utf8mb4_unicode_ci), puis `php artisan migrate --seed` |
| Page blanche sur :5173 | Dépendances npm manquantes | `npm install` dans `web/` |
