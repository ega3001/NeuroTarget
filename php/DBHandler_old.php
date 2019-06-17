<?php

require __DIR__ . '/auth_vendor/autoload.php';
require 'ClusterHandler.php';

class DBHandler{
	var $dbname;
	var $dbh;
	var $auth;
	public function DBHandler($bdtype, $dbname, $host, $port, $login, $password)
	{
		$this->dbname = $dbname;
		$this->dbh = new PDO("{$bdtype}:host={$host};dbname={$dbname};port={$port}", $login, $password);
		$this->auth = new \Delight\Auth\Auth($this->dbh);
	}
	private function GetNextQueryPack($arr, &$first, $concat = '', $lFrame = '', $rFrame = '')
	{
		$qpack = 800;
		$arrTemp = array_slice($arr, $first, $qpack);

		$size = count($arrTemp);
		$res = "{$lFrame}{$arrTemp[0]}{$rFrame}";
		for ($i = 1; $i < $size; $i++) { 
			$res = $res."{$concat}{$lFrame}{$arrTemp[$i]}{$rFrame}";
		}
		$first += $qpack;

		return $res;
	}
	/*=======================================================================
	===========================AUTH_FUNCTIONS===============================
	//=====================================================================*/
	public function Redirect()
	{
		if ($this->auth->isLoggedIn()) {
	        return "<script>self.location='/load';</script>";//header('Location: http://tagrgetingempty/main');
	    }
	    else {
	        return "<script>self.location='/login';</script>";//header('Location: http://tagrgetingempty/login');
	    }
	}
	public function IsLoggedIn()
	{
		return $this->auth->isLoggedIn();
	}
	public function RedirectTo($link){
		return "<script>self.location='/{$link}';</script>";
	}
	public function logOut()
	{
		$this->auth->LogOut();
		// session_destroy();
		return 'Success';
	}
	public function LoadFile()
	{
		if(!$this->auth->isLoggedIn()){
			return json_encode(array("success"=>false,"data"=>'not login'));
		}

		$userId = $this->auth->getUserId();
		$queryName = $_POST['queryName'];
		
		if(empty($_FILES)){
		    return json_encode(array("success"=>false,"data"=>'Файл не найден'));
		    die();
		}

		$ids = file($_FILES['file']['tmp_name']);
		$reg = '/^\d+(\r\n|\z)/';
		$sz = count($ids);
		for ($i = 0; $i < $sz; $i++) {
		    if(!preg_match($reg, $ids[$i])){
		        unset($ids[$i]);
		    }
		}

		if (empty($ids)) {
		    return json_encode(array("success"=>false,"data"=>'Файл не содержит корректные id'));
		} elseif (!$this->AddQuery($userId, $queryName)){
		    return json_encode(array("success"=>false,"data"=>'Запрос с таким названием у вас уже существует'));
		}
		
		//Фильтр
		$ids = 	array_unique($ids);
		$ids = 	array_map( function($elem){
					return str_replace(array("\r\n", "\r", "\n", "\t"), '', $elem);
					},$ids
				);
		$pids = $this->AddIdsToParseIDVK($ids);
		$queryId = $this->GetQueryId($userId, $queryName);
		$this->AddQueryParseIDVK($queryId, $pids);

		return json_encode(array('success' =>true,'data'=>'Query created'));
	}
	/*=======================================================================
	===========================QUERY_FUNCTIONS===============================
	//=====================================================================*/
	public function CheckInvite($invite)//$_POST['invite']
	{
		if (isset($invite)) {
	        $query = "select * FROM \"Referal\" WHERE \"User_ID\" IS NULL AND \"Token\" = '{$invite}'";
	        $result = [];
	        foreach ($this->dbh->query($query) as $row) {
				$result[count($result)] = $row;
	        }
	        if (count($result) > 0)
	        	return 'Success';
	        return 'Failed';
   		}
        return 'Failed';
	}
	//--------------------//
	public function ConnectInvite($invite, $id)//$_POST['invite'] , $_POST['id']
	{
		if (isset($invite) AND isset($id)) {
	        $query = "update \"Referal\" SET \"User_ID\" = '{$id}' WHERE \"Token\" = '{$invite}'";
	        $this->dbh->query($query);
	        return 'Success';
    	}
        return 'Failed';
	}
	//--------------------//
	public function LogIn($email, $pass)
	{
		if(isset($email) AND isset($pass)) {
	        try {
	            //$auth = $GLOBALS['auth'];
	            $this->auth->login($email, $pass, null);
	            $query = "select \"check_invite\"('".$email."')";
	            //echo $query;
	            
	            $result = [];
	            foreach ($this->dbh->query($query) as $row) {
	                $result[count($result)] = $row;
	            }

	            if (count($result) > 0 AND $result[0][0] == '1') {
	            	$query = "select \"id\" FROM \"users\" WHERE \"email\" = '{$email}'";
	            	$res = $this->dbh->query($query);
	            	$userId = $res->fetchAll()[0][0];
	            	session_start();
	            	$_SESSION['userId'] = $userId;
	            	return 'Success';
	            }

	            $this->auth->logOut();
	            // $auth->admin()->deleteUserByEmail($_POST['email']);
	            return "try another one";

	        } catch (\Delight\Auth\InvalidEmailException $e) {
	            return 'wrong email address';
	        } catch (\Delight\Auth\InvalidPasswordException $e) {
	            return 'wrong password';
	        } catch (\Delight\Auth\EmailNotVerifiedException $e) {
	            return 'email not verified';
	        } catch (\Delight\Auth\TooManyRequestsException $e) {
	            return 'too many requests';
	        } catch (Exception $e){
	            return 'Some error';
	        }
		}
	}
	//--------------------//
	public function Register($email, $pass)
	{
	    try {
	        //$auth = $GLOBALS['auth'];
	        $userId = $this->auth->register($email, $pass, null);
	        return $userId;
	        // we have signed up a new user with the ID `$userId`
	    }
	    catch (\Delight\Auth\InvalidEmailException $e) {
	        return 'invalid email address';
	    }
	    catch (\Delight\Auth\InvalidPasswordException $e) {
	        return 'invalid password';
	    }
	    catch (\Delight\Auth\UserAlreadyExistsException $e) {
	        $query = "select \"check_invite\"('{$email}')";
	        //echo $query;
	        $result = [];
	        foreach ($this->dbh->query($query) as $row) {
	            $result[count($result)] = $row;
	        }
	        if (count($result) > 0 AND $result[0][0] === '1') return 'user already exists';
	        else{
	            $this->auth->admin()->deleteUserByEmail($email);
	            return 'try another one';
	        }
	    }
	    catch (\Delight\Auth\TooManyRequestsException $e) {
	        return 'too many requests';
	    }
	}
	//--------------------//
	public function DeleteRegister($id)//$_POST['id']
	{
	    try {
	        $this->auth->admin()->deleteUserById($id);
	        return 'Success';
	    }
	    catch (\Delight\Auth\UnknownIdException $e) {
	        return 'Failed';
	    }
	}
	//--------------------//
	public function ChangePassword($oldPass, $newPass)//$_POST['oldPassword'] $_POST['newPassword']
	{
		try {
	        $this->auth->changePassword($oldPass, $newPass);
	        // password has been changed
	        return 'Success';
	    }
	    catch (\Delight\Auth\NotLoggedInException $e) {
	        // not logged in
	        return 'not login';
	    }
	    catch (\Delight\Auth\InvalidPasswordException $e) {
	        // invalid password(s)
	        return 'invalid password';
	    }
	    catch (\Delight\Auth\TooManyRequestsException $e) {
	        // too many requests
	        return 'too many requests';
	    }
	}
	//--------------------//
	public function GetQueries()
	{
	    if ($this->auth->isLoggedIn()) {
	        $user = $this->auth->getUserId();
	        $query="select \"Query_ID\", \"QueryName\" FROM \"Query\" WHERE \"User_ID\"='{$user}'";
	        $result = [];
	        foreach ($this->dbh->query($query) as $row) {
	            $result[count($result)] = $row;
	        }
	        return json_encode($result);   
	    }
	    else {
	        return 'Failed';
	    }
	}
	//--------------------//
	public function SaveCluster($cluster_name, $cluster)
	{
		if($cluster == '')
			throw new Exception("Пустой кластер.");
		if($cluster_name == '')
			throw new Exception("Пустое название.");
		
		$user_id = $this->auth->getUserId();

		$query =
			"	select 	\"Cluster_ID\" from \"Cluster\" 
				where 	\"ClusterName\"='{$cluster_name}'
				and 	\"id\"='{$user_id}'";

		$run = $this->dbh->prepare($query);

		if( !$run->execute() )
			throw new Exception('Ошибка при выполнении запроса.'. $query);
		if(count($run->fetchAll()) != 0)
			throw new Exception("Уже есть кластер с таким названием.");
			
		$cluster_name = str_replace("'", "''", $cluster_name); // Экранирование одинарной кавычки для PostgreSQL
		$query =
			"	insert INTO \"Cluster\"(\"id\", \"ClusterName\", \"ClusterText\") VALUES ({$user_id}, '{$cluster_name}', ";

		if(!ClusterHandler::IsCorrect($cluster))
			throw new Exception("Некорректное выражение кластера ");

		$cluster = str_replace("'", "''", $cluster); // Экранирование одинарной кавычки для PostgreSQL
		$query .= ' \''. $cluster. '\') ';

		$run = $this->dbh->prepare($query);

		if( !$run->execute() ){
			throw new Exception('Ошибка при выполнении запроса.'. $query);
		}

		return true;
	}
	//--------------------//
	public function GetTags()
	{   
	    $query = "select \"TagName\" from \"Tag\" ORDER BY \"TagName\" ASC";
	    
	    $run = $this->dbh->prepare($query);

	    if( !$run->execute() ){
	    	throw new Exception('Ошибка при выполнении запроса. '. $query);
	    }

	    $result = [];
	    foreach ($run->fetchAll(PDO::FETCH_ASSOC) as $row) {
	        if(json_encode($row) == false){
	        	throw new Exception(
	        		'Некорректный тег в базе (скорее всего). '. 
					count($result) != 0 ? 
					'тег после "'. $result[count($result) - 2]. '" по алфавиту' : 
					'первый тег по алфавиту'
				);
	        }
	        $result[count($result)] = $row;
	    }

	    return $result;
	}
	//--------------------//
	public function GetClusters()
	{   
		//	На данном этапе каждому пользователю доступны кластеры всех пользователей
		// $user_id = $this->auth->getUserId();
		// $query = "select \"ClusterName\" from \"Cluster\" where \"id\"={$user_id} ORDER BY \"ClusterName\" ASC";
	    $query = "select \"ClusterName\" from \"Cluster\" ORDER BY \"ClusterName\" ASC";

	    $run = $this->dbh->prepare($query);

	    if( !$run->execute() ){
	    	throw new Exception('Ошибка при выполнении запроса. '. $query);
	    }

	    $result = [];
	    foreach ($run->fetchAll(PDO::FETCH_ASSOC) as $row) {
	        if(json_encode($row) == false){
	        	throw new Exception(
	        		'Некорректный кластер в базе (скорее всего). '. 
					count($result) != 0 ? 
					'тег после "'. $result[count($result) - 2]. '" по алфавиту' : 
					'первый кластер по алфавиту'
				);
	        }
	        $result[count($result)] = $row;
	    }

	    return $result;
	}
	//--------------------//
	public function GetTagsStatFromQuery($query_id, $cluster)
	{
		$query = '';

		if( $cluster != '' ){
			$query .= ' select t."TagName", count(pt."ParseIDVK-Tag_ID") as cnt from (';
				
			$template = 
			'	(select pt."ParseIDVK_ID"
				FROM "Query-ParseIDVK" qp 
				JOIN "ParseIDVK-Tag" pt ON qp."ParseIDVK_ID"=pt."ParseIDVK_ID" 
				JOIN "Tag" t ON pt."Tag_ID"=t."Tag_ID" 
				WHERE qp."Query_ID"= '. $query_id. ' AND 
				t."TagName" like \'{tag}\')';
			
			$user_id = $this->auth->getUserId();
			$clh = new ClusterHandler($this->dbh, $user_id, $template);
			$cluster_query = $clh->GetQuery($cluster);
			
			$query .= $cluster_query. ' ) as tbl 
			    join "ParseIDVK-Tag" pt on pt."ParseIDVK_ID" = tbl."ParseIDVK_ID"
			    join "Tag" t on t."Tag_ID" = pt."Tag_ID"
			    group by "TagName"';
		} else {
			$query .= 
	    	'	select t."TagName", COUNT(pt."ParseIDVK_ID") as cnt 
	    		FROM  "Query-ParseIDVK" qp  
	    		JOIN  "ParseIDVK-Tag" pt ON pt."ParseIDVK_ID"=qp."ParseIDVK_ID"
				JOIN   "Tag" t ON t."Tag_ID"=pt."Tag_ID" 
				WHERE  qp."Query_ID"= '. $query_id;
			$query .= 'group by t."TagName"';
		}

		$query .= ' order by cnt desc ';
		// return $query;
	    $run = $this->dbh->prepare($query);

	    if( !$run->execute() ){
	    	throw new Exception('Ошибка при выполнении запроса. '. $query);
	    }

		$result = [];
	    foreach ($run->fetchAll(PDO::FETCH_ASSOC) as $row) {
	        if(json_encode($row) == false){
	        	throw new Exception(
	        		'Некорректный тег в базе (скорее всего).'. 
	        		'Теги, использованные в запросe: '. implode(", ", $tags)
	        	);
	        }
	        $result[count($result)] = $row;
	    }

	    return $result;
	}
	//--------------------//
	public function GetTagsFromQuery($query_id, $cluster)
	{
		$query = '';

		if( $cluster != '' ){
			$query .= ' select * from (';
				
			$template = 
			'	(select distinct t."TagName"
				FROM "Query-ParseIDVK" qp 
				JOIN "ParseIDVK-Tag" pt ON qp."ParseIDVK_ID"=pt."ParseIDVK_ID" 
				JOIN "Tag" t ON pt."Tag_ID"=t."Tag_ID" 
				WHERE qp."Query_ID"= '. $query_id. ' AND 
				EXISTS (SELECT * FROM "Tag" t 
				JOIN "ParseIDVK-Tag" pt ON pt."Tag_ID"=t."Tag_ID" 
				WHERE pt."ParseIDVK_ID"=qp."ParseIDVK_ID" 
				AND t."TagName" = \'{tag}\') 
				GROUP BY t."TagName")';
			
			$user_id = $this->auth->getUserId();
			$clh = new ClusterHandler($this->dbh, $user_id, $template);
			$cluster_query = $clh->GetQuery($cluster);
			
			$query .= $cluster_query. ' ) as tbl ';
		} else {
			$query .= 
	    	'	select distinct t."TagName"
	    		FROM  "Query-ParseIDVK" qp  
	    		JOIN  "ParseIDVK-Tag" pt ON pt."ParseIDVK_ID"=qp."ParseIDVK_ID"
	    		JOIN   "Tag" t ON t."Tag_ID"=pt."Tag_ID" 
	    		WHERE  qp."Query_ID"= '. $query_id;
		}
	    
	    $query .= ' order by "TagName" asc ';

	    $run = $this->dbh->prepare($query);

	    if( !$run->execute() ){
	    	throw new Exception('Ошибка при выполнении запроса. '. $query);
	    }

		$result = [];
	    foreach ($run->fetchAll(PDO::FETCH_ASSOC) as $row) {
	        if(json_encode($row) == false){
	        	throw new Exception(
	        		'Некорректный тег в базе (скорее всего).'. 
	        		'Теги, использованные в запросe: '. implode(", ", $tags)
	        	);
	        }
	        $result[count($result)] = $row;
	    }

	    return $result;
	}
	//--------------------//
	public function GetUsersFromQuery($query_id, $cluster)
	{
		$query = '';

		if( $cluster != '' ){
    	    if(!ClusterHandler::IsCorrect($cluster))
    			throw new Exception("Некорректное выражение кластера ");
    			
			$query .= ' select * from (';
			
			$template = 
			'	select p."TextID", p."AvatarURL"
				FROM "Query-ParseIDVK" qp 
				JOIN "ParseIDVK" p ON qp."ParseIDVK_ID"=p."ParseIDVK_ID" 
				JOIN "ParseIDVK-Tag" pt ON p."ParseIDVK_ID"=pt."ParseIDVK_ID" 
				JOIN "Tag" t ON pt."Tag_ID"=t."Tag_ID" 
				WHERE qp."Query_ID"= '. $query_id. ' AND t."TagName" like \'{tag}\' ';
			$user_id = $this->auth->getUserId();
			$clh = new ClusterHandler($this->dbh, $user_id, $template);
			$cluster_query = $clh->GetQuery($cluster);
			
			$query .= $cluster_query. ' ) as tbl';
		} else {
			$query .=
			'	select distinct p."TextID", p."AvatarURL"
				FROM "Query-ParseIDVK" qp
				JOIN "ParseIDVK" p ON qp."ParseIDVK_ID"=p."ParseIDVK_ID" 
				WHERE qp."Query_ID"= '. $query_id;
		}

		$run = $this->dbh->prepare($query);

		if( !$run->execute() ){
			throw new Exception('Ошибка при выполнении запроса.'. $query);
		}
        
        $cnt = $run->rowCount();
    
		$result = [];
		for ($i = 0; $i < min($cnt, 100); $i++) {
		     $result[] = $run->fetch(PDO::FETCH_ASSOC);
		}

		return [
		    'total_count'   => $cnt,
		    'users'         => $result
        ];
	}//--------------------//
	public function SaveUsersFromQuery($query_id, $cluster)
	{
		$query = '';

		if( $cluster != '' ){
    	    if(!ClusterHandler::IsCorrect($cluster))
    			throw new Exception("Некорректное выражение кластера ");
    			
			$query .= ' select * from (';
			
			$template = 
			'	select distinct p."TextID"
				FROM "Query-ParseIDVK" qp 
				JOIN "ParseIDVK" p ON qp."ParseIDVK_ID"=p."ParseIDVK_ID" 
				JOIN "ParseIDVK-Tag" pt ON p."ParseIDVK_ID"=pt."ParseIDVK_ID" 
				JOIN "Tag" t ON pt."Tag_ID"=t."Tag_ID" 
				WHERE qp."Query_ID"= '. $query_id. ' AND t."TagName" like \'{tag}\' ';
			$user_id = $this->auth->getUserId();
			$clh = new ClusterHandler($this->dbh, $user_id, $template);
			$cluster_query = $clh->GetQuery($cluster);
			
			$query .= $cluster_query. ' ) as tbl';
		} else {
			$query .=
			'	select distinct p."TextID"
				FROM "Query-ParseIDVK" qp
				JOIN "ParseIDVK" p ON qp."ParseIDVK_ID"=p."ParseIDVK_ID" 
				WHERE qp."Query_ID"= '. $query_id;
		}

		$run = $this->dbh->prepare($query);

		if( !$run->execute() ){
			throw new Exception('Ошибка при выполнении запроса.'. $query);
		}


		$ids = "";
		foreach ($run->fetchAll(PDO::FETCH_ASSOC) as $row) {
	        $ids .= $row['TextID']. "\r\n";
	    }

		$ids = mb_substr($ids, 0, -1);
		header("Pragma: public");
		header("Content-Type: text/plain; charset=utf-8");
		header("Content-Disposition: attachment; charset=utf-8; filename=\"file.txt\"");
		header("Content-Transfer-Encoding: binary"); 
		header("Content-Length: " . strlen($ids));

		return $ids;
	}
	/*=======================================================================
	===========================GET/ADD_FUNCTIONS=============================
	//=====================================================================*/
	public function GetIdsByTags($queryId, $tagsArr, $score = 0.5)
	{
		/**
		 * Не использовать!
		 * Логику работы с этой функцией необходимо поменять
		 */
		return 'useless function GetIdsByTags';

		$q_start = ' select q."QueryName", p."TextID", p."AvatarURL", ';
		$q_join = 
			'	FROM "Query" q 
				JOIN "Query-ParseIDVK" qp ON q.Query_ID=qp.Query_ID 
				JOIN "ParseIDVK" p ON qp."ParseIDVK_ID"=p."ParseIDVK_ID" 
				WHERE q."Query_ID"='. $queryId;
	    $q_end = 'GROUP BY "TextID"';
		$qpack = 800;
		$first = 0;
		$res = array();
		while($first != count($tagsArr)){
			$lim = (count($tagsArr) - $first < $qpack) ? count($tagsArr) : $first + $qpack;
			$q_select = " (SELECT pt.Value FROM Tag t 
		JOIN `ParseIDVK-Tag` pt ON t.Tag_ID=pt.Tag_ID 
		WHERE pt.ParseIDVK_ID=p.ParseIDVK_ID AND t.TagName=\"{$tagsArr[$first]}\" AND pt.Value>={$score}) AS {$tagsArr[$first]}";
			$q_exists = " AND EXISTS (SELECT pt.Value FROM Tag t 
							JOIN `ParseIDVK-Tag` pt ON t.Tag_ID=pt.Tag_ID 
							WHERE pt.ParseIDVK_ID=p.ParseIDVK_ID AND t.TagName='{$tagsArr[$first]}' AND pt.Value>={$score}) ";
			for ($i= $first +1; $i < $lim; $i++) { 
				$q_select = $q_select.", (SELECT pt.Value FROM Tag t 
		JOIN `ParseIDVK-Tag` pt ON t.Tag_ID=pt.Tag_ID 
		WHERE pt.ParseIDVK_ID=p.ParseIDVK_ID AND t.TagName=\"{$tagsArr[$i]}\" AND pt.Value>={$score}) AS {$tagsArr[$i]}";
				$q_exists = $q_exists." AND EXISTS (SELECT pt.Value FROM Tag t 
							JOIN `ParseIDVK-Tag` pt ON t.Tag_ID=pt.Tag_ID 
							WHERE pt.ParseIDVK_ID=p.ParseIDVK_ID AND t.TagName=\"{$tagsArr[$i]}\" AND pt.Value>={$score}) ";
			}
			$query = $q_start.$q_select.$q_join.$q_exists.$q_end;
			foreach ($this->dbh->query($query) as $row) {
			 	$res[count($res)] = $row['TextID'];
			}
			$first = $lim;
		}
		return $res;
	}
	//---------------------------||
	public function GetPidById($id)
	{
		$query = "select \"ParseIDVK_ID\" FROM \"ParseIDVK\" WHERE \"TextID\"='{$id}'";
		
		foreach ($this->dbh->query($query) as $row) {
			return $row['ParseIDVK_ID'];
		}
	}

	public function GetPidsByIds($idsArr)
	{
		$result = array();
		foreach ($idsArr as $id) {
			array_push($result, $this->GetPidById($id));
		}
		return $result;
	}
	//---------------------------||
	public function GetUserId($login, $passHash)
	{
		$query = "select \"User_ID\" FROM \"User\" WHERE \"Login\"='{$login}'";
		$userId = $this->dbh->query($query);
		$userId = $userId->fetchAll();
		return $userId[0][0];
	}
	//---------------------------||
	public function GetUserIdByQueryId($query_id)
	{
		$query = 'select "User_ID" FROM "Query" WHERE "Query_ID"='. $query_id;
		$userId = $this->dbh->query($query);
		$userId = $userId->fetchAll()[0][0];
		return $userId;
	}
	//---------------------------||
	public function AddAvatarURLSByIds($ids, $avatarUrls)
	{
		for ($i=0; $i < count($ids); $i++) { 
			$query = "update \"ParseIDVK\" SET \"AvatarURL\"='{$avatarUrls[$i]}' WHERE \"TextID\"='{$ids[$i]}'";
			$this->dbh->query($query);
		}
	}
	//---------------------------||
	public function RefreshPersonId($userFormatId, $id)
	{
		$query = "update \"ParseIDVK\" SET \"TextID\"='{$id}' WHERE \"TextID\"='{$userFormatId}'";
		// echo "\n".$query."\n";
		$res = $this->dbh->query($query);
		if($res){
			return;
		}
		$query = "select \"ParseIDVK_ID\" FROM \"ParseIDVK\" WHERE \"TextID\"='{$id}'";
		$res = $this->dbh->query($query)->fetchAll()[0][0];
		if($res == NULL){
			return;
		}
		$query = "delete FROM \"ParseIDVK\" WHERE \"TextID\"='{$userFormatId}'";
		$this->dbh->query($query);
	}
	public function AddAvatarURLSByPersons($persons)
	{
		foreach ($persons as $value) {
			if(!$value['has_photo']) {
				continue;
			}
			$query = "update \"ParseIDVK\" SET \"AvatarURL\"='{$value['photo_max_orig']}' WHERE \"TextID\"='{$value['id']}'";
			$this->dbh->query($query);
		}
	}
	//---------------------------||
	public function GetTidByTag($tag)
	{
		$tag = str_replace("'", "''", $tag);
		$query = "select \"Tag_ID\" FROM \"Tag\" WHERE \"TagName\"='{$tag}'";
		
		foreach ($this->dbh->query($query) as $row) {
			return $row['Tag_ID'];
		}
	}

	public function GetTidsByTags($tagsArr)
	{
		$result = array();
		foreach ($tagsArr as $id) {
			array_push($result, $this->GetTidByTag($id));
		}
		return $result;
	}
	//---------------------------||
	public function AddTag($tag)
	{
		$tag = str_replace("'", "''", $tag);
		$query = "insert INTO \"Tag\"(\"TagName\") VALUES('{$tag}')";
		$this->dbh->query($query);
	}

	public function AddTags($tagsArr)
	{
		foreach ($tagsArr as $tag) {
			$this->AddTag($tag);
		}
	}
	//---------------------------||
	public function AddValue($person)
	{
		foreach ($person['keywords'] as $keyword) {
			$query = "insert INTO \"ParseIDVK-Tag\"(\"ParseIDVK_ID\", \"Tag_ID\", \"Value\") VALUES('{$person['id']}', '{$keyword['keyword']}', '{$keyword['score']}')";
			$this->dbh->query($query);
		}
	}

	public function AddValues($personsArr)
	{
		foreach ($personsArr as $person) {
			$this->AddValue($person);
		}
	}

	public function GetQueryId($userId, $queryName)
	{
		$query = "select \"Query_ID\" FROM \"Query\" WHERE \"User_ID\"={$userId} AND \"QueryName\"='{$queryName}'";
		$queryId = $this->dbh->query($query);
		$queryId = $queryId->fetchAll()[0][0];
		return $queryId;
	}
	/*=======================================================================
	===========================MAIN_FUNCTIONS================================
	//=====================================================================*/
	public function AddUser($login, $passHash)
	{
		$query = "insert INTO \"User\"(\"Login\", \"PassHash\") VALUES('{$login}', '{$passHash}')";
		$this->dbh->query($query);
		return GetUserId($login, $passHash);
	}

	public function AddQuery($userId, $queryName)
	{
		//Check
		$query = "select \"Query_ID\" FROM \"Query\" WHERE \"User_ID\"='{$userId}' AND \"QueryName\"='{$queryName}'";
		$res = $this->dbh->query($query);
		if( isset($res->fetchAll()[0][0]) )
			return false;
		//
		$query = "insert INTO \"Query\"(\"User_ID\", \"QueryName\") VALUES('{$userId}','{$queryName}')";
		$this->dbh->query($query);

		return true;
	}

	public function AddIdsToParseIDVK($idsArr)
	{
		$first = 0;
		while($first < count($idsArr)){
			$pack 	= $this->GetNextQueryPack($idsArr, $first, ',', "('", "')");
			$query 	= "insert INTO \"ParseIDVK\"(\"TextID\") VALUES{$pack}";
			$query .= "ON CONFLICT DO NOTHING";
			$this->dbh->query($query);
		}
		return $this->GetPidsByIds($idsArr);
	}
	public function AddQueryParseIDVK($queryId, $pids)
	{
		$first = 0;
		while($first < count($pids)){
			$pack = $this->GetNextQueryPack($pids, $first, ',', "('{$queryId}','", "')");
			$query = "insert INTO \"Query-ParseIDVK\"(\"Query_ID\", \"ParseIDVK_ID\") VALUES{$pack}";
			$this->dbh->query($query);
		}
	}

	public function TagsHandler($persons)
	{	
		//tags to tids
		//get array all tags
		$tags = array();
		foreach ($persons as $person) {
			foreach ($person['keywords'] as $key) {
				array_push($tags, $key['keyword']);
			}
		}

		$this->AddTags($tags);

		//get array all tids
		$tids = $this->getTidsByTags($tags);

		//replace tags to tids
		$i = 0;
		foreach ($persons as &$person) {
			foreach ($person['keywords'] as &$key) {
				$key['keyword'] = $tids[$i];
				$i += 1;
			}
		}

		//ids to pids
	 	$pids = $this->GetPidsByIds(array_column($persons, 'id'));

	 	$i = 0;
	 	foreach ($persons as &$person) {
	 		$person['id'] = $pids[$i];
	 		$i += 1;
	 	}
	 	
	 	$this->AddValues($persons);
	}
}
?>