const vkSubscriber = require("./Subscribers/vkSubscriber");
const epSubscriber = require("./Subscribers/epSubscriber");
const dbSubscriber = require("./Subscribers/dbSubscriber");
const UpdateKeyHelper = require("./Helpers/UpdateKeyHelper");

class Starter {
    constructor(params){
        this.db = params.db;
        this.ep = params.ep;
        this.vk = params.vk;
        this.startDB();
        this.startEP();
        this.startVk();
        if (params.memory) this.memoryMonit();
    }
    memoryMonit() {
    	setInterval(() => {
        	console.clear();
        	console.log("totalMemory on NT = ", process.memoryUsage().heapTotal / Math.pow(1024, 2));
    	}, 1000/ 60);	
    }
    startDB() {
        for (let i = 0; i < this.db; i++) new dbSubscriber().listen();
    }
    startEP() {
        for (let i = 0; i < this.ep; i++) new epSubscriber({delay: 2000}).listen();
    }
    startVk() {
        for (let i = 0; i < this.vk; i++) new vkSubscriber("0dce64cd0dce64cd0dce64cdd70da8276100dce0dce64cd56669b6e0611fe0967f5d750").listen();
    }
}

new UpdateKeyHelper(
    "cokmCeAAm5ukt2Mr8ljADcpPkxQRqKYioj0uddPm",
    "dXfku53759ntKOGQ51146vU0kuwFUmmAJN8Q407sFUKHO4osnu"
).listen();

let st = new Starter({
    ep: 5,
    vk: 1,
    db: 5,
    memory: false
});




