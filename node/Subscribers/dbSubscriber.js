let amqp = require('amqplib/callback_api');
let DBHandler = require('../custom-libs/DBH');
let fs = require("fs");
let dbh = new DBHandler();
// let count = 0;
module.exports = class dbSubscriber{
    constructor(){}
    listen(){
        amqp.connect('amqp://localhost', (err, conn) => {
            conn.createChannel((err, ch) => {

                let q = 'dbQueue';
                ch.assertQueue(q, {durable: true});
                ch.prefetch(1);
                console.log("[*] dbSubscriber launched. To exit press CTRL+C", q);

                ch.consume(q, async (msg) => {

                    console.log("db : Подготавливаю данные для БД");

                    let decoded_content = JSON.parse(msg.content.toString());
                    console.log("db : Принял ", decoded_content.length, " записей.");

                    try{
                        await dbh.HandlePersons(decoded_content);//Тут возвращается промис
                    }
                    catch(err){
                        fs.appendFileSync("errors_log.txt", JSON.stringify(decoded_content) + " : " + err + "\r\n", function(error){
                            if(error) // если возникла ошибка
                                console.log("db : Запись ошибки (БД) завершена");
                            else
                                console.log("db : Запись ошибки (БД) НЕ завершена");
                        });
                    }
                    
                    console.log("Загружено");
                    ch.ack(msg);
                }, {noAck: false});

            });
        });
    }

};