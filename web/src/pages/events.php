<?php
require_once __DIR__ . '/../main.inc.php';
requireLogin();

$pageTitle = 'Événements';
$activePage = 'dashboard';
$activeSidebar = 'events';

require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/navbar.php';

$api = new ApiClient(API_BASE_URL);

// Récupérer les événements selon le rôle
$events = [];
$allEvents = [];
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

// Villes (id => nom) pour l'affichage et la modale d'édition
$cityNames = [];
$cities = [];
try {
    $apiResponse = $api->get('/city');
    $cities = $apiResponse['result'] ?? [];
    foreach ($cities as $city) {
        $cityNames[$city['id']] = $city['name'];
    }
    usort($cities, fn($a, $b) => strcasecmp($a['name'], $b['name']));
} catch (Exception $e) {
    // L'affichage retombe sur les ids de villes
}

// Types d'événements pour la modale d'édition
$eventTypes = [];
try {
    $apiResponse = $api->get('/event/type');
    $eventTypes = $apiResponse['result'] ?? [];
} catch (Exception $e) {
    // Le select de type restera vide
}

// Pour un admin : usernames (id => username) des créateurs d'événements
$creatorNames = [];
if (isAdmin()) {
    try {
        $apiResponse = $api->get('/user', [], getToken());
        foreach ($apiResponse['result'] ?? [] as $user) {
            $creatorNames[$user['id']] = $user['username'];
        }
    } catch (Exception $e) {
        // La colonne "Créé par" affichera un tiret
    }
}

$listTitle = isAdmin() ? 'Tous les événements' : 'Mes Événements';
$colCount = isAdmin() ? 7 : 6;
?>

<main class="layout-sidebar">
    <?php require __DIR__ . '/../includes/sidebar.php'; ?>

    <div class="main-content">
        <div class="container py-5">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h1><?= $listTitle ?></h1>
                <a href="<?= url(
                                'index.php#event-research',
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
                                <?php if (isAdmin()): ?>
                                    <th>Créé par</th>
                                <?php endif; ?>
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
                                            $cityNames[$event['FK_cityId']] ??
                                                $event['FK_cityId'],
                                        ) ?>
                                    </td>
                                    <?php if (isAdmin()): ?>
                                        <td>
                                            <?= htmlspecialchars(
                                                $creatorNames[$event['createdBy'] ?? ''] ?? '—',
                                            ) ?>
                                        </td>
                                    <?php endif; ?>
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
                                                                ) ?>'); return false;">
                                            <i class="bi bi-pencil"></i> Modifier
                                        </a>

                                        <button
                                            type="button"
                                            class="btn btn-sm btn-outline-warning btn-review"
                                            data-bs-toggle="modal"
                                            data-bs-target="#reviewModal"
                                            data-event-id="<?= htmlspecialchars($event['id']) ?>"
                                            data-event-title="<?= htmlspecialchars($event['title']) ?>"
                                        >
                                            <i class="bi bi-star"></i> Avis
                                        </button>
                                        <?php if (isAdmin()): ?>
                                            <a href="#" class="btn btn-sm btn-outline-danger"
                                                onclick="deleteEvent('<?= htmlspecialchars(
                                                                            $event['id'],
                                                                        ) ?>'); return false;">
                                                <i class="bi bi-trash"></i> Supprimer
                                            </a>
                                        <?php endif; ?>
                                    </td>
                                </tr>
                                <!-- Détails expandable -->
                                <tr>
                                    <td colspan="<?= $colCount ?>">
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


