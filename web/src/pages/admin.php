<?php

require_once __DIR__ . '/../main.inc.php';

requireAdmin();

$pageTitle = 'Administration';
$activePage = 'admin';

require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/navbar.php';

?>

<main class="page-wrapper">
    <div class="container py-5">

        <h1>Administration</h1>

        <p>Cette page est réservée aux administrateurs.</p>

    </div>
</main>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>