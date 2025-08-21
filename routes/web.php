<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect('/frontend/');
});

Route::get('/frontend', function () {
    return file_get_contents(public_path('frontend/index.html'));
});

Route::get('/frontend/', function () {
    return file_get_contents(public_path('frontend/index.html'));
});
