module.exports = class DBHandler{
    
    constructor(){
        this.ConnectDB();
        this.push_url = 0;
        this.add_tag = 0;
        this.get_parse_id = 0;
        this.push_tag_on_id = 0;
        this.persons = null;
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

    async AddAvatarUrlsByArrayPersons(){
        return this.persons.map(async (person) => {
            let query = `UPDATE "ParseIDVK" SET "AvatarURL"= '${person['photo_max_orig']}' WHERE "TextID"= '${person['id']}'`;
            return this.connection.query(query).then((res)=>{person.url = res; this.push_url++;});
        });
    }

    async GetParseidByArrayPersons(){
        return this.persons.map((person)=>{
            var query = `SELECT "ParseIDVK_ID" FROM "ParseIDVK" WHERE "TextID"='${person.id}'`;
            return this.connection.query(query).then(res=>{person.parse_id = res['rows'][0].ParseIDVK_ID; this.get_parse_id++;});
        })
    }
    async AddTagAndGetTagByArrayPersons(){
        return this.persons.map((person) => {
            return this.AddTagAndGetTagByOnlyPerson(person);
        })
    }
    AddTagAndGetTagByOnlyPerson(person){
        return person.keywords.map((keywordinfo) => {
            let tag_name = keywordinfo.keyword.replace("'", "''"); // Ёкранирование одинарной кавычки дл€ PostgreSQL
            let query_insert = `INSERT INTO "Tag"("TagName") VALUES ('${tag_name}')`; // «десь должен быть IGNORE
                query_insert += `ON CONFLICT DO NOTHING`;

            let query_select = `SELECT "Tag_ID" FROM "Tag" WHERE "TagName" = '${tag_name}'`;
            
            return this.connection.query(query_insert).then(res => this.connection.query(query_select)).then(res => {keywordinfo.tag_id = res['rows'][0].Tag_ID; this.add_tag++;});
        })
    }
    async AddPersonTagsByArrayPerson(){
        return this.persons.map((person)=>{
            return this.AddPersonTagsByOnlyPerson(person);
        })
    }
    AddPersonTagsByOnlyPerson(person){
        return person.keywords.map(async (keywordinfo) => {
            let query = `INSERT INTO "ParseIDVK-Tag"("ParseIDVK_ID", "Tag_ID", "Value") VALUES('${person.parse_id}','${keywordinfo.tag_id}','${keywordinfo.score}')`; // «десь должен быть IGNORE
                query += `ON CONFLICT DO NOTHING`;
            return this.connection.query(query).then(()=>{this.push_tag_on_id++;});
        });
    }
    HandlePersons(persons){
        this.push_url = 0;
        this.add_tag = 0;
        this.get_parse_id = 0;
        this.push_tag_on_id = 0;
        this.persons = persons;
        
        return this.AddAvatarUrlsByArrayPersons()
        .then(res => this.AddTagAndGetTagByArrayPersons())
        .then(res => this.GetParseidByArrayPersons())
        .then(res => this.AddPersonTagsByArrayPerson());
    }
};

