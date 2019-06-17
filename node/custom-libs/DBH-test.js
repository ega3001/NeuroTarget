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
        return persons.map(async (person) => {
            let query = `UPDATE "ParseIDVK" SET "AvatarURL"= '${person['photo_max_orig']}' WHERE "TextID"= '${person['id']}'`;
            return this.connection.query(query).then((res)=>{person.url = res; this.push_url++;});
        });
    }

    GetParseidById(person){
        var query = `SELECT "ParseIDVK_ID" FROM "ParseIDVK" WHERE "TextID"='${person.id}'`;
        return this.connection.query(query).then(res=>{person.parse_id = res['rows'][0].ParseIDVK_ID; this.get_parse_id++;});
    }
    AddTagAndGetTagid(keywordinfo){

        let tag_name = keywordinfo.keyword.replace("'", "''"); // Экранирование одинарной кавычки для PostgreSQL
        let query_insert = `INSERT INTO "Tag"("TagName") VALUES ('${tag_name}')`; // Здесь должен быть IGNORE
            query_insert += `ON CONFLICT DO NOTHING`;

        let query_select = `SELECT "Tag_ID" FROM "Tag" WHERE "TagName" = '${tag_name}'`;
        
        return this.connection.query(query_insert).then(res => this.connection.query(query_select)).then(res => {keywordinfo.tag_id = res['rows'][0].Tag_ID; this.add_tag++;});
    }
    AddPersonTags(person){
        return person.keywords.map(async (keywordinfo) => {
            let query = `INSERT INTO "ParseIDVK-Tag"("ParseIDVK_ID", "Tag_ID", "Value") VALUES('${person.parse_id}','${keywordinfo.tag_id}','${keywordinfo.score}')`; // Здесь должен быть IGNORE
                query += `ON CONFLICT DO NOTHING`;
            return this.connection.query(query).then(()=>{this.push_tag_on_id++;});
        });
    }

    TagsHandle(persons) {

        let personsPromises = [];
        //Получение tag_id
        persons.forEach(person => {
            person.keywords.forEach(keywordinfo => {
                personsPromises.push(this.AddTagAndGetTagid(keywordinfo));
            });
        });
        
        //Получение parse_id
        persons.forEach(person => {
            personsPromises.push(this.GetParseidById(person));
        });
        //Когда все данные получены:
        // let promise = new Promise((resolve)=>{
        //     Promise.all(personsPromises).then(() => {
        //         Promise.all(persons.map((person) => {
        //             let prom = this.AddPersonTags(person);
        //             // console.log(`prom: ${prom}`);
        //             return prom;
        //         })).then((res) => {console.log(res); resolve(true);});
        //     });
        // });
        return Promise.all(persons.map(person => {
            return this.AddPersonTags(person);
        }));
        return Promise.all(personsPromises);
    }
    appendTags(persons){
        return Promise.all(persons.map(person => {
            return this.AddPersonTags(person);
        }));
    }
    async HandlePersons(persons){
        this.push_url = 0;
        this.add_tag = 0;
        this.get_parse_id = 0;
        this.push_tag_on_id = 0;
        let promiseAll = [];
        let TagsPromise = this.TagsHandle(persons).then(res => this.appendTags(persons));
        let UrlsPromise = this.AddAvatarUrlsByPersons(persons);

        promiseAll.push(UrlsPromise);
        promiseAll.push(TagsPromise);
        // console.log(TagsPromise);
        
        return Promise.all(promiseAll);
    }
};

