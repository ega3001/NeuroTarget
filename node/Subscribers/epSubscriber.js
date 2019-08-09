
let amqp = require('amqplib/callback_api');
let EpApi = require('../custom-libs/EpApi');
let DH = require('../Helpers/DebugHelper');
let epApi = new EpApi();
let Timeout = require("await-timeout");

let rp = require("request-promise");

let all = require("promise-all-map");

let httpBuildQuery = require('http-build-query');

async function getData(promises) {
    return all(promises, async (post) => post);
}



async function validationKey(paramKey){
    let photo_link = "https://pp.userapi.com/c836333/v836333001/31189/8To0r3d-6iQ.jpg";

    let params = {'url': photo_link, 'num_keywords': 50};
    let link = `https://api.everypixel.com/v1/keywords?${httpBuildQuery(params)}`;

    let key = `Bearer ${paramKey}`;

    let options = {
        headers: {
            Authorization: key
        },
        url: link,
        json: true
    };

    return rp(options).then(_ => true).catch(_ => false);
}

module.exports = class epSubscriber {
    constructor(params) {
        this.delay = params.delay;
    }

    listen() {
        amqp.connect('amqp://localhost', (err, conn) => {
            conn.createChannel((err, ch) => {
                let q = 'epQueue';
                ch.assertQueue(q, {durable: true});
                ch.prefetch(1);
                DH.debug_message("[*] epSubscriber launched. To exit press CTRL+C", q);
                ch.consume(q, async (msg) => {
                    let decoded_content = JSON.parse(msg.content.toString());
                    // console.log("Содержимое сообещения из epQueue: ", decoded_content);
                    let key = null;
                    
                    // console.log(msg);
                    
                    while(true){
                        await epApi.getKeysFromDb().then((results) => {
                            key = results
                        });

                        let vaKey = await validationKey(key);

                        if (vaKey) break;
                        else{
                            // DH.debug_message("Invalid key, ждем новый");
                            await Timeout.set(this.delay);
                        }

                    }

                    // DH.debug_message("Ключ проверен, получаем данные");

                    let promises = [];

                    decoded_content.response.map((item) => {

                        let photo_link = item.photo_max_orig;
                        let params = {'url': photo_link, 'num_keywords': 100};
                        let link = `https://api.everypixel.com/v1/keywords?${httpBuildQuery(params)}`;

                        let local_key = `Bearer ${key}`;

                        let options = {
                            headers: {
                                Authorization: local_key
                            },
                            url: link,
                            json: true
                        };

                        promises.push(
                            rp(options).then((res) => {
                                return res
                            }).catch((err) => {
                                return err.error.message
                            }));
                    });

                    let data = await getData(promises);
                    let i = -1;
                    let all_content = [];
                    let send = 'dbQueue';
                    data.map((item)=>{
                            i++;
                            //console.log("item: ", item);
                            //console.log(decoded_content.response[i].id);

                            let words = item && item.keywords ? item.keywords : undefined;

                            if(!item || !item.keywords){
                                return;
                            }

                            words = words.filter(elem => {
                                return elem.score > 0.3;
                            });

                            if(words.length == 0){
                                return;
                            }
                            
                            // if (decoded_content.response[i]['has_photo'] = 0) {
                            //     console.log("HAS PHOTO 0: ", decoded_content.response[i]);
                            // }

                            let send_content = {
                                "id": decoded_content.response[i].id,
                                "photo_max_orig": decoded_content.response[i].photo_max_orig,
                                "keywords": words
                            };

                            all_content.push(send_content);
                            // console.log("send_content: ", send_content);
                            //console.log("send_content: ", send_content);
                    });
                    if(all_content != [])
                        ch.sendToQueue(send, Buffer.from(JSON.stringify(all_content)), {persistent: true});

                    // DH.debug_message("Данные получены, подписываем");
                    key = null;
                    data = null;
                    decoded_content = null;
                    ch.ack(msg);

                }, {noAck: false});
            });
        });
    }
};

