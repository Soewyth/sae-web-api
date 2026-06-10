
<footer>

    <div class="footer-logo">
        <a class="navbar-brand d-flex align-items-center gap-2 fw-bold" href="index.php">
            <span class="brand-icon">
                <i class="bi bi-compass-fill"></i>
            </span>
            <span><?= APP_NAME ?></span>
        </a>
    </div>

    <div class="footer-copyright">
        <span>&copy; 2026 <?= APP_NAME ?> - SAE-WEB-API. All rights reserved.</span>
    </div>

    <div class="footer-links">
        <a href="#">A Propos</a>
        <a href="#">Politique de confidentialité</a>
        <a href="#">Conditions d'utilisation</a>
        <a href="#">Contact</a>
    </div>
</footer>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>


<style>

    * {
        margin: 0px;
    }

    footer {
        height: 60px;
        background-color: var(--color-footer);
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-around;
        padding: 40px;
        border-top: 1px solid darkgray;
    }

    .footer-logo {
        flex-basis: 25%;
    }

    .footer-copyright {
        flex-basis: calc(75% / 2);
    }

    .footer-links {
        flex-basis: calc(75% / 2);
        display: flex;
        justify-content: space-around;
        align-items: center;

        a {
            color: var(--color-text);
            text-decoration: none;
        }

        a:hover {
            text-decoration: underline;
        }
    }
    <?php include 'css/style.css'; ?>

</style>