<!-- Modale d'ajout d'avis -->
<div class="modal fade" id="reviewModal" tabindex="-1" aria-labelledby="reviewModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <form method="post" action="<?= url('pages/review_create.php') ?>">
                <div class="modal-header">
                    <h5 class="modal-title" id="reviewModalLabel">
                        <i class="bi bi-star"></i> Ajouter un avis
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fermer"></button>
                </div>

                <div class="modal-body">
                    <input type="hidden" name="event_id" id="reviewEventId">

                    <p class="mb-3">
                        Avis pour :
                        <strong id="reviewEventTitle">—</strong>
                    </p>

                    <div class="mb-3">
                        <label for="reviewRating" class="form-label">Note</label>
                        <select name="rating" id="reviewRating" class="form-select" required>
                            <option value="5">5 - Excellent</option>
                            <option value="4">4 - Très bien</option>
                            <option value="3">3 - Moyen</option>
                            <option value="2">2 - Décevant</option>
                            <option value="1">1 - Mauvais</option>
                        </select>
                    </div>

                    <div class="mb-3">
                        <label for="reviewComment" class="form-label">Commentaire</label>
                        <textarea
                            name="comment"
                            id="reviewComment"
                            class="form-control"
                            rows="4"
                            placeholder="Votre commentaire..."
                        ></textarea>
                    </div>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                        Annuler
                    </button>

                    <button type="submit" class="btn btn-warning">
                        <i class="bi bi-check-lg"></i> Publier l'avis
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Modale de modification d'un événement -->
<div class="modal fade" id="editEventModal" tabindex="-1" aria-labelledby="editEventModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <form id="editEventForm" method="post" action="<?= url(
                'pages/update_event.php',
            ) ?>">
                <div class="modal-header">
                    <h5 class="modal-title" id="editEventModalLabel">
                        <i class="bi bi-pencil"></i> Modifier l'événement
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fermer"></button>
                </div>
                <div class="modal-body">
                    <div id="editEventError" class="alert alert-danger d-none" role="alert"></div>

                    <input type="hidden" id="editEventId" name="eventId">

                    <div class="row g-3">
                        <div class="col-md-8">
                            <label for="editTitle" class="form-label">Titre</label>
                            <input type="text" class="form-control" id="editTitle" name="title" maxlength="100" required>
                        </div>
                        <div class="col-md-4">
                            <label for="editType" class="form-label">Type</label>
                            <select class="form-select" id="editType" name="type" required>
                                <?php foreach ($eventTypes as $type): ?>
                                    <option value="<?= htmlspecialchars(
                                                        $type,
                                                    ) ?>"><?= htmlspecialchars($type) ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>

                        <div class="col-md-6">
                            <label for="editStartDate" class="form-label">Date de début</label>
                            <input type="date" class="form-control" id="editStartDate" name="startDate" required>
                        </div>
                        <div class="col-md-6">
                            <label for="editEndDate" class="form-label">Date de fin</label>
                            <input type="date" class="form-control" id="editEndDate" name="endDate" required>
                        </div>

                        <div class="col-md-6">
                            <label for="editCity" class="form-label">Ville</label>
                        <select class="form-select" id="editCity" name="cityId" required>
                                <?php foreach ($cities as $city): ?>
                                    <option value="<?= htmlspecialchars(
                                                        $city['id'],
                                                    ) ?>"><?= htmlspecialchars($city['name']) ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label for="editNbGuests" class="form-label">Participants</label>
                            <input type="number" class="form-control" id="editNbGuests" name="nbGuests" min="1" required>
                        </div>
                        <div class="col-md-3 d-flex align-items-end">
                            <div class="form-check form-switch mb-2">
                                <input class="form-check-input" type="checkbox" id="editIsOutdoor" name="isOutdoor">
                                <label class="form-check-label" for="editIsOutdoor">Extérieur</label>
                            </div>
                        </div>

                        <div class="col-12">
                            <label for="editDescription" class="form-label">Description</label>
                            <textarea class="form-control" id="editDescription" name="description" rows="3"></textarea>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                    <button type="submit" class="btn btn-primary" id="editEventSubmitBtn">
                        <i class="bi bi-check-lg"></i> Enregistrer
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>

