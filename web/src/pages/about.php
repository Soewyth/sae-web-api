<?php
require_once __DIR__ . '/../main.inc.php';

$pageTitle = 'À propos';
$activePage = 'about';

require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/navbar.php';
?>

<style>
    .simple-page-container { max-width: 800px; margin: 50px auto; padding: 40px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .simple-page-container h1 { color: #333; margin-bottom: 30px; border-bottom: 2px solid var(--color-green); display: inline-block; padding-bottom: 5px; }
    .simple-page-container h3 { color: #444; margin-top: 25px; }
    .simple-page-container p { line-height: 1.8; color: #555; }
</style>

<main class="simple-page-container">
    <h1>À propos de <?= APP_NAME ?></h1>

    <p><?= APP_NAME ?> est une plateforme innovante qui combine expertise touristique et analyse météorologique pour garantir le succès de vos événements.</p>

    <h3>Notre mission</h3>
    <p>Aider les organisateurs à choisir le moment et le lieu parfaits grâce à une analyse de données précise et en temps réel. Que vous organisiez un festival, un marché de plein air ou une compétition sportive, nous croisons les données météo et touristiques pour vous recommander les meilleures villes.</p>

    <h3>Notre équipe</h3>
    <p>Fondée en 2026 par une équipe d'étudiants passionnés de données et de voyages, <?= APP_NAME ?> rassemble aujourd'hui des profils variés : développeurs, météorologues amateurs et amoureux du tourisme local.</p>

    <h3>Nos valeurs</h3>
    <p>Transparence des données, simplicité d'utilisation et passion du terrain. Nous pensons qu'un bon événement commence par un bon emplacement, et qu'un bon emplacement se choisit avec de bonnes données.</p>
</main>

<?php require_once __DIR__ . '/../includes/footer.php';