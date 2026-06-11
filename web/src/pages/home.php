<?php
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

<div class="home-main-display">
    <div class="home-main-display-text text-white w-75 user-select-none">
        <h1>EventSpot</h1>
        <h2>Planifiez vos événements avec précision.</h2>
        <h2 class="mb-5"><strong>La rencontre de la science météo et de l'expertise touristique.</strong></h2>

        <div class="home-main-buttons">
            <a href="#event-research" class="btn-cta text-light" style="background-color: var(--color-green);">
                Commencer l'analyse &nbsp;<i class="bi bi-chevron-double-down"></i>
            </a>
            <span class="real-time-badge">
                <i class="bi bi-check-circle"></i> Données Temps Réel
            </span>
        </div>
    </div>
</div>

<div id="event-research" class="event-research d-flex flex-column align-items-center justify-content-center">
    <form class="w-100 d-flex flex-column align-items-center" action="<?= url(
      'pages/explore.php',
    ) ?>" method="get">
        <div class="event-research-text text-center mb-5" style="width: 75%;">
            <h1 style="font-size: 46px; margin-bottom: 20px;">Quel événement souhaitez vous organiser ?</h1>
            <span style="font-size: 20px; color: #6c757d;">Une analyse des données géographiques et temporelles pour vous aider à organiser votre événement au bon endroit, au bon moment.</span>
        </div>

        <div class="event-research-box container-sm border border-1 border-info rounded-2 p-4 shadow" style="backdrop-filter: blur(15px);">
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
                    <div class="btn-group" role="group">
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
                            <select class="form-select py-2" name="event_duration">
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
                    <span class="text-uppercase fw-bold small mb-2">Nombre participants</span>
                    <input type="number" class="form-control" placeholder="200" name="event_participants" required>
                </div>
            </div>

            <div class="row align-items-center">
                <div class="col-md-3 d-flex flex-column w-100">
                    <span class="text-uppercase fw-bold small mb-2">Description</span>
                    <textarea class="form-control" placeholder="Description de l'événement..." name="event_description"></textarea>
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
.home-main-display {
    position: relative;
    height: calc(100vh - 70px);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
}

.home-main-display::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url("../img/background-image-homepage.png");
    background-size: cover;
    background-position: center;
    filter: brightness(30%) grayscale(100%);
    z-index: -1;
}

.home-main-display h1 {
    font-size: clamp(3rem, 5vw, 6rem);
    margin-left: 10vw;
}

.home-main-display h2 {
    margin-left: 10vw;
}

.home-main-buttons {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 30px;
    width: 100%;
    justify-content: center;
}

.btn-cta {
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 24px;
    border-radius: 50px;
    padding: 15px 40px;
    text-decoration: none;
    font-weight: 600;
}

.real-time-badge {
    color: white;
    font-size: 24px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.event-research {
    position: relative;
    min-height: 100vh;
    padding: 60px 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    background: linear-gradient(#ffffff, #d7d7d9);
}

.event-research::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image:
            linear-gradient(to bottom, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0) 80%),
            url("../img/background-image-form.png");    background-size: cover;
    background-position: center;
    z-index: 0;
    filter: brightness(150%);
}

.event-research > form {
    position: relative;
    z-index: 1;

    span {
        color: black;
    }


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
</style>