<script>
    const allEvents = <?= json_encode($allEvents) ?>;
    const cityNames = <?= json_encode($cityNames) ?>;
    const creatorNames = <?= json_encode($creatorNames) ?>;
    const isAdminView = <?= isAdmin() ? 'true' : 'false' ?>;
    const colCount = <?= $colCount ?>;
    const itemsPerPage = 50;
    let currentPage = 1;

    function renderEventRow(event) {
        const creatorCell = isAdminView ?
            `<td>${escapeHtml(creatorNames[event.createdBy] ?? '—')}</td>` :
            '';
        const deleteBtn = isAdminView ?
            `<a href="#" class="btn btn-sm btn-outline-danger"
                    onclick="deleteEvent('${event.id}'); return false;">
                    <i class="bi bi-trash"></i> Supprimer
                </a>` :
            '';
        return `
            <tr>
                <td><strong>${escapeHtml(event.title)}</strong></td>
                <td><span class="badge bg-secondary">${escapeHtml(event.type)}</span></td>
                <td>${formatDate(event.startDate)} - ${formatDate(event.endDate)}</td>
                <td>${escapeHtml(cityNames[event.FK_cityId] ?? event.FK_cityId)}</td>
                ${creatorCell}
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
                    <button type="button"
                        class="btn btn-sm btn-outline-warning btn-review"
                        data-bs-toggle="modal"
                        data-bs-target="#reviewModal"
                        data-event-id="${escapeHtml(event.id)}"
                        data-event-title="${escapeHtml(event.title)}">
                        <i class="bi bi-star"></i> Avis
                    </button>
                    ${deleteBtn}
                </td>
            </tr>
            <tr>
                <td colspan="${colCount}">
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
        return String(text).replace(/[&<>"']/g, m => map[m]);
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
        const event = allEvents.find(e => e.id === eventId);
        if (!event) {
            return;
        }

        document.getElementById('editEventError').classList.add('d-none');
        document.getElementById('editEventId').value = event.id;
        document.getElementById('editTitle').value = event.title;
        document.getElementById('editType').value = event.type;
        document.getElementById('editStartDate').value = event.startDate.slice(0, 10);
        document.getElementById('editEndDate').value = event.endDate.slice(0, 10);
        document.getElementById('editCity').value = event.FK_cityId;
        document.getElementById('editNbGuests').value = event.nbGuests ?? 1;
        document.getElementById('editIsOutdoor').checked = !!event.isOutdoor;
        document.getElementById('editDescription').value = event.description ?? '';

        bootstrap.Modal.getOrCreateInstance(document.getElementById('editEventModal')).show();
    }

    // La modification part en POST vers update_event.php (l'API n'est pas
    // joignable depuis le navigateur) ; on valide juste les dates avant envoi.
    document.getElementById('editEventForm').addEventListener('submit', function(e) {
        const errorBox = document.getElementById('editEventError');
        errorBox.classList.add('d-none');

        const startDate = document.getElementById('editStartDate').value;
        const endDate = document.getElementById('editEndDate').value;

        if (endDate < startDate) {
            e.preventDefault();
            errorBox.textContent = 'La date de fin doit être postérieure ou égale à la date de début.';
            errorBox.classList.remove('d-none');
        }
    });

    function deleteEvent(eventId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
            return;
        }

        const form = document.createElement('form');
        form.method = 'post';
        form.action = '<?= url('pages/delete_event.php') ?>';

        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'eventId';
        input.value = eventId;

        form.appendChild(input);
        document.body.appendChild(form);
        form.submit();
    }

    document.addEventListener('click', function (event) {
        const button = event.target.closest('.btn-review');

        if (!button) {
            return;
        }

        const eventId = button.dataset.eventId;
        const eventTitle = button.dataset.eventTitle;

        document.getElementById('reviewEventId').value = eventId;
        document.getElementById('reviewEventTitle').textContent = eventTitle;

        document.getElementById('reviewRating').value = '5';
        document.getElementById('reviewComment').value = '';
    });
</script>