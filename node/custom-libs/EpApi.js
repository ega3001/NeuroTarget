let pg = require('pg');

module.exports = class EpApi {
    constructor() {
        this.connection = new pg.Client({
            user:       'postgres',
            host:       'localhost',
            database:   'DB',
            password:   '123',
            port:       5432,
        })
        this.connection.connect()
          .then(() => console.log('EpApi is connected to DB'))
          .catch(err => console.error('EpApi connection to DB is failed', err.stack));
    }

    getKeysFromDb() {
        return new Promise((resolve, reject) => {
                this.connection.query(
                    'SELECT "textKey" FROM "EpKey" WHERE "id" = 1',
                    function (err, result) {
                        if (result['rowCount'] == 0 || result === undefined) {
                            reject(new Error("Result is undefined. No textKey in EpKey table."));
                        } else {
                            resolve(result['rows'][0]['textKey']);
                        }
                    }
                )
            }
        )
    };

};
