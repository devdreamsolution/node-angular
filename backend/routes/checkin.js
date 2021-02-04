const common = require("./common");
const appRouter = (app, fs) => {

    const sql = require('mssql')     
    var conn = new sql.ConnectionPool(global.config);    


    // get Checkin status , it is used in checkin page.
    
    app.post('/getCheckin', function (req, res) {
        //var id = req.query.id;        
        if(req.body.department_id != null && req.body.different != null){
            conn.connect()    
            .then(async function () {

                var request = new sql.Request(conn);                                               
                var current_date_time = common.getCurrentDateTime();
                var current_date = common.getCurrentDate();
                
                // if current time is earlier than business open time, get the time difference.
                    
                var query = "SELECT QUEUE_ID as queue_id,  QUEUE_average_attention_time as avg_attention, QUEUE_average_waiting_time as avg_waiting_time , QUEUE_clients_currently_queueing as total_queue , " + 
                + req.body.different + " + QUEUE_average_waiting_time*QUEUE_clients_currently_queueing as waiting_time, " +  //(DATEPART(HOUR, ) * 60 +  DATEPART(MINUTE, QUEUE_average_waiting_time))
                "LOWER(CONVERT(VARCHAR, QUEUE_date_start, 100)) as start_time , QUEUE_date_end as end_time ,  " + 
                "LOWER(RIGHT(CONVERT(VARCHAR, DATEADD(minute,  case when QUEUE_clients_currently_queueing = 0 then " + req.body.different +" +  QUEUE_average_waiting_time * 0.5  else " + req.body.different +" + QUEUE_average_waiting_time * QUEUE_clients_currently_queueing end  , '" + current_date_time +"')),7)) as expected_time " + 
                "FROM [CQ_QUEUE] " + 
                "LEFT Join [CQ_BUSINESS_DEPT_SETTINGS] on [CQ_BUSINESS_DEPT_SETTINGS].DEPT_ID = [CQ_QUEUE].DEPT_ID " + 
                "where cast(QUEUE_date_start as DATE) = '"+ current_date +"'  and [CQ_QUEUE].DEPT_ID = '" + req.body.department_id + "' and QUEUE_is_active = 1";
                    
                console.log("waiting time");

                request.query(query)
                .then(function (results) {  
                    if(results.recordset.length > 0){
                        var responseOb={                        
                            "info": results.recordset[0], 
                            "status": 200}; 
                        return res.send(responseOb);           
                    }else{
                        var responseOb={                        
                            "msg": "no info", 
                            "status": 400}; 
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
                "msg": "department_id missing", 
                "status": 400}; 
            return res.send(responseOb);   
        }                
    });

                                               
    // save check in , it is used in check page.
    app.post('/addcheckin', function (req, res) {  

        //var id = req.query.id;
        if(req.body.queue_id != null && req.body.cprofile_id != null && req.body.peep != null && req.body.department_id != null){
            conn.connect()    
            .then(async function () {
                                
                var request = new sql.Request(conn);                

                var check = await checkValidation(request, req.body.cprofile_id, req.body.department_id);
                if(check == 0){
                    var datetime = new Date();
                    request.input('queue_id', sql.Int, req.body.queue_id);
                    request.input('cprofile_id', sql.Int, req.body.cprofile_id);
                    request.input('peep', sql.Int, req.body.peep);
                    request.input('current_time', sql.DateTime,  datetime);                    

                    request.input('qbased_date', sql.DateTime,  common.getCurrentDate());  
                    request.input('order_number', sql.Int, 0);
                    request.input('checked_out', sql.Int, 0);
                    request.input('checkin_time', sql.DateTime,  datetime);

                                        
                    request.input('estimated_waiting_time', sql.Int, 0 ); //("0" + hours).slice(-2) + ":" + ("0" + minutes).slice(-2) + ":00" 
                    request.input('initial_position', sql.Int, 0);
                    request.input('current_position', sql.Int, 0);
                    request.input('current_estimated_waiting_time', sql.Int, 0);                                
                    var ticket_number = await updateLastTicketNumber(request, req.body.queue_id);
                    request.input('ticket_number', sql.Int, ticket_number);


                    var query = "insert into [CQ_QUEUE_BASED] (QUEUE_ID,CPROFILE_ID,QBASED_peep,QBASED_created_on,QBASED_updated_on" + 
                                ",QBASED_date,QBASED_ticket_number,QBASED_order_number,QBASED_checked_out,QBASED_checkin_time,QBASED_initial_estimated_waiting_time,QBASED_initial_position" + 
                                ",QBASED_current_position,QBASED_current_estimated_waiting_time" + 
                                ")"  + 
                                " values (@queue_id,@cprofile_id,@peep,@current_time,@current_time,@qbased_date,@ticket_number,@order_number"+
                                ",@checked_out,@checkin_time,@estimated_waiting_time,@initial_position,@current_position,@current_estimated_waiting_time" + 
                                "); "+ 
                                "SELECT SCOPE_IDENTITY() AS id ";

                    request.query(query)
                    .then(function (results) {  
                        if(results.recordset.length > 0){
                            var responseOb={   
                                "slot_id":results.recordset[0].id,      
                                "ticket_number": ticket_number,          
                                "status": 200}; 
                            return res.send(responseOb);           
                        }else{
                            var responseOb={                        
                                "msg": "failed", 
                                "status": 300}; 
                            return res.send(responseOb);                                    
                        }                         
                    })
                    // Handle sql statement execution errors
                    .catch(function (err) {            
                        conn.close();
                        res.send(err);
                    }) 
                    

                }else{
                    var responseOb={                        
                        "msg": "Can not check in ,Already Assigned", 
                        "status": 300}; 
                    return res.send(responseOb);                      
                }
                
                
            })    
            .catch(function (err) {
                console.log(err);
                conn.close();
                res.send(err);
            });   
        }else{
            var responseOb={                        
                "msg": " Parameter Missing, Please wait a sec and try again.", 
                "status": 400}; 
            return res.send(responseOb);
        }
    });
    
    // close current open check in, it is used in checkin ticket page.
    app.post('/closecheckin', function (req, res) {                      
        //var id = req.query.id;
        if(req.body.slot_id != null ){
            conn.connect()
            .then(async function () {                                    

                var request = new sql.Request(conn);
                //var bUserId  = await  getBusinessUserId(request, req.body.bprofile_id);                
                request.input('checked_out', sql.Int, 1);
                request.input('self_checkout', sql.Int, 1);

                var query = "UPDATE [CQ_QUEUE_BASED] SET QBASED_checked_out=@checked_out,QBASED_self_checkout=@self_checkout WHERE QBASED_ID = '" + req.body.slot_id +  "'";                
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
                console.log(err);
                conn.close();
                res.send(err);
            });

        }else{
            var responseOb={                        
                "msg": "invalid parameter", 
                "status": 400}; 
            return res.send(responseOb); 
        }               
    });

    
    // inner function
    async function checkValidation(request, cprofile_id, department_id){        
        return new Promise((resolve, reject)=>{
            var query = "select * from [CQ_QUEUE_BASED] " + 
            "LEFT Join [CQ_QUEUE] on [CQ_QUEUE].QUEUE_ID = [CQ_QUEUE_BASED].QUEUE_ID " + 
            "LEFT Join [CQ_BUSINESS_DEPARTMENTS] on [CQ_BUSINESS_DEPARTMENTS].DEPT_ID = [CQ_QUEUE].DEPT_ID " + 
            "LEFT Join [CQ_BUSINESS_DEPT_SETTINGS] on [CQ_BUSINESS_DEPT_SETTINGS].DEPT_ID = [CQ_BUSINESS_DEPARTMENTS].DEPT_ID " +             
            "where CPROFILE_ID='" + cprofile_id + 
            "' and QBASED_checked_out = 0 and ( [CQ_BUSINESS_DEPT_SETTINGS].QTYPE_ID = 1  or [CQ_BUSINESS_DEPT_SETTINGS].QTYPE_ID = 2 ) and [CQ_BUSINESS_DEPARTMENTS].DEPT_ID ='" +department_id +  "'" ; 
        
            request.query(query)
            .then(function (results) {
                if(results.recordset.length >  0){
                    resolve(1);        
                }else{
                    resolve(0);                
                }                
            })
            // Handle sql statement execution errors
            .catch(function (err) {            
                //conn.close();
                console.log(err);
                resolve(0);                
            })  
        });
    }

    // inner function
    async function updateLastTicketNumber(request, queue_id){
        return new Promise((resolve, reject)=>{
            var query = "UPDATE [CQ_QUEUE] SET QUEUE_last_ticket_number = QUEUE_last_ticket_number + 1  WHERE QUEUE_ID ='" + queue_id + 
            "'; select QUEUE_last_ticket_number from [CQ_QUEUE] where QUEUE_ID='" + queue_id + "'";            
            request.query(query)
            .then(function (results) {
                if(results.recordset.length >  0){
                    resolve(results.recordset[0].QUEUE_last_ticket_number);        
                }else{
                    resolve(0);                
                }                
            })
            // Handle sql statement execution errors
            .catch(function (err) {            
                //conn.close();
                console.log(err);
                resolve(0);                
            })  
        });
    }




};
module.exports = appRouter;

