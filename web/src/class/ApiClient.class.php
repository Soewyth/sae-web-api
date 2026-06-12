<?php

class ApiClient
{
    private string $baseUrl;

    public function __construct(string $baseUrl)
    {
        $this->baseUrl = rtrim($baseUrl, '/');
    }

    public function get(string $endpoint, array $queryParams = [], ?string $token = null): array
    {
        if (!empty($queryParams)) {
            $endpoint .= '?' . http_build_query($queryParams);
        }

        return $this->request('GET', $endpoint, null, $token);
    }

    public function post(string $endpoint, array $data = [], ?string $token = null): array
    {
        return $this->request('POST', $endpoint, $data, $token);
    }

    public function put(string $endpoint, array $data = [], ?string $token = null): array
    {
        return $this->request('PUT', $endpoint, $data, $token);
    }

    public function delete(string $endpoint, ?string $token = null): array
    {
        return $this->request('DELETE', $endpoint, null, $token);
    }

    private function request(string $method, string $endpoint, ?array $data = null, ?string $token = null): array
    {
        $url = $this->baseUrl . '/' . ltrim($endpoint, '/');

        $headers = [
            'Accept: application/json',
            'Content-Type: application/json'
        ];

        if ($token !== null) {
            $headers[] = 'Authorization: Bearer ' . $token;
        }

        $options = [
            'http' => [
                'method' => $method,
                'header' => implode("\r\n", $headers) . "\r\n",
                'ignore_errors' => true,
                'timeout' => 30,
            ]
        ];

        if ($data !== null) {
            $options['http']['content'] = json_encode($data);
        }

        $context = stream_context_create($options);
        $response = @file_get_contents($url, false, $context);

        if ($response === false) {
            throw new Exception("Impossible de contacter l'API : " . $url);
        }

        $decoded = json_decode($response, true);

        if ($decoded === null) {
            throw new Exception("La réponse de l'API n'est pas un JSON valide.");
        }

        return $decoded;
    }
}