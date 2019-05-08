<?php

require_once '../constants.php';

class VkApi 
{
    private $access_key;

    public function VkApi($access_key)
    {
        $this->access_key = $access_key;
    }

    private function GetNextQueryPack($ids, &$first, $fields)
    {
        $qpack = QUERY_PACK;

        $params = [
            'user_ids' => implode(",", array_slice($ids, $first, $qpack)),
            'fields' => $fields,
            'name_case' => 'nom',
            'v' => '5.52',
            'access_token' => $this->access_key
        ];
        
        $query =  http_build_query($params);

        $first += $qpack;
        return $query;
    }

    public function GetDataByIds($ids, $fields = 'has_photo, photo_max_orig')
    {
        $first = 0;
        $result = array();

        while($first < count($ids)){
            $pack = $this->GetNextQueryPack($ids, $first, $fields);
            $url = "https://api.vk.com/method/users.get?".$pack;

            $data = file_get_contents($url);

//            if(!is_null($data)) {
            $res  = json_decode($data, true);
            $result =  array_merge($result, $res['response']);
//            }
        }

        return $result;
    }
}

class EpApi 
{
    private $client_id;
    private $secret;
    private $authorization;
    private $curl;
    private $params;
    var $host;
    var $login;
    var $password;
    var $database;
    var $dbh;

    public function EpApi($client_id, $secret, $host, $login, $password, $database)
    {
        $this->params = array('url', 'num_keywords' => EP_KEYWORDS_NUMBER);
        $this->client_id = $client_id;
        $this->secret = $secret;
        $this->dbh = $dbh;
        $this->host = $host;
        $this->login = $login;
        $this->password = $password;
        $this->database = $database;
        $this->dbh = new PDO("mysql:host={$host};dbname={$database}", $login, $password);
    }

    private function RefreshTokenAndAuth()
    {
        echo "token was refreshed."."\n";

        $url = "https://api.everypixel.com/oauth/token?client_id=$this->client_id&client_secret=$this->secret&grant_type=client_credentials";

        $_curl = curl_init();
        curl_setopt($_curl, CURLOPT_URL, $url);
        curl_setopt($_curl, CURLOPT_RETURNTRANSFER, true);
        $data = curl_exec($_curl);
        curl_close($_curl);

        $json = json_decode($data);

        if($json->error)
            return false;

        $this->WriteToken($json->access_token);
        
        $this->authorization = "Authorization: Bearer $json->access_token";
        curl_setopt($this->curl, CURLOPT_HTTPHEADER, array($this->authorization));
        curl_setopt($this->curl, CURLOPT_RETURNTRANSFER, true);

        return true;
    }

    public function ReadToken()
    {
        $query = "SELECT Token FROM EP_APPI WHERE EP_API_ID = 1";
        $res = $this->dbh->query($query);
        $token = $res->fetchAll()[0]['Token'];
        var_dump($token);
        return $token;
    }

    public function WriteToken($token)
    {
        $query = "UPDATE `EP_APPI` SET `token` = '{$token}' WHERE EP_API_ID=1";
        $stmt = $this->dbh->query($query);

        echo "token was rewritten."."\n";
    }

    public function Init()
    {
        $this->curl = curl_init();
        $this->LoadTokenFile();
        return true;
    }

    public function GetKeywords($photoUrl)
    {
        $json = $this->Try($photoUrl);
        // echo var_dump($json)."\n";
        // return $json;
        if ($json->error || $json === null || $json['status'] == 'error') {
            $this->LoadTokenFile();
            // $data = curl_exec($this->curl);
            $json = $this->Try($photoUrl);
            if ($json->error || $json === null || $json['status'] == 'error') {
                $this->RefreshTokenAndAuth();
                // $data = curl_exec($this->curl);
                $json = $this->Try($photoUrl);
            }
        }

        return $json;//['keywords'];
    }

    public function Try($photoUrl){
        $this->params['url'] = $photoUrl;
        // var_dump($this->params['url']);
        // var_dump($photoUrl);
        $url = 'https://api.everypixel.com/v1/keywords?'.http_build_query($this->params);
        
        curl_setopt($this->curl, CURLOPT_URL, $url);

        $data = curl_exec($this->curl);
        $json = json_decode(json_encode(json_decode($data)),true);
        // echo $url.' : '.$data.'\n';
        return $json;
    }

    public function LoadTokenFile(Type $var = null)
    {
        $token = $this->ReadToken();
        $this->authorization = "Authorization: Bearer $token";
        curl_setopt($this->curl, CURLOPT_HTTPHEADER, array($this->authorization));
        curl_setopt($this->curl, CURLOPT_RETURNTRANSFER, true);
    }

    public function Close()
    {
        curl_close($this->curl);
    }

    public function SetNumKeywords($numKeywords)
    {
        if (!is_int($numKeywords) || $numKeywords < 0)
            return false;
        $this->params['num_keywords'] = $numKeywords;
        return true;
    }
}
