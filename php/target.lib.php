<?php

class VkApi{
	private $access_key;
	public function VkApi($access_key)
	{
		$this->access_key = $access_key;
	}
	private function GetNextQueryPack($ids, &$first, $fields)
	{
		$qpack = 100;
		$lim = (count($ids) - $first < $qpack) ? count($ids) : $first + $qpack;

		$params = [
			'user_ids' => implode(",", array_slice($ids, $first, $lim)),
			'fields' => $fields,
			'name_case' => 'nom',
			'v' => '5.52',
			'access_token' => $this->access_key
		];

		$query =  http_build_query($params);
		
		$first = $lim;
		return $query;
	}
	public function GetDataByIds($ids, $fields = 'photo_max_orig, has_photo')
	{
		$first = 0;
		$result = array();
		while($first != count($ids)){
			$pack = $this->GetNextQueryPack($ids, $first, $fields);
			$url = "https://api.vk.com/method/users.get?".$pack;
			
			$res  = json_decode(file_get_contents($url), true);
			
			$result =  array_merge($result,$res['response']);
		}

		return $result;
	}
}

class EpApi{
	private $client_id;
	private $secret;
	private $authorization;
	private $curl;
	private $params;
	public function EpApi($client_id, $secret)
	{
		$this->params = array('url', 'num_keywords' => 50);
		$this->client_id = $client_id;
		$this->secret = $secret;
	}
	private function RefreshTokenAndAuth()
	{
		$url = "https://api.everypixel.com/oauth/token?client_id=$this->client_id&client_secret=$this->secret&grant_type=client_credentials";

		$_curl = curl_init();
		curl_setopt($_curl, CURLOPT_URL, $url);
		curl_setopt($_curl, CURLOPT_RETURNTRANSFER, true);
		$data = curl_exec($_curl);
		curl_close($_curl);

		$json = json_decode($data);

		if($json->error)
			return false;

		$this->authorization = "Authorization: Bearer $json->access_token";
		
		curl_setopt($this->curl, CURLOPT_HTTPHEADER, array($this->authorization));
		curl_setopt($this->curl, CURLOPT_RETURNTRANSFER, true);

		return true;
	}
	public function Init()
	{
		$this->curl = curl_init();
		if(!$this->refreshTokenAndAuth()){
			curl_close($this->curl);
			return false;
		}

		return true;
	}
	public function GetKeywords($photoUrl)
	{
		$this->params['url'] = $photoUrl;

		$url = 'https://api.everypixel.com/v1/keywords?'.http_build_query($this->params);

		curl_setopt($this->curl, CURLOPT_URL, $url);
		$data = curl_exec($this->curl);

		$json = json_decode(json_encode(json_decode($data)),true);

		if($json->error){
			$this->RefreshTokenAndAuth();
			$data = curl_exec($this->curl);
			$json = json_decode($data);
		}

		return $json['keywords'];
	}
	public function Close()
	{
		curl_close($this->curl);
	}
	public function SetNumKeywords($numKeywords)
	{
		if(!is_int($numKeywords) || $numKeywords < 0)
			return false;
		$this->params['num_keywords'] = $numKeywords;
		return true;
	}
}

?>