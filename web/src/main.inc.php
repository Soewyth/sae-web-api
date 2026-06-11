<?php

session_start();

require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/class/ApiClient.class.php';

/**
 * Permet de savoir si l'utilisateur est connecté.
 * générique pour l'instant.
 * TODO coorriger avec token reçu par l'API.
 */
function isUserLoggedIn(): bool
{
    return isset($_SESSION['user']);
}

/**
 * Permet de simplifier les liens   
 */
function url(string $path): string
{
    return BASE_URL . '/' . ltrim($path, '/');
}


function isAdmin(): bool
{
    return isset($_SESSION['user']) && isset($_SESSION['user']['isAdmin']) && ($_SESSION['user']['isAdmin'] === true);
}


function requireLogin(): void
{
    if (!isUserLoggedIn()){
        header('Location: ' . url('pages/login.php'));
        exit;
    }
}

function requireAdmin(): void
{
    requireLogin();

    if (!isAdmin()){
        header('Location: ' . url('pages/403.php'));
        exit;
    }
}