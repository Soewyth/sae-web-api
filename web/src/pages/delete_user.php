<?php

require_once __DIR__ . '/../main.inc.php';

requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ' . url('pages/users.php'));
    exit;
}

$userId = trim($_POST['userId'] ?? '');

if ($userId === '') {
    $_SESSION['flash_error'] = "Impossible de supprimer l'utilisateur : identifiant manquant.";
    header('Location: ' . url('pages/users.php'));
    exit;
}

if ($userId === $_SESSION['user']['id']) {
    $_SESSION['flash_error'] = 'Vous ne pouvez pas supprimer votre propre compte.';
    header('Location: ' . url('pages/users.php'));
    exit;
}

try {
    $api = new ApiClient(API_BASE_URL);

    $response = $api->delete('/user/' . rawurlencode($userId), getToken());

    if (isset($response['error']) || !isset($response['message'])) {
        $_SESSION['flash_error'] = $response['message']
            ?? $response['error']
            ?? "Erreur lors de la suppression de l'utilisateur.";

        header('Location: ' . url('pages/users.php'));
        exit;
    }

    $_SESSION['flash_success'] = "L'utilisateur a bien été supprimé.";

    header('Location: ' . url('pages/users.php'));
    exit;
} catch (Exception $e) {
    $_SESSION['flash_error'] = $e->getMessage();

    header('Location: ' . url('pages/users.php'));
    exit;
}
