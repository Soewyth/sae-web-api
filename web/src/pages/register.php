<?php

require_once __DIR__ . '/../main.inc.php';

$pageTitle = 'Inscription';
$activePage = 'register';

$error = null;
$success = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $username = $_POST['username'] ?? '';
  $email = $_POST['email'] ?? '';
  $password = $_POST['password'] ?? '';

  // preparation des donnees pour l'api
  $payload = json_encode([
    'username' => $username,
    'email' => $email,
    'password' => $password,
  ]);

  // creation de la requete http vers API
  $context = stream_context_create([
    'http' => [
      'method' => 'POST',
      'header' =>
        "Content-Type: application/json\r\n" . "Accept: application/json\r\n",
      'content' => $payload,
      'ignore_errors' => true,
    ],
  ]);

  // envoi de la reponse vers API
  $response = file_get_contents(
    API_BASE_URL . '/auth/register',
    false,
    $context,
  );

  // reponse de API
  $data = json_decode($response, true);

  if (isset($data['user'])) {
    $success =
      'Compte créé avec succès. Vous pouvez maintenant vous connecter.';
  } else {
    $error = $data['message'] ?? 'Erreur lors de la création du compte.';
  }
}

require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/navbar.php';
?>

<main class="page-wrapper w-100" style="height: calc(100vh - 70px);">
    <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%;">

        <h1>Inscription</h1>

        <?php if ($error): ?>
            <div class="alert alert-danger">
                <?= htmlspecialchars($error) ?>
            </div>
        <?php endif; ?>

        <?php if ($success): ?>
            <div class="alert alert-success">
                <?= htmlspecialchars($success) ?>
            </div>
        <?php endif; ?>

        <form method="post" class="mt-4" style="max-width: 420px;">

            <div class="mb-3">
                <label for="username" class="form-label">Nom d'utilisateur</label>
                <input
                    type="text"
                    name="username"
                    id="username"
                    class="form-control"
                    required
                >
            </div>

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
                Créer mon compte
            </button>

            <a href="<?= url('pages/login.php') ?>" class="btn btn-link">
                Déjà un compte ?
            </a>

        </form>

    </div>
</main>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
