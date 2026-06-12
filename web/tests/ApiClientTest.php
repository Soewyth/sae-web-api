<?php

declare(strict_types=1);

use PHPUnit\Framework\TestCase;

/**
 * Mock stream wrapper qui intercepte les appels file_get_contents('http://...')
 * sans faire de vrai appel réseau.
 */
class MockHttpStreamWrapper
{
    /** @var resource|null */
    public $context;

    /** @var array<string, string|false> */
    private static array $responses = [];

    /** Dernière requête capturée (url, method, headers, content) */
    public static array $lastRequest = [];

    private string $content = '';
    private int $readPosition = 0;

    public static function addResponse(string $url, string|false $response): void
    {
        self::$responses[$url] = $response;
    }

    public static function reset(): void
    {
        self::$responses = [];
        self::$lastRequest = [];
    }

    public function stream_open(string $path, string $mode, int $options, ?string &$opened_path): bool
    {
        $opts = stream_context_get_options($this->context);

        self::$lastRequest = [
            'url'     => $path,
            'method'  => $opts['http']['method'] ?? 'GET',
            'headers' => $opts['http']['header'] ?? '',
            'content' => $opts['http']['content'] ?? null,
        ];

        if (!array_key_exists($path, self::$responses)) {
            return false;
        }

        $body = self::$responses[$path];
        if ($body === false) {
            return false;
        }

        $this->content = $body;
        $this->readPosition = 0;
        return true;
    }

    public function stream_read(int $count): string|false
    {
        if ($this->readPosition >= strlen($this->content)) {
            return '';
        }
        $chunk = substr($this->content, $this->readPosition, $count);
        $this->readPosition += strlen($chunk);
        return $chunk;
    }

    public function stream_eof(): bool
    {
        return $this->readPosition >= strlen($this->content);
    }

    public function stream_stat(): array|false
    {
        return false;
    }
}

class ApiClientTest extends TestCase
{
    private ApiClient $client;

    protected function setUp(): void
    {
        stream_wrapper_unregister('http');
        stream_wrapper_register('http', MockHttpStreamWrapper::class);
        MockHttpStreamWrapper::reset();

        $this->client = new ApiClient('http://test-api.local');
    }

    protected function tearDown(): void
    {
        stream_wrapper_unregister('http');
        stream_wrapper_restore('http');
        MockHttpStreamWrapper::reset();
    }

    // -------------------------------------------------------------------------
    // Constructeur
    // -------------------------------------------------------------------------

    public function testConstructeurSupprimeLesSlashsFinaux(): void
    {
        MockHttpStreamWrapper::addResponse('http://test-api.local/test', '{"ok":true}');
        $client = new ApiClient('http://test-api.local///');
        $client->get('/test');

        $this->assertEquals('http://test-api.local/test', MockHttpStreamWrapper::$lastRequest['url']);
    }

    // -------------------------------------------------------------------------
    // GET
    // -------------------------------------------------------------------------

    public function testGetSansQueryParams(): void
    {
        MockHttpStreamWrapper::addResponse('http://test-api.local/users', '{"users":[]}');
        $result = $this->client->get('/users');

        $this->assertEquals(['users' => []], $result);
        $this->assertEquals('GET', MockHttpStreamWrapper::$lastRequest['method']);
        $this->assertEquals('http://test-api.local/users', MockHttpStreamWrapper::$lastRequest['url']);
    }

    public function testGetAvecQueryParams(): void
    {
        MockHttpStreamWrapper::addResponse('http://test-api.local/events?limit=10&page=2', '{"events":[]}');
        $result = $this->client->get('/events', ['limit' => 10, 'page' => 2]);

        $this->assertEquals(['events' => []], $result);
        $this->assertEquals(
            'http://test-api.local/events?limit=10&page=2',
            MockHttpStreamWrapper::$lastRequest['url']
        );
    }

    public function testGetAvecQueryParamsVides(): void
    {
        MockHttpStreamWrapper::addResponse('http://test-api.local/events', '{"events":[]}');
        $this->client->get('/events', []);

        // Aucun ? ne doit être ajouté si le tableau est vide
        $this->assertEquals('http://test-api.local/events', MockHttpStreamWrapper::$lastRequest['url']);
    }

    public function testGetEndpointSansSlashInitial(): void
    {
        MockHttpStreamWrapper::addResponse('http://test-api.local/cities', '[]');
        $this->client->get('cities');

        $this->assertEquals('http://test-api.local/cities', MockHttpStreamWrapper::$lastRequest['url']);
    }

    // -------------------------------------------------------------------------
    // POST
    // -------------------------------------------------------------------------

    public function testPostEnvoieCorpsJson(): void
    {
        MockHttpStreamWrapper::addResponse('http://test-api.local/users', '{"id":42}');
        $result = $this->client->post('/users', ['name' => 'Alice', 'email' => 'alice@test.com']);

        $this->assertEquals(['id' => 42], $result);
        $this->assertEquals('POST', MockHttpStreamWrapper::$lastRequest['method']);
        $this->assertEquals(
            '{"name":"Alice","email":"alice@test.com"}',
            MockHttpStreamWrapper::$lastRequest['content']
        );
    }

