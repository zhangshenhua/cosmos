var ws = require('nodejs-websocket');
var HashMap = require('hashmap');
var http = require('http'),
    fs = require('fs');
const querystring = require('querystring');


function serveStaticFile(res, path, contentType, responseCode) {
    if(!responseCode) responseCode = 200; 
    fs.readFile(__dirname + path, function(err, data) 
    { 
        if(err) { 
            res.writeHead( 500, {'Content-Type': 'text/plain' }); 
            res.end('500 - Internal Error'); 
        } else { 
            res.writeHead(responseCode, {'Content-Type': contentType}); 
            res.end(data); 
        }
    }); 
}


function uri_parse (str_uri) {
    var uri = str_uri;
    var cid = '/',
        uid = '';

    var group;
    if (group = uri.match('^(/.*)/(.*)$')) {
        cid = group[1];
        uid = group[2];
    } else {
        cid = uri;
    }
    return {"cid": querystring.unescape(cid), "uid": querystring.unescape(uid)}
}


http.createServer(function (req, res) { 
    var path = req.url;
    console.log(path);
    var uri_hash = uri_parse(path),
        cid = uri_hash.cid,
        uid = uri_hash.uid;

    switch(path) {
        case '/favicon.ico':
            break;
        default:
            serveStaticFile(res, '/client.html', 'text/html');
            break;
    }
    //res.end(`cid=${cid} </br> uid=${uid}`);
}).listen(3000); 
console. log('Server running at http://localhost:3000/');


function arrayRemove(arr, value) {
    return arr.filter(function(ele){
        return ele.key != value.key;
    });
}


var cosmosHash = new HashMap();
var server = ws.createServer(function(conn){
    var uri_hash = uri_parse(conn.path),
        cid = uri_hash.cid,
        uid = uri_hash.uid,
        key = conn.key;


    conn.on('error', (err)=>{
        console.log(err);
        //if (err.code == 'ECONNRESET') {
            cosmosHash.get(cid).delete(key);
        //}
        
    })


    conn.on('close', (code, reason) => {
        cosmosHash.get(cid).delete(key);
        domain_boardcast(cosmosHash.get(cid).values(),`${cid}: ${uid} 下线了`);
        console.log(`Connection closed ${key}`);
    })


    conn.on('text', function(str) {  
        console.log(`${cid}/${uid}: ${str}`);
        domain_boardcast(cosmosHash.get(cid).values(), `${uid}: ${str}`);
    });


    console.log(`New connection $cid/$uid ${key}`);
    
    if (!cosmosHash.get(cid)) {
        var tmp = new HashMap();
        tmp.set(key, conn);
        cosmosHash.set(cid, tmp);
    } else {
        cosmosHash.get(cid).set(key, conn);
    }

    domain_boardcast(cosmosHash.get(cid).values(), `${cid}: ${uid} 上线了`);
    console.log(cosmosHash.get(cid).count());
}).listen(2333);


function global_boardcast(str) {
    server.connections.forEach(
        conn => {
            console.log(str);
            conn.sendText(str);
        }
    )
}


function domain_boardcast(connections, str) {
    connections.forEach(
        conn => {
            console.log(str);
            conn.sendText(str);
        }
    )
}