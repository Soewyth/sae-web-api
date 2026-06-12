<?php
require_once __DIR__ . '/../main.inc.php';
requireAdmin();

$pageTitle = 'Gestion des Utilisateurs';
$activePage = 'users';

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
            ) ?>" class="sidebar-link active text-decoration-none p-3">
                <i class="fas fa-users me-3"></i>
                <span class="hide-on-collapse">Utilisateurs</span>
            </a>

            <a href="<?= url(
              'pages/admin.php',
            ) ?>" class="sidebar-link text-decoration-none p-3">
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
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h1><i class="bi bi-people"></i> Gestion des Utilisateurs</h1>
            </div>

            <?php if (!empty($error)): ?>
                <div class="alert alert-danger" role="alert">
                    <i class="bi bi-exclamation-circle"></i> Erreur: <?= htmlspecialchars(
                      $error,
                    ) ?>
                </div>
            <?php endif; ?>

            <?php if (empty($users)): ?>
                <div class="alert alert-info" role="alert">
                    <i class="bi bi-info-circle"></i> Aucun utilisateur à afficher.
                </div>
            <?php else: ?>
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead class="table-light">
                            <tr>
                                <th>Nom d'utilisateur</th>
                                <th>Email</th>
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
                                    </td>
                                    <td>
                                        <?= htmlspecialchars($user['email']) ?>
                                    </td>
                                    <td>
                                        <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="collapse"
                                                data-bs-target="#details-<?= htmlspecialchars(
                                                  $user['id'],
                                                ) ?>"
                                                aria-expanded="false" aria-controls="details-<?= htmlspecialchars(
                                                  $user['id'],
                                                ) ?>">
                                            <i class="bi bi-chevron-down"></i> Détails
                                        </button>
                                        <a href="#" class="btn btn-sm btn-outline-primary"
                                           onclick="editUser('<?= htmlspecialchars(
                                             $user['id'],
                                           ) ?>')">
                                            <i class="bi bi-pencil"></i> Modifier
                                        </a>
                                    </td>
                                </tr>
                                <!-- Détails expandable -->
                                <tr>
                                    <td colspan="3">
                                        <div class="collapse" id="details-<?= htmlspecialchars(
                                          $user['id'],
                                        ) ?>">
                                            <div class="card card-body bg-light">
                                                <div class="row">
                                                    <div class="col-md-12">
                                                        <p><strong>ID:</strong> <code><?= htmlspecialchars(
                                                          $user['id'],
                                                        ) ?></code></p>
                                                        <p><strong>Email:</strong> <?= htmlspecialchars(
                                                          $user['email'],
                                                        ) ?></p>
                                                        <p><strong>Nom d'utilisateur:</strong> <?= htmlspecialchars(
                                                          $user['username'],
                                                        ) ?></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
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

<!-- Modal pour modifier un utilisateur -->
<div class="modal fade" id="editUserModal" tabindex="-1" aria-labelledby="editUserModalLabel" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h1 class="modal-title fs-5" id="editUserModalLabel">Modifier l'utilisateur</h1>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <form id="editUserForm">
          <div class="mb-3">
            <label for="editEmail" class="form-label">Email</label>
            <input type="email" class="form-control" id="editEmail" name="email">
          </div>
          <div class="mb-3">
            <label for="editUsername" class="form-label">Nom d'utilisateur</label>
            <input type="text" class="form-control" id="editUsername" name="username">
          </div>
          <div class="mb-3">
            <label for="editPassword" class="form-label">Nouveau mot de passe (laisser vide pour ne pas changer)</label>
            <input type="password" class="form-control" id="editPassword" name="password">
          </div>
          <input type="hidden" id="editUserId" name="userId">
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
        <button type="button" class="btn btn-primary" onclick="submitEditUser()">Enregistrer</button>
      </div>
    </div>
  </div>
</div>

<script>
function editUser(userId) {
    fetch('<?= API_BASE_URL ?>/user/' + userId, {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + '<?= getToken() ?? '' ?>'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.result) {
            document.getElementById('editUserId').value = userId;
            document.getElementById('editEmail').value = data.result.email;
            document.getElementById('editUsername').value = data.result.username;
            document.getElementById('editPassword').value = '';

            new bootstrap.Modal(document.getElementById('editUserModal')).show();
        }
    })
    .catch(error => {
        console.error('Erreur:', error);
        alert('Erreur lors de la récupération des informations');
    });
}

function submitEditUser() {
    const userId = document.getElementById('editUserId').value;
    const email = document.getElementById('editEmail').value;
    const username = document.getElementById('editUsername').value;
    const password = document.getElementById('editPassword').value;

    const data = {
        email: email,
        username: username
    };

    if (password) {
        data.password = password;
    }

    fetch('<?= API_BASE_URL ?>/user/' + userId, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + '<?= getToken() ?? '' ?>'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            alert('Utilisateur modifié avec succès');
            bootstrap.Modal.getInstance(document.getElementById('editUserModal')).hide();
            location.reload();
        }
    })
    .catch(error => {
        console.error('Erreur:', error);
        alert('Erreur lors de la modification');
    });
}
</script>
