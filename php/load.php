<?php 
	
	require 'DBHandler.php';

	$userId = 0;
	$queryName = $_POST['name'];

	$host = "localhost:3307";
	$login = "root";
	$password = "";
	$database = "Targeting";

	$dbhandler = new DBHandler($host, $login, $password, $database);

//-----------
	$ids = file($_FILES['base']['tmp_name']);

	$reg = '/^(([0-9]{2}[a-zA-Z]|[0-9][a-zA-Z]\w|[a-zA-Z]\w{2})\w{2,29}|[0-9]{4,32})\r\n/';
	$sz = count($ids);

	for ($i=0; $i < $sz; $i++) {
	 	if(!preg_match($reg, $ids[$i])){
	 		echo $ids[$i].'<br>';
			unset($ids[$i]);
		}
	}

	if(empty($ids)){
		echo 'Файл не содержит корректные id.';
		die();
	}elseif (!$dbhandler->AddQuery($userId, $queryName)){
		echo 'Запрос с таким названием у вас уже существует.';
		die();
	}

	$ids = array_unique($ids); 

	$pids = $dbhandler->AddIdsToParseIDVK($ids);

	$queryId = $dbhandler->GetQueryId($userId, $queryName);

	$dbhandler->AddQueryParseIDVK($queryId, $pids);

	echo 'Success';
?>

