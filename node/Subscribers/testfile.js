
let amqp = require('amqplib/callback_api');
let DH = require('../Helpers/DebugHelper');
let DBHandler = require('../custom-libs/DBH');
let VkApi = require('../custom-libs/VkApi');

let vkApi = new VkApi('0dce64cd0dce64cd0dce64cdd70da8276100dce0dce64cd56669b6e0611fe0967f5d750');
let dbh = new DBHandler();
let ids = ['373', 'readix'];

vkApi.getDataByIds("photo_max_orig, has_photo", ids, async (res)=>{
    
    //Очистка от id, которые уже были спаршены
    res = JSON.parse(res);
    let arr = [];
    await res.response.map(elem =>{
        dbh.IdIsSet(elem.id, elem.photo_max_orig)
        .then(ans => {
            if(!ans) arr.push(elem);
            console.log(ans, elem);
        })
        .catch(err => {
            console.log(err);
        })
    });
    res.response = arr;
    
    console.log(res);
    // if(res.response.length !== 0){
    //     JSON.stringify(res);
    //     ch.sendToQueue(send, Buffer.from(res), {persistent: true});
    // }
});
