<?php

require_once __DIR__ . '/../main.inc.php';

requireLogin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ' . url('pages/events.php'));
    exit;
}

$eventId = trim($_POST['eventId'] ?? '');
$title = trim($_POST['title'] ?? '');
$type = trim($_POST['type'] ?? '');
$startDate = trim($_POST['startDate'] ?? '');
$endDate = trim($_POST['endDate'] ?? '');
$cityId = trim($_POST['cityId'] ?? '');
$nbGuests = max(1, (int) ($_POST['nbGuests'] ?? 1));
$isOutdoor = isset($_POST['isOutdoor']);
$description = trim($_POST['description'] ?? '');

if ($eventId === '' || $title === '' || $type === '' || $cityId === '' || $startDate === '' || $endDate === '') {
    $_SESSION['flash_error'] = "Impossible de modifier l'événement : certaines informations sont manquantes.";
    header('Location: ' . url('pages/events.php'));
    exit;
}

try {
    $startDateTime = new DateTime($startDate);
    $endDateTime = new DateTime($endDate);

    if ($endDateTime < $startDateTime) {
        $_SESSION['flash_error'] = 'La date de fin doit être postérieure ou égale à la date de début.';
        header('Location: ' . url('pages/events.php'));
        exit;
    }

    $payload = [
        'type' => $type,
        'startDate' => $startDateTime->format(DateTime::ATOM),
        'endDate' => $endDateTime->format(DateTime::ATOM),
        'description' => $description,
        'isOutdoor' => $isOutdoor,
        'nbGuests' => $nbGuests,
        'title' => $title,
        'FK_cityId' => $cityId,
    ];

    $api = new ApiClient(API_BASE_URL);

    $response = $api->put('/event/' . rawurlencode($eventId), $payload, getToken());

    if (!isset($response['event'])) {
        $_SESSION['flash_error'] = $response['message']
            ?? $response['error']
            ?? "Erreur lors de la modification de l'événement.";

        header('Location: ' . url('pages/events.php'));
        exit;
    }

    $_SESSION['flash_success'] = "L'événement a bien été modifié.";

    header('Location: ' . url('pages/events.php'));
    exit;
} catch (Exception $e) {
    $_SESSION['flash_error'] = $e->getMessage();

    header('Location: ' . url('pages/events.php'));
    exit;
}