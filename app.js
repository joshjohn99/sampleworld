var http = require('http'),
	fs = require('fs');

http.createServer(function(req,res){
	if (req.url === '/favicon.ico'){
		return res.end();
	}
	console.log('Incoming request to ' + req.url); 

	var i = 2;
	res.writeHead(200, {'Content-Type': 'text/plain'});

	setTimeout(function() {
		fs.readFile(__filename,{
			encoding:'utf8'
		}, function(error,contents){
			if (error){
				console.error(error);
				return res.end();			
			}
			
			console.log('sending response for ' + req.url);
			res.end('Yay!! It went thought!!');
		});
	},5000);

	while(i--){
		console.log('loop value: ' + i + '\r');
	}


}).listen(1337,'127.0.0.1');

console.log('Server is running st http://127.0.0.1:1337');