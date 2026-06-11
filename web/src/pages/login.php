<?php

require_once __DIR__ . '/../main.inc.php';

$pageTitle = 'Connexion';
$activePage = 'login';

$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $email = $_POST['email'] ?? '';
  $password = $_POST['password'] ?? '';

  // prepa du json
  $payload = json_encode([
    'email' => $email,
    'password' => $password,
  ]);

  $context = stream_context_create([
    'http' => [
      'method' => 'POST',
      'header' =>
        "Content-Type: application/json\r\n" . "Accept: application/json\r\n",
      'content' => $payload,
      'ignore_errors' => true,
    ],
  ]);

  // envoi la requete a API
  $response = file_get_contents(API_BASE_URL . '/auth/login', false, $context);
  $data = json_decode($response, true);

  // stockage de lutilisateur en session
  if (isset($data['token'], $data['user'])) {
    $_SESSION['token'] = $data['token'];
    $_SESSION['user'] = $data['user'];

    header('Location: ' . url('index.php'));
    exit();
  }

  $error = $data['message'] ?? 'Identifiants incorrects.';
}

require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/navbar.php';
?>

<main class="page-wrapper w-100" style="height: calc(100vh - 70px);">
    <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%;">

        <h1>Connexion</h1>

        <?php if ($error): ?>
            <div class="alert alert-danger">
                <?= htmlspecialchars($error) ?>
            </div>
        <?php endif; ?>

        <form method="post" class="mt-4" style="max-width: 420px;">

            <div class="mb-3">
                <label for="email" class="form-label">Adresse email</label>
                <input
                    type="email"
                    name="email"
                    id="email"
                    class="form-control"
                    required
                >
            </div>

            <div class="mb-3">
                <label for="password" class="form-label">Mot de passe</label>
                <input
                    type="password"
                    name="password"
                    id="password"
                    class="form-control"
                    required
                >
            </div>

            <button type="submit" class="btn btn-app-secondary">
                Se connecter
            </button>

            <a href="<?= url('pages/register.php') ?>" class="btn btn-link">
                Créer un compte
            </a>

        </form>

    </div>
</main>


<?php require_once __DIR__ . '/../includes/footer.php'; ?>
