var ws = require('nodejs-websocket');

var server = ws.createServer(function(conn){
    console.log(`New connection`);

    conn.on('text', function(str){  
        console.log(`client: ${str}`)
        boardcast(str);
    });

    conn.on('error', (err)=>{
        console.log(err)
    })

    setTimeout(() => {
        conn.sendText(`<js>
        alert('连接已建立');
        </js>
        `);
    }, 1000);


}).listen(2333);


function boardcast(str) {
    server.connections.forEach(
        conn => {
            conn.sendText(str);
        }
    )
}