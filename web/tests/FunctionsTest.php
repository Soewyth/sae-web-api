<?php

declare(strict_types=1);

use PHPUnit\Framework\TestCase;

/**
 * Tests unitaires pour les fonctions helper de main.inc.php.
 *
 * Note : requireLogin() et requireAdmin() appellent exit() sur leur chemin d'erreur.
 * Seul le chemin "succès" (utilisateur connecté / admin) est testé en unit.
 * Le comportement de redirection relève des tests d'intégration.
 */
class FunctionsTest extends TestCase
{
    protected function setUp(): void
    {
        $_SESSION = [];
        $_GET = [];
    }

    protected function tearDown(): void
    {
        $_SESSION = [];
        $_GET = [];
    }

    // -------------------------------------------------------------------------
    // isUserLoggedIn()
    // -------------------------------------------------------------------------

    public function testIsUserLoggedInVraiQuandTokenEtUserPresents(): void
    {
        $_SESSION['token'] = 'jwt-token-123';
        $_SESSION['user']  = ['id' => 1, 'email' => 'test@test.com'];

        $this->assertTrue(isUserLoggedIn());
    }

    public function testIsUserLoggedInFauxSansToken(): void
    {
        $_SESSION['user'] = ['id' => 1];

        $this->assertFalse(isUserLoggedIn());
    }

    public function testIsUserLoggedInFauxSansUser(): void
    {
        $_SESSION['token'] = 'jwt-token-123';

        $this->assertFalse(isUserLoggedIn());
    }

    public function testIsUserLoggedInFauxQuandSessionVide(): void
    {
        $this->assertFalse(isUserLoggedIn());
    }

    // -------------------------------------------------------------------------
    // url()
    // -------------------------------------------------------------------------

    public function testUrlAvecSlashInitial(): void
    {
        $this->assertEquals('/users', url('/users'));
    }

    public function testUrlSansSlashInitial(): void
    {
        $this->assertEquals('/users', url('users'));
    }

    public function testUrlAvecChemin(): void
    {
        $this->assertEquals('/pages/login.php', url('/pages/login.php'));
    }

    public function testUrlChaineVide(): void
    {
        $this->assertEquals('/', url(''));
    }

    public function testUrlAvecSousRepertoires(): void
    {
        $this->assertEquals('/api/v1/events', url('api/v1/events'));
    }

    // -------------------------------------------------------------------------
    // getUser()
    // -------------------------------------------------------------------------

    public function testGetUserRetourneTableauUser(): void
    {
        $_SESSION['user'] = ['id' => 1, 'email' => 'test@test.com', 'username' => 'alice'];

        $result = getUser();

        $this->assertIsArray($result);
        $this->assertEquals(1, $result['id']);
        $this->assertEquals('test@test.com', $result['email']);
    }

    public function testGetUserRetourneNullQuandAbsent(): void
    {
        $this->assertNull(getUser());
    }

    // -------------------------------------------------------------------------
    // getToken()
    // -------------------------------------------------------------------------

    public function testGetTokenRetourneLaValeur(): void
    {
        $_SESSION['token'] = 'mon-jwt-token-secret';

        $this->assertEquals('mon-jwt-token-secret', getToken());
    }

    public function testGetTokenRetourneNullQuandAbsent(): void
    {
        $this->assertNull(getToken());
    }

    // -------------------------------------------------------------------------
    // isAdmin()
    // -------------------------------------------------------------------------

    public function testIsAdminVraiPourAdmin(): void
    {
        $_SESSION['user'] = ['id' => 1, 'email' => 'admin@test.com', 'isAdmin' => true];

        $this->assertTrue(isAdmin());
    }

    public function testIsAdminFauxPourNonAdmin(): void
    {
        $_SESSION['user'] = ['id' => 2, 'email' => 'user@test.com', 'isAdmin' => false];

        $this->assertFalse(isAdmin());
    }

    public function testIsAdminFauxQuandUserAbsent(): void
    {
        $this->assertFalse(isAdmin());
    }

    public function testIsAdminFauxQuandIsAdminNonDefini(): void
    {
        $_SESSION['user'] = ['id' => 3, 'email' => 'user@test.com'];

        $this->assertFalse(isAdmin());
    }

