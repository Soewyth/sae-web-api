<?php

require_once __DIR__ . '/../main.inc.php';

$pageTitle = 'Explore';
$activePage = 'explore';

$recommendations = array();
$errorMessage = null;

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
        'image_url' => 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34',
        'averageTemp' => 20,
        'precipitation' => 65,
        'sunHours' => 7,
        'poisCount' => 124,
        'matchScore' => 92,
        'keyAttractions' => [
            ['name' => 'Eiffel Tower', 'tag' => 'Must See'],
            ['name' => 'Louvre Museum', 'tag' => 'Art'],
            ['name' => 'Notre-Dame', 'tag' => 'History']
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
            'Dec' => 42
        ]
    ],
    [
        'id' => '2',
        'name' => 'London',
        'region' => 'Greater London',
        'month' => 'Jun',
        'image_url' => 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad',
        'averageTemp' => 18,
        'precipitation' => 72,
        'sunHours' => 6,
        'poisCount' => 98,
        'matchScore' => 85,
        'keyAttractions' => [
            ['name' => 'Big Ben', 'tag' => 'Must See'],
            ['name' => 'British Museum', 'tag' => 'Museum'],
            ['name' => 'Tower Bridge', 'tag' => 'History']
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
            'Dec' => 39
        ]
    ],
    [
        'id' => '3',
        'name' => 'Rome',
        'region' => 'Lazio',
        'month' => 'Sep',
        'image_url' => 'https://images.unsplash.com/photo-1552832230-c0197dd311b5',
        'averageTemp' => 24,
        'precipitation' => 45,
        'sunHours' => 8,
        'poisCount' => 156,
        'matchScore' => 78,
        'keyAttractions' => [
            ['name' => 'Colosseum', 'tag' => 'History'],
            ['name' => 'Trevi Fountain', 'tag' => 'Must See'],
            ['name' => 'Vatican Museum', 'tag' => 'Art']
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
            'Dec' => 55
        ]
    ]
];

$top1Recommendation = $recommendations[0];

} catch (Exception $e) {
    $errorMessage = $e->getMessage();
}

require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/navbar.php';
?>

<main class="page-wrapper explore-page">

    <section class="explore-layout">
        <!--Volet gauche-->
        <aside class="recommendations-panel">
            <h1 class="recommendations-title">Liste des recommandations</h1>

            <div class="recommendations-list">
                <?php 
                foreach($recommendations as $key => $recommendation){
                    ?>
                    <!--Vignette de recommandation-->
                    <article class="recommendations-item <?= $key === 0 ? 'active' : ''?>">

                        <img src="<?= htmlspecialchars($recommendation['image_url'])?>" alt="<?= htmlspecialchars($recommendation['name'])?>" class="recommendations-thumb">

                        <div class="recommendations-content">
                            <div class="recommendations-header">
                                <h2><?= htmlspecialchars($recommendation['name']) ?></h2>
                                <span class="recommendations-month">
                                    <?= htmlspecialchars($recommendation['month']) ?>
                                </span>
                            </div>

                            <p class="recommendations-region">
                                <?= htmlspecialchars($recommendation['region']) ?>
                            </p>

                            <div class="recommendations-meta">
                                <span><?= htmlspecialchars($recommendation['poisCount']) ?> Evènements</span>
                            </div>

                            <div class="score-label">
                                <span>Score</span>
                                <strong><?= htmlspecialchars($recommendation['matchScore']) ?>%</strong>
                            </div>

                            <div class="score-bar">
                                <div style="width: <?= htmlspecialchars($recommendation['matchScore']) ?>%"></div>
                            </div>

                        </div>

                    </article>
                <?php
                }
                ?>
            </div>
        </aside>

        <!--Volet droit-->
        <section class="explore-details">
            <p>Image Paris</p>
            <section
                class="recommandations-top1"
                style="background-image: linear-gradient(rgba(7, 19, 46, 0.2), rgba(7, 19, 46, 0.75)), url('<?= htmlspecialchars($top1Recommendation['image_url']) ?>');"
            >
                <div>
                    <h2><?= htmlspecialchars($top1Recommendation['name']) ?></h2>
                    <p><?= htmlspecialchars($top1Recommendation['region']) ?>, France</p>
                </div>

            </section>

            <section class="info-grid">
                <article class="info-card">
                    <h3>
                        <i class="bi bi-thermometer"></i>
                        <?= htmlspecialchars($top1Recommendation['month']) ?> Moyennes
                    </h3>
                    
                    <div class="weather-stats">
                        <div>
                            <strong><?= htmlspecialchars($top1Recommendation['averageTemp']) ?>°</strong>
                            <span>Temp</span>
                        </div>

                        <div>
                            <strong><?= htmlspecialchars($top1Recommendation['precipitation']) ?><small>mm</small></strong>
                            <span>Prec</span>
                        </div>

                        <div>
                            <strong><?= htmlspecialchars($top1Recommendation['sunHours']) ?><small>h</small></strong>
                            <span>Soleil</span>
                        </div>

                    </div>
                </article>

                <article class="info-card">
                    <p>En construction</p>
                </article>
            </section>

            <section class="travel-score">

            </section>

        </section>

    </section>

</main>

<?php 

require_once __DIR__ . '/../includes/footer.php';

?>
