<?php
require_once __DIR__ . '/../main.inc.php';
requireAdmin();

$pageTitle = 'Utilisateurs';
$activePage = 'dashboard';
$activeSidebar = 'users';

require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/navbar.php';

$api = new ApiClient(API_BASE_URL);

// Récupérer tous les utilisateurs
$users = [];
$error = null;

try {
    $apiResponse = $api->get('/user', [], getToken());
    $users = $apiResponse['result'] ?? [];
} catch (Exception $e) {
    $error = $e->getMessage();
}

// Tri par date de création (plus récent en premier), ordre alphabétique sinon
usort($users, function ($a, $b) {
    $dateA = $a['createdAt'] ?? null;
    $dateB = $b['createdAt'] ?? null;

    if ($dateA !== null && $dateB !== null && $dateA !== $dateB) {
        return strcmp($dateB, $dateA);
    }
    if ($dateA !== null && $dateB === null) {
        return -1;
    }
    if ($dateA === null && $dateB !== null) {
        return 1;
    }

    return strcasecmp($a['username'] ?? '', $b['username'] ?? '');
});
?>

<main class="layout-sidebar">
    <?php require __DIR__ . '/../includes/sidebar.php'; ?>

    <div class="main-content">
        <div class="container py-5">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h1>Utilisateurs</h1>
            </div>

            <?php if (!empty($error)): ?>
                <div class="alert alert-danger" role="alert">
                    <i class="bi bi-exclamation-circle"></i> Erreur: <?= htmlspecialchars(
                                                                            $error,
                                                                        ) ?>
                </div>
            <?php endif; ?>

            <?php if (empty($users) && empty($error)): ?>
                <div class="alert alert-info" role="alert">
                    <i class="bi bi-info-circle"></i> Aucun utilisateur à afficher.
                </div>
            <?php elseif (!empty($users)): ?>
                <div class="table-responsive">
                    <table class="table table-hover" id="usersTable">
                        <thead class="table-light">
                            <tr>
                                <th>Nom d'utilisateur</th>
                                <th>Email</th>
                                <th>Créé le</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($users as $user): ?>
                                <tr>
                                    <td>
                                        <strong><?= htmlspecialchars(
                                                    $user['username'],
                                                ) ?></strong>
                                        <?php if (!empty($user['isAdmin'])): ?>
                                            <span class="badge bg-primary ms-1">Admin</span>
                                        <?php endif; ?>
                                    </td>
                                    <td><?= htmlspecialchars($user['email']) ?></td>
                                    <td>
                                        <?= isset($user['createdAt'])
                                            ? date(
                                                'd/m/Y H:i',
                                                strtotime($user['createdAt']),
                                            )
                                            : '—' ?>
                                    </td>
                                    <td>
                                        <?php if ($user['id'] !== $_SESSION['user']['id']): ?>
                                            <a href="#" class="btn btn-sm btn-outline-danger"
                                                onclick="deleteUser('<?= htmlspecialchars(
                                                                            $user['id'],
                                                                        ) ?>', '<?= htmlspecialchars(
                                                                            addslashes($user['username']),
                                                                        ) ?>'); return false;">
                                                <i class="bi bi-trash"></i> Supprimer
                                            </a>
                                        <?php else: ?>
                                            <span class="text-muted small">Votre compte</span>
                                        <?php endif; ?>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            <?php endif; ?>
        </div>
    </div>
</main>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>

<script>
    function deleteUser(userId, username) {
        if (!confirm("Êtes-vous sûr de vouloir supprimer l'utilisateur \"" + username + "\" ?")) {
            return;
        }

        const form = document.createElement('form');
        form.method = 'post';
        form.action = '<?= url('pages/delete_user.php') ?>';

        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'userId';
        input.value = userId;

        form.appendChild(input);
        document.body.appendChild(form);
        form.submit();
    }
</script>
