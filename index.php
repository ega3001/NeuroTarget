<?php

require_once 'php/klein_vendor/autoload.php';
require 'php/DBHandler.php';
require 'php/auth.php';

require_once __DIR__ . '/vendor/autoload.php';

require_once 'constants.php';


$dbhandler = new DBHandler("pgsql", $database, $host, $port, $login, $password);

use PhpAmqpLib\Connection\AMQPStreamConnection;
use PhpAmqpLib\Message\AMQPMessage;

$connection = new AMQPStreamConnection('localhost', 5672, 'guest', 'guest');
$channel = $connection->channel();

$klein = new Klein\Klein();

function ExceptionString($e)
{
    return [
        'message' => $e->getMessage(),
        'info'    => 'Файл: '. $e->getFile(). "\nСтрока:". $e->getLine()
    ];
}

$klein->respond('POST', '/get_options', function(){
    $data = $_POST['data'];
    $search = $_POST['search'];
    $arr = array();

    if ($search == "") {
        for ($i = 0; $i < count($data); $i++) {
            $arr[] = ['id' => $data[$i]['TagName'], 'text' => $data[$i]['TagName']];
        }
    }
    else {
        for ($i = 0; $i < count($data); $i++) {
            if (strpos(strtolower($data[$i]['TagName']), strtolower($search)) === 0) {
                $arr[] = ['id' => $data[$i]['TagName'], 'text' => $data[$i]['TagName']];
            }
        }
    }
    echo json_encode($arr);
});

$klein->respond('GET', '/', function () use ($dbhandler){
    echo $dbhandler->Redirect();
});

$klein->respond('POST', '/logout', function () use ($dbhandler){
    echo $dbhandler->logOut();
});


$klein->respond('GET', '/load', function () use ($dbhandler){
    if(!$dbhandler->IsLoggedIn()){
        echo $dbhandler->RedirectTo('login');
    } else {
        require 'html/load.html';
    }
});

$klein->respond('GET', '/settings', function () use ($dbhandler){
    if(!$dbhandler->IsLoggedIn()){
        echo $dbhandler->RedirectTo('login');
    } else {
        require 'html/settings.html';
    }
});

$klein->respond('POST', '/check_invite', function () use ($dbhandler){
    echo $dbhandler->CheckInvite($_POST['invite']);
});

$klein->respond('POST', '/load_file', function () use ($dbhandler){
  echo $dbhandler->LoadFile();
});

$klein->respond('POST', '/connect_invite', function () use ($dbhandler){
    echo $dbhandler->ConnectInvite($_POST['invite'], $_POST['id']);
});

$klein->respond('POST', '/login', function () use ($dbhandler){
    echo $dbhandler->LogIn($_POST['email'], $_POST['pass']);
    session_start();
    $_SESSION['email'] = 'green';
});

$klein->respond('GET', '/login', function () use ($dbhandler){
    if($dbhandler->IsLoggedIn()){
        echo $dbhandler->RedirectTo('load');
    } else {
        require 'html/login.html';
    }
});

$klein->respond('GET', '/filter', function () use ($dbhandler){
    if(!$dbhandler->IsLoggedIn()){
        echo $dbhandler->RedirectTo('login');
    } else {
        require 'html/filter.html';
    }
});

$klein->respond('GET', '/create_cluster', function () use ($dbhandler){
    if(!$dbhandler->IsLoggedIn()){
        echo $dbhandler->RedirectTo('login');
    } else {
        require 'html/clusters.html';
    }
});

$klein->respond('GET', '/view_tags', function () use ($dbhandler){
    if($dbhandler->IsLoggedIn()){
        require 'html/view_tags.php';
    } else {
        echo $dbhandler->RedirectTo('login');
    }
});

$klein->respond('GET', '/register', function () use ($dbhandler){
    if($dbhandler->IsLoggedIn()){
        echo $dbhandler->RedirectTo('load');
    }
    else{
        require 'html/register.html';
    }
});

$klein->respond('POST', "/register", function () use ($dbhandler){
    echo $dbhandler->Register($_POST['email'], $_POST['pass']);
});

$klein->respond('POST', "/delete_register", function () use ($dbhandler){
    echo $dbhandler->DeleteRegister($_POST['id']);
});

$klein->respond('POST', "/change_password", function () use ($dbhandler){
    echo $dbhandler->ChangePassword($_POST['oldPassword'], $_POST['newPassword']);
});

$klein->respond('POST','/get_queries',function() use ($dbhandler){
    echo $dbhandler->GetQueries();
});

