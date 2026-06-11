<?php
http: //localhost:8080/pages/explore.php?event_name=festival+de+bbq&
// event_type=Festival&
// event_place=outdoor&event_region=Nord-Pas-De-Calais&
// event_month=4&
// event_participants=3000&
// event_description=De+la+Barbaque+%C3%A0+foison&event_start_research=event_start_research

// url
// http://localhost:8080/index.php?
// event_name=festival+de+bbq&
// event_type=&
// event_place=on
// &event_region=Nord-Pas-De-Calais
// &event_month=6&
// event_participants=3000&
// event_description=&
// event_start_research=event_start_research

//http://localhost:8080/pages/explore.php?event_name=festival+de+bbq&event_type=Festival&event_place=outdoor&event_region=Nord-Pas-De-Calais&event_month=7&event_duration=10&event_participants=3000&event_description=fhjnidoksplq%5Efvhcdijkxplsq&event_start_research=event_start_research

require_once __DIR__ . '/../main.inc.php';

$pageTitle = 'Explore';
$activePage = 'explore';

$recommendations = [];
$errorMessage = null;

require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/navbar.php';

$eventName = $_GET['event_name'] ?? '';
$eventType = $_GET['event_type'] ?? '';
$setting = $_GET['event_place'] ?? '';
$audience = $_GET['audience'] ?? '';
$region = $_GET['event_region'] ?? '';

$monthNumber = (int) ($_GET['event_month'] ?? date('n'));
$monthNumber = max(1, min(12, $monthNumber));

$year = (int) date('Y');
$month = sprintf('%04d-%02d', $year, $monthNumber);

$duration = max(1, (int) ($_GET['event_duration'] ?? 1));

function generateFakeDailyScores(string $month, int $baseScore): array
{
  $days = [];

  $firstDay = new DateTime($month . '-01');
  $numberOfDays = (int) $firstDay->format('t');

  for ($day = 1; $day <= $numberOfDays; $day++) {
    $currentDate = new DateTime(
      $month . '-' . str_pad($day, 2, '0', STR_PAD_LEFT),
    );

    $score = $baseScore + rand(-15, 15);
    $score = max(0, min(100, $score));

    $days[] = [
      'date' => $currentDate->format('Y-m-d'),
      'score' => $score,
    ];
  }

  return $days;
}

