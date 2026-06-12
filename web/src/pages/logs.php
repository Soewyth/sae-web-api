<?php
require_once __DIR__ . '/../main.inc.php';
requireAdmin();

$pageTitle = 'Logs';
$activePage = 'dashboard';
$activeSidebar = 'logs';

require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/navbar.php';

$api = new ApiClient(API_BASE_URL);

// Filtres (query string)
$validMethods = ['GET', 'POST', 'PUT', 'DELETE'];
$filterUserId = trim($_GET['user'] ?? '');
$filterMethod = in_array($_GET['method'] ?? '', $validMethods, true)
    ? $_GET['method']
    : '';

// Récupérer les logs (du plus récent au plus ancien, triés par l'API)
$logs = [];
$error = null;

try {
    $queryParams = [];
    if ($filterUserId !== '') {
        $queryParams['userId'] = $filterUserId;
    }
    if ($filterMethod !== '') {
        $queryParams['method'] = $filterMethod;
    }

    $apiResponse = $api->get('/logs', $queryParams, getToken());
    $logs = $apiResponse['result'] ?? [];
} catch (Exception $e) {
    $error = $e->getMessage();
}

// Utilisateurs pour le filtre
$users = [];
try {
    $apiResponse = $api->get('/user', [], getToken());
    $users = $apiResponse['result'] ?? [];
    usort($users, fn($a, $b) => strcasecmp($a['username'], $b['username']));
} catch (Exception $e) {
    // Le select utilisateur restera vide
}
?>

<main class="layout-sidebar">
    <?php require __DIR__ . '/../includes/sidebar.php'; ?>

    <div class="main-content">
        <div class="container py-5">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h1>Logs des appels API</h1>
                <span class="text-muted"><?= count($logs) ?> appel(s)</span>
            </div>

            <!-- Filtres -->
            <form method="get" class="row g-2 align-items-end mb-4">
                <div class="col-auto">
                    <label for="filterUser" class="form-label mb-1">Utilisateur</label>
                    <select name="user" id="filterUser" class="form-select form-select-sm">
                        <option value="">Tous</option>
                        <?php foreach ($users as $user): ?>
                            <option value="<?= htmlspecialchars($user['id']) ?>"
                                <?= $filterUserId === $user['id'] ? 'selected' : '' ?>>
                                <?= htmlspecialchars($user['username']) ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="col-auto">
                    <label for="filterMethod" class="form-label mb-1">Méthode</label>
                    <select name="method" id="filterMethod" class="form-select form-select-sm">
                        <option value="">Toutes</option>
                        <?php foreach ($validMethods as $method): ?>
                            <option value="<?= $method ?>"
                                <?= $filterMethod === $method ? 'selected' : '' ?>>
                                <?= $method ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="col-auto">
                    <button type="submit" class="btn btn-sm btn-primary">
                        <i class="bi bi-funnel"></i> Filtrer
                    </button>
                    <a href="<?= url('pages/logs.php') ?>" class="btn btn-sm btn-outline-secondary">
                        Réinitialiser
                    </a>
                </div>
            </form>

            <?php if (!empty($error)): ?>
                <div class="alert alert-danger" role="alert">
                    <i class="bi bi-exclamation-circle"></i> Erreur: <?= htmlspecialchars(
                                                                            $error,
                                                                        ) ?>
                </div>
            <?php endif; ?>

            <?php if (empty($logs) && empty($error)): ?>
                <div class="alert alert-info" role="alert">
                    <i class="bi bi-info-circle"></i> Aucun log à afficher.
                </div>
            <?php elseif (!empty($logs)): ?>
                <div class="table-responsive">
                    <table class="table table-hover align-middle" id="logsTable">
                        <thead class="table-light">
                            <tr>
                                <th>ID</th>
                                <th>Date</th>
                                <th>Méthode</th>
                                <th>Route</th>
                                <th>Utilisateur</th>
                                <th>Détails</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($logs as $log): ?>
                                <?php
                                $methodColors = [
                                    'GET' => 'success',
                                    'POST' => 'primary',
                                    'PUT' => 'warning',
                                    'DELETE' => 'danger',
                                ];
                                $badgeColor = $methodColors[$log['method']] ?? 'secondary';
                                $hasDetails = !empty($log['details']);
                                ?>
                                <tr>
                                    <td>
                                        <code class="small" title="<?= htmlspecialchars($log['id']) ?>">
                                            <?= htmlspecialchars(substr($log['id'], 0, 8)) ?>…
                                        </code>
                                    </td>
                                    <td>
                                        <?= isset($log['date'])
                                            ? date('d/m/Y H:i:s', strtotime($log['date']))
                                            : '—' ?>
                                    </td>
                                    <td>
                                        <span class="badge bg-<?= $badgeColor ?>">
                                            <?= htmlspecialchars($log['method']) ?>
                                        </span>
                                    </td>
                                    <td><code><?= htmlspecialchars($log['route'] ?? '—') ?></code></td>
                                    <td>
                                        <?php if (!empty($log['user']['username'])): ?>
                                            <?= htmlspecialchars($log['user']['username']) ?>
                                        <?php else: ?>
                                            <span class="text-muted">—</span>
                                        <?php endif; ?>
                                    </td>
                                    <td>
                                        <?php if ($hasDetails): ?>
                                            <button type="button" class="btn btn-sm btn-outline-secondary"
                                                onclick="toggleLogDetails('<?= htmlspecialchars($log['id']) ?>')">
                                                <i class="bi bi-eye"></i> Détail
                                            </button>
                                        <?php else: ?>
                                            <span class="text-muted small">—</span>
                                        <?php endif; ?>
                                    </td>
                                </tr>
                                <?php if ($hasDetails): ?>
                                    <tr id="log-details-<?= htmlspecialchars($log['id']) ?>" class="d-none">
                                        <td colspan="6" class="bg-light">
                                            <?php if (!empty($log['details']['query'])): ?>
                                                <div class="mb-2">
                                                    <strong class="small">Paramètres d'URL :</strong>
                                                    <pre class="small mb-0"><?= htmlspecialchars(
                                                        json_encode(
                                                            $log['details']['query'],
                                                            JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES,
                                                        ),
                                                    ) ?></pre>
                                                </div>
                                            <?php endif; ?>
                                            <?php if (!empty($log['details']['body'])): ?>
                                                <div>
                                                    <strong class="small">Corps de la requête :</strong>
                                                    <pre class="small mb-0"><?= htmlspecialchars(
                                                        json_encode(
                                                            $log['details']['body'],
                                                            JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES,
                                                        ),
                                                    ) ?></pre>
                                                </div>
                                            <?php endif; ?>
                                        </td>
                                    </tr>
                                <?php endif; ?>
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
    function toggleLogDetails(logId) {
        const row = document.getElementById('log-details-' + logId);
        if (row) {
            row.classList.toggle('d-none');
        }
    }
</script>
