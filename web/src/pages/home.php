<?php

// try {
//   $api = new ApiClient(API_BASE_URL);

//   $recommendations = $api->get('/city');
// } catch (Exception $e) {
// }

// Variables de test
$event_types = ['Festival', 'Cirque', 'Concert'];
$regions = ['Nord-Pas-De-Calais', 'Nord'];

$months = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];
?>

<!-- Main Body -->
<div class="event-research d-flex flex-column align-items-center justify-content-center" style="background-color: var(--bg-color);">

    <form class="w-100 d-flex flex-column align-items-center"
        action="../index.php" method="get">

        <!-- Text -->
        <div class="event-research-text text-center mb-5" style="width: 75%;">
            <h1 style="font-size: 46px; margin-bottom: 20px;">Quel événement souhaitez vous organiser ?</h1>
            <span style="font-size: 20px; color: #6c757d;">Une analyse des données géographiques et temporelles pour vous aider à organiser votre événement au bon endroit, au bon moment.</span>
        </div>

        <!-- Formulaire -->
        <div class="event-research-box container-sm border border-1 border-info rounded-2 bg-light p-4 shadow">


            <div class="row align-items-center mb-4 pb-4 border-bottom border-1 border-gray">
                <div class="col-8">
                    <div class="input-group">
                        <span class="input-group-text">Nom de l'événement</span>
                        <input type="text" class="form-control form-control-lg" placeholder="ex. Festival De Musique" name="event_name" required>
                    </div>
                </div>

                <div class="col-4">
                    <select class="form-select form-select-lg" name="event_type" required>
                        <option selected disabled value="">Type d'événement</option>
                        <?php foreach ($event_types as $event_type): ?>
                            <option value="<?= $event_type ?>"><?= $event_type ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
            </div>

            <div class="row align-items-end mb-4">

                <div class="col-md-3 d-flex flex-column">
                    <span class="text-uppercase fw-bold small mb-2">Lieu</span>
                    <div class="btn-group" role="group" aria-label="Choix du lieu">
                        <input type="radio" class="btn-check" name="event_place" id="outdoor" value="outdoor" checked>
                        <label class="btn btn-radio btn-outline-secondary px-3 py-2" for="outdoor">Outdoor</label>

                        <input type="radio" class="btn-check" name="event_place" id="indoor" value="indoor">
                        <label class="btn btn-radio btn-outline-secondary px-3 py-2" for="indoor">Indoor</label>
                    </div>
                </div>

                <div class="col-md-3 d-flex flex-column">
                    <span class="text-uppercase fw-bold small mb-2">Région</span>
                    <select name="event_region" class="form-select py-2">
                        <option value="none">Toutes Les Régions</option>
                        <?php foreach ($regions as $region): ?>
                            <option value="<?= $region ?>"><?= $region ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div class="col-md-4">
                    <div class="row m-0 p-0">
                        <div class="col-6 ps-0 d-flex flex-column">
                            <span class="text-uppercase fw-bold small mb-2">Mois</span>
                            <select class="form-select py-2" name="event_month">
                                <?php foreach ($months as $index => $month): ?>
                                    <option value="<?= $index +
                                      1 ?>"><?= $month ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>

                        <div class="col-6 pe-0 d-flex flex-column">
                            <span class="text-uppercase fw-bold small mb-2">Durée</span>
                            <select class="form-select py-2">
                                <?php for ($i = 1; $i <= 20; $i++): ?>
                                    <option value="<?= $i ?>"><?= $i ?> <?= $i >
 1
   ? 'jours'
   : 'jour' ?></option>
                                <?php endfor; ?>
                            </select>
                        </div>


                    </div>


                </div>

                <div class="col-2 d-flex flex-column">
                    <span class="text-uppercase fw-bold small mb-2">Nombre  participants</span>
                    <input type="number" class="form-control" placeholder="200" name="event_participants" required>
                </div>


            </div>

            <div class="row align-items-center h-100">
                <div class="col-md-3 d-flex flex-column w-100 h-100">
                    <span class="text-uppercase fw-bold small mb-2">Description</span>
                    <textarea class="form-control"
                        placeholder="Deux jours de musique live en plein cœur de la nature. Retrouvez le meilleur de la scène pop-rock et électro sur deux scènes en plein air ..."
                        name="event_description"></textarea>
                </div>
            </div>

            <div class="row mt-4">
                <div class="col-12">
                    <button type="submit" class="btn text-white w-100 py-3" style="background-color: var(--color-green, #198754);" name="event_start_research" value="event_start_research">
                        <h5 class="m-0">Trouver le meilleur moment &nbsp;<i class="bi bi-search"></i></h5>
                    </button>
                </div>
            </div>

        </div>
    </form>
</div>

<style>

.event-research {
    min-height: calc(100vh - 70px);
    padding: 20px 0;
}

.btn-radio {
    border: 1px solid #ccc;
    background-color: #fff;
    color: #495057;
}

.btn-check:checked + .btn-radio {
    background-color: var(--color-green, #198754) !important;
    border-color: var(--color-green, #198754) !important;
    color: white !important;
}

.row {

    div, select {
        height: 20%;
    }

    textarea {
        height: 40%;
    }
}

.form-control::placeholder {
    color: darkgray;
}

</style>
