<?php

require_once __DIR__ . '/../main.inc.php';

$pageTitle = 'Accès refusé';

require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/navbar.php';

?>

<main class="page-wrapper">
    <div class="container py-5">

        <h1>Accès refusé</h1>

        <p>Vous n'avez pas les droits nécessaires pour accéder à cette page.</p>

        <a href="<?= url('index.php') ?>" class="btn btn-app-secondary">
            Retour à l'accueil
        </a>

    </div>
</main>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>