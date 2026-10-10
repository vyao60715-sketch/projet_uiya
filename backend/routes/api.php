<?php

use App\Http\Controllers\Api\AffectationController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BatimentController;
use App\Http\Controllers\Api\BienController;
use App\Http\Controllers\Api\CategorieController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DemandeController;
use App\Http\Controllers\Api\FournisseurController;
use App\Http\Controllers\Api\MaintenanceController;
use App\Http\Controllers\Api\SalleController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| AUTHENTIFICATION (EF-01 à EF-03)
|--------------------------------------------------------------------------
*/

Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:20,1')
    ->name('login');

Route::post('/password/forgot', [AuthController::class, 'forgotPassword'])
    ->middleware('throttle:5,1')
    ->name('password.forgot');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    Route::get('/user', [AuthController::class, 'profile'])->name('user.profile');

    /*
    |--------------------------------------------------------------------------
    | TABLEAU DE BORD
    |--------------------------------------------------------------------------
    */

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/notifications', [DashboardController::class, 'notifications'])->name('notifications');
    Route::post('/notifications/{id}/lue', [DashboardController::class, 'marquerLue']);

    /*
    |--------------------------------------------------------------------------
    | RÉFÉRENTIELS (EF-06 à EF-08)
    |--------------------------------------------------------------------------
    */

    Route::get('/services', [ServiceController::class, 'index']);
    Route::get('/batiments', [BatimentController::class, 'index']);
    Route::get('/salles', [SalleController::class, 'index']);
    Route::get('/categories', [CategorieController::class, 'index']);
    Route::get('/fournisseurs', [FournisseurController::class, 'index']);

    Route::middleware('role:admin|gestionnaire')->group(function () {
        Route::post('/services', [ServiceController::class, 'store']);
        Route::put('/services/{service}', [ServiceController::class, 'update']);
        Route::delete('/services/{service}', [ServiceController::class, 'destroy']);

        Route::post('/batiments', [BatimentController::class, 'store']);
        Route::put('/batiments/{batiment}', [BatimentController::class, 'update']);
        Route::delete('/batiments/{batiment}', [BatimentController::class, 'destroy']);

        Route::post('/salles', [SalleController::class, 'store']);
        Route::put('/salles/{salle}', [SalleController::class, 'update']);
        Route::delete('/salles/{salle}', [SalleController::class, 'destroy']);

        Route::post('/categories', [CategorieController::class, 'store']);
        Route::put('/categories/{categorie}', [CategorieController::class, 'update']);
        Route::delete('/categories/{categorie}', [CategorieController::class, 'destroy']);

        Route::post('/fournisseurs', [FournisseurController::class, 'store']);
        Route::put('/fournisseurs/{fournisseur}', [FournisseurController::class, 'update']);
        Route::delete('/fournisseurs/{fournisseur}', [FournisseurController::class, 'destroy']);
    });

    /*
    |--------------------------------------------------------------------------
    | BIENS ET CODES QR (EF-09 à EF-19)
    |--------------------------------------------------------------------------
    */

    Route::middleware('permission:consulter_biens')->group(function () {
        Route::get('/biens', [BienController::class, 'index']);
        Route::get('/biens/qr/{uuid}', [BienController::class, 'showByUuid']);
        Route::get('/biens/etiquettes/planche', [BienController::class, 'etiquettesPlanche']);
        Route::get('/biens/{bien}', [BienController::class, 'show']);
        Route::get('/biens/{bien}/photo', [BienController::class, 'photo']);
        Route::get('/biens/{bien}/qr', [BienController::class, 'qr']);
        Route::get('/biens/{bien}/etiquette', [BienController::class, 'etiquette']);
        Route::get('/biens/{bien}/historique', [AffectationController::class, 'historique']);
    });

    Route::middleware('permission:gerer_biens')->group(function () {
        Route::post('/biens', [BienController::class, 'store']);
        Route::put('/biens/{bien}', [BienController::class, 'update']);
        Route::delete('/biens/{bien}', [BienController::class, 'destroy']);
    });

    /*
    |--------------------------------------------------------------------------
    | AFFECTATIONS ET MOUVEMENTS (EF-20 à EF-23)
    |--------------------------------------------------------------------------
    */

    Route::middleware('permission:gerer_affectations')->group(function () {
        Route::post('/biens/{bien}/affecter', [AffectationController::class, 'affecter']);
        Route::post('/biens/{bien}/transferer', [AffectationController::class, 'transferer']);
        Route::post('/biens/{bien}/preter', [AffectationController::class, 'preter']);
        Route::post('/biens/{bien}/retour', [AffectationController::class, 'retour']);
    });

    /*
    |--------------------------------------------------------------------------
    | DEMANDES (EF-25 à EF-28)
    |--------------------------------------------------------------------------
    */

    Route::middleware('permission:creer_demandes|gerer_demandes')->group(function () {
        Route::get('/demandes', [DemandeController::class, 'index']);
    });

    Route::middleware('permission:creer_demandes')->group(function () {
        Route::post('/demandes', [DemandeController::class, 'store']);
    });

    Route::middleware('permission:gerer_demandes')->group(function () {
        Route::post('/demandes/{demande}/valider', [DemandeController::class, 'valider']);
        Route::post('/demandes/{demande}/rejeter', [DemandeController::class, 'rejeter']);
    });

    /*
    |--------------------------------------------------------------------------
    | MAINTENANCES ET GARANTIES (EF-29 à EF-31)
    |--------------------------------------------------------------------------
    */

    Route::middleware('permission:gerer_maintenances')->group(function () {
        Route::get('/maintenances', [MaintenanceController::class, 'index']);
        Route::post('/maintenances', [MaintenanceController::class, 'store']);
        Route::put('/maintenances/{maintenance}', [MaintenanceController::class, 'update']);
    });

    /*
    |--------------------------------------------------------------------------
    | COMPTES UTILISATEURS (EF-04)
    |--------------------------------------------------------------------------
    */

    // Lecture ouverte au gestionnaire aussi : besoin de choisir un responsable
    // lors d'une affectation/transfert/prêt (EF-20 à EF-22).
    Route::middleware('role:admin|gestionnaire')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
    });

    Route::middleware('role:admin')->group(function () {
        Route::post('/users', [UserController::class, 'store']);
        Route::put('/users/{user}', [UserController::class, 'update']);
        Route::delete('/users/{user}', [UserController::class, 'destroy']);
    });
});
