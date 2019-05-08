let mysql = require('mysql');


module.exports = class EpApi {
    constructor() {
        this.connection = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'DB'
        });
    }

    getKeysFromDb() {
        return new Promise((resolve, reject) => {
                this.connection.query(
                    "SELECT textKey FROM EpKey WHERE id = 1",
                    function (err, rows) {
                        if (rows === undefined) {
                            reject(new Error("Error rows is undefined"));
                        } else {
                            resolve(rows.shift().textKey);
                        }
                    }
                )
            }
        )
    };

};