try {
  // $api = new ApiClient(API_BASE_URL);

  // $recommendations = $api->get('/city/recommendations');

  // en attendant davoir les routes
  $recommendations = [
    [
      'id' => '1',
      'name' => 'Paris',
      'region' => 'Île-de-France',
      'month' => 'May',
      'image_url' =>
        'https://images.unsplash.com/photo-1502602898657-3e91760cbb34',
      'averageTemp' => 20,
      'precipitation' => 65,
      'sunHours' => 7,
      'poisCount' => 124,
      'matchScore' => 92,
      'keyAttractions' => [
        ['name' => 'Eiffel Tower', 'tag' => 'Must See'],
        ['name' => 'Louvre Museum', 'tag' => 'Art'],
        ['name' => 'Notre-Dame', 'tag' => 'History'],
      ],
      'travelScoreByMonth' => [
        'Jan' => 45,
        'Feb' => 48,
        'Mar' => 62,
        'Apr' => 75,
        'May' => 92,
        'Jun' => 88,
        'Jul' => 80,
        'Aug' => 72,
        'Sep' => 85,
        'Oct' => 65,
        'Nov' => 50,
        'Dec' => 42,
      ],
      'travelScoreByDay' => generateFakeDailyScores($month, 92),
    ],
    [
      'id' => '2',
      'name' => 'London',
      'region' => 'Greater London',
      'month' => 'Jun',
      'image_url' =>
        'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad',
      'averageTemp' => 18,
      'precipitation' => 72,
      'sunHours' => 6,
      'poisCount' => 98,
      'matchScore' => 85,
      'keyAttractions' => [
        ['name' => 'Big Ben', 'tag' => 'Must See'],
        ['name' => 'British Museum', 'tag' => 'Museum'],
        ['name' => 'Tower Bridge', 'tag' => 'History'],
      ],
      'travelScoreByMonth' => [
        'Jan' => 40,
        'Feb' => 44,
        'Mar' => 55,
        'Apr' => 68,
        'May' => 78,
        'Jun' => 85,
        'Jul' => 82,
        'Aug' => 76,
        'Sep' => 70,
        'Oct' => 58,
        'Nov' => 47,
        'Dec' => 39,
      ],
      'travelScoreByDay' => generateFakeDailyScores($month, 85),
    ],
    [
      'id' => '3',
      'name' => 'Rome',
      'region' => 'Lazio',
      'month' => 'Sep',
      'image_url' =>
        'https://images.unsplash.com/photo-1552832230-c0197dd311b5',
      'averageTemp' => 24,
      'precipitation' => 45,
      'sunHours' => 8,
      'poisCount' => 156,
      'matchScore' => 78,
      'keyAttractions' => [
        ['name' => 'Colosseum', 'tag' => 'History'],
        ['name' => 'Trevi Fountain', 'tag' => 'Must See'],
        ['name' => 'Vatican Museum', 'tag' => 'Art'],
      ],
      'travelScoreByMonth' => [
        'Jan' => 52,
        'Feb' => 56,
        'Mar' => 66,
        'Apr' => 72,
        'May' => 76,
        'Jun' => 80,
        'Jul' => 70,
        'Aug' => 68,
        'Sep' => 78,
        'Oct' => 74,
        'Nov' => 60,
        'Dec' => 55,
      ],
      'travelScoreByDay' => generateFakeDailyScores($month, 50),
    ],
  ];

  $top1Recommendation = $recommendations[0] ?? null;
} catch (Exception $e) {
  $errorMessage = $e->getMessage();
}
?>

<main class="page-wrapper explore-page">

    <?php if ($errorMessage !== null): ?>
        <div class="alert alert-danger">
            <?= htmlspecialchars($errorMessage) ?>
        </div>
    <?php endif; ?>

    <?php if ($top1Recommendation === null): ?>
        <div class="alert alert-warning">
            Aucune recommandation disponible pour cette recherche.
        </div>
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

                                <div class="recommendations-meta">
                                    <span><?= htmlspecialchars(
                                      $recommendation['poisCount'],
                                    ) ?> Evènements</span>
                                </div>

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
                <p>Image Paris</p>
                <section
                    class="recommandations-top1"
                    id="topRecommendationImage"
                    style="background-image: linear-gradient(rgba(7, 19, 46, 0.2), rgba(7, 19, 46, 0.75)), url('<?= htmlspecialchars(
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
                        <p>En construction</p>
                    </article>
                </section>

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
                  'pages/book-event.php',
                ) ?>" class="booking-form">

                    <input type="hidden" name="eventName" value="<?= htmlspecialchars(
                      $eventName,
                    ) ?>">
                    <input type="hidden" name="eventType" value="<?= htmlspecialchars(
                      $eventType,
                    ) ?>">
                    <input type="hidden" name="setting" value="<?= htmlspecialchars(
                      $setting,
                    ) ?>">
                    <input type="hidden" name="audience" value="<?= htmlspecialchars(
                      $audience,
                    ) ?>">
                    <input type="hidden" name="region" value="<?= htmlspecialchars(
                      $region,
                    ) ?>">
                    <input type="hidden" name="month" value="<?= htmlspecialchars(
                      $month,
                    ) ?>">
                    <input type="hidden" name="duration" value="<?= htmlspecialchars(
                      $duration,
                    ) ?>">

                    <input type="hidden" name="cityId" id="selectedCityId" value="<?= htmlspecialchars(
                      $top1Recommendation['id'],
                    ) ?>">
                    <input type="hidden" name="startDate" id="selectedStartDate">

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
