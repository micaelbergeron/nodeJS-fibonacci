var http = require("http");
var test = require("./test.js");
var querystring = require("querystring");
var fib = require("./fibonacci.js");

http.createServer(function (req, res) {
	res.writeHead(200, {'Content-Type': 'text/html'});
	var ip_address = req.connection.remoteAddress;

	res.write('<h1>Your ip is: ' + ip_address + '</h1>');

	var data = parseActionURL(req.url);

	console.log(data);
	console.log('Request from: ' + ip_address);

	if (data.action === "fibonacci") {
		try {
			fib.fibonacci(data.query.n, function(val, cacheHit) {
				console.log(val);
				res.write('<p>Fibonacci(' + data.query.n + ')=' + val + '.</p>');

				if (cacheHit) {
					res.end('<p>Cache hit :)</p>');
				} else {
					res.end('<p>Cache miss :(</p>');
				}
			});
		} catch(err) {
			res.end('<p class="error">' + err + '</p>');
		}
	};

	if (data.action === "cancel") {
		fib.rollback();
		res.end('<p>Fibonacci cancelled by the user.</p>');
	};

	if (data.action == "clean") {
		fib.clean();
		res.end('<p>Fibonacci cleaned by user.</p>');
	}
}).listen(1337);

function parseActionURL(url) {
	var split = url.split('?');
	var qs = querystring.parse(split[1]);
	return {
		action: split[0].replace('/',''),
		query: qs
	};
}

console.log('Server running at http://127.0.0.1:1337/');