let rp = require('request-promise');
let mysql = require('mysql');
let EpApi = require("../custom-libs/EpApi");
let httpBuildQuery = require('http-build-query');


let ep = new EpApi();

module.exports = class UpdateKeyHelper {
    constructor(client_id, secret) {
        this.client_id = client_id;
        this.secret = secret;
        this.connection = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'qLgxNxavx9wuCru',
            database: 'DB'
        });

        console.log("[*] UpdateKeyHelper launched");

    }

    refreshKey() {
        let url = `https://api.everypixel.com/oauth/token?client_id=${this.client_id}&client_secret=${this.secret}&grant_type=client_credentials`;
        rp(url).then((data) => {
            let l_data = JSON.parse(data);
            let sql = `UPDATE EpKey SET textKey = '${l_data.access_token}' WHERE id = 1`;
            this.connection.query(sql);
            console.log(l_data.access_token);
        });
    }

    listen() {
        setInterval(() => {
            console.log("Проверка");
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