<?php

require_once __DIR__ . '/../main.inc.php';

requireLogin();

// Le tableau de bord s'ouvre sur la liste des événements
header('Location: ' . url('pages/events.php'));
exit;