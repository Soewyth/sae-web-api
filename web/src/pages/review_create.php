<?php

require_once __DIR__ . '/../main.inc.php';

requireLogin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ' . url('pages/events.php'));
    exit;
}

$eventId = $_POST['event_id'] ?? '';
$rating = (int) ($_POST['rating'] ?? 0);
$comment = trim($_POST['comment'] ?? '');

if ($eventId === '') {
    $_SESSION['flash_error'] = "Impossible d'ajouter l'avis : événement introuvable.";
    header('Location: ' . url('pages/events.php'));
    exit;
}

if ($rating < 1 || $rating > 5) {
    $_SESSION['flash_error'] = "La note doit être comprise entre 1 et 5.";
    header('Location: ' . url('pages/events.php'));
    exit;
}

$api = new ApiClient(API_BASE_URL);

try {
    $apiResponse = $api->post(
        '/event/' . rawurlencode($eventId) . '/review',
        [
            'rating' => $rating,
            'comment' => $comment,
        ],
        getToken()
    );

    if (isset($apiResponse['result'])) {
        $_SESSION['flash_success'] = 'Votre avis a bien été ajouté.';
    } else {
        $_SESSION['flash_error'] =
            $apiResponse['message']
            ?? $apiResponse['error']
            ?? "Erreur lors de l'ajout de l'avis.";
    }
} catch (Exception $e) {
    $_SESSION['flash_error'] = $e->getMessage();
}

header('Location: ' . url('pages/events.php'));
exit;