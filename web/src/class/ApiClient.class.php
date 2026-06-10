<?php

/**
 * Classe servant à créer un client PHP pour contacter l'API REST et de récupérer des données des donnes au format JSON
 * 
 * exemple: 
 * $api = new ApiClient(API_BASE_URL);
 * $data = $api->get('/city');
 * permet d'appeler http://api:3070/api/city
 */
class ApiClient
{
    private string $baseUrl;

    public function __construct(string $baseUrl)
    {
        $this->baseUrl = rtrim($baseUrl, '/'); // enlever les / a la fin de lurl
    }

    //requete HTTP avec une methode GET
    public function get(string $endpoint): array
    {
        $url = $this->baseUrl . '/' . ltrim($endpoint, '/');

        $options = [
            'http' => [
                'method' => 'GET',
                'header' => "Accept: application/json\r\n",
                'timeout' => 5
            ]
        ];

        $context = stream_context_create($options);

        $response = @file_get_contents($url, false, $context);

        if ($response === false) {
            throw new Exception("Impossible de contacter l'API : " . $url);
        }

        $data = json_decode($response, true); // transforme en tableau php

        if ($data === null) {
            throw new Exception("La réponse de l'API n'est pas un JSON valide.");
        }

        return $data;
    }
}