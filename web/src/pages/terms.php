<style>
    .simple-page-container { max-width: 600px; margin: 50px auto; padding: 40px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .simple-page-container h1 { color: #333; margin-bottom: 30px; border-bottom: 2px solid var(--color-green); display: inline-block; padding-bottom: 5px; }
    .contact-form .form-control { border: 1px solid #ddd; padding: 12px; border-radius: 8px; margin-bottom: 15px; }
    .contact-form button { padding: 12px 30px; font-weight: bold; border-radius: 50px; }
</style>

<main class="simple-page-container">
    <h1>Contact</h1>
    <p>Une question ou une suggestion ? N'hésitez pas à nous envoyer un message.</p>
    <form action="send_contact.php" method="POST" class="contact-form">
        <div class="mb-3">
            <label class="form-label">Email</label>
            <input type="email" class="form-control" name="email" required>
        </div>
        <div class="mb-3">
            <label class="form-label">Message</label>
            <textarea class="form-control" name="message" rows="5" required></textarea>
        </div>
        <button type="submit" class="btn text-white" style="background-color: var(--color-green);">Envoyer</button>
    </form>
</main>
