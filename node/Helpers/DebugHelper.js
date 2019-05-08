module.exports = class DebugHelper {
    static timeConverter(UNIX_timestamp){
        let a = new Date(UNIX_timestamp * 1000);
        let months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        let year = a.getFullYear();
        let month = months[a.getMonth()];
        let date = a.getDate();
        let hour = a.getHours();
        let min = a.getMinutes();
        let sec = a.getSeconds();
        return date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec;
    }

    static debug_message(msg){
        console.log(DebugHelper.timeConverter(Date.now()) + " " + msg);
    }

    static debug_dump(msg){
        console.log(DebugHelper.timeConverter(Date.now()));
        console.log(msg);
    }
};