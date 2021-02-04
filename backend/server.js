const express = require("express");
var cors = require('cors');
const app = express();
const PORT = process.env.PORT || "8001";
const mysql = require('mysql');
const mssql = require('mssql');
const bodyParser = require('body-parser');
const nodemailer = require("nodemailer");
let http = require('http');

var error_response={};
var error_code=0;
var error_msg='';

app.use(cors({origin:true,credentials: true}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(bodyParser.json());

var engines = require('consolidate');
app.set('views', __dirname + '/view');
app.engine('html', engines.mustache);
app.set('view engine', 'html');

// for image upload
app.use(express.static(__dirname + '/uploads'));


const fs = require("fs");

global.config = {        
    user: '2C2Q_Business_Dev',
    password: '2C2Q_biz4',
    port : 1433,
    server: '188.121.44.214', 
    database: '2C2Q_Business_Dev'
}; 


// Incoming Server: outlook.office365.com Port: 995
// Outgoing Server: smtp.office365.com Port: 587
// Email: info@2cool2q.app
// PWD: Company2C2Q1
global.transporter = nodemailer.createTransport({
    host: "smtp.office365.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: "info@2cool2q.app", // generated ethereal user
        pass: "Company2C2Q1", // generated ethereal password
    },
});

// global.transporter = nodemailer.createTransport({
//     host: "mail.prohealthdetect.com",
//     port: 465,
//     secure: true, // true for 465, false for other ports
//     auth: {
//         user: "newuser@prohealthdetect.com", // generated ethereal user
//         pass: "AYI.7.WDimo~", // generated ethereal password
//     },
// });

const routes = require("./routes/routes.js")(app, fs);
const users = require("./routes/users.js")(app, fs);
const business = require("./routes/business.js")(app, fs);
const country = require("./routes/country.js")(app, fs);
const categories = require("./routes/category.js")(app, fs);
const favourite = require("./routes/favourite.js")(app, fs);
const department= require("./routes/department.js")(app, fs);
const book= require("./routes/book.js")(app, fs);
const menu = require("./routes/menu.js")(app, fs);
const queue = require("./routes/queue.js")(app, fs);
const checkin = require("./routes/checkin.js")(app, fs);
const activity = require("./routes/activity.js")(app, fs);
const feedback = require("./routes/feedback.js")(app, fs);
const order = require("./routes/order.js")(app, fs);

//const view_user = require("./page/user.js");

const server = app.listen(PORT, ()=>{
    //console.log("server is running on "+PORT);
    console.log("listening on port %s...", server.address().port);
})

//http.createServer(view_user.handleRequest).listen(8000);
