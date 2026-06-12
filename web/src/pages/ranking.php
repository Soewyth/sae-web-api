<?php
require_once __DIR__ . '/../main.inc.php';

$pageTitle = 'Classement';
$activePage = 'ranking';

const RANKING_PER_PAGE = 20;

$validTabs = ['cities', 'events', 'regions'];
$tab = in_array($_GET['tab'] ?? '', $validTabs, true) ? $_GET['tab'] : 'cities';
$page = max(1, (int) ($_GET['page'] ?? 1));

$rows = [];
$totalPages = 1;
$errorMessage = null;

try {
    $api = new ApiClient(API_BASE_URL);

    $response = $api->get('/ranking/' . $tab, [
        'page' => $page,
        'limit' => RANKING_PER_PAGE,
    ]);

    $rows = $response['result'] ?? [];
    $totalPages = max(1, (int) ($response['totalPages'] ?? 1));
} catch (Exception $e) {
    $errorMessage = $e->getMessage();
}

require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/navbar.php';

/**
 * Construit l'URL de la page de classement pour un onglet et une page donnés
 */
function rankingUrl(string $tab, int $page = 1): string
{
    return url('pages/ranking.php?' . http_build_query(['tab' => $tab, 'page' => $page]));
}

/**
 * Affiche la cellule de score (note /5 + barre de progression)
 */
function renderScoreCell(float $score): void
{
    $percent = max(0, min(100, ($score / 5) * 100));
    ?>
    <div class="ranking-score">
        <div class="score-label">
            <span>Score</span>
            <strong><?= htmlspecialchars(number_format($score, 1)) ?> / 5</strong>
        </div>
        <div class="score-bar">
            <div style="width: <?= $percent ?>%"></div>
        </div>
    </div>
    <?php
}

/**
 * Affiche la pagination (précédent, fenêtre de pages avec ellipses, suivant)
 */
function renderPagination(string $tab, int $page, int $totalPages): void
{
    if ($totalPages <= 1) {
        return;
    }

    // Fenêtre de pages autour de la page courante, avec première et dernière
    $pages = [1, $totalPages];
    for ($i = $page - 2; $i <= $page + 2; $i++) {
        if ($i >= 1 && $i <= $totalPages) {
            $pages[] = $i;
        }
    }
    $pages = array_unique($pages);
    sort($pages);
    ?>
    <nav class="ranking-pagination" aria-label="Pagination du classement">
        <?php if ($page > 1): ?>
            <a class="ranking-page-link" href="<?= rankingUrl($tab, $page - 1) ?>" aria-label="Page précédente">
                <i class="bi bi-chevron-left"></i>
            </a>
        <?php endif; ?>

        <?php $previous = 0; ?>
        <?php foreach ($pages as $p): ?>
            <?php if ($p - $previous > 1): ?>
                <span class="ranking-page-ellipsis">…</span>
            <?php endif; ?>
            <?php if ($p === $page): ?>
                <span class="ranking-page-link active"><?= $p ?></span>
            <?php else: ?>
                <a class="ranking-page-link" href="<?= rankingUrl($tab, $p) ?>"><?= $p ?></a>
            <?php endif; ?>
            <?php $previous = $p; ?>
        <?php endforeach; ?>

        <?php if ($page < $totalPages): ?>
            <a class="ranking-page-link" href="<?= rankingUrl($tab, $page + 1) ?>" aria-label="Page suivante">
                <i class="bi bi-chevron-right"></i>
            </a>
        <?php endif; ?>
    </nav>
    <?php
}
?>

