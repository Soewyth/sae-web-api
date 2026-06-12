<?php

require_once __DIR__ . '/../main.inc.php';

requireLogin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ' . url('pages/events.php'));
    exit;
}

$eventId = trim($_POST['eventId'] ?? '');

if ($eventId === '') {
    $_SESSION['flash_error'] = "Impossible de supprimer l'événement : identifiant manquant.";
    header('Location: ' . url('pages/events.php'));
    exit;
}

try {
    $api = new ApiClient(API_BASE_URL);

    $response = $api->delete('/event/' . rawurlencode($eventId), getToken());

    if (!isset($response['event'])) {
        $_SESSION['flash_error'] = $response['message']
            ?? $response['error']
            ?? "Erreur lors de la suppression de l'événement.";

        header('Location: ' . url('pages/events.php'));
        exit;
    }

    $_SESSION['flash_success'] = "L'événement a bien été supprimé.";

    header('Location: ' . url('pages/events.php'));
    exit;
} catch (Exception $e) {
    $_SESSION['flash_error'] = $e->getMessage();

    header('Location: ' . url('pages/events.php'));
    exit;
}