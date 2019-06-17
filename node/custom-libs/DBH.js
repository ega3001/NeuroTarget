module.exports = class DBHandler{
    
    constructor(){
        this.ConnectDB();
        this.push_url = 0;
        this.add_tag = 0;
        this.get_parse_id = 0;
        this.push_tag_on_id = 0;
    }

    ConnectDB(){
        let pg = require('pg');

        this.connection = new pg.Client({
            user:       'postgres',
            host:       'localhost',
            database:   'DB',
            password:   '123',
            port:       5432,
        });
        this.connection.connect()
          .then(() => console.log('connected'))
          .catch(err => console.error('connection error', err.stack));
    }

    AddAvatarUrlsByPersons(persons){

        return new Promise((resolve) => {
            persons.forEach((person) => {
                let query = `UPDATE "ParseIDVK" SET "AvatarURL"= '${person['photo_max_orig']}' WHERE "TextID"= '${person['id']}'`;

                this.connection.query(query, err => {
                    if(err) throw err;
                    this.push_url++;
                    resolve();
                });
            });
        });
    }

    GetParseidById(id){
        var query = `SELECT "ParseIDVK_ID" FROM "ParseIDVK" WHERE "TextID"='${id}'`;
        return new Promise(resolve => {
            this.connection.query(query, (err, res) => {
                if (err) throw err;
                try{
                    if(res['rows'][0] == undefined){
                        console.log(id);
                    }
                }
                catch(error){
                    console.log("---------------------------");
                    console.log(id, res);
                    console.log(error);
                    console.log("---------------------------");
                }
                this.get_parse_id++;
                resolve(res['rows'][0].ParseIDVK_ID);
            });
        });
    }

    AddTagAndGetTagid(tag_name){
        tag_name = tag_name.replace("'", "''"); // Экранирование одинарной кавычки для PostgreSQL
        let query_insert = `INSERT INTO "Tag"("TagName") VALUES ('${tag_name}')`; // Здесь должен быть IGNORE
            query_insert += `ON CONFLICT DO NOTHING`;

        let query_select = `SELECT "Tag_ID" FROM "Tag" WHERE "TagName" = '${tag_name}'`;
        
        return new Promise(resolve => {
            this.connection.query(query_insert, (err, res) => {
                if (err) throw err;
                this.connection.query(query_select, (err, res) => {
                    if (err) throw err;
                    this.add_tag++;
                    resolve(res['rows'][0].Tag_ID);
                });
            });
        });
    }
    
    AddPersonTags(person){
        return new Promise(resolve => {
            person.keywords.forEach(keywordinfo => {
                let query = `INSERT INTO "ParseIDVK-Tag"("ParseIDVK_ID", "Tag_ID", "Value") VALUES('${person.parse_id}','${keywordinfo.tag_id}','${keywordinfo.score}')`; // Здесь должен быть IGNORE
                    query += `ON CONFLICT DO NOTHING`;

                this.connection.query(query, err => {
                    if (err) throw err;
                    this.push_tag_on_id++;
                    resolve();
                });
            });
        });
    }

    async TagsHandle(persons) {

        let personsPromises = [];
        //Получение tag_id
        await persons.forEach(person => {
            person.keywords.forEach(keywordinfo => {
                let tag_promise = this.AddTagAndGetTagid(keywordinfo.keyword);
                personsPromises.push(tag_promise);
                tag_promise.then(res => {
                    keywordinfo.tag_id = res;
                });
            });
        });
        
        //Получение parse_id
        await persons.forEach(person => {
            let parseid_promise = this.GetParseidById(person.id);
            personsPromises.push(parseid_promise);
            parseid_promise.then(res => {
                person.parse_id = res;
            });
        });
        //Когда все данные получены:
        let promises = [];
        await Promise.all(personsPromises).then(() => {
            persons.forEach(person => {
                let promise = this.AddPersonTags(person);
                promises.push(promise);
            });
        });
        return Promise.all(promises);
    }
    async HandlePersons(persons){
        this.push_url = 0;
        this.add_tag = 0;
        this.get_parse_id = 0;
        this.push_tag_on_id = 0;
        let promiseAll = [];
        let UrlsPromise = this.AddAvatarUrlsByPersons(persons);
        let TagsPromise = this.TagsHandle(persons);

        promiseAll.push(UrlsPromise);
        promiseAll.push(TagsPromise);
        
        return Promise.all(promiseAll);
    }
};

