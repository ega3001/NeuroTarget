<?php

/**
 * Класс для работы с кластерами
 */
class ClusterHandler
{
	var $user_id;
	var $dbh;
	var $template;
	var $set;
	var $operations;
	public function __construct(&$dbh, $user_id)
	{
		$this->closebracket = false;
		$this->user_id = $user_id;
		$this->dbh = $dbh;
		$this->operations = [
			'AND' => 'INTERSECT', // Не работает с MySQL
			'OR'  => ' UNION ',
		];
		$this->set = [
			'_Operation' => 'AutoOperation',
			'_Tag' => 'AutoTag',
			'_Bracket' => 'AutoBracket',
			'_Cluster' => 'AutoCluster',
		];
		$this->template = 
			'	select pt.ParseIDVK_ID
				FROM Tag t 
				JOIN `ParseIDVK-Tag` pt ON t.Tag_ID=pt.Tag_ID 
				WHERE pt.ParseIDVK_ID=p.ParseIDVK_ID 
				AND t.TagName= "{tag}" ';
	}

	private function GetClass($elem)
	{
		switch ($elem) {
			case 'AND':
			case 'OR' :
				return '_Operation';
			case '('  :
			case ')'  :
				return '_Bracket';
		}
		if(stripos($elem, 't_') === 0){
			return '_Tag';
		}
		if(stripos($elem, 'c_') === 0){
			return '_Cluster';
		}

		throw new Exception("Неизвестный элемент кластера \"{$elem}\".");
	}

	private function AutoBracket(&$str, $bracket)
	{
		$str .= $bracket. ' ';
	}

	private function AutoTag(&$str, $tag)
	{
		$tag = substr($tag, 2);
		$temp = str_replace('{tag}', $tag, $this->template);
		$str .= $temp. ' ';
	}

	private function AutoOperation(&$str, $operation)
	{
		$str .= $this->operations[$operation]. ' ';
	}

	private function AutoCluster(&$str, $cluster)
	{
		$cluster = substr($cluster, 2);

		$query = "	select ClusterText from Cluster
					where id = {$this->user_id} and ClusterName = \"{$cluster}\" ";
		
		if($this->dbh == NULL){
			throw new Exception('Потеряно соединение с базой данных.');
		}

		$cluster_query = $this->dbh->query($query)->fetchAll()[0][0];

		if($cluster_query == false){
			throw new Exception("Не найден кластер {$cluster}, user id = {$this->user_id}.");
		}

		$str .= ' ( '. $cluster_query. ' ) ';
	}

	public function GetQuery($cluster)
	{//Возвращает текст запроса для выражения кластер
		$elems = explode(';', $cluster);
		$query = '';

		foreach ($elems as $elem) {
			$class = $this->GetClass($elem);
			$this->{$this->set[$class]}($query, $elem);
		}

		return $query;
	}
}

?>