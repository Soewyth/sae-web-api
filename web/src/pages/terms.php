<?php
require_once __DIR__ . '/../main.inc.php';

$pageTitle = "Conditions d'utilisation";
$activePage = 'terms';

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
    <h1>Conditions d'utilisation</h1>

    <p>En utilisant <?= APP_NAME ?>, vous acceptez les présentes conditions d'utilisation. Merci de les lire attentivement.</p>

    <h3>1. Accès au service</h3>
    <p>Le service est accessible gratuitement à toute personne disposant d'un accès à Internet. La création d'un compte est nécessaire pour publier des événements ou des avis.</p>

    <h3>2. Contenu publié</h3>
    <p>Vous êtes responsable du contenu que vous publiez (événements, avis, commentaires). Tout contenu illicite, offensant ou trompeur pourra être supprimé sans préavis par les administrateurs.</p>

    <h3>3. Données météorologiques</h3>
    <p>Les prévisions et recommandations fournies par <?= APP_NAME ?> sont données à titre indicatif. Nous ne saurions être tenus responsables d'un événement annulé ou perturbé par des conditions météorologiques imprévues.</p>

    <h3>4. Modification des conditions</h3>
    <p>Nous nous réservons le droit de modifier ces conditions à tout moment. Les utilisateurs seront informés de toute modification substantielle par e-mail.</p>
</main>

<?php require_once __DIR__ . '/../includes/footer.php';