const { request } = require('express');

const common = require('./common');
const appRouter = (app, fs) => {

    const sql = require('mssql')     
    var conn = new sql.ConnectionPool(global.config);    

    // save feedback api, it is used in feedback page.
    app.post('/feedback', function (req, res) {  
                      
        //var id = req.query.id;   
        if(req.body.bprofile_id != null && req.body.cprofile_id != null && req.body.star != null ){
            conn.connect()    
            .then(function () {

                var request = new sql.Request(conn);                                        
                request.input('bprofile_id', sql.Int, req.body.bprofile_id);
                request.input('cprofile_id', sql.Int, req.body.cprofile_id);
                request.input('star', sql.Int, req.body.star);
                request.input('abased_id', sql.Int, req.body.abased_id);
                request.input('qbased_id', sql.Int, req.body.qbased_id);
                
                request.input('title', sql.VarChar, req.body.title);
                request.input('brate_feedback', sql.VarChar, req.body.content);
                var datetime = new Date();
                request.input('created_on', sql.DateTime, datetime );
                request.input('updated_on', sql.DateTime, datetime );
                request.input('is_deleted', sql.Int, 0 );                
    
                var query = "insert into [CQ_BUSINESS_RATING] (BPROFILE_ID,CPROFILE_ID,ABASED_ID,QBASED_ID,BRATE_stars" +                             
                            ",BRATE_title, BRATE_feedback,BRATE_created_on,BRATE_updated_on,BRATE_is_deleted" + 
                            ")"  + 
                            " values (@bprofile_id,@cprofile_id,@abased_id,@qbased_id,@star,@title ,@brate_feedback,@created_on,@updated_on,@is_deleted"+                            
                            "); "+ 
                            "SELECT SCOPE_IDENTITY() AS id ";
    
                request.query(query)
                .then(async function (results) {  
                    if(results.recordset.length > 0){

                        //DATENAME(dw,CORDER_created_on) as weekofday, DATEPART (day,CORDER_created_on) as day , DATENAME(month,CORDER_created_on) as month ,  LOWER(RIGHT(CONVERT(VARCHAR, CORDER_created_on, 100),7)) as time
                        var feedback = await getFeedbackInfo(request, req.body.bprofile_id, req.body.cprofile_id, req.body.abased_id, req.body.qbased_id);
                       

                        conn.close();
                        var responseOb={                        
                            "id": results.recordset[0].id, 
                            "feedback":feedback,
                            "status": 200}; 
                        return res.send(responseOb);            
                    }else{
                        var responseOb={                        
                            "msg": "error", 
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

        }   else{
            var responseOb={                        
                "msg": "invalid parameter", 
                "status": 400}; 
            return res.send(responseOb);    
        }                 
    });

    // update feedback api, it is used in feedback page.
    app.post('/updatefeedback', function (req, res) {  
                      
        //var id = req.query.id;   
        if(req.body.bprofile_id != null && req.body.cprofile_id != null && req.body.star != null ){
            conn.connect()    
            .then(function () {

                var request = new sql.Request(conn);                                        
                request.input('bprofile_id', sql.Int, req.body.bprofile_id);
                request.input('cprofile_id', sql.Int, req.body.cprofile_id);
                request.input('star', sql.Int, req.body.star);
                request.input('abased_id', sql.Int, req.body.abased_id);
                request.input('qbased_id', sql.Int, req.body.qbased_id);
                request.input('brate_feedback', sql.VarChar, req.body.content);
                var datetime = new Date();
                request.input('created_on', sql.DateTime, datetime );
                request.input('updated_on', sql.DateTime, datetime );
                request.input('is_deleted', sql.Int, 0 );

                var query = "UPDATE [CQ_BUSINESS_RATING] SET BRATE_stars=@star,BRATE_feedback=@brate_feedback  WHERE BRATE_ID = '" + req.body.brate_id + "'";
    
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

        }   else{
            var responseOb={                        
                "msg": "invalid parameter", 
                "status": 400}; 
            return res.send(responseOb);    
        }                 
    });


    // update report api, it is used in feedback page.
    app.post('/updatereport', function (req, res) {  
                      
        //var id = req.query.id;   
        if(req.body.bprofile_id != null && req.body.cprofile_id != null ){
            conn.connect()    
            .then(function () {                                    
                var request = new sql.Request(conn);
                        
                request.input('bprofile_id', sql.Int, req.body.bprofile_id);
                request.input('cprofile_id', sql.Int, req.body.cprofile_id);                
                request.input('abased_id', sql.Int, req.body.abased_id);
                request.input('qbased_id', sql.Int, req.body.qbased_id);
                request.input('title', sql.VarChar, req.body.title);
                request.input('report', sql.VarChar, req.body.content);
                var datetime = new Date();
                request.input('created_on', sql.DateTime, datetime );
                request.input('updated_on', sql.DateTime, datetime );
                request.input('is_deleted', sql.Int, 0 );
                request.input('solved', sql.Int, 0 );
                
                var query = "UPDATE [CQ_BUSINESS_REPORT] SET BREP_title=@title , BREP_report=@report  WHERE BREP_ID = '" + req.body.brep_id + "'";    
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

        }   else{
            var responseOb={                        
                "msg": "invalid parameter", 
                "status": 400}; 
            return res.send(responseOb);    
        }                 
    });


    // save report api, it is used in feedback page.
    app.post('/report', function (req, res) {  
                      
        //var id = req.query.id;   
        if(req.body.bprofile_id != null && req.body.cprofile_id != null ){
            conn.connect()    
            .then(function () {                                    
                var request = new sql.Request(conn);
                        
                request.input('bprofile_id', sql.Int, req.body.bprofile_id);
                request.input('cprofile_id', sql.Int, req.body.cprofile_id);                
                request.input('abased_id', sql.Int, req.body.abased_id);
                request.input('qbased_id', sql.Int, req.body.qbased_id);
                request.input('title', sql.VarChar, req.body.title);
                request.input('report', sql.VarChar, req.body.content);
                var datetime = new Date();
                request.input('created_on', sql.DateTime, datetime );
                request.input('updated_on', sql.DateTime, datetime );
                request.input('is_deleted', sql.Int, 0 );
                request.input('solved', sql.Int, 0 );
                
                var query = "insert into [CQ_BUSINESS_REPORT] (BPROFILE_ID,CPROFILE_ID,ABASED_ID,QBASED_ID" +                             
                            ",BREP_title,BREP_report,BREP_created_on,BREP_updated_on,BREP_is_deleted,BREP_solved" + 
                            ")"  + 
                            " values (@bprofile_id,@cprofile_id,@abased_id,@qbased_id,@title,@report,@created_on,@updated_on,@is_deleted,@solved"+   
                            "); "+ 
                            "SELECT SCOPE_IDENTITY() AS id ";
    
                request.query(query)
                .then(async function (results) {  
                    if(results.recordset.length > 0){

                        var report = await getReportInfo(request, req.body.bprofile_id, req.body.cprofile_id, req.body.abased_id, req.body.qbased_id);
                        conn.close();
                        var responseOb={                        
                            "id": results.recordset[0].id, 
                            "report":report,
                            "status": 200}; 
                        return res.send(responseOb);            
                    }else{
                        var responseOb={                        
                            "msg": "error", 
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

        }   else{
            var responseOb={                        
                "msg": "invalid parameter", 
                "status": 400}; 
            return res.send(responseOb);    
        }                 
    });


    // get feedback api, it is used in feedback page.
    app.post('/getfeedback', function (req, res) {  
                      
        //var id = req.query.id;   
        if(req.body.bprofile_id != null && req.body.cprofile_id != null){
            conn.connect()    
            .then(async function () {                                    
                var request = new sql.Request(conn);
                        
                var bprofile_id = req.body.bprofile_id;
                var cprofile_id = req.body.cprofile_id;
                var qbased_id = req.body.qbased_id;
                var abased_id = req.body.abased_id;

                var feedback = await getFeedbackInfo(request, bprofile_id, cprofile_id, abased_id, qbased_id);
                var report = await getReportInfo(request, bprofile_id, cprofile_id, abased_id, qbased_id);

                var responseOb={                        
                    "feedback": feedback, 
                    "report": report, 
                    "status": 200};

                return res.send(responseOb);      
            })    
            .catch(function (err) {                
                conn.close();
                res.send(err);
            });   

        }   else{
            var responseOb={                        
                "msg": "invalid parameter", 
                "status": 400}; 
            return res.send(responseOb);    
        }                 
    });


    // inner function
    async function getFeedbackInfo(request, bprofile_id, cprofile_id, abased_id, qbased_id){
        return new Promise((resolve, reject) => {                       
            var query = "";
            if(qbased_id == null && abased_id != null){                
                query = "select BRATE_ID as brate_id, BPROFILE_ID as bprofile_id, CPROFILE_ID as cprofile_id, ABASED_ID as abased_id , QBASED_ID as qbased_id ,BRATE_stars as star " +
                ", BRATE_title as title , BRATE_feedback as feedback " +
                ", DATENAME(dw,BRATE_created_on) as weekofday, DATEPART (day,BRATE_created_on) as day , DATENAME(month,BRATE_created_on) as month ,  LOWER(RIGHT(CONVERT(VARCHAR, BRATE_created_on, 100),7)) as time " + 
                " from [CQ_BUSINESS_RATING] " +
                " where BPROFILE_ID = '" + bprofile_id + "' and CPROFILE_ID = '" + cprofile_id + "' and ABASED_ID = '" + abased_id + "'"; 

            }else if(qbased_id != null && abased_id == null){

                query = "select BRATE_ID as brate_id, BPROFILE_ID as bprofile_id, CPROFILE_ID as cprofile_id, ABASED_ID as abased_id , QBASED_ID as qbased_id ,BRATE_stars as star " +
                ", BRATE_title as title,  BRATE_feedback as feedback " + 
                ", DATENAME(dw,BRATE_created_on) as weekofday, DATEPART (day,BRATE_created_on) as day , DATENAME(month,BRATE_created_on) as month ,  LOWER(RIGHT(CONVERT(VARCHAR, BRATE_created_on, 100),7)) as time " + 
                " from [CQ_BUSINESS_RATING] " +                 
                " where BPROFILE_ID = '" + bprofile_id + "' and CPROFILE_ID = '" + cprofile_id + "' and QBASED_ID = '" + qbased_id + "'"; 

            }else{
                resolve({});            
            }                                                
       
            request.query(query)
            .then(function (results) {  
                if(results.recordset.length > 0){
                    resolve(results.recordset[0]);                     
                }else{
                    resolve({});     
                }                
            })
            // Handle sql statement execution errors
            .catch(function (err) {                
                resolve({}); 
            }) 


        });        
    }

    // inner function
    async function getReportInfo(request, bprofile_id, cprofile_id, abased_id, qbased_id){
        return new Promise((resolve, reject) => {                       
            var query = "";
            if(qbased_id == null && abased_id != null){                
 
                query = "select BREP_ID as brep_id,  BPROFILE_ID as bprofile_id, CPROFILE_ID as cprofile_id, ABASED_ID as abased_id , QBASED_ID as qbased_id " +
                ",BREP_title as title, BREP_report as report, BREP_solved as solved  " + 
                ", DATENAME(dw,BREP_created_on) as weekofday, DATEPART (day,BREP_created_on) as day , DATENAME(month,BREP_created_on) as month ,  LOWER(RIGHT(CONVERT(VARCHAR, BREP_created_on, 100),7)) as time " + 
                " from [CQ_BUSINESS_REPORT] " +                 
                " where BPROFILE_ID = '" + bprofile_id + "' and CPROFILE_ID = '" + cprofile_id + "' and ABASED_ID = '" + abased_id + "'"; 

            }else if(qbased_id != null && abased_id == null && common.enabled() == 0){

                query = "select BREP_ID as brep_id, BPROFILE_ID as bprofile_id, CPROFILE_ID as cprofile_id, ABASED_ID as abased_id , QBASED_ID as qbased_id " +
                ",BREP_title as title, BREP_report as report ,BREP_solved as solved " + 
                ", DATENAME(dw,BREP_created_on) as weekofday, DATEPART (day,BREP_created_on) as day , DATENAME(month,BREP_created_on) as month ,  LOWER(RIGHT(CONVERT(VARCHAR, BREP_created_on, 100),7)) as time " + 
                " from [CQ_BUSINESS_REPORT] " +                 
                " where BPROFILE_ID = '" + bprofile_id + "' and CPROFILE_ID = '" + cprofile_id + "' and QBASED_ID = '" + qbased_id + "'"; 

            }else{
                resolve({});            
            }        
            
    

            request.query(query)
            .then(function (results) {  
                if(results.recordset.length > 0){
                    resolve(results.recordset[0]);                     
                }else{
                    resolve({});     
                }                         
            })
            // Handle sql statement execution errors
            .catch(function (err) {                
                resolve({}); 
            }) 
        });        
    }

    



};
module.exports = appRouter;

