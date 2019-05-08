/**
 * Simple userland heapdump generator using v8-profiler
 * Usage: require('[path_to]/HeapDump').init('datadir')
 *
 * @module HeapDump
 * @type {exports}
 */

let fs = require('fs');
let profiler = require('v8-profiler');
let _datadir = null;
let nextMBThreshold = 0;


/**
 * Init and scheule heap dump runs
 *
 * @param datadir Folder to save the data to
 */
module.exports.init = function (datadir) {
    _datadir = datadir;
    setInterval(tickHeapDump, 100);
};

/**
 * Schedule a heapdump by the end of next tick
 */
function tickHeapDump() {
    setImmediate(function () {
        heapDump();
    });
}

/**
 * Creates a heap dump if the currently memory threshold is exceeded
 */
function heapDump() {
    let memMB = process.memoryUsage().rss / 1048576;

    console.log(memMB + '>' + nextMBThreshold);

    if (memMB > nextMBThreshold) {
        console.log('Current memory usage: %j', process.memoryUsage());
        nextMBThreshold += 50;
        let snap = profiler.takeSnapshot('profile');
        saveHeapSnapshot(snap, _datadir);
    }
}

/**
 * Saves a given snapshot
 *
 * @param snapshot Snapshot object
 * @param datadir Location to save to
 */
function saveHeapSnapshot(snapshot, datadir) {
    let buffer = '';
    let stamp = Date.now();
    snapshot.serialize(
        function iterator(data, length) {
            buffer += data;
        }, function complete() {

            let name = stamp + '.heapsnapshot';
            fs.writeFile(datadir + '/' + name , buffer, function () {
                console.log('Heap snapshot written to ' + name);
            });
        }
    );
}