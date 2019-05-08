<?php
//RabbitMQ and amqplib
require_once '../vendor/autoload.php';

use PhpAmqpLib\Connection\AMQPStreamConnection;
use PhpAmqpLib\Message\AMQPMessage;

//parserLib
require_once '../target/target.php';
require_once 'DBHandler.php';

//Constants
$host = "localhost";//http://vm-3787f085.netangels.ru
$login = "root";
$password = "dJgUiNTcjoL9Uai";//"dJgUiNTcjoL9Uai"
$database = "targetingDB";
$QueueName = 'vkQueue';
$dbh = new DBHandler($host, $login, $password, $database);

$globalCount = 0;

class VkReader
{
    private $connection;
    private $channel;
    private $vkApi;
    public function __construct()
    {

        $this->connection = new AMQPStreamConnection('localhost', 5672, 'guest', 'guest');
        $this->channel = $this->connection->channel();

        $keys = Array(    
            "60e8eed760e8eed760e8eed79a608c1c13660e860e8eed73bd8153c2472ccfe64f25d32", 
            "0dce64cd0dce64cd0dce64cdd70da8276100dce0dce64cd56669b6e0611fe0967f5d750", 
            "b5e94f57b5e94f57b5e94f57ccb58f0cf8bb5e9b5e94f57ee404f5b075b16a35b8b8f22", 
            "4092645240926452409264522140f427e044092409264521b3b641f94863a3bafe7da3b" 
        );

        $options = getopt("k:");

        $this->vkApi = new VkApi(
            $keys[intval($options["k"])]
        );
    }

    public function listen()
    {
        global $QueueName;
        $this->channel->queue_declare($QueueName, false, true, false, false);

        $callback = function (AMQPMessage $msg){
            $decoded_msg = json_decode($msg->body);
            if($decoded_msg != null){
                $file = $decoded_msg->file;
                $IDS = $file;
                $result = $this->vkApi->GetDataByIds($file);
                $result = array_combine($file, $result);
                //userFormatId  key
            }
            $send = new EpSend();
            $send->send($result, $decoded_msg);
            $this->channel->basic_ack($msg->delivery_info['delivery_tag']);
        };

        $prefetchSize = null;
        $prefetchCount = 1;
        $applyPerChannel = null;

        $this->channel->basic_qos($prefetchSize, $prefetchCount, $applyPerChannel);
        $this->channel->basic_consume($QueueName, '', false, false, false, false, $callback);

        while (count($this->channel->callbacks)){
            $this->channel->wait();
        }
    }
}
class EpSend
{
    private $epApi;

    public function __construct()
    {        
        global $host;
        global $login;
        global $password;
        global $database;
        $this->epApi = new EpApi(
            "cokmCeAAm5ukt2Mr8ljADcpPkxQRqKYioj0uddPm",
            "dXfku53759ntKOGQ51146vU0kuwFUmmAJN8Q407sFUKHO4osnu", $host, $login, $password, $database
        );
    }
    public function send($msg, $info)
    {
        global $dbh;
        global $host;
        global $login;
        global $password;
        global $database;
        global $globalCount;
        echo "-------------------start-----------------\n";

        if (!$this->epApi->init()) {
            echo "epApi initial error\n";
            return;
        }

        $data = $msg;
        if($data == null) {
            echo "incorrect message\n";
            return;
        }

        $i = 1;
        $persons = array();
        foreach ($data as $key => &$value) {
            /*
            Нужно поправить. Теряются связи с Query_ID
            
            Если id было пользовательское 
            то оно заменяется на оригинальное
            if($key != $value['id']){
                // echo "\n".'замена'."\n";
                $dbh->RefreshPersonId($key, $value['id']);
            }
            */
            $value['id'] = $key;

            if ($value["deactivated"] != null) {
                $f = fopen('log.txt', "a");
                fwrite($f, $value['id'].PHP_EOL);
                fclose($f);
                continue;
            }

            $tags = $this->epApi->GetKeywords($value["photo_max_orig"]);
            
            echo $i.")".$tags['status'].'  '.$value['id'].': '.$value["first_name"]."\n";
            $i++;
            
            $tags = $tags['keywords'];

            if($tags == null or $value["first_name"] == null or $tags['status'] == 'error') {
                continue;
            }

            foreach ($tags as $tag) {
                $tag["score"] = str_replace(".", ",", $keyword->score);
            }   

            $value['keywords'] = $tags;
            array_push($persons, $value);
        }
        $dbh->AddAvatarURLSByPersons($persons);//Обязательно ДО TagsHandler
        $dbh->TagsHandler($persons);

        $this->epApi->Close();

        $globalCount += 10;
        echo $globalCount."\n";
        echo "-------------------end-------------------\n";
    }
}

try{
    $vk = new VkReader();
    $vk->listen();
}
catch(Exception $e){
    $f = fopen('subscriber_errors.txt', 'w');
    fwrite($f, "Ошибка");
    fclose($f);
}

