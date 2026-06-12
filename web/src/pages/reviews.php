<?php
require_once __DIR__ . '/../main.inc.php';
requireLogin();

$pageTitle = 'Avis';
$activePage = 'dashboard';
$activeSidebar = 'reviews';

require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/navbar.php';

$api = new ApiClient(API_BASE_URL);

// Récupérer tous les avis (avec événement, ville et auteur)
$reviews = [];
$error = null;

try {
    $apiResponse = $api->get('/review', [], getToken());
    $reviews = $apiResponse['result'] ?? [];
} catch (Exception $e) {
    $error = $e->getMessage();
}
?>

<main class="layout-sidebar">
    <?php require __DIR__ . '/../includes/sidebar.php'; ?>

    <div class="main-content">
        <div class="container py-5">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h1>Avis des événements</h1>
            </div>

            <?php if (!empty($error)): ?>
                <div class="alert alert-danger" role="alert">
                    <i class="bi bi-exclamation-circle"></i> Erreur: <?= htmlspecialchars(
                                                                            $error,
                                                                        ) ?>
                </div>
            <?php endif; ?>

            <div class="input-group mb-4">
                <span class="input-group-text"><i class="bi bi-search"></i></span>
                <input type="search" class="form-control" id="reviewSearchInput"
                    placeholder="Rechercher une ville ou un événement..."
                    aria-label="Rechercher une ville ou un événement">
            </div>

            <?php if (empty($reviews) && empty($error)): ?>
                <div class="alert alert-info" role="alert">
                    <i class="bi bi-info-circle"></i> Aucun avis à afficher.
                </div>
            <?php elseif (!empty($reviews)): ?>
                <div class="table-responsive">
                    <table class="table table-hover" id="reviewsTable">
                        <thead class="table-light">
                            <tr>
                                <th>Événement</th>
                                <th>Ville</th>
                                <th>Auteur</th>
                                <th>Note</th>
                                <th>Commentaire</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($reviews as $review): ?>
                                <?php
                                $eventTitle = $review['event']['title'] ?? '—';
                                $cityName = $review['event']['city']['name'] ?? '—';
                                $rating = max(0, min(5, (int) $review['rating']));
                                ?>
                                <tr class="review-row"
                                    data-search="<?= htmlspecialchars(
                                        mb_strtolower($eventTitle . ' ' . $cityName),
                                    ) ?>">
                                    <td>
                                        <strong><?= htmlspecialchars(
                                                    $eventTitle,
                                                ) ?></strong>
                                    </td>
                                    <td><?= htmlspecialchars($cityName) ?></td>
                                    <td><?= htmlspecialchars(
                                            $review['user']['username'] ?? '—',
                                        ) ?></td>
                                    <td>
                                        <span class="text-warning">
                                            <?= str_repeat(
                                                '<i class="bi bi-star-fill"></i>',
                                                $rating,
                                            ) ?><?= str_repeat(
                                                '<i class="bi bi-star"></i>',
                                                5 - $rating,
                                            ) ?>
                                        </span>
                                    </td>
                                    <td><?= htmlspecialchars(
                                            $review['comment'] ?? 'Pas de commentaire',
                                        ) ?></td>
                                    <td><?= date(
                                            'd/m/Y',
                                            strtotime($review['createdAt']),
                                        ) ?></td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>

                <div class="alert alert-info d-none" id="noReviewResult" role="alert">
                    <i class="bi bi-info-circle"></i> Aucun avis ne correspond à votre recherche.
                </div>
            <?php endif; ?>
        </div>
    </div>
</main>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>

<script>
    const searchInput = document.getElementById('reviewSearchInput');

    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const query = this.value.trim().toLowerCase();
            const rows = document.querySelectorAll('.review-row');
            let visibleCount = 0;

            rows.forEach(row => {
                const matches = row.dataset.search.includes(query);
                row.classList.toggle('d-none', !matches);
                if (matches) {
                    visibleCount++;
                }
            });

            const noResult = document.getElementById('noReviewResult');
            if (noResult) {
                noResult.classList.toggle('d-none', visibleCount > 0);
            }
        });
    }
</script>