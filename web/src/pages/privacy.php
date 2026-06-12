<?php
require_once __DIR__ . '/../main.inc.php';

$pageTitle = 'Politique de confidentialité';
$activePage = 'privacy';

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
    <h1>Politique de confidentialité</h1>

    <p>Dernière mise à jour : juin 2026. Chez <?= APP_NAME ?>, nous prenons la protection de vos données personnelles très au sérieux.</p>

    <h3>Collecte des données</h3>
    <p>Nous collectons uniquement les informations nécessaires au fonctionnement du service : votre adresse e-mail, votre nom d'utilisateur ainsi que les événements et avis que vous créez sur la plateforme.</p>

    <h3>Utilisation des données</h3>
    <p>Vos données servent exclusivement à l'optimisation de vos recherches d'événements et à la gestion de votre compte. Elles ne sont jamais vendues ni partagées avec des tiers à des fins commerciales.</p>

    <h3>Conservation</h3>
    <p>Vos données sont conservées tant que votre compte est actif. La suppression de votre compte entraîne la suppression de l'ensemble de vos données personnelles sous 30 jours.</p>

    <h3>Vos droits</h3>
    <p>Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Vous pouvez exercer ces droits directement depuis votre tableau de bord.</p>
</main>

<?php require_once __DIR__ . '/../includes/footer.php';