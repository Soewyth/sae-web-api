<?php
require_once __DIR__ . '/../main.inc.php';
requireLogin();

$pageTitle = 'Événements';
$activePage = 'events';

require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/navbar.php';

$api = new ApiClient(API_BASE_URL);

// Récupérer les événements selon le rôle
$events = [];
$error = null;
$totalEvents = 0;
$itemsPerPage = 50;

try {
    if (isAdmin()) {
        $apiResponse = $api->get('/event', [], getToken());
    } else {
        $apiResponse = $api->get(
            '/user/' . $_SESSION['user']['id'] . '/events',
            [],
            getToken(),
        );
    }
    $allEvents = $apiResponse['result'] ?? [];
    $totalEvents = count($allEvents);
    // Charger seulement les 50 premiers événements
    $events = array_slice($allEvents, 0, $itemsPerPage);
} catch (Exception $e) {
    $error = $e->getMessage();
}
?>

<main class="layout-sidebar">
    <nav class="sidebar">
        <div class="nav flex-column">
            <a href="<?= url(
                            'pages/events.php',
                        ) ?>" class="sidebar-link active text-decoration-none p-3">
                <i class="fas fa-calendar me-3"></i>
                <span class="hide-on-collapse">Événements</span>
            </a>

            <a href="<?= url(
                            'pages/reviews.php',
                        ) ?>" class="sidebar-link text-decoration-none p-3">
                <i class="fas fa-star me-3"></i>
                <span class="hide-on-collapse">Avis</span>
            </a>

            <?php if (isAdmin()): ?>
                <a href="<?= url(
                                'pages/admin.php',
                            ) ?>" class="sidebar-link text-decoration-none p-3">
                    <i class="fas fa-cog me-3"></i>
                    <span class="hide-on-collapse">Admin</span>
                </a>
            <?php endif; ?>
        </div>

        <div class="profile-section mt-auto p-4">
            <div class="d-flex align-items-center">
                <div class="ms-3 profile-info">
                    <h6 class="text-white mb-0"><?= $_SESSION['user']['username'] ?></h6>
                    <?php if (isAdmin()): ?>
                        <small class="text-muted">Admin</small>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </nav>

    <div class="main-content">
        <div class="container py-5">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h1>Mes Événements</h1>
                <a href="<?= url(
                                'pages/book_event.php',
                            ) ?>" class="btn btn-primary">
                    <i class="bi bi-plus-circle"></i> Créer un événement
                </a>
            </div>

            <?php if (!empty($error)): ?>
                <div class="alert alert-danger" role="alert">
                    <i class="bi bi-exclamation-circle"></i> Erreur: <?= htmlspecialchars(
                                                                            $error,
                                                                        ) ?>
                </div>
            <?php endif; ?>

            <?php if (empty($events)): ?>
                <div class="alert alert-info" role="alert">
                    <i class="bi bi-info-circle"></i> Aucun événement à afficher.
                </div>
            <?php else: ?>
                <div class="table-responsive">
                    <table class="table table-hover" id="eventsTable">
                        <thead class="table-light">
                            <tr>
                                <th>Titre</th>
                                <th>Type</th>
                                <th>Dates</th>
                                <th>Ville</th>
                                <th>Participants</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="eventsTableBody">
                            <?php foreach ($events as $event): ?>
                                <tr>
                                    <td>
                                        <strong><?= htmlspecialchars(
                                                    $event['title'],
                                                ) ?></strong>
                                    </td>
                                    <td>
                                        <span class="badge bg-secondary"><?= htmlspecialchars(
                                                                                $event['type'],
                                                                            ) ?></span>
                                    </td>
                                    <td>
                                        <?= date(
                                            'd/m/Y',
                                            strtotime($event['startDate']),
                                        ) ?> - <?= date(
                                                    'd/m/Y',
                                                    strtotime($event['endDate']),
                                                ) ?>
                                    </td>
                                    <td>
                                        <?= htmlspecialchars(
                                            $event['FK_cityId'],
                                        ) ?>
                                    </td>
                                    <td>
                                        <span class="badge bg-info"><?= $event['nbGuests'] ?? 0 ?> invités</span>
                                    </td>
                                    <td>
                                        <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="collapse"
                                            data-bs-target="#details-<?= htmlspecialchars(
                                                                            $event['id'],
                                                                        ) ?>"
                                            aria-expanded="false" aria-controls="details-<?= htmlspecialchars(
                                                                                                $event['id'],
                                                                                            ) ?>">
                                            <i class="bi bi-chevron-down"></i> Détails
                                        </button>
                                        <a href="#" class="btn btn-sm btn-outline-primary"
                                            onclick="editEvent('<?= htmlspecialchars(
                                                                    $event['id'],
                                                                ) ?>')">
                                            <i class="bi bi-pencil"></i> Modifier
                                        </a>
                                        <?php if (isAdmin()): ?>
                                            <a href="#" class="btn btn-sm btn-outline-danger"
                                                onclick="deleteEvent('<?= htmlspecialchars(
                                                                            $event['id'],
                                                                        ) ?>')">
                                                <i class="bi bi-trash"></i> Supprimer
                                            </a>
                                        <?php endif; ?>
                                    </td>
                                </tr>
                                <!-- Détails expandable -->
                                <tr>
                                    <td colspan="6">
                                        <div class="collapse" id="details-<?= htmlspecialchars(
                                                                                $event['id'],
                                                                            ) ?>">
                                            <div class="card card-body bg-light">
                                                <div class="row">
                                                    <div class="col-md-6">
                                                        <p><strong>Description:</strong></p>
                                                        <p><?= htmlspecialchars(
                                                                $event['description'] ??
                                                                    'Pas de description',
                                                            ) ?></p>
                                                    </div>
                                                    <div class="col-md-6">
                                                        <p><strong>Détails:</strong></p>
                                                        <ul class="list-unstyled">
                                                            <li><strong>Extérieur:</strong> <?= $event['isOutdoor']
                                                                                                ? 'Oui'
                                                                                                : 'Non' ?></li>
                                                            <li><strong>Capacité max:</strong> <?= $event['maxCapacity'] ??
                                                                                                    'Non définie' ?></li>
                                                            <li><strong>Créé le:</strong> <?= date(
                                                                                                'd/m/Y H:i',
                                                                                                strtotime(
                                                                                                    $event['createdAt'],
                                                                                                ),
                                                                                            ) ?></li>
                                                        </ul>
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

                <?php if ($totalEvents > $itemsPerPage): ?>
                    <div class="text-center mt-4">
                        <button id="loadMoreBtn" class="btn btn-primary" onclick="loadMoreEvents()">
                            <i class="bi bi-arrow-down"></i> Charger plus (<?= $totalEvents - $itemsPerPage ?> restants)
                        </button>
                    </div>
                <?php endif; ?>
            <?php endif; ?>
        </div>
    </div>
