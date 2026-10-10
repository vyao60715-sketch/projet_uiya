<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BatimentController;
use App\Http\Controllers\Api\BienController;
use App\Http\Controllers\Api\CategorieController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\FournisseurController;
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
    });

    Route::middleware('permission:gerer_biens')->group(function () {
        Route::post('/biens', [BienController::class, 'store']);
        Route::put('/biens/{bien}', [BienController::class, 'update']);
        Route::delete('/biens/{bien}', [BienController::class, 'destroy']);
    });

    /*
    |--------------------------------------------------------------------------
    | COMPTES UTILISATEURS (EF-04) — admin uniquement
    |--------------------------------------------------------------------------
    */

    Route::middleware('role:admin')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::put('/users/{user}', [UserController::class, 'update']);
        Route::delete('/users/{user}', [UserController::class, 'destroy']);
    });
});