    public function testPostSansCorps(): void
    {
        MockHttpStreamWrapper::addResponse('http://test-api.local/ping', '{"pong":true}');
        $this->client->post('/ping');

        $this->assertEquals('POST', MockHttpStreamWrapper::$lastRequest['method']);
        $this->assertEquals('[]', MockHttpStreamWrapper::$lastRequest['content']);
    }

    // -------------------------------------------------------------------------
    // PUT
    // -------------------------------------------------------------------------

    public function testPutEnvoieCorpsJson(): void
    {
        MockHttpStreamWrapper::addResponse('http://test-api.local/users/1', '{"id":1,"name":"Bob"}');
        $result = $this->client->put('/users/1', ['name' => 'Bob']);

        $this->assertEquals(['id' => 1, 'name' => 'Bob'], $result);
        $this->assertEquals('PUT', MockHttpStreamWrapper::$lastRequest['method']);
        $this->assertEquals('{"name":"Bob"}', MockHttpStreamWrapper::$lastRequest['content']);
    }

    // -------------------------------------------------------------------------
    // DELETE
    // -------------------------------------------------------------------------

    public function testDeleteNEnvoiePasDeCorps(): void
    {
        MockHttpStreamWrapper::addResponse('http://test-api.local/users/1', '{"deleted":true}');
        $result = $this->client->delete('/users/1');

        $this->assertEquals(['deleted' => true], $result);
        $this->assertEquals('DELETE', MockHttpStreamWrapper::$lastRequest['method']);
        $this->assertNull(MockHttpStreamWrapper::$lastRequest['content']);
    }

    // -------------------------------------------------------------------------
    // En-têtes
    // -------------------------------------------------------------------------

    public function testRequeteInclutEntetesAcceptEtContentType(): void
    {
        MockHttpStreamWrapper::addResponse('http://test-api.local/test', '{"ok":true}');
        $this->client->get('/test');

        $this->assertStringContainsString(
            'Accept: application/json',
            MockHttpStreamWrapper::$lastRequest['headers']
        );
        $this->assertStringContainsString(
            'Content-Type: application/json',
            MockHttpStreamWrapper::$lastRequest['headers']
        );
    }

    public function testRequeteAvecTokenAjouteAuthorization(): void
    {
        MockHttpStreamWrapper::addResponse('http://test-api.local/me', '{"id":1}');
        $this->client->get('/me', [], 'mon-jwt-token');

        $this->assertStringContainsString(
            'Authorization: Bearer mon-jwt-token',
            MockHttpStreamWrapper::$lastRequest['headers']
        );
    }

    public function testRequeteSansTokenNAjoutePasAuthorization(): void
    {
        MockHttpStreamWrapper::addResponse('http://test-api.local/public', '{"data":true}');
        $this->client->get('/public');

        $this->assertStringNotContainsString(
            'Authorization:',
            MockHttpStreamWrapper::$lastRequest['headers']
        );
    }

    public function testPostAvecTokenAjouteAuthorization(): void
    {
        MockHttpStreamWrapper::addResponse('http://test-api.local/events', '{"id":99}');
        $this->client->post('/events', ['title' => 'Concert'], 'mon-jwt-token');

        $this->assertStringContainsString(
            'Authorization: Bearer mon-jwt-token',
            MockHttpStreamWrapper::$lastRequest['headers']
        );
    }

    // -------------------------------------------------------------------------
    // Gestion des erreurs
    // -------------------------------------------------------------------------

    public function testLeveExceptionSiLAPIEstInaccessible(): void
    {
        // Aucune réponse enregistrée = stream_open retourne false
        $this->expectException(Exception::class);
        $this->expectExceptionMessageMatches('/Impossible de contacter/');

        $this->client->get('/unreachable');
    }

    public function testLeveExceptionSiReponseNEstPasJson(): void
    {
        MockHttpStreamWrapper::addResponse('http://test-api.local/bad', 'ce-nest-pas-du-json');

        $this->expectException(Exception::class);
        $this->expectExceptionMessageMatches('/JSON valide/');

        $this->client->get('/bad');
    }

    public function testLeveExceptionSiReponseEstJsonNull(): void
    {
        MockHttpStreamWrapper::addResponse('http://test-api.local/null', 'null');

        $this->expectException(Exception::class);
        $this->expectExceptionMessageMatches('/JSON valide/');

        $this->client->get('/null');
    }

    // -------------------------------------------------------------------------
    // Valeurs de retour
    // -------------------------------------------------------------------------

    public function testRetourneTableauVide(): void
    {
        MockHttpStreamWrapper::addResponse('http://test-api.local/empty', '[]');
        $result = $this->client->get('/empty');

        $this->assertIsArray($result);
        $this->assertEmpty($result);
    }

    public function testRetourneTableauImbriqué(): void
    {
        $payload = '{"user":{"id":1,"roles":["admin","user"]}}';
        MockHttpStreamWrapper::addResponse('http://test-api.local/profile', $payload);
        $result = $this->client->get('/profile');

        $this->assertEquals(1, $result['user']['id']);
        $this->assertContains('admin', $result['user']['roles']);
    }
}
