var mysql = require("mysql");
var auth = require("./auth").getAuth();

var conn = mysql.createClient(auth);
conn.debug = false;

process.on('exit', function() {
	if(inTransaction) {
		rollback();
	}
	conn.end();
});

var fn2 = 0;
var fn1 = 1;
var fn = null;
var fib_base = 0;

exports.fibonacci = function (n, cb) {
	// find the lastest base
	if ((n < 2 ) || (n > 500)) {
		throw 'Le domaine de la function est [2,500].';
	}

	conn.query('SELECT * FROM fibonacci WHERE no < ' + String(n) + ' ORDER BY no DESC LIMIT 2', function(err, results) {
		if (err) throw err;
		console.log(results);

		fn2 = results[1].value;
		fn1 = results[0].value;

		fib_base = results[0].no + 1;

		if (fib_base == n) {
			// the value is already calculated.
			cb(fn2 + fn1, true);
		} else {
			fibonacci(n, cb);
		}
	});
};

exports.begin = function() { begin(); };
exports.commit = function() { commit(); };
exports.rollback = function() { rollback(); };
exports.clean = function() { clean(); };

function init() {
	conn.query('USE micaeldev;');
}

function fibonacci(n, cb) {
	if (!inTransaction) {
		inTransaction = true;
		begin();
	}

	// calculate
	fn = fn1 + fn2;
	console.log('>f' + fib_base + ": " + fn1 + " + " + fn2 + "=" + fn);

	if (n <= fib_base) {
		commit();
		
		cb(fn, false);
		return;
	}

	saveDB(fib_base, fn);

	fn2 = fn1;
	fn1 = fn;

	// next loop call
	fib_base++;

	process.nextTick(function() {
		fibonacci(n, cb);
	});
}

var inTransaction;
var fib_snapshot;
function begin() {
	conn.query('START TRANSACTION;');
	console.log("Starting transaction.");
	fib_snapshot = fib_base;
}

function saveDB(index, value) {
	var sql = conn.format('INSERT INTO fibonacci(no, value) VALUES(?, ?);', [index, value]);
	console.log("saveDB query = " + sql);
	conn.query(sql);
}

function commit() {
	if (inTransaction) {
		console.log("Committed transaction.");
		inTransaction = false;
		conn.query('COMMIT;');
	}
}

function rollback() {
	if (inTransaction) {
		inTransaction = false;
		console.log("Rollbacked transaction.");
		conn.query('ROLLBACK;');
		fib_base = fib_snapshot;
	}
}

function clean() {
	conn.query('DROP TABLE fibonacci;', function() {
		conn.query('CREATE TABLE fibonacci ( no int not null, value bigint unsigned not null, primary key (no) );', function() {
			conn.query('INSERT INTO fibonacci(no, value) VALUES(0, 0);');
			conn.query('INSERT INTO fibonacci(no, value) VALUES(1, 1);');
		});
	});
}

init();