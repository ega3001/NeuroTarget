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
			'AND' => ' INTERSECT ',
			'OR'  => ' UNION ',
			'DIFF'  => ' EXCEPT ',
		];
		$this->set = [
			'_Operation' => 'AutoOperation',
			'_Tag' => 'AutoTag',
			'_Bracket' => 'AutoBracket',
			'_Cluster' => 'AutoCluster',
		];
		$this->template = 
			'	select pt1."ParseIDVK_ID"
				FROM "Tag" t  
				JOIN "ParseIDVK-Tag" pt1 ON t."Tag_ID"=pt1."Tag_ID"
				WHERE 
				pt1."ParseIDVK_ID"= qp."ParseIDVK_ID"
				AND t."TagName"= \'{tag}\' ';
	}

	private function GetClass($elem)
	{
		switch ($elem) {
			case 'AND':
			case 'OR' :
			case 'DIFF' :
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

		throw new Exception("Неизвестный элемент выражения \"{$elem}\".");
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
		$cluster_name = substr($cluster_name, 2);

		$query = "	select \"ClusterText\" from \"Cluster\"
					where \"id\" = {$this->user_id} and \"ClusterName\" = '{$cluster_name}' ";
		
		if($this->dbh == NULL){
			throw new Exception('Потеряно соединение с базой данных.');
		}

		$cluster_query = $this->dbh->query($query)->fetchAll()[0][0];
		
		if($cluster_query == false){
			throw new Exception("Не найден кластер {$cluster_name}, user id = {$this->user_id}.");
		}

		$str .= ' ( '. $cluster_query. ' ) ';
	}

	public function GetQuery($cluster)
	{//Возвращает текст запроса для выражения $cluster
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