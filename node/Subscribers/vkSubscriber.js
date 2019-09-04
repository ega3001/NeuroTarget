let VkApi = require('../custom-libs/VkApi');
let amqp = require('amqplib/callback_api');
let DBHandler = require('../custom-libs/DBH');

module.exports = class vkSubscriber{
  constructor(key){
    this.dbh = new DBHandler();
    if(!key)
      this.key = "0dce64cd0dce64cd0dce64cdd70da8276100dce0dce64cd56669b6e0611fe0967f5d750";
    else
      this.key = key;
  }

  listen(){
      amqp.connect('amqp://localhost', (err, conn) => {
          conn.createChannel((err, ch) => {
              let q = 'vkQueue';
              ch.assertQueue(q, {durable: true});
              ch.prefetch(1);
              console.log("[*] vkSubscriber launched. To exit press CTRL+C", q);
              ch.consume(q, (msg) => {
                  let vkApi = new VkApi(this.key);
                //   console.log(msg.content.toString());
                  let ids = JSON.parse(msg.content.toString()).file; // Падает здесь JSON.parse не может отработать на некорректных данных msg
                  
                  for (let i = 0; i < ids.length; i++){
                      ids[i] = ids[i].replace(/\r?\n/g, "");
                  }
                  vkApi.getDataByIds("photo_max_orig, has_photo", ids, async (res)=>{
                        let send = 'epQueue';
                        
                        //Очистка от id, которые уже были спаршены
                        res = JSON.parse(res);
                        res.response = res.response.filter(elem => !dbh.IdIsSet(elem.id));
                        
                        if(res.response.length !== 0){
                            JSON.stringify(res);
                            ch.sendToQueue(send, Buffer.from(res), {persistent: true});
                        }
                      
                      //прокинуть информацию о юзере в следующую очередь
                      ch.sendToQueue(send, Buffer.from(res), {persistent: true});
                  });
                  //console.log(ids);
                  ch.ack(msg);
              }, {noAck: false});
          });
      });
  }

};


