<?php

session_start();

require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/class/ApiClient.class.php';

/**
 * To know if user is connected
 */
function isUserLoggedIn(): bool
{
    return isset($_SESSION['token'], $_SESSION['user']);
}

/**
 * To facilitate writing links
 */
function url(string $path): string
{
    return BASE_URL . '/' . ltrim($path, '/');
}

function getUser(): ?array
{
    return $_SESSION['user'] ?? null;
}


function getToken(): ?string
{
    return $_SESSION['token'] ?? null;
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