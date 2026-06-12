<?php

require_once __DIR__ . '/../main.inc.php';

requireLogin();

$pageTitle = 'Tableau de bord';
$activePage = 'dashboard';

require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/navbar.php';
?>


<main>

    <nav class="sidebar">



        <div class="nav flex-column">
            <a href="<?= url(
              'pages/events.php',
            ) ?>" class="sidebar-link active text-decoration-none p-3">
                <i class="fas fa-home me-3"></i>
                <span class="hide-on-collapse">Evenements</span>
            </a>

            <a href="reviews.php" class="sidebar-link active text-decoration-none p-3">
                <i class="fas fa-home me-3"></i>
                <span class="hide-on-collapse">Avis</span>
            </a>

        </div>

        <div class="profile-section mt-auto p-4">
            <div class="d-flex align-items-center">
                <div class="ms-3 profile-info">
                    <h6 class="text-white mb-0"><?= $_SESSION['user'][
                      'username'
                    ] ?></h6>
                    <?php if ($_SESSION['user']['isAdmin'] === 'true'): ?>
                        <small class="text-muted">Admin</small>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </nav>
