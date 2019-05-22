<?php

/**
 * Класс для работы с кластерами
 */	
class ClusterHandler
{
	private $user_id;
	private $dbh;
	private $template;
	private $operations;
	private $set;
	private static $grammatic = [
			'S' 			=> ['_OpenBracket', '_Tag', '_Cluster'],
			'_Tag'			=> ['_Operation', '_CloseBracket', 'eps'],
			'_Cluster'		=> ['_Operation', '_CloseBracket', 'eps'],
			'_OpenBracket'	=> ['_Tag', '_Cluster'],
			'_CloseBracket'	=> ['_Operation', 'eps'],
			'_Operation'	=> ['_OpenBracket', '_Tag', '_Cluster'],
		];
	public function __construct(&$dbh, $user_id, $template = '')
	{
		$this->user_id = $user_id;
		$this->dbh = $dbh;
		$this->template = $template;
		$this->operations = [
			'AND' 	=> ' INTERSECT ',
			'OR'  	=> ' UNION ',
			'DIFF'  => ' EXCEPT ',
		];
		$this->set = [
			'_Operation' 	=> 'AutoOperation',
			'_Tag' 			=> 'AutoTag',
			'_OpenBracket' 	=> 'AutoBracket',
			'_CloseBracket' => 'AutoBracket',
			'_Cluster' 		=> 'AutoCluster',
		];
	}

	public static function IsCorrect($cluster)
	{//Проверяет выражение кластера на корректность
		$elems = explode(';', $cluster);
		$state = 'S';
		for ($i = 0; $i < count($elems); $i++) { 
			$new_state = self::GetClass($elems[$i]);
			if(!in_array($new_state, self::$grammatic[$state])){
				return false;
			}
			$state = $new_state;
		}
		return in_array('eps', self::$grammatic[$state]);
	}

	private static function GetClass($elem)
	{
		switch ($elem) {
			case 'AND':
			case 'OR' :
			case 'DIFF' :
				return '_Operation';
			case '('  :
				return '_OpenBracket';
			case ')'  :
				return '_CloseBracket';
		}
		if(stripos($elem, 't_') === 0){
			return '_Tag';
		}
		if(stripos($elem, 'c_') === 0){
			return '_Cluster';
		}

		throw new Exception("Неизвестный элемент выражения \"{$elem}\".");
	}

	private function GetClusterText($cluster_name)
	{
		$cluster_name = substr($cluster_name, 2);

		$query = "	select \"ClusterText\" from \"Cluster\"
					where \"id\" = {$this->user_id} and \"ClusterName\" = '{$cluster_name}' ";

		if($this->dbh == NULL){
			throw new Exception('Потеряно соединение с базой данных.');
		}
		
		$cluster_text = $this->dbh->query($query)->fetchAll()[0][0];	

		if($cluster_text == false){
			throw new Exception("Не найден кластер {$cluster_name}, user id = {$this->user_id}.");
		}

		return $cluster_text;
	}

	private function AutoBracket(&$str, $bracket)
	{
		$str .= $bracket. ' ';
	}

	private function AutoTag(&$str, $tag)
	{
		$tag = substr($tag, 2);
		$tag = str_replace("'", "''", $tag); // Экранирование одинарной кавычки для PostgreSQL
		$temp = str_replace('{tag}', $tag, $this->template);
		$str .= $temp. ' ';
	}

	private function AutoOperation(&$str, $operation)
	{
		$str .= $this->operations[$operation]. ' ';
	}

	private function AutoCluster(&$str, $cluster_name)
	{
		throw new Exception("Функция AutoCluster не должна вызываться");
		
		$cluster_text = $this->GetClusterText($cluster_name);

		$clh = new ClusterHandler($this->dbh, $this->user_id, $this->template);
		$cluster_query = $clh->GetQuery($cluster_text);

		$str .= ' ( '. $cluster_query. ' ) ';
	}

	private function DeployCluster($cluster)
	{
		$elems = explode(';', $cluster);

		$clh = new ClusterHandler($this->dbh, $this->user_id);

		$repl = function($elem) use ($clh) {
			if(self::GetClass($elem) != '_Cluster')
				return $elem;
			return '(;'. $clh->DeployCluster($this->GetClusterText($elem)). ';)';
		};

		$elems = array_map($repl, $elems);

		return implode(';', $elems);
	}

	public function GetQuery($cluster)
	{//Возвращает текст запроса для выражения $cluster
		$query = '';

		if(!self::IsCorrect($cluster))
			throw new Exception("Некорректное выражение кластера ");
		
		$elems = explode(';', $this->DeployCluster($cluster));

		foreach ($elems as $elem) {
			$class = self::GetClass($elem);
			$this->{$this->set[$class]}($query, $elem);
		}

		return $query;
	}
}

?>