<main class="page-wrapper ranking-page">

    <h1 class="ranking-title">Classement des destinations</h1>
    <p class="ranking-subtitle">
        Les villes, événements et régions les plus attractifs, classés selon les notes laissées par les utilisateurs.
    </p>

    <ul class="nav ranking-tabs">
        <li class="nav-item">
            <a class="ranking-tab <?= $tab === 'cities' ? 'active' : '' ?>" href="<?= rankingUrl('cities') ?>">
                <i class="bi bi-buildings"></i> Villes
            </a>
        </li>
        <li class="nav-item">
            <a class="ranking-tab <?= $tab === 'events' ? 'active' : '' ?>" href="<?= rankingUrl('events') ?>">
                <i class="bi bi-calendar-event"></i> Événements
            </a>
        </li>
        <li class="nav-item">
            <a class="ranking-tab <?= $tab === 'regions' ? 'active' : '' ?>" href="<?= rankingUrl('regions') ?>">
                <i class="bi bi-map"></i> Régions
            </a>
        </li>
    </ul>

    <?php if ($errorMessage !== null): ?>
        <div class="alert alert-danger">
            <h2 style="font-size: 1.1rem;">Impossible de charger le classement</h2>
            <p class="mb-0"><?= htmlspecialchars($errorMessage) ?></p>
            <p class="mb-0 mt-2">
                Vérifiez que l’API et la base de données PostgreSQL sont bien démarrées.
            </p>
        </div>
    <?php elseif (empty($rows)): ?>
        <div class="alert alert-warning">Aucun résultat pour ce classement.</div>
    <?php else: ?>

        <div class="ranking-card">

            <?php if ($tab === 'cities'): ?>

                <table class="ranking-table">
                    <thead>
                        <tr>
                            <th class="ranking-col-rank">#</th>
                            <th>Ville</th>
                            <th class="ranking-col-score">Score</th>
                            <th class="ranking-col-count">Événements</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($rows as $row): ?>
                            <tr>
                                <td class="ranking-col-rank">
                                    <span class="ranking-rank <?= (int) $row['rank'] <= 3 ? 'top' : '' ?>">
                                        <?= (int) $row['rank'] ?>
                                    </span>
                                </td>
                                <td>
                                    <div class="ranking-identity">
                                        <?php if (!empty($row['city']['imageUrl'])): ?>
                                            <img src="<?= htmlspecialchars($row['city']['imageUrl']) ?>"
                                                 alt="<?= htmlspecialchars($row['city']['name']) ?>"
                                                 class="ranking-thumb">
                                        <?php else: ?>
                                            <span class="ranking-thumb ranking-thumb-placeholder">
                                                <i class="bi bi-buildings"></i>
                                            </span>
                                        <?php endif; ?>
                                        <div>
                                            <strong><?= htmlspecialchars($row['city']['name']) ?></strong>
                                            <small><?= htmlspecialchars($row['city']['region']) ?></small>
                                        </div>
                                    </div>
                                </td>
                                <td class="ranking-col-score">
                                    <?php renderScoreCell((float) $row['score']); ?>
                                </td>
                                <td class="ranking-col-count">
                                    <span class="ranking-count"><?= (int) $row['eventCount'] ?></span>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>

            <?php elseif ($tab === 'events'): ?>

                <table class="ranking-table">
                    <thead>
                        <tr>
                            <th class="ranking-col-rank">#</th>
                            <th>Événement</th>
                            <th>Ville</th>
                            <th class="ranking-col-score">Score</th>
                            <th class="ranking-col-count">Avis</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($rows as $row): ?>
                            <tr>
                                <td class="ranking-col-rank">
                                    <span class="ranking-rank <?= (int) $row['rank'] <= 3 ? 'top' : '' ?>">
                                        <?= (int) $row['rank'] ?>
                                    </span>
                                </td>
                                <td>
                                    <div class="ranking-identity">
                                        <?php if (!empty($row['event']['imageUrl'])): ?>
                                            <img src="<?= htmlspecialchars($row['event']['imageUrl']) ?>"
                                                 alt="<?= htmlspecialchars($row['event']['title']) ?>"
                                                 class="ranking-thumb">
                                        <?php else: ?>
                                            <span class="ranking-thumb ranking-thumb-placeholder">
                                                <i class="bi bi-calendar-event"></i>
                                            </span>
                                        <?php endif; ?>
                                        <div>
                                            <strong><?= htmlspecialchars($row['event']['title']) ?></strong>
                                            <small><?= htmlspecialchars(ucfirst(strtolower($row['event']['type']))) ?></small>
                                        </div>
                                    </div>
                                </td>
                                <td><?= htmlspecialchars($row['event']['city']['name'] ?? '') ?></td>
                                <td class="ranking-col-score">
                                    <?php renderScoreCell((float) $row['score']); ?>
                                </td>
                                <td class="ranking-col-count">
                                    <span class="ranking-count"><?= (int) $row['reviewCount'] ?></span>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>

            <?php else: ?>

                <table class="ranking-table">
                    <thead>
                        <tr>
                            <th class="ranking-col-rank">#</th>
                            <th>Région</th>
                            <th class="ranking-col-score">Score</th>
                            <th class="ranking-col-count">Villes</th>
                            <th class="ranking-col-count">Événements</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($rows as $row): ?>
                            <tr>
                                <td class="ranking-col-rank">
                                    <span class="ranking-rank <?= (int) $row['rank'] <= 3 ? 'top' : '' ?>">
                                        <?= (int) $row['rank'] ?>
                                    </span>
                                </td>
                                <td>
                                    <div class="ranking-identity">
                                        <?php if (!empty($row['imageUrl'])): ?>
                                            <img src="<?= htmlspecialchars($row['imageUrl']) ?>"
                                                 alt="<?= htmlspecialchars($row['region']) ?>"
                                                 class="ranking-thumb">
                                        <?php else: ?>
                                            <span class="ranking-thumb ranking-thumb-placeholder">
                                                <i class="bi bi-map"></i>
                                            </span>
                                        <?php endif; ?>
                                        <div>
                                            <strong><?= htmlspecialchars($row['region']) ?></strong>
                                        </div>
                                    </div>
                                </td>
                                <td class="ranking-col-score">
                                    <?php renderScoreCell((float) $row['score']); ?>
                                </td>
                                <td class="ranking-col-count">
                                    <span class="ranking-count"><?= (int) $row['cityCount'] ?></span>
                                </td>
                                <td class="ranking-col-count">
                                    <span class="ranking-count"><?= (int) $row['eventCount'] ?></span>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>

            <?php endif; ?>

        </div>

        <?php renderPagination($tab, $page, $totalPages); ?>

    <?php endif; ?>

</main>

<?php require_once __DIR__ . '/../includes/footer.php';
