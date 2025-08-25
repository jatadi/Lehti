<?php

use App\Http\Controllers\Api\AlertController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SymptomLogController;
use App\Http\Controllers\Api\TreatmentController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Authentication routes
Route::group(['prefix' => 'auth'], function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    
    Route::middleware('auth:api')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('refresh', [AuthController::class, 'refresh']);
    });
});

// Demo API routes (no authentication required)
// Symptom logs CRUD
Route::apiResource('symptom-logs', SymptomLogController::class);

// Treatments CRUD
Route::apiResource('treatments', TreatmentController::class);

// Alerts
Route::get('alerts', [AlertController::class, 'index']);
Route::get('alerts/{id}', [AlertController::class, 'show']);
Route::post('alerts/{id}/resolve', [AlertController::class, 'resolve']);
Route::post('alerts/recompute', [AlertController::class, 'recompute']);