</main>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>

<script>
    const allEvents = <?= json_encode($allEvents) ?>;
    const itemsPerPage = 50;
    let currentPage = 1;

    function renderEventRow(event) {
        return `
            <tr>
                <td><strong>${escapeHtml(event.title)}</strong></td>
                <td><span class="badge bg-secondary">${escapeHtml(event.type)}</span></td>
                <td>${formatDate(event.startDate)} - ${formatDate(event.endDate)}</td>
                <td>${escapeHtml(event.FK_cityId)}</td>
                <td><span class="badge bg-info">${event.nbGuests ?? 0} invités</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="collapse"
                        data-bs-target="#details-${event.id}"
                        aria-expanded="false" aria-controls="details-${event.id}">
                        <i class="bi bi-chevron-down"></i> Détails
                    </button>
                    <a href="#" class="btn btn-sm btn-outline-primary"
                        onclick="editEvent('${event.id}'); return false;">
                        <i class="bi bi-pencil"></i> Modifier
                    </a>
                    <?php if (isAdmin()): ?>
                        <a href="#" class="btn btn-sm btn-outline-danger"
                            onclick="deleteEvent('${event.id}'); return false;">
                            <i class="bi bi-trash"></i> Supprimer
                        </a>
                    <?php endif; ?>
                </td>
            </tr>
            <tr>
                <td colspan="6">
                    <div class="collapse" id="details-${event.id}">
                        <div class="card card-body bg-light">
                            <div class="row">
                                <div class="col-md-6">
                                    <p><strong>Description:</strong></p>
                                    <p>${escapeHtml(event.description || 'Pas de description')}</p>
                                </div>
                                <div class="col-md-6">
                                    <p><strong>Détails:</strong></p>
                                    <ul class="list-unstyled">
                                        <li><strong>Extérieur:</strong> ${event.isOutdoor ? 'Oui' : 'Non'}</li>
                                        <li><strong>Capacité max:</strong> ${event.maxCapacity ?? 'Non définie'}</li>
                                        <li><strong>Créé le:</strong> ${formatDateTime(event.createdAt)}</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }

    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR');
    }

    function formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR') + ' ' + date.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function loadMoreEvents() {
        const startIndex = currentPage * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const tbody = document.getElementById('eventsTableBody');

        const newEvents = allEvents.slice(startIndex, endIndex);
        newEvents.forEach(event => {
            tbody.innerHTML += renderEventRow(event);
        });

        currentPage++;

        // Cacher le bouton si tous les événements sont chargés
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (endIndex >= allEvents.length) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.textContent = `Charger plus (${allEvents.length - endIndex} restants)`;
        }
    }

    function editEvent(eventId) {
        window.location.href = '<?= url('pages/book_event.php') ?>?edit=' + eventId;
    }

    function deleteEvent(eventId) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
            fetch('<?= API_BASE_URL ?>/event/' + eventId, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': 'Bearer ' + '<?= getToken() ?? '' ?>'
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.message) {
                        alert('Événement supprimé avec succès');
                        location.reload();
                    }
                })
                .catch(error => {
                    console.error('Erreur:', error);
                    alert('Erreur lors de la suppression');
                });
        }
    }
</script>

<style>
    :root {
        --sidebar-width: 280px;
        --sidebar-width-collapsed: 80px;
    }

    body {
        overflow-x: hidden;
    }

    .sidebar {
        width: var(--sidebar-width);
        height: 100vh;
        background: linear-gradient(135deg, #1a1c2e 0%, #16181f 100%);
        transition: all 0.3s ease;
    }

    .sidebar.collapsed {
        width: var(--sidebar-width-collapsed);
    }

    .sidebar-link {
        color: #a0a3bd;
        transition: all 0.2s ease;
        border-radius: 8px;
        margin: 4px 16px;
        white-space: nowrap;
        overflow: hidden;
    }

    .sidebar-link:hover {
        color: #ffffff;
        background: rgba(255, 255, 255, 0.1);
        transform: translateX(5px);
    }

    .sidebar-link.active {
        color: #ffffff;
        background: rgba(255, 255, 255, 0.1);
    }

    .logo-text {
        background: linear-gradient(45deg, #6b8cff, #8b9fff);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        transition: opacity 0.3s ease;
    }

    .notification-badge {
        background: #ff6b6b;
        padding: 2px 6px;
        border-radius: 6px;
        font-size: 0.7rem;
    }

    .profile-section {
        border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .main-content {
        margin-left: var(--sidebar-width);
        background-color: #f8f9fa;
        min-height: 100vh;
        padding: 20px;
        transition: all 0.3s ease;
    }

    .collapsed~.main-content {
        margin-left: var(--sidebar-width-collapsed);
    }

    .toggle-btn {
        position: absolute;
        right: -15px;
        top: 20px;
        background: white;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        border: none;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        z-index: 100;
        cursor: pointer;
        transition: transform 0.3s ease;
    }

    .collapsed .toggle-btn {
        transform: rotate(180deg);
    }

    .collapsed .hide-on-collapse {
        opacity: 0;
        visibility: hidden;
    }

    .collapsed .logo-text {
        opacity: 0;
    }

    .collapsed .profile-info {
        opacity: 0;
    }

    .collapsed .sidebar-link {
        text-align: center;
        padding: 1rem !important;
        margin: 4px 8px;
    }

    .collapsed .sidebar-link i {
        margin: 0 !important;
    }

    .profile-info {
        transition: opacity 0.2s ease;
    }
</style>