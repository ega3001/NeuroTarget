let rp = require('request-promise');
let pg = require('pg');
let EpApi = require("../custom-libs/EpApi");
let httpBuildQuery = require('http-build-query');

let ep = new EpApi();

module.exports = class UpdateKeyHelper {
    constructor(client_id, secret) {
        this.client_id = client_id;
        this.secret = secret;
        this.connection = new pg.Client({
            user:       'postgres',
            host:       'localhost',
            database:   'DB',
            password:   '123',
            port:       5432,
        })
        this.connection.connect()
          .then(() => console.log('UpdateKeyHelper is connected to DB'))
          .catch(err => console.error('UpdateKeyHelper connection to DB is failed', err.stack));

        console.log("[*] UpdateKeyHelper launched");
    }

    refreshKey() {
        let url = `https://api.everypixel.com/oauth/token?client_id=${this.client_id}&client_secret=${this.secret}&grant_type=client_credentials`;
        rp(url).then((data) => {
            let l_data = JSON.parse(data);
            console.log("Access token from Epx: ", l_data.access_token);
            let query = `UPDATE "EpKey" SET "textKey" = '${l_data.access_token}' WHERE "id" = 1`;
            this.connection.query(query);
        });
    }

    listen() {
        setInterval(() => {
            console.log("Проверка работоспобсности ключа Epx");
            
            ep.getKeysFromDb().then(
                (res) => {
                    let photo_link = "https://pp.userapi.com/c836333/v836333001/31189/8To0r3d-6iQ.jpg";
                    let params = {'url': photo_link, 'num_keywords': 50};
                    let link = `https://api.everypixel.com/v1/keywords?${httpBuildQuery(params)}`;
                    let key = `Bearer ${res}`;
                    let options = {
                        headers: {
                            Authorization: key
                        },
                        url: link,
                        json: true
                    };
                    rp(options).then(
                        _ => {
                            console.log("Проверка прошла успешно");
                        }
                    ).catch(
                        _ => {
                            console.log("Ключ не работает. Обновление ключа...")
                            this.refreshKey();
                            console.log("Ключ обновлен");
                        }
                    );
                }
            ).catch(
                (err) => {
                    console.log("Promise rejection error: " + err);
                }
            );
        }, 10000);
    }
};