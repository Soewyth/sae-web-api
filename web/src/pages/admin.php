<?php

require_once __DIR__ . '/../main.inc.php';

requireAdmin();

$pageTitle = 'Administration';
$activePage = 'admin';

require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/navbar.php';
?>

<main>
    <nav class="sidebar">
        <div class="nav flex-column">
            <a href="<?= url(
              'pages/events.php',
            ) ?>" class="sidebar-link text-decoration-none p-3">
                <i class="fas fa-calendar me-3"></i>
                <span class="hide-on-collapse">Événements</span>
            </a>

            <a href="<?= url(
              'pages/users.php',
            ) ?>" class="sidebar-link text-decoration-none p-3">
                <i class="fas fa-users me-3"></i>
                <span class="hide-on-collapse">Utilisateurs</span>
            </a>

            <a href="<?= url(
              'pages/admin.php',
            ) ?>" class="sidebar-link active text-decoration-none p-3">
                <i class="fas fa-cog me-3"></i>
                <span class="hide-on-collapse">Admin</span>
            </a>
        </div>

        <div class="profile-section mt-auto p-4">
            <div class="d-flex align-items-center">
                <div class="ms-3 profile-info">
                    <h6 class="text-white mb-0"><?= $_SESSION['user'][
                      'username'
                    ] ?></h6>
                    <small class="text-muted">Admin</small>
                </div>
            </div>
        </div>
    </nav>

    <div class="main-content">
        <div class="container py-5">

            <div class="mb-4">
                <h1>
                    <i class="bi bi-gear"></i> Panneau d'Administration
                </h1>
                <p class="text-muted">Bienvenue dans le panneau d'administration. Gérez les utilisateurs et les événements.</p>
            </div>

            <div class="row g-4">
                <!-- Carte Gestion des Utilisateurs -->
                <div class="col-md-6">
                    <div class="card h-100 shadow-sm">
                        <div class="card-body">
                            <div class="d-flex align-items-center mb-3">
                                <i class="bi bi-people fs-1 text-primary me-3"></i>
                                <div>
                                    <h5 class="card-title mb-0">Gestion des Utilisateurs</h5>
                                    <small class="text-muted">Modifier les profils et les rôles</small>
                                </div>
                            </div>
                            <p class="card-text">Consultez, modifiez et gérez les rôles de tous les utilisateurs de la plateforme.</p>
                            <a href="<?= url(
                              'pages/users.php',
                            ) ?>" class="btn btn-primary">
                                <i class="bi bi-arrow-right"></i> Gérer les utilisateurs
                            </a>
                        </div>
                    </div>
                </div>

                <!-- Carte Gestion des Événements -->
                <div class="col-md-6">
                    <div class="card h-100 shadow-sm">
                        <div class="card-body">
                            <div class="d-flex align-items-center mb-3">
                                <i class="bi bi-calendar-event fs-1 text-success me-3"></i>
                                <div>
                                    <h5 class="card-title mb-0">Gestion des Événements</h5>
                                    <small class="text-muted">Superviser tous les événements</small>
                                </div>
                            </div>
                            <p class="card-text">Consultez, modifiez et supprimez tous les événements créés par les utilisateurs.</p>
                            <a href="<?= url(
                              'pages/events.php',
                            ) ?>" class="btn btn-success">
                                <i class="bi bi-arrow-right"></i> Gérer les événements
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Section Statistiques -->
            <div class="row g-4 mt-4">
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-body text-center">
                            <i class="bi bi-person-check text-primary" style="font-size: 2rem;"></i>
                            <h6 class="card-title mt-3">Utilisateurs</h6>
                            <p class="card-text display-6">--</p>
                            <small class="text-muted">Cliquez sur "Gérer" pour voir la liste</small>
                        </div>
                    </div>
                </div>

                <div class="col-md-4">
                    <div class="card">
                        <div class="card-body text-center">
                            <i class="bi bi-calendar-check text-success" style="font-size: 2rem;"></i>
                            <h6 class="card-title mt-3">Événements</h6>
                            <p class="card-text display-6">--</p>
                            <small class="text-muted">Cliquez sur "Gérer" pour voir la liste</small>
                        </div>
                    </div>
                </div>

                <div class="col-md-4">
                    <div class="card">
                        <div class="card-body text-center">
                            <i class="bi bi-shield-exclamation text-warning" style="font-size: 2rem;"></i>
                            <h6 class="card-title mt-3">Administrateurs</h6>
                            <p class="card-text display-6">--</p>
                            <small class="text-muted">Nombre d'admins actifs</small>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>
</main>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
