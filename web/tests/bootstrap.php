<?php

declare(strict_types=1);

// Session en mémoire uniquement (pas d'écriture disque pendant les tests)
ini_set('session.use_cookies', '0');
ini_set('session.use_trans_sid', '0');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Les constantes sont définies ici pour éviter les conflits avec require_once de main.inc.php
// main.inc.php les définit via config.php (require_once), donc pas de double définition
require_once __DIR__ . '/../src/config/config.php';
require_once __DIR__ . '/../src/class/ApiClient.class.php';
require_once __DIR__ . '/../src/main.inc.php';
