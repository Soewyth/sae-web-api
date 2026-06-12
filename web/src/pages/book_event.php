<?php

require_once __DIR__ . '/../main.inc.php';

requireLogin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ' . url('index.php'));
    exit;
}

$eventName = trim($_POST['eventName'] ?? '');
$eventType = trim($_POST['eventType'] ?? '');
$setting = trim($_POST['setting'] ?? '');
$duration = max(1, (int) ($_POST['duration'] ?? 1));
$nbGuests = max(1, (int) ($_POST['nbGuests'] ?? 1));
$description = trim($_POST['description'] ?? '');
$cityId = trim($_POST['cityId'] ?? '');
$startDate = trim($_POST['startDate'] ?? '');

if ($eventName === '' ||$eventType === '' ||$cityId === '' ||$startDate === '') 
{
    $_SESSION['flash_error'] = "Impossible de créer l'événement : certaines informations sont manquantes.";
    header('Location: ' . url('index.php'));
    exit;
}

try {
    $startDateTime = new DateTime($startDate);

    // On ajoute 1 an car les données météo viennent de l'année précédente
    $startDateTime->modify('+1 year');

    $endDateTime = clone $startDateTime;
    $endDateTime->modify('+' . ($duration - 1) . ' days');

    $payload = [
        'type' => $eventType,
        'startDate' => $startDateTime->format(DateTime::ATOM),
        'endDate' => $endDateTime->format(DateTime::ATOM),
        'description' => $description,
        'isOutdoor' => $setting === 'outdoor',
        'nbGuests' => $nbGuests,
        'title' => $eventName,
        'FK_cityId' => $cityId,
    ];

    $api = new ApiClient(API_BASE_URL);

    $response = $api->post('/event', $payload, getToken());

    if (!isset($response['result'])) {
        $_SESSION['flash_error'] = $response['message']
            ?? $response['error']
            ?? "Erreur lors de la création de l'événement.";

        header('Location: ' . url('index.php'));
        exit;
    }

    $_SESSION['flash_success'] = $response['message'] ?? "L'événement a bien été créé.";

    header('Location: ' . url('index.php'));
    exit;
} catch (Exception $e) {
    $_SESSION['flash_error'] = $e->getMessage();

    header('Location: ' . url('index.php'));
    exit;
}