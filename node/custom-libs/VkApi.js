let rp = require('request-promise');
let httpBuildQuery = require('http-build-query');


module.exports = class VkApi {
    constructor(access_key){
        this.access_key = access_key;
    }

    getDataByIds(fields, ids, callback){
        let params = {
            "user_ids": ids.join(","),
            "fields": fields,
            'name_case': 'nom',
            'v': '5.52',
            'access_token': this.access_key
        };

        let link = `https://api.vk.com/method/users.get?${httpBuildQuery(params)}`;
        rp(link).then((data)=>{
            callback(data)
        }).catch(()=>{
            console.log("ошибка");
        });
    }
};


