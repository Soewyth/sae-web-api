<?php

$activePage = $activePage ?? '';

?>

<header class="top-header">
    <nav class="navbar navbar-expand-lg navbar-dark app-navbar">
        <div class="container-fluid px-4">

            <a class="navbar-brand d-flex align-items-center gap-2 fw-bold" href="<?= url('index.php') ?>">
                <span class="brand-icon">
                    <i class="bi bi-compass-fill"></i>
                </span>
                <span><?= APP_NAME ?></span>
            </a>

            <button 
                class="navbar-toggler" 
                type="button" 
                data-bs-toggle="collapse" 
                data-bs-target="#mainNavbar" 
                aria-controls="mainNavbar" 
                aria-expanded="false" 
                aria-label="Ouvrir le menu"
            >
                <span class="navbar-toggler-icon"></span>
            </button>

            <div class="collapse navbar-collapse" id="mainNavbar">

                <ul class="navbar-nav mx-auto mb-2 mb-lg-0">

                    <li class="nav-item">
                        <a 
                            class="nav-link <?= $activePage === 'home' ? 'active' : '' ?>" 
                            href="<?= url('index.php') ?>"
                        >
                            Home
                        </a>
                    </li>

                    <li class="nav-item">
                        <a 
                            class="nav-link <?= $activePage === 'explore' ? 'active' : '' ?>" 
                            href="<?= url('pages/explore.php') ?>"
                        >
                            Explore
                        </a>
                    </li>

                    <li class="nav-item">
                        <a 
                            class="nav-link <?= $activePage === 'dashboard' ? 'active' : '' ?>" 
                            href="<?= url('pages/dashboard.php') ?>"
                        >
                            Dashboard
                        </a>
                    </li>

                    <?php if (isAdmin()) : ?>
                    <li class="nav-item">
                        <a 
                            class="nav-link <?= $activePage === 'admin' ? 'active' : '' ?>" 
                            href="<?= url('pages/admin/index.php') ?>"
                        >
                            Admin
                        </a>
                    </li>
                <?php endif; ?>

                </ul>

                <div class="d-flex align-items-center gap-2">
                    <?php if (isUserLoggedIn()) : ?>

                        <a href="<?= url('pages/profile.php') ?>" class="btn btn-outline-light btn-sm">
                            Mon compte
                        </a>

                        <a href="<?= url('pages/logout.php') ?>" class="btn btn-app-secondary btn-sm">
                            Logout
                        </a>

                    <?php else : ?>

                        <a href="<?= url('pages/login.php') ?>" class="btn btn-app-secondary btn-sm">
                            Login
                        </a>

                    <?php endif; ?>
                </div>

            </div>
        </div>
    </nav>
</header>