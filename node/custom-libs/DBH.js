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
          .then(() => console.log('DBHandler is connected to DB'))
          .catch(err => console.error('DBHandler connection is failed', err.stack));
    }

    AddAvatarUrlByOnlyPerson(person){
        let query = `UPDATE "ParseIDVK" SET "AvatarURL"= '${person['photo_max_orig']}' WHERE "TextID"= '${person['id']}'`;
        return new Promise((resolve, reject) => {
            this.connection.query(query).then((res)=>{
                person.url = res; 
                this.push_url++;
                resolve(person);
            }).catch((err) => {
                reject(err);
            })
        });
    }

    GetParseidByOnlyPerson(person){
        var query = `SELECT "ParseIDVK_ID" FROM "ParseIDVK" WHERE "TextID"='${person.id}'`;
        return new Promise((resolve, reject) => {
            this.connection.query(query).then(res=>{
                person.parse_id = res['rows'][0].ParseIDVK_ID; 
                this.get_parse_id++;
                resolve(person);
            }).catch((err)=>{
                reject(err);
            })
        });
        
    }

    AddTagAndGetTagByOnlyPerson(person){
        return Promise.all(
            person.keywords.map((keywordinfo) => {
                let tag_name = keywordinfo.keyword.replace("'", "''"); // Ye?aie?iaaiea iaeia?iie eaau?ee aey PostgreSQL
                let query_insert = `INSERT INTO "Tag"("TagName") VALUES ('${tag_name}')`; // Caanu aie?ai auou IGNORE
                    query_insert += `ON CONFLICT DO NOTHING`;

                let query_select = `SELECT "Tag_ID" FROM "Tag" WHERE "TagName" = '${tag_name}'`;
                
                return this.connection.query(query_insert).then(res => this.connection.query(query_select)).then(res => {keywordinfo.tag_id = res['rows'][0].Tag_ID; this.add_tag++;});
            })
        )
    }

    AddPersonTagsByOnlyPerson(person){
        return Promise.all(
            person.keywords.map(async (keywordinfo) => {
                let query = `INSERT INTO "ParseIDVK-Tag"("ParseIDVK_ID", "Tag_ID", "Value") VALUES('${person.parse_id}','${keywordinfo.tag_id}','${keywordinfo.score}')`; // Caanu aie?ai auou IGNORE
                    query += `ON CONFLICT DO NOTHING`;
                return this.connection.query(query).then(()=>{this.push_tag_on_id++;});
            })
        )
    }
    
    async HandlePersons(persons){
        this.push_url = 0;
        this.add_tag = 0;
        this.get_parse_id = 0;
        this.push_tag_on_id = 0;
        
        return Promise.all(
            persons.map(person => {
                return this.AddAvatarUrlByOnlyPerson(person).then(this.GetParseidByOnlyPerson.bind(this)).then(this.AddTagAndGetTagByOnlyPerson.bind(this)).then(res => {return person;}).then(this.AddPersonTagsByOnlyPerson.bind(this));
            })
        );
    }
    
    //Проверка на наличие url
    IdIsSet(id, url){
        let query = `SELECT * FROM "ParseIDVK" WHERE "TextID"='${id}' and "AvatarURL" = '${url}'`;
        return new Promise((resolve, reject) => {
            this.connection.query(query).then((res)=>{
                resolve(
                    res.rows.length !== 0
                );
            }).catch((err) => {
                reject(err);
            })
        });
    }
};

