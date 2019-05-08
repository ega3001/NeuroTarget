module.exports = class DBHandler{
    
    constructor(){
        let mysql = require('mysql');
        this.pool = mysql.createPool({
            host     : '78.29.9.129',
            user     : 'root',
            password : '',
            database : 'targetingDBNetangels'
        });
        // this.pool.connect(err => {
        //     if(err) throw err;
        // });
    }

    AddAvatarUrlsByPersons(persons){

        return new Promise((resolve) => {
            persons.forEach((person) => {
                let query = `UPDATE ParseIDVK SET AvatarURL= '${person['photo_max_orig']}' WHERE TextID= "${person['id']}"`;
                this.pool.getConnection(function(err, connection) {
                    connection.query(query, err => {
                        connection.release();
                        if(err) throw err;
                        console.log("Add url");
                        resolve();
                    });
                });
            });
        });
    }
    
    GetParseidById(id){
        let query = `SELECT ParseIDVK_ID FROM ParseIDVK WHERE TextID="${id}"`;
        
        return new Promise(resolve => {
            this.pool.getConnection(function(err, connection) {
                connection.query(query, (err, res) => {
                    connection.release();
                    if (err) throw err;
                    if(res[0].ParseIDVK_ID == undefined){
                        console.log(id);
                    }
                    resolve(res[0].ParseIDVK_ID);
                    console.log("Взял id");
                });
            });
        });
    }
    AddTagAndGetTagid(tag_name){
        let query_insert = `INSERT IGNORE INTO \`Tag\`(TagName) VALUE ("${tag_name}")`;
        let query_select = `SELECT Tag_ID FROM \`Tag\` WHERE TagName = "${tag_name}"`;
        
        return new Promise(resolve => {
            this.pool.getConnection(function(err, connection) {
                connection.query(query_insert, (err, res) => {
                    if (err) throw err;
                    connection.query(query_select, (err, res) => {
                        connection.release();
                        if (err) throw err;
                        resolve(res[0].Tag_ID);
                        console.log("Get tag_id");
                    });
                });
            });
        });
    }
    AddPersonTags(person){

        return new Promise(() => {
            person.keywords.forEach(keywordinfo => {
                let query = `INSERT IGNORE INTO \`ParseIDVK-Tag\`(ParseIDVK_ID, Tag_ID, Value) VALUES('${person.parse_id}','${keywordinfo.tag_id}','${keywordinfo.score}')`;
                this.pool.getConnection(function(err, connection) {
                    connection.query(query, err => {
                        connection.release();
                        if (err) throw err;
                        console.log("Add tag");
                    });
                });
            });
        });
    }

    TagsHandle(persons) {

        let personsPromises = [];
        //Получение tag_id
        persons.forEach(person => {
            person.keywords.forEach(keywordinfo => {
                let tag_promise = this.AddTagAndGetTagid(keywordinfo.keyword);
                personsPromises.push(tag_promise);
                tag_promise.then(res => {
                    keywordinfo.tag_id = res;
                });
            });
        });
        //Получение parse_id
        persons.forEach(person => {
            let parseid_promise = this.GetParseidById(person.id);
            personsPromises.push(parseid_promise);
            parseid_promise.then(res => {
                person.parse_id = res;
            });
        });
        //Когда все данные получены:
        let promises = [];
        Promise.all(personsPromises).then(() => {
            persons.forEach(person => {
                let promise = this.AddPersonTags(person);
                promises.push(promise);
            });
        });
        return Promise.all(promises);
    }
    async HandlePersons(persons){

        let promiseAll = [];
        let UrlsPromise = this.AddAvatarUrlsByPersons(persons);
        let TagsPromise = this.TagsHandle(persons);

        promiseAll.push(UrlsPromise);
        promiseAll.push(TagsPromise);

        return Promise.all(promiseAll);
    }
};

