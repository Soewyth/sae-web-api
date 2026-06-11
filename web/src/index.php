<?php

require_once __DIR__ . '/main.inc.php';

$pageTitle = 'Accueil';
$activePage = 'home';

error_reporting(0);

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/navbar.php';

if ($_GET['event_start_research'] == 'event_start_research') {
  $pageTitle = 'Explorer';
  $activePage = 'explore';
}
?>

<main class="page-wrapper">

    <?php require_once __DIR__ . '/pages/' . $activePage . '.php'; ?>

</main>

<?php require_once __DIR__ . '/includes/footer.php';

?>
