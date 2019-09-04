let amqp = require('amqplib/callback_api');
let DBHandler = require('../custom-libs/DBH');
let fs = require("fs");

// let count = 0;

module.exports = class dbSubscriber {
    constructor() {
        this.dbh = new DBHandler();
    }

    listen() {
        amqp.connect('amqp://localhost', (err, conn) => {
            conn.createChannel((err, ch) => {
                let q = 'dbQueue';
                ch.assertQueue(q, {durable: true});
                ch.prefetch(1);
                console.log("[*] dbSubscriber launched. To exit press CTRL+C", q);

                ch.consume(q, async (msg) => {
                    // console.log("dbSubscriber : Подготавливаю данные для БД");
                    let decoded_content = JSON.parse(msg.content.toString());
                    // console.log("Содержимое 1 записи сообещения из dbQueue:", decoded_content[0]);
                    // console.log("db : Принял ", decoded_content.length, " записей.");
                    
                    try {
                        await this.dbh.HandlePersons(decoded_content).then((res) => {
                            console.log(`urls pushed: ${this.dbh.push_url}, add tags: ${this.dbh.add_tag}, get parse ids: ${this.dbh.get_parse_id}, pushed tags on id: ${this.dbh.push_tag_on_id}`);
                            console.log(this.dbh.push_url == this.dbh.get_parse_id && this.dbh.add_tag == this.dbh.push_tag_on_id ? 'ITS OK':'ERROR!!!!!!!')
                        }).catch((err)=>{
                            console.log(err);
                        }); // Тут возвращается промис
                    }
                    catch(err) {
                        fs.appendFileSync("errors_log.txt", JSON.stringify(decoded_content) + " : " + err + "\r\n", function(error){
                            if(error) // если возникла ошибка
                                console.log("db : Запись ошибки (БД) завершена");
                            else
                                console.log("db : Запись ошибки (БД) НЕ завершена");
                        });
                    }
                    // console.log('STOP');
                    // process.exit();
                    // console.log("Загружено");
                    ch.ack(msg);
                }, {noAck: false});

            });
        });
    }

};