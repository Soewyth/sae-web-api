<?php

$activeSidebar = $activeSidebar ?? ''; ?>

<nav class="sidebar">
    <div class="nav flex-column">
        <a href="<?= url(
          'pages/events.php',
        ) ?>" class="sidebar-link <?= $activeSidebar === 'events'
  ? 'active'
  : '' ?> text-decoration-none p-3">
            <i class="fas fa-calendar me-3"></i>
            <span class="hide-on-collapse">Événements</span>
        </a>

        <a href="<?= url(
          'pages/reviews.php',
        ) ?>" class="sidebar-link <?= $activeSidebar === 'reviews'
  ? 'active'
  : '' ?> text-decoration-none p-3">
            <i class="fas fa-star me-3"></i>
            <span class="hide-on-collapse">Avis</span>
        </a>

        <?php if (isAdmin()): ?>
            <a href="<?= url(
              'pages/users.php',
            ) ?>" class="sidebar-link <?= $activeSidebar === 'users'
  ? 'active'
  : '' ?> text-decoration-none p-3">
                <i class="fas fa-users me-3"></i>
                <span class="hide-on-collapse">Utilisateurs</span>
            </a>

            <a href="<?= url(
              'pages/logs.php',
            ) ?>" class="sidebar-link <?= $activeSidebar === 'logs'
  ? 'active'
  : '' ?> text-decoration-none p-3">
                <i class="fas fa-list-ul me-3"></i>
                <span class="hide-on-collapse">Logs</span>
            </a>
        <?php endif; ?>
    </div>

    <div class="profile-section mt-auto p-4">
        <div class="d-flex align-items-center">
            <div class="ms-3 profile-info">
                <h6 class="text-white mb-0"><?= htmlspecialchars(
                  $_SESSION['user']['username'],
                ) ?></h6>
                <?php if (isAdmin()): ?>
                    <small class="text-muted">Admin</small>
                <?php endif; ?>
            </div>
        </div>
    </div>
</nav>