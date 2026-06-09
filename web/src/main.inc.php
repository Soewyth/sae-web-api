<?php

session_start();

require_once __DIR__ . '/config/config.php';

/**
 * Permet de savoir si l'utilisateur est connecté.
 * générique pour l'instant.
 * TODO coorriger avec token reçu par l'API.
 */
function isUserLoggedIn(): bool
{
    return true;
    // return isset($_SESSION['user']);
}

/**
 * Permet de simplifier les liens   
 */
function url(string $path): string
{
    return BASE_URL . '/' . ltrim($path, '/');
}

