module.exports = class DBHandler{

	constructor(){

		let mysql = require('mysql');

		this.connection = mysql.createConnection({

		  host     : '78.29.9.129',

		  user     : 'root',

		  password : '',

		  database : 'targetingDBNetangels'

		});

		this.connection.connect(err => {

		    if(err) throw err;

        });

	}

    AddAvatarUrlsByPersons(persons){

        let personsPromises = [];

	    persons.forEach((person) => {

            let promise_add_url = this.AddAvatarUrlsByPerson(person);

            personsPromises.push(promise_add_url);

        });

        Promise.all(personsPromises);
    }

    AddAvatarUrlsByPerson(person){
        
        let query = `UPDATE ParseIDVK SET AvatarURL= '${person['photo_max_orig']}' WHERE TextID= '${person['id']}'`;

        return new Promise(resolve => {

            this.connection.query(query, (err, res) => {

                if (err) throw err;

                console.log("Добавил УРЛ\n");

            });

        });
    }

    GetParseidById(id){

        let query = `SELECT ParseIDVK_ID FROM ParseIDVK WHERE TextID='${id}'`;



        return new Promise(resolve => {

            this.connection.query(query, (err, res) => {

                if (err) throw err;

                console.log("Получил ParseID\n");
                
                resolve(res[0].ParseIDVK_ID);

            });

        });

    }

	AddTagAndGetTagid(tag_name){

        let query_insert = `INSERT IGNORE INTO \`Tag\`(TagName) VALUE ("${tag_name}")`;

        let query_select = `SELECT Tag_ID FROM \`Tag\` WHERE TagName = "${tag_name}"`;

        

        return new Promise(resolve => {

            this.connection.query(query_insert, (err, res) => {

                if (err) throw err;

                this.connection.query(query_select, (err, res) => {

                    if (err) throw err;

                    //Вложенные запросы?
                    console.log("Получил TagID\n");

                    resolve(res[0].Tag_ID);

                })

            })

        });

    }

    AddPersonTags(person){

	    person.keywords.forEach(keywordinfo => {

            let query = `INSERT IGNORE INTO \`ParseIDVK-Tag\`(ParseIDVK_ID, Tag_ID, Value) VALUES('${person.parse_id}','${keywordinfo.tag_id}','${keywordinfo.score}')`;



            this.connection.query(query, err => {

                if (err) throw err;

                console.log("Соединил ParseIDVK и TagID\n");

            })

        })

    }



    TagsHandle(persons) {

        let personsPromises = [];

	    //Получение tag_id

        persons.forEach(person => {

            //console.log(person);

            person.keywords.forEach(keywordinfo => {

                let tag_promise = this.AddTagAndGetTagid(keywordinfo.keyword);

                personsPromises.push(tag_promise);

                tag_promise.then(res => {

                    keywordinfo.tag_id = res;

                });

            })

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

        Promise.all(personsPromises).then(() => {

            persons.forEach(person => {

                this.AddPersonTags(person);

            })

        });

    }

    HandlePersons(persons){

        return new Promise(resolve => { 
            
            this.AddAvatarUrlsByPersons(persons);

            this.TagsHandle(persons);
            
        });
    }

};

