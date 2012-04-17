var mysql = require('mysql');
var auth = require("./auth.js");
var fs = require("fs");

process.on('exit', function() {
  client.end();
});

var TEST_SCHEMA = 'micaeldev';
var TEST_TABLE = 'test';

var creds = auth.getAuth();

console.log("Trying to connect to DB server.");
console.log(">username: " + creds.user);
console.log(">host: " + creds.host + ":" + creds.port);
var client = mysql.createClient(creds);

function init() {
  console.log("Changing database to " + TEST_SCHEMA);
  client.query('USE ' + TEST_SCHEMA + ';');
}

exports.resetDB = function() {
  fs.readFile("./drop_test.sql", 'utf-8', function(err, dropSql) {
    if (err) throw err;
    console.log("Content of drop_test.sql:\n" + dropSql);
    dropSql.split(/;/).forEach(function(expr) {
      if (expr) {
        client.query(expr + ';');
      }
    });

    fs.readFile("./create_tables.sql", 'utf-8', function(err, createSql) {
      if (err) throw err;
      console.log("Content of create_tables.sql:\n" + createSql);
      createSql.split(/;/).forEach(function(expr) {
        if (expr) {
          client.query(expr + ';');
        } 
      });
    });
  });
};

exports.testDB = function() {
  // If no callback is provided, any errors will be emitted as `'error'`
  // events by the client
  var showTable = client.query("SHOW TABLES;");

  console.log("<connected!");
  console.log(showTable);
}

exports.insertIP = function(ip_str) {
  client.query('INSERT INTO ' + TEST_TABLE + '(ip) VALUES(?);', [ip_str]);
}

exports.query = function(q) {
  client.query(q);
}

// entrypoint();
init();