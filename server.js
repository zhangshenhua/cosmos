var http = require('http'),
    fs = require('fs');

var ws = require('nodejs-websocket');
var HashMap = require('hashmap');

mylog = (s) => {
    console.log((new Date()).toLocaleString() + ' ' + `{${s}}`);
}

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
    var cid, uid_from, uid_to;

    var group = uri.match('^/(.*?)(/([^/@]*))?(@([^/]*))?$');
    cid = '/' + group[1];
    uid_from = group[3];
    uid_to = group[5];
    
    console.log({"cid": decodeURI(cid), "uid_from": decodeURI(uid_from), "uid_to": decodeURI(uid_to)});
    return {"cid": decodeURI(cid), "uid_from": decodeURI(uid_from), "uid_to": decodeURI(uid_to)}
}


http.createServer(function (req, res) {
    var path = req.url;

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


var cosmosHash = new HashMap();

var server = ws.createServer(function(conn){
    var uri_hash = uri_parse(conn.path),
        cid = uri_hash.cid,
        uid_from = uri_hash.uid_from,
        uid_to = uri_hash.uid_to,
        key = conn.key;
    conn.uid_from = uid_from = (uid_from == 'undefined' ? key : uid_from);

    conn.on('error', (err)=>{
        console.log(err);
        cosmosHash.get(cid).delete(key);
        mylog(cosmosHash.get(cid).count());
    });

    conn.on('close', (code, reason) => {
        cosmosHash.get(cid).delete(key);
        domain_boardcast(cosmosHash.get(cid).values(), makeCloseMessage(uid_from));
        console.log(`Connection close: ${conn.path} ${key}`);
        mylog(cosmosHash.get(cid).count());
    });

    conn.on('text', function(str) {                   //收到消息后：
        mylog(str);
        domain_boardcast(                             // 转发给：
            cosmosHash.get(cid).values().filter(      // cid所指宇宙中，
                cn =>                                 
                    (cn.uid_from === uid_to)          //【用户名】为【单播对象】(被@者)的连接，
                     || (uid_to === "undefined")        // 以及由于发送者url中无‘@’符号，从而指所有在线者。
            ), 
            str
        );
    });

    mylog(`Connection open: ${conn.path} ${key}`);

    if (!cosmosHash.get(cid)) {
        var tmp = new HashMap();
        tmp.set(key, conn);
        cosmosHash.set(cid, tmp);
    } else {
        cosmosHash.get(cid).set(key, conn);
    }

    domain_boardcast(cosmosHash.get(cid).values(), makeOpenMessage(uid_from));
    mylog(cosmosHash.get(cid).count());
}).listen(2333);


function domain_boardcast(connections, str) {
    connections.forEach(
        conn => {
            conn.sendText(str);
        }
    )
}


function makeMessage(from, to, text) {
    return JSON.stringify(
        {
            'from': from,
            'to': to,
            'text': text,
        }
    );
}


function makeOpenMessage(from) {
    return makeMessage(from, '' , 'OPEN');
}


function makeCloseMessage(from) {
    return makeMessage(from, '' , 'CLOSE');
}
