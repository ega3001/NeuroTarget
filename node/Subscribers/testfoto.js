let amqp = require('amqplib/callback_api');
let EpApi = require('../custom-libs/EpApi');
let DH = require('../Helpers/DebugHelper');
let epApi = new EpApi();
let Timeout = require("await-timeout");

let rp = require("request-promise");

let all = require("promise-all-map");

let httpBuildQuery = require('http-build-query');

async function validationKey(paramKey){
    let photo_link = "https://pp.userapi.com/c836333/v836333001/31189/8To0r3d-6iQ.jpg";

    let params = {'url': photo_link, 'num_keywords': 50};
    let link = `https://api.everypixel.com/v1/keywords?${httpBuildQuery(params)}`;

    let key = `Bearer ${paramKey}`;

    let options = {
        headers: {
            Authorization: key
        },
        url: link,
        json: true
    };

    return rp(options).then(_ => true).catch(_ => false);
}

async function testFoto(){

    let key = null;

    while(true){
        await epApi.getKeysFromDb().then((results) => {
            key = results
        });

        let vaKey = await validationKey(key);

        if (vaKey) break;
        else{
            // DH.debug_message("Invalid key, ждем новый");
            await Timeout.set(this.delay);
        }

    }


    // let photo_link = item.photo_max_orig;
    let params = {'url': 'http://static5.depositphotos.com/1040226/462/i/450/depositphotos_4629339-Teenager-Acne-Problem.jpg', 'num_keywords': 150};
    let link = `https://api.everypixel.com/v1/keywords?${httpBuildQuery(params)}`;

    let local_key = `Bearer ${key}`;

    let options = {
        headers: {
            Authorization: local_key
        },
        url: link,
        json: true
    };

    rp(options).then((res) => {
        console.log(res);
        return res;
    }).catch((err) => {
        console.log(err.error.message);
        return err.error.message;
    });
}

testFoto();