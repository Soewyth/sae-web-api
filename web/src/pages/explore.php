<?php
require_once __DIR__ . '/../main.inc.php';

if (!hasExploreSearchParams()) {
    header('Location: ' . url('index.php'));
    exit;
}

if (!isUserLoggedIn()) {
    $_SESSION['redirect_after_login'] = $_SERVER['REQUEST_URI'];
    $_SESSION['flash_error'] = 'Vous devez être connecté pour accéder aux recommandations.';

    header('Location: ' . url('pages/login.php'));
    exit;
}

$pageTitle = 'Evenements';
$activePage = 'explore';

$recommendations = [];
$errorMessage = null;

require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/navbar.php';

// recovering data on GET
$eventName = $_GET['event_name'] ?? '';
$eventType = $_GET['event_type'] ?? '';
$setting = $_GET['event_place'] ?? '';
$participants = max(1, (int) ($_GET['event_participants'] ?? 1));
$region = $_GET['event_region'] ?? '';

$monthNumber = (int) ($_GET['event_month'] ?? date('n'));
$monthNumber = max(1, min(12, $monthNumber));

$monthNames = [
    1 => 'Janvier',
    2 => 'Février',
    3 => 'Mars',
    4 => 'Avril',
    5 => 'Mai',
    6 => 'Juin',
    7 => 'Juillet',
    8 => 'Août',
    9 => 'Septembre',
    10 => 'Octobre',
    11 => 'Novembre',
    12 => 'Décembre',
];

$monthLabel = $monthNames[$monthNumber];

$isOutdoor = ($setting === 'outdoor');

$year = (int) date('Y');
$month = sprintf('%04d-%02d', $year, $monthNumber);
$description = $_GET['event_description'] ?? '';
$duration = max(1, (int) ($_GET['event_duration'] ?? 1));


try {
  $api = new ApiClient(API_BASE_URL);

    $recommendationParams = [
        'month' => $monthNumber,
        'duration' => $duration,
        'isOutdoor' => $isOutdoor ? 'true' : 'false',
        'nbGuests' => $participants,
    ];

    if ($region !== '' && $region !== 'none') {
        $recommendationParams['region'] = $region;
    }

    $apiResponse = $api->get('/recommendations', $recommendationParams);

    // echo '<pre>';
    // print_r($apiResponse);
    // echo '</pre>';
    // exit;

    if (!isset($apiResponse['result']) || !is_array($apiResponse['result'])) {
        $errorMessage = $apiResponse['message']
            ?? $apiResponse['error']
            ?? "Impossible de récupérer les recommandations pour le moment.";

        $top1Recommendation = null;
    } else {
        if (!empty($apiResponse['startDate'])) {
            $month = substr($apiResponse['startDate'], 0, 7);
        }

        $recommendations = [];


        // recovering datas response json
        foreach (($apiResponse['result'] ?? []) as $item) {
                $city = $item['city'];
                $monthlyAverage = $item['monthlyAverage'] ?? [];

                $recommendations[] = [
                    'id' => $city['id'],
                    'name' => $city['name'],
                    'region' => $city['region'] ?? '',
                    'month' => $monthLabel,
                    'image_url' => $city['imageUrl'] ?? '',
                    'averageTemp' => $monthlyAverage['avgTemp'] ?? null,
                    'precipitation' => $monthlyAverage['avgPrecip'] ?? null,
                    'sunHours' => $monthlyAverage['avgSun'] ?? null,
                    'poisCount' => $item['avgMaxCapacity'] ?? 0,
                    'matchScore' => $item['score'] ?? 0,
                    'travelScoreByDay' => $item['days'] ?? [],
                ];
            }


            $top1Recommendation = $recommendations[0] ?? null;
    }

} catch (Exception $e) {
  $errorMessage = $e->getMessage();
  $top1Recommendation = null;
}
?>

