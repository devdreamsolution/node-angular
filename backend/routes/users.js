const cons = require('consolidate');
const { response, request } = require('express');
const multer = require('multer');
const path = require('path');
const helpers = require('./helpers');
const common = require('./common');


const userRoutes = (app, fs) => {    
    const sql = require('mssql')     
    var conn = new sql.ConnectionPool(global.config);    
    const bcrypt = require("bcryptjs");
    var path = require('path');
    
    const Transform = require('stream').Transform;
    const parser = new Transform();
    const newLineStream = require('new-line');
    
    const RequestIp = require('@supercharge/request-ip')
    var geoip = require('geoip-country');
       
    // check if email was validated or not. It is used in forgot password.
    app.get('/validateEmail', function (req, res) {  
                      
        var id = req.query.id;
        if(id != null){
            conn.connect()    
            .then(function () {                                    
                var request = new sql.Request(conn);                       
                var query = "UPDATE [CQ_LOGIN_CLIENT] SET CLOGIN_email_verified = '1' WHERE CLOGIN_ID = '" + id +  "'";                
                request.query(query)
                .then(function (results) {                    
                    var responseOb={                        
                        "msg": "success",                        
                        "status": 200};  
                    return res.send(responseOb);                 
                })
                // Handle sql statement execution errors
                .catch(function (err) {            
                    conn.close();
                    res.send(err);
                }) 
            })    
            .catch(function (err) {                
                conn.close();
                res.send(err);
            });   
        }                   
    });

    // login api , it is used in login page.
    app.post('/login', function (req, res) {          
        
        if(req.body.email != null && req.body.password != null){
            conn.connect()    
            .then(function () {            
                var request = new sql.Request(conn);
                var query = "select [CQ_LOGIN_CLIENT].CLOGIN_ID, [CQ_LOGIN_CLIENT].CLOGIN_email ,[CQ_LOGIN_CLIENT].CLOGIN_password, [CQ_CLIENT_PROFILES].CPROFILE_ID from [CQ_LOGIN_CLIENT] " + 
                "LEFT Join [CQ_CLIENTS] on [CQ_LOGIN_CLIENT].CLOGIN_ID = [CQ_CLIENTS].CLOGIN_ID " + 
                "LEFT Join [CQ_CLIENT_PROFILES] on [CQ_CLIENTS].CLIENT_ID = [CQ_CLIENT_PROFILES].CLIENT_ID " + 
                " where CLOGIN_is_active = '1' and CLOGIN_email='" + req.body.email + "'";

                request.query(query)
                .then(function (results) {            
                    
                    var responseOb = null;
                    if(results.recordset.length > 0){                        
                        var check = bcrypt.compareSync(req.body.password, results.recordset[0].CLOGIN_password );
                        if (!check) {  
                            conn.close();
                            responseOb={
                                "msg":"Invalid Password",
                                "status": 300};
                            return res.send(responseOb);

                        } else {

                            var ip = RequestIp.getClientIp(req)
                            var geo = geoip.lookup(ip);
                                                       
                            if(geo != null){
                                request.query("select * from [CQ_ADM_COUNTRIES] where COUNTRY_NAME = '" + geo.country+ "'")
                                .then(function (country_results) {
                                    
                                        var id = 1;
                                        if(country_results.recordset.length > 0){
                                            id = country_results.recordset[0].COUNTRY_ID;
                                        }
                                        if(results.recordset[0].COUNTRY_ID == null  || results.recordset[0].LANG_ID == null){
                                            updateCountryAndLang(request, id, 1, req.body.email);
                                        }                     
                                })
                                // Handle sql statement execution errors
                                .catch(function (err) {                                    
                                    //conn.close();                                
                                })

                            }else{
                                updateCountryAndLang(request, 1, 1, req.body.email);
                            }
                            
                            if(req.body.lat != null && req.body.lng != null){
                                updateLocation(request, req.body.lat, req.body.lng, results.recordset[0].CLOGIN_ID);
                            }

                            responseOb={
                                "user":results.recordset[0],                            
                                "status": 200};    
                            return res.send(responseOb);    


                                                                                                                     
                        }   
                    }else{
                        conn.close();
                        responseOb={
                            "msg":"Invalid Email", 
                            "status": 300};
                        return res.send(responseOb);
                    }                    
                    
                })
                // Handle sql statement execution errors
                .catch(function (err) {            
                    conn.close();
                    res.send(err);
                })
                })    
            .catch(function (err) {                
                conn.close();
                res.send(err);
            }); 
        }else{
            var responseOb={
                "msg":"please send email and password",   
                "status": 400};
            return res.send(responseOb);
        }
           
    });

    // it is register page, it is used in register page.
    app.post('/register', function (req, res) {

        // config for your database                     
        conn.connect()    
        .then(function () {                  
            var request = new sql.Request(conn);                            
            request.query("select * from [CQ_LOGIN_CLIENT] where CLOGIN_email='" + req.body.email + "'")
            .then(function (results) {
                
                if(results.recordset.length == 0){
                    request.input('email', sql.VarChar, req.body.email);
                    request.input('name', sql.VarChar, req.body.name);
                    request.input('phone', sql.VarChar, req.body.phone);                    
                    request.input('active', sql.Bit, 1);                    
                    request.input('email_verified', sql.Bit, 0);
                    request.input('phone_verified', sql.Bit, 1);
                    var datetime = new Date();
                    request.input('created_on', sql.DateTime, datetime);

                    // generate hash password
                    bcrypt.hash(req.body.password, 10, function(e, hash) {
                        if (e) { 
                            var responseOb={                                
                                "msg":e,                      
                                "status": 300};  
                            return res.send(responseOb);   
                        }else{                            
                            
                            request.input('password', sql.VarChar, hash);
                            request.query("insert into [CQ_LOGIN_CLIENT] (CLOGIN_username , CLOGIN_email ,CLOGIN_password,CLOGIN_phone,CLOGIN_email_verified,CLOGIN_phone_verified,CLOGIN_is_active,CLOGIN_created_on) values (@name,@email,@password,@phone,@email_verified,@phone_verified,@active,@created_on); SELECT SCOPE_IDENTITY() AS id")
                            .then(function (results) {            

                                // add automatically the CQ_CLIENT_PROFILES ,CQ_CLIENTS 
                                var hostname = req.headers.host;
                                sendEmail(req.body.email, "Create Account", "<b> <a href='http://" +  + hostname + "/validateEmail?id=" + results.recordset[0].id  + "'> Click Here" + "</a> </b>");
                                addClient(request, results.recordset[0].id );                                
                                //conn.close();
                                var responseOb={
                                    "user_id":results.recordset[0].id,      
                                    "email":req.body.email,                      
                                    "status": 200};  
                                return res.send(responseOb);                        
                            })                        
                            .catch(function (err) {            
                                conn.close();
                                res.send(err);
                            })   
                        }                   
                                             
                    });                                       
                }else{
                    conn.close();
                    var responseOb={                        
                        "msg": "Same email exist",                        
                        "status": 300};  
                    return res.send(responseOb);
                }
            })
            // Handle sql statement execution errors
            .catch(function (err) {            
                conn.close();
                res.send(err);
            })            
        })    
        .catch(function (err) {
            
            conn.close();
            res.send(err);
        });    
    });


    // it is otp api, it is used in register page.
    app.post('/otp' , function(req, res){
   
        if(req.body.phone != null){
            var code = Math.floor(100000 + Math.random() * 900000);            
            // implement send sms feature .

            // end send sms.
            var responseOb={
                "code":code,   
                "status": 200};
            return res.send(responseOb);
        }else{
            var responseOb={
                "msg":"please send phone number",   
                "status": 400};
            return res.send(responseOb);
        }
    });


    // it is forgot password api, it is used forgot password page.
    app.post('/forgotpassword', function (req, res) {
        if( req.body.email != null ){
            conn.connect()    
            .then(function () {                  

                var request = new sql.Request(conn);       
                var query = "select * from [CQ_LOGIN_CLIENT] where CLOGIN_email='" +  req.body.email  +"'";
                                
                request.query(query)
                .then(function (results) {

                    // save forgot passwrod request...                                       
                    if(results.recordset.length > 0){
                        // send email
                        //sendEmail(req.body.email, "Forgot Email", "<b>Forgot Email Sent?</b>");
                        var hostname = req.headers.host;
                        sendEmail(req.body.email, "Forgot Email", "<b> <a href='http://" +  hostname + "/forgotEmail?email=" + req.body.email + "'> Click Here" + "</a> </b>");
                        request.input('id', sql.Int, results.recordset[0].CLOGIN_ID);
                        request.input('email', sql.VarChar, req.body.email);
                        request.input('login_type', sql.Int, 1);
                        var datetime = new Date();
                        request.input('email_token', sql.VarChar,  bcrypt.hashSync(datetime.toString(), 8));
                        request.input('email_on', sql.DateTime,  datetime);
                        request.input('old_password', sql.VarChar,  results.recordset[0].CLOGIN_password);
                        request.input('password_changed', sql.Bit, 0);
                                                
                        var query = "insert into [CQ_LOGIN_FORGOT_PASSWORD] (FORGOT_login_id , FORGOT_email, FORGOT_login_type,FORGOT_email_token,FORGOT_emailed_on, FORGOT_old_password, FORGOT_password_changed)" 
                                    + " values (@id,@email,@login_type,@email_token,@email_on,@old_password,@password_changed);";

                        request.query(query)
                        .then(function (results) {            
                            conn.close();
                            var responseOb={                        
                                "msg": "success",                        
                                "status": 200};  
                            return res.send(responseOb);
                                                
                        })                        
                        .catch(function (err) {            
                            conn.close();
                            res.send(err);
                        })                                                       
                    }else{
                        var responseOb={                        
                            "msg": "no such email", 
                            "status": 300};  
                        return res.send(responseOb);
                    }                    
                })
                // Handle sql statement execution errors
                .catch(function (err) {            
                    conn.close();
                    res.send(err);
                })            
            })    
            .catch(function (err) {
                
                conn.close();
                res.send(err);
            });                            
        }else{
            var responseOb={
                "msg":"please send email",   
                "status": 400};
            return res.send(responseOb);
        }           
    });



    // it is update password api, it is used for updating password in forgot password page.
    app.post('/updatepassword', function (req, res) {    
   
        if(req.body.email != null && req.body.password != null){
            if(req.body.password != req.body.confirm_password || req.body.password.length < 6){
                res.render( 'forgotEmail.html', {error: "Invalid Password"}); 
            }else{

                conn.connect()    
                .then(function () {                    
                    
                    var request = new sql.Request(conn);       
                    var password = bcrypt.hashSync(req.body.password, 10);
                    var query = "UPDATE [CQ_LOGIN_CLIENT] SET CLOGIN_password = '" + password + "' WHERE CLOGIN_email = '" + req.body.email +  "'";                
                    request.query(query)
                    .then(function (results) {                    
                        var query = "UPDATE [CQ_LOGIN_FORGOT_PASSWORD] SET FORGOT_password_changed = '1' WHERE FORGOT_email = '" + req.body.email +  "'";                
                        request.query(query)
                        .then(function (results) {                                    
                            // var responseOb={                        
                            //     "msg": "success",                        
                            //     "status": 200};  
                            // return res.send(responseOb);
                            res.render( 'success.html', {error: "Success"}); 

                        })
                        // Handle sql statement execution errors
                        .catch(function (err) {            
                            conn.close();
                            res.send(err);
                        })                   
                    })
                    // Handle sql statement execution errors
                    .catch(function (err) {            
                        conn.close();
                        res.send(err);
                    })            
                })    
                .catch(function (err) {
                    
                    conn.close();
                    res.send(err);
                });
                
                
            }
                                  
        }else{
            var responseOb={
                "msg":"please send password",   
                "status": 400};
            return res.send(responseOb);
        }           
    });


    // it is loading profile info by login id, it is used in profile page.
    app.post('/loadProfile',  function (req, res) {    
   
        if(req.body.login_id != null){

            conn.connect()    
            .then(async function () {                    
                
                var request = new sql.Request(conn);    
                var profile = await getProfile(request, req.body.login_id);
                var country = await getCountry(request);
                var language = await getLanguage(request);

                var responseOb={
                    "user":profile,   
                    "country":country,   
                    "language":language,  
                    "status": 200};
                return res.send(responseOb);      

            })    
            .catch(function (err) {                
                conn.close();
                res.send(err);
            }); 
        }else{
            var responseOb={
                "msg":"please send password",   
                "status": 400};
            return res.send(responseOb);
        }
    });
    

    // it is used for web forgot email redirection.
    app.get('/forgotEmail', function(request, response){        

        var email = request.query.email;
        response.render( 'forgotEmail.html', {email: email}); 

    });
    // it is used for web forgot email redirection.
    app.use('/forgot', (req, res) => {
        fs.createReadStream( __dirname + '/view/forgotEmail.html')
        .pipe(
            res
        );
    });


    
    const storage = multer.diskStorage({
        destination: function(req, file, cb) {
            cb(null, 'uploads/');
        },        
        // By default, multer removes file extensions so let's add them back
        filename: function(req, file, cb) {
            cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
        }
    });
    
    // it is update profile api, it is used in profile page.
    app.post('/updateprofile', (req, res) => {
        // 10 is the limit I've defined for number of uploaded files at once
        // 'multiple_images' is the name of our file input field
        
        let upload = multer({ storage: storage, fileFilter: helpers.imageFilter }).array('multiple_images', 10);
    
        upload(req, res, function(err) {
            if (req.fileValidationError) {
                return res.send(req.fileValidationError);
            }
            else // The same as when uploading single images
            {

                var info = req.body.information;
                // for (index = 0, len = files.length; index < len; ++index) {
                //     result += `<img src="${files[index].path}" width="300" style="margin-right: 20px;">`;
                // }
                var photo_path = '';
                const files = req.files;
                if(files.length > 0){
                    photo_path = files[0].filename;                    
                }

                var re = '';
                for (index = 0, len = files.length; index < len; ++index) {
                    re += `<img src="${files[index].path}" width="300" style="margin-right: 20px;">`;
                }       
                
                const dirPath = path.join(__dirname, '/uploads');
                
                //var photo_path = dirPath + "\\" + photo_path;                

                conn.connect()    
                .then(async function () {                    
                    
                    var request = new sql.Request(conn);   
                    
                    const obj = JSON.parse(info);
                    
                    if(obj.lan_id != null && obj.country_id != null && obj.cprofile_id != null){                        
                        var r = await updateClient(request, obj.lan_id, obj.country_id, photo_path, obj.cprofile_id, obj.email, obj.phone);
                        var rr = await updateClientPhoto(request, obj.cprofile_id);
                        var rrr = await updateLoginClient(request, obj.phone , obj.cprofile_id)
                        if(r == 1 && rr == 1 && rrr == 1){
                            var responseOb={                    
                                "msg":"success",  
                                "status": 200};
                            return res.send(responseOb);    
                        }else{
                            var responseOb={                    
                                "msg":"failed",  
                                "status": 300};
                            return res.send(responseOb);    
                        }                
                    }else{
                        var responseOb={                    
                            "msg":"invalid parameter",  
                            "status": 400};
                        return res.send(responseOb); 
                    }                                          
                })    
                .catch(function (err) {
                    
                    conn.close();
                    res.send(err);
                }); 
                                      
            }
                                       
            // Loop through all the uploaded images and display them on frontend
            // var re = '';
            // for (index = 0, len = files.length; index < len; ++index) {
            //     re += `<img src="${files[index].path}" width="300" style="margin-right: 20px;">`;
            // }       
            
        });
        
    });

    
    // inner function
    async function updateClient(request, lan_id, country_id, photo_url, cprofile_id, email, phone){
        
        return new Promise((resolve, reject)=>{
            
            request.input('lan_id', sql.Int, lan_id);
            request.input('country_id', sql.Int, country_id);
            request.input('photo_url', sql.VarChar, photo_url);    
            request.input('cprofile_id', sql.VarChar, cprofile_id);    
            request.input('email', sql.VarChar, email);
            request.input('phone', sql.VarChar, phone);
                    
            var query = "UPDATE [CQ_CLIENTS] SET LANG_ID=@lan_id, COUNTRY_ID=@country_id , CLIENT_profile_picture_url=@photo_url , CLIENT_email_address=@email , CLIENT_mobile_number=@phone " +
            " From [CQ_CLIENTS] LEFT Join [CQ_CLIENT_PROFILES] on [CQ_CLIENT_PROFILES].CLIENT_ID = [CQ_CLIENTS].CLIENT_ID " + 
            " WHERE [CQ_CLIENT_PROFILES].CPROFILE_ID = '" + cprofile_id + "'";            
            if(photo_url == '' || photo_url == null){
                query = "UPDATE [CQ_CLIENTS] SET LANG_ID=@lan_id, COUNTRY_ID=@country_id , CLIENT_email_address=@email , CLIENT_mobile_number=@phone " +
                " From [CQ_CLIENTS] LEFT Join [CQ_CLIENT_PROFILES] on [CQ_CLIENT_PROFILES].CLIENT_ID = [CQ_CLIENTS].CLIENT_ID" + 
                " WHERE [CQ_CLIENT_PROFILES].CPROFILE_ID = '" + cprofile_id + "'";    
            }
            request.query(query)
            .then(function (results) {
                resolve(1);                          
            })
            // Handle sql statement execution errors
            .catch(function (err) {            
                //conn.close();                
                resolve(0);                
            })  
        });

    }
    
    // inner function
    async function updateLoginClient(request, phone, cprofile_id){
        
        return new Promise((resolve, reject)=>{
            
            //[CQ_LOGIN_CLIENT].CLOGIN_email=@email
            var query = "UPDATE [CQ_LOGIN_CLIENT] SET [CQ_LOGIN_CLIENT].CLOGIN_phone=@phone " +
            " From [CQ_LOGIN_CLIENT] "  + 
            "LEFT Join [CQ_CLIENTS] on [CQ_CLIENTS].CLOGIN_ID = [CQ_LOGIN_CLIENT].CLOGIN_ID " + 
            "LEFT Join [CQ_CLIENT_PROFILES] on [CQ_CLIENT_PROFILES].CLIENT_ID = [CQ_CLIENTS].CLIENT_ID" + 
            " WHERE [CQ_CLIENT_PROFILES].CPROFILE_ID = '" + cprofile_id + "'";

            request.query(query)
            .then(function (results) {
                resolve(1);                          
            })
            // Handle sql statement execution errors
            .catch(function (err) {            
                //conn.close();                
                resolve(0);                
            })  
        });


    }

    // inner function
    async function updateClientPhoto(request,  cprofile_id){
        
        return new Promise((resolve, reject)=>{                        
            
            var dt = common.getCurrentDateTime();
            request.input('created_on', sql.VarChar, dt);                                    

            var query = "select * from [CQ_CLIENT_PHOTOS] where CPROFILE_ID = '" + cprofile_id + "'";
            request.query(query)
            .then(function (results) {
                if(results.recordset.length > 0){
                    query = "UPDATE [CQ_CLIENT_PHOTOS] SET CPHOTO_link=@photo_url " +            
                    " WHERE [CQ_CLIENT_PHOTOS].CPROFILE_ID = '" + cprofile_id + "'";
                    request.query(query)
                    .then(function (results) {
                        resolve(1);                          
                    })
                    // Handle sql statement execution errors
                    .catch(function (err) {            
                        //conn.close();                        
                        resolve(0);                
                    })  

                }else{
                    var query = "insert into [CQ_CLIENT_PHOTOS] (CPROFILE_ID , CPHOTO_link , CPHOTO_order_by, CPHOTO_is_deleted, CPHOTO_created_on, CPHOTO_updated_on, CPHOTO_created_by, CPHOTO_updated_by) " + 
                    " values (@cprofile_id,@photo_url,0,0,@created_on,@created_on,0,0); SELECT SCOPE_IDENTITY() AS id";
                    request.query(query)
                    .then(function (results) {
                        resolve(1);                          
                    })
                    // Handle sql statement execution errors
                    .catch(function (err) {            
                        //conn.close();                        
                        resolve(0);                
                    })  

                }                
            })
            // Handle sql statement execution errors
            .catch(function (err) {            
                //conn.close();                
                resolve(0);                
            })  
        });


    }

    // inner function
    async function getProfile(request, login_id){
        var query = "SELECT CLOGIN_username as  username, [CQ_CLIENTS].CLIENT_email_address as email, CLOGIN_phone as phone, [CQ_CLIENTS].LANG_ID as lan_id, [CQ_CLIENTS].COUNTRY_ID as country_id, [CQ_CLIENTS].CLIENT_profile_picture_url as photo_url FROM [CQ_LOGIN_CLIENT] " + 
                            "LEFT Join [CQ_CLIENTS] on [CQ_CLIENTS].CLOGIN_ID = [CQ_LOGIN_CLIENT].CLOGIN_ID " + 
                            "LEFT Join [CQ_CLIENT_PROFILES] on [CQ_CLIENT_PROFILES].CLIENT_ID = [CQ_CLIENTS].CLIENT_ID " + 
                            "LEFT Join [CQ_CLIENT_PHOTOS] on [CQ_CLIENT_PHOTOS].CPHOTO_ID = [CQ_CLIENT_PROFILES].CPHOTO_ID " + 
                            "where [CQ_CLIENTS].CLOGIN_ID = '" + login_id + "'";
        return new Promise((resolve, reject) => {
            request.query(query)
            .then(function (results) {                
                if(results.recordset.length > 0 ){                    
                    resolve(results.recordset[0]);           
                }                                   
            })
            // Handle sql statement execution errors
            .catch(function (err) {            
                conn.close();
                resolve(null);
            })   
        });       
    }    

    // inner function
    async function getCountry(request){
        return new Promise((resolve, reject) => {
            var myquery = "select * from  [CQ_ADM_COUNTRIES]";
            request.query(myquery)
            .then(function (results) {
                if(results.recordset.length > 0 ){                        
                    resolve(results.recordset);
                }                                   
            })
            // Handle sql statement execution errors
            .catch(function (err) {            
                conn.close();
                resolve(null);
            })   
        });        
    }
    
    // inner function
    async function getLanguage(request){
        
        return new Promise((resolve, reject) => {
            var myquery = "select * from  [CQ_ADM_LANGUAGES]";
            request.query(myquery)
            .then(function (results) {
                if(results.recordset.length > 0 ){                        
                    resolve(results.recordset);
                }                                   
            })
            // Handle sql statement execution errors
            .catch(function (err) {            
                conn.close();
                resolve(null);
            }) 
        });
         
    }


    // inner function
    async function sendEmail(email, title, content) {
        let info = await global.transporter.sendMail({
            from: 'info@2cool2q.app', // sender address
            to: email, // list of receivers
            subject: "Hello ✔", // Subject line
            text: title, // plain text body
            html: content, // html body
        });
    }    

    // inner function
    async function updateCountryAndLang(request, country_id, lang_id, email){
        var query = "UPDATE [CQ_LOGIN_CLIENT] SET COUNTRY_ID = '" + country_id + "' , LANG_ID = '" + lang_id + "' WHERE CLOGIN_email = '" + email +  "'";                
        request.query(query)
        .then(function (res) {
        })        
        .catch(function (err) {                        
        })   
    }

    // inner function
    async function updateLocation(request, lat, lng, CLOGIN_ID){
        request.query("select * from [CQ_CLIENTS] where CLOGIN_ID='" + CLOGIN_ID + "'")
            .then(function (results) {   
                if(results.recordset.length > 0){
                    var query = "UPDATE [CQ_CLIENT_PROFILES] SET CPROFILE_current_latitude = '" + lat + "' , CPROFILE_current_longitude = '" + lng + "' WHERE CLIENT_ID = '" + results.recordset[0].CLIENT_ID +  "'";
                    request.query(query)
                    .then(function (result) {             
                    })
                    // Handle sql statement execution errors
                    .catch(function (err) {                                                                                                       
                    })  
                }                                                                
        });
       
    }

    // inner function
    async function addClient(request, login_id){
        request.input('country_id', sql.Int, 1);
        request.input('lang_id', sql.Int, 1);
        request.input('first_name', sql.VarChar, '');
        request.input('last_name', sql.VarChar, '');
        request.input('mobile', sql.VarChar, '');
        request.input('url', sql.VarChar, '');
        request.input('login_id', sql.Int, login_id);
        request.input('is_registered', sql.Bit, 0);
        request.input('is_active', sql.Bit, 0);
        request.input('is_deleted', sql.Bit, 0);
        request.input('is_under_surveillance', sql.Bit, 0);
        request.input('current_latitude', sql.Decimal, 0);
        request.input('current_longitude', sql.Decimal, 0);
        request.input('from_web', sql.Bit, 0);
        request.input('from_app', sql.Bit, 0);
        request.input('created_by', sql.Int, 1);
                
        var datetime = new Date();
        //request.input('created_on', sql.DateTime, datetime);
        request.input('updated_by', sql.Int, 0);

        var query = "insert into [CQ_CLIENTS] (LANG_ID , COUNTRY_ID ,CLIENT_first_name  , CLIENT_last_name  , CLIENT_email_address ,CLIENT_mobile_number, CLIENT_profile_picture_url, CLOGIN_ID, CLIENT_is_registered "+ 
                    ",CLIENT_is_active , CLIENT_is_deleted , CLIENT_is_under_surveillance, CLIENT_Current_Latitude, CLIENT_Current_longitude, CLIENT_from_web, CLIENT_from_app, CLIENT_Created_By, CLIENT_Created_On, CLIENT_Updated_On,CLIENT_Updated_By) " + 
                    "values (@lang_id,@country_id,@name,@last_name,@email,@mobile,@url,@login_id,@is_registered,@is_active,@is_deleted," + 
                    "@is_under_surveillance,@current_latitude,@current_longitude,@from_web,@from_app,@created_by,@created_on,@created_on,@updated_by); " + 
                    "SELECT SCOPE_IDENTITY() AS id";
        request.query(query)
        .then(function (results) {
            if(results.recordset.length > 0){
                var id = results.recordset[0].id;
                addClientProfile(request, id);
            }            
        })                        
        .catch(function (err) {  
            
        })   
    }

    // inner function
    async function addClientProfile(request, login_id){

        request.input('client_id', sql.Int, login_id);
        request.input('caddr_id', sql.Int, 2);
        request.input('plan_id', sql.Int, 0);
        request.input('cphoto_id', sql.Int, 0);
        request.input('cprofile_is_active', sql.Bit, 0);        
        request.input('link_to_instagram', sql.VarChar, '');
        request.input('allow_alerts', sql.Int, 0);
        //request.input('created_by', sql.Int, 1);
        var datetime = new Date();
       // request.input('created_on', sqlb  .DateTime, datetime);
        request.input('profile_updated_by', sql.Int, 0);       

        var query = "insert into [CQ_CLIENT_PROFILES] (CLIENT_ID , CADDR_ID , PLAN_ID  , CPHOTO_ID  , CPROFILE_is_active ,CPROFILE_current_latitude , CPROFILE_current_longitude"+ 
                    ", CPROFILE_link_to_instagram , CPROFILE_allow_alerts , CPROFILE_created_by, CPROFILE_created_on, CPROFILE_updated_on , CPROFILE_updated_by) " + 
                    "values (@client_id,@caddr_id,@plan_id,@cphoto_id,@cprofile_is_active,@current_latitude,@current_longitude," + 
                    "@link_to_instagram,@allow_alerts,@created_by,@created_on,@created_on,@profile_updated_by); " + 
                    "SELECT SCOPE_IDENTITY() AS id";
        request.query(query)
        .then(function (results) {
         
        })                        
        .catch(function (err) {  
             
        })  
        
    }



  };
  
  module.exports = userRoutes;