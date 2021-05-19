// var mysql = require('mysql');

// // TODO: move to .env
// var con = mysql.createConnection({
//   host: "us-cdbr-east-03.cleardb.com",
//   user: "b260297a3fc883",
//   password: "2f686a00",
//   database: "heroku_dd41f5d2804303d"
// });

var mysql = require('mysql');

// connect to the db
dbConnectionInfo = {
    host: "us-cdbr-east-03.cleardb.com",
    user: "b260297a3fc883",
    password: "2f686a00",
    database: "heroku_dd41f5d2804303d",
    connectionLimit: 5, //mysql connection pool length

};


//create mysql connection pool
var dbconnection = mysql.createPool(
  dbConnectionInfo
);

// Attempt to catch disconnects 
dbconnection.on('connection', function (connection) {
  console.log('📈 Analytics Attached!');

  connection.on('error', function (err) {
    console.error(new Date(), 'MySQL error', err.code);
  });
  connection.on('close', function (err) {
    console.error(new Date(), 'MySQL close', err);
  });

});




//api hit
function apiHit(api){
    let query = "INSERT INTO `endpoint_traffic` (`endpoint`) VALUES(\"" + api + "\");"
    //console.log("🚀 ~ file: analytics.js ~ line 19 ~ apiHit ~ query", query)
    let res = dbconnection.query(query)
    //console.log("🚀 ~ file: analytics.js ~ line 21 ~ apiHit ~ res", res)
}



module.exports={
    apiHit
}