<main class="page-wrapper explore-page">

    <?php if ($errorMessage !== null): ?>
        <div class="alert alert-danger">
            <h2 style="font-size: 1.1rem;">Impossible de charger les recommandations</h2>
            <p class="mb-0">
                <?= htmlspecialchars($errorMessage) ?>
            </p>
            <p class="mb-0 mt-2">
                Vérifiez que l’API et la base de données PostgreSQL sont bien démarrées.
            </p>
        </div>
    <?php endif; ?>

    <?php if ($top1Recommendation === null): ?>
        <?php if ($errorMessage === null): ?>
            <div class="alert alert-warning">
                Aucune recommandation disponible pour cette recherche.
            </div>
        <?php endif; ?>
    <?php else: ?>

        <section class="explore-layout">
            <!--Volet gauche-->
            <aside class="recommendations-panel">
                <h1 class="recommendations-title">Villes recommandées</h1>

                <div class="recommendations-list">
                    <?php foreach (
                      $recommendations
                      as $key => $recommendation
                    ) { ?>
                        <!--Vignette de recommandation-->
                        <article class="recommendations-item <?= $key === 0
                          ? 'active'
                          : '' ?>" data-index="<?= $key ?>">

                            <img src="<?= htmlspecialchars(
                              $recommendation['image_url'],
                            ) ?>" alt="<?= htmlspecialchars(
  $recommendation['name'],
) ?>" class="recommendations-thumb">

                            <div class="recommendations-content">
                                <div class="recommendations-header">
                                    <h2><?= htmlspecialchars(
                                      $recommendation['name'],
                                    ) ?></h2>
                                    <span class="recommendations-month">
                                        <?= htmlspecialchars(
                                          $recommendation['month'],
                                        ) ?>
                                    </span>
                                </div>

                                <p class="recommendations-region">
                                    <?= htmlspecialchars(
                                      $recommendation['region'],
                                    ) ?>
                                </p>


                                <div class="score-label">
                                    <span>Score</span>
                                    <strong><?= htmlspecialchars(
                                      $recommendation['matchScore'],
                                    ) ?>%</strong>
                                </div>

                                <div class="score-bar">
                                    <div style="width: <?= htmlspecialchars(
                                      $recommendation['matchScore'],
                                    ) ?>%"></div>
                                </div>

                            </div>

                        </article>
                    <?php } ?>
                </div>
            </aside>

            <!--Volet droit-->
            <section class="explore-details">

                <section
                    class="recommandations-top1"
                    id="topRecommendationImage"
                    style="margin-top: 15px; background-image: linear-gradient(rgba(7, 19, 46, 0.2), rgba(7, 19, 46, 0.75)), url('<?= htmlspecialchars(
                      $top1Recommendation['image_url'],
                    ) ?>');"
                >
                    <div>
                        <h2 id="topRecommendationName"><?= htmlspecialchars(
                          $top1Recommendation['name'],
                        ) ?></h2>
                        <p id="topRecommendationRegion"><?= htmlspecialchars(
                          $top1Recommendation['region'],
                        ) ?>, France</p>
                    </div>

                </section>

                <?php if($isOutdoor){
                    ?>
                    <section class="info-grid">
                        <article class="info-card">
                            <h3>
                                <i class="bi bi-thermometer"></i>
                                <span id="topMonth"><?= htmlspecialchars(
                                  $top1Recommendation['month'],
                                ) ?></span> Moyennes
                            </h3>
    
                            <div class="weather-stats">
                                <div>
                                    <strong>
                                        <span id="topAverageTemp"><?= htmlspecialchars(
                                          $top1Recommendation['averageTemp'],
                                        ) ?></span>
                                    </strong>
                                    <span>Temp</span>
                                </div>
    
                                <div>
                                    <strong>
                                        <span id="topPrecipitation"><?= htmlspecialchars(
                                          $top1Recommendation['precipitation'],
                                        ) ?></span>
                                        <small>mm</small>
                                    </strong>
                                    <span>Prec</span>
                                </div>
    
                                <div>
                                    <strong >
                                        <span id="topSunHours"><?= htmlspecialchars(
                                          $top1Recommendation['sunHours'],
                                        ) ?></span>
                                        <small>h</small>
                                    </strong>
                                    <span>Soleil</span>
                                </div>
    
                            </div>
                        </article>
    
                        <article class="info-card">
                            <h3>
                                <i class="bi bi-calendar-event"></i>
                                Événements prévus
                            </h3>

                            <div class="weather-stats">
                                <div>
                                    <strong id="selectedDayEventCount">-</strong>
                                    <span>événement(s)</span>
                                </div>
                            </div>

                            <p class="mb-0 mt-2 text-muted" id="selectedDayEventMessage">
                                Sélectionnez une date dans le calendrier.
                            </p>
                        </article>
                    </section>
                <?php
                }
                ?>

                <!-- Calendirer des dates -->
                <section class="travel-score">
                    <div class="travel-score-header">
                        <div>
                            <h2>Calendrier du mois</h2>
                            <p>
                                Durée sélectionnée :
                                <strong><?= htmlspecialchars(
                                  $duration,
                                ) ?> jour<?= $duration > 1
   ? 's'
   : '' ?></strong>
                            </p>
                        </div>

                        <div class="travel-score-legend">
                            <span>Low</span>
                            <span class="legend-box score-low"></span>
                            <span class="legend-box score-medium"></span>
                            <span class="legend-box score-high"></span>
                            <span>High</span>
                        </div>
                    </div>

                    <div class="calendar-weekdays">
                        <div>Lun</div>
                        <div>Mar</div>
                        <div>Mer</div>
                        <div>Jeu</div>
                        <div>Ven</div>
                        <div>Sam</div>
                        <div>Dim</div>
                    </div>

                    <div class="calendar-grid" id="calendarGrid"></div>
                </section>

                <form method="POST" action="<?= url(
                  'pages/book_event.php',
                ) ?>" class="booking-form">

                    <input type="hidden" name="eventName" value="<?= htmlspecialchars($eventName) ?>">
                    <input type="hidden" name="eventType" value="<?= htmlspecialchars($eventType) ?>">
                    <input type="hidden" name="setting" value="<?= htmlspecialchars($setting) ?>">
                    <input type="hidden" name="nbGuests" value="<?= htmlspecialchars($participants) ?>">
                    <input type="hidden" name="region" value="<?= htmlspecialchars($region) ?>">
                    <input type="hidden" name="month" value="<?= htmlspecialchars($month) ?>">
                    <input type="hidden" name="duration" value="<?= htmlspecialchars($duration) ?>">

                    <input type="hidden" name="cityId" id="selectedCityId" value="<?= htmlspecialchars($top1Recommendation['id']) ?>">
                    <input type="hidden" name="startDate" id="selectedStartDate">

                    <input type="hidden" name="description" value="<?= htmlspecialchars($description) ?>">

                    <button type="submit" class="btn btn-app-secondary" id="submitBooking" disabled>
                        Bloquer cet événement
                    </button>

                </form>

            </section>

        </section>

    <?php endif; ?>
</main>

<!-- script de recuperation des données php vers js -->
<script>
    window.exploreData = {
        recommendations: <?= json_encode(
          $recommendations,
          JSON_UNESCAPED_UNICODE,
        ) ?>,
        selectedMonth: "<?= htmlspecialchars($month) ?>",
        duration: <?= (int) $duration ?>
    };
</script>
<?php require_once __DIR__ . '/../includes/footer.php';