$klein->respond('POST','/get_tags_from_query', function() use ($dbhandler){
    $result = [];
    try {
        $result = $dbhandler->GetTagsFromQuery($_POST['query_id'], $_POST['cluster']);
    } catch(Exception $e) {
        return json_encode(ExceptionString($e));
    }
    return json_encode($result);
});

$klein->respond('POST','/get_cluster_view', function() use ($dbhandler){
    $result = [];
    try {
        $result = $dbhandler->GetClusterElems($_POST['cluster_name']);
    } catch(Exception $e) {
        return json_encode(ExceptionString($e));
    }
    return json_encode($result);
});

$klein->respond('POST','/get_tags_stat_from_query', function() use ($dbhandler){
    $result = [];
    try {
        $result = $dbhandler->GetTagsStatFromQuery($_POST['query_id'], $_POST['cluster'], $_POST['isDescent']);
    } catch(Exception $e) {
        return json_encode(ExceptionString($e));
    }
    return json_encode($result);
});

$klein->respond('POST','/save_cluster', function() use ($dbhandler){
    $result = false;
    try {
        $result = $dbhandler->SaveCluster($_POST['cluster_name'], $_POST['cluster']);
    } catch(Exception $e) {
        return json_encode(ExceptionString($e));
    }
    return $result;
});

$klein->respond('POST','/get_clusters', function() use ($dbhandler){
    try {
        $result = $dbhandler->GetClusters();
    } catch(Exception $e) {
        return json_encode(ExceptionString($e));
    }
    return json_encode($result);
});

$klein->respond('POST','/get_tags', function() use ($dbhandler){
    $result = [];
    try {
        $result = $dbhandler->GetTags();
    } catch(Exception $e) {
        return json_encode(ExceptionString($e));
    }
    return json_encode($result);
});

$klein->respond('POST','/get_users_from_query', function() use ($dbhandler){
    $result = [];
    try {
        $result = $dbhandler->GetUsersFromQuery($_POST['query_id'], $_POST['cluster'], $_POST['offset'], $_POST['photosNumOnPage']);
    } catch(Exception $e) {
        return json_encode(ExceptionString($e));
    }
    return json_encode($result);
});

$klein->respond('GET','/save_users_from_query',function() use ($dbhandler){
    $result = [];
    try {
        $result = $dbhandler->SaveUsersFromQuery($_GET['query_id'], $_GET['cluster']);
    } catch(Exception $e) {
        return json_encode(ExceptionString($e));
    }
    return $result;
});

/**
 * Загрузка файла в очередь
 */
$klein->respond("POST", "/uploadFiles", function ($params) {
    /**
     * Функция работает для ОДНОГО файла
     */
    $data = array();
    $error = false;
    $file_way = "";
    $uploaddir = './userfiles/';

    if (!is_dir($uploaddir)) {
        mkdir($uploaddir, 0777);
    }

    foreach ($_FILES as $file) {
        if (move_uploaded_file($file['tmp_name'], $uploaddir . basename($file['name']))) {
            $file_way = realpath($uploaddir . $file['name']);
        } else {
            $error = true;
        }
    }
    $data = $error ? array('error' => 'Ошибка загрузки файлов.') : array('file' => $file_way);

    echo json_encode($data);
});

$klein->respond('GET', '/getUserPhotosLinks', function ($params) {
    $QueueName =  'vkQueue';
   
    $GLOBALS["channel"]->queue_declare($QueueName, false, true, false, false);

    //создаем сообщение для очереди
    $file_way = json_decode($params->info)->file;

    $file = fopen($file_way, 'r');

    if ($file) {
        while (!feof($file)) {
            $counter = 0;
            $batch_ids = array();
            
            while (!feof($file) && $counter < QUERY_PACK) {
                $batch_ids[count($batch_ids)] = fgets($file);
                $counter++;
            }
            
            // Фильтр строк от ненужных символов
            $batch_ids = array_map(function($elem){
                return str_replace(array("\r\n", "\r", "\n", "\t"), '', $elem);
                },$batch_ids
            );
            
            // Формирование сообщения
            $info = Array("file" => $batch_ids);
            $msg = new AMQPMessage(
                json_encode($info),
                array('delivery_mode' => AMQPMessage::DELIVERY_MODE_PERSISTENT)
            );
            $GLOBALS["channel"]->basic_publish($msg, '', $QueueName);
        }
    }
    
    $GLOBALS["channel"]->close();
    $GLOBALS["connection"]->close();
});

$klein->dispatch();