    public function testIsAdminFauxAvecValeurString(): void
    {
        // Vérification que la comparaison stricte === true est bien utilisée
        $_SESSION['user'] = ['id' => 4, 'isAdmin' => '1'];

        $this->assertFalse(isAdmin());
    }

    // -------------------------------------------------------------------------
    // requireLogin() — chemin succès uniquement
    // -------------------------------------------------------------------------

    public function testRequireLoginNeRienFaitQuandConnecte(): void
    {
        $_SESSION['token'] = 'jwt-token';
        $_SESSION['user']  = ['id' => 1];

        requireLogin();

        $this->assertTrue(true, 'requireLogin() ne doit pas interrompre l\'exécution quand connecté');
    }

    // -------------------------------------------------------------------------
    // requireAdmin() — chemin succès uniquement
    // -------------------------------------------------------------------------

    public function testRequireAdminNeRienFaitQuandAdmin(): void
    {
        $_SESSION['token'] = 'jwt-token';
        $_SESSION['user']  = ['id' => 1, 'isAdmin' => true];

        requireAdmin();

        $this->assertTrue(true, 'requireAdmin() ne doit pas interrompre l\'exécution pour un admin');
    }

    // -------------------------------------------------------------------------
    // hasExploreSearchParams()
    // -------------------------------------------------------------------------

    public function testHasExploreSearchParamsVraiAvecTousLesParams(): void
    {
        $_GET = [
            'event_start_research' => '1',
            'event_name'           => 'Concert',
            'event_type'           => 'Music',
            'event_place'          => 'Paris',
            'event_month'          => '06',
            'event_duration'       => '2',
            'event_participants'   => '100',
        ];

        $this->assertTrue(hasExploreSearchParams());
    }

    public function testHasExploreSearchParamsFauxSansStartResearch(): void
    {
        $_GET = [
            'event_name'         => 'Concert',
            'event_type'         => 'Music',
            'event_place'        => 'Paris',
            'event_month'        => '06',
            'event_duration'     => '2',
            'event_participants' => '100',
        ];

        $this->assertFalse(hasExploreSearchParams());
    }

    public function testHasExploreSearchParamsFauxAvecNomVide(): void
    {
        $_GET = [
            'event_start_research' => '1',
            'event_name'           => '',
            'event_type'           => 'Music',
            'event_place'          => 'Paris',
            'event_month'          => '06',
            'event_duration'       => '2',
            'event_participants'   => '100',
        ];

        $this->assertFalse(hasExploreSearchParams());
    }

    public function testHasExploreSearchParamsFauxAvecTypVide(): void
    {
        $_GET = [
            'event_start_research' => '1',
            'event_name'           => 'Concert',
            'event_type'           => '',
            'event_place'          => 'Paris',
            'event_month'          => '06',
            'event_duration'       => '2',
            'event_participants'   => '100',
        ];

        $this->assertFalse(hasExploreSearchParams());
    }

    public function testHasExploreSearchParamsFauxAvecLieuManquant(): void
    {
        $_GET = [
            'event_start_research' => '1',
            'event_name'           => 'Concert',
            'event_type'           => 'Music',
            // event_place absent
            'event_month'          => '06',
            'event_duration'       => '2',
            'event_participants'   => '100',
        ];

        $this->assertFalse(hasExploreSearchParams());
    }

    public function testHasExploreSearchParamsFauxAvecParticipantsVides(): void
    {
        $_GET = [
            'event_start_research' => '1',
            'event_name'           => 'Concert',
            'event_type'           => 'Music',
            'event_place'          => 'Lyon',
            'event_month'          => '06',
            'event_duration'       => '2',
            'event_participants'   => '',
        ];

        $this->assertFalse(hasExploreSearchParams());
    }

    public function testHasExploreSearchParamsFauxQuandGetVide(): void
    {
        $this->assertFalse(hasExploreSearchParams());
    }

    public function testHasExploreSearchParamsFauxAvecDureeManquante(): void
    {
        $_GET = [
            'event_start_research' => '1',
            'event_name'           => 'Expo',
            'event_type'           => 'Art',
            'event_place'          => 'Nantes',
            'event_month'          => '08',
            // event_duration absent
            'event_participants'   => '50',
        ];

        $this->assertFalse(hasExploreSearchParams());
    }
}
