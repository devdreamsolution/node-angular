const cons = require('consolidate');
const common = require("./common");

const appRouter = (app, fs) => {

    const sql = require('mssql')     
    var conn = new sql.ConnectionPool(global.config);    

    // get queue status, it is used in queue page.
    app.post('/getqueue', function (req, res) {
        //var id = req.query.id;        
        if(req.body.department_id != null && req.body.different != null && req.body.cprofile_id){
            conn.connect()    
            .then(async function () {

                var request = new sql.Request(conn);                                               
                var current_date_time = common.getCurrentDateTime();
                var current_date = common.getCurrentDate();
                
                var check = await checkValidation(request, req.body.cprofile_id, req.body.department_id);
                if( check == 0){
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
                    
                }else{
                    var responseOb={                        
                        "msg": "You are already in the queue",
                        "queue_slot_id":check, 
                        "status": 300}; 
                    return res.send(responseOb); 
                }
                
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

    // get queue status by slot id. it is used in queue page.
    app.post('/getcheckinslot', function (req, res) {                      
        //var id = req.query.id;
        if(req.body.slot_id != null  && req.body.different != null ){
            conn.connect()
            .then(async function () {                                    

                var request = new sql.Request(conn);
                //var bUserId  = await  getBusinessUserId(request, req.body.bprofile_id);                                
                var slotInfo = await getSlotInfo(request, req.body.slot_id);
                var avg_waiting_time = await getWaitingTime(request, slotInfo.queue_id);
                

                var currentDT = common.getCurrentDateTime();

                request.input('avg_waiting_time', sql.Int,  avg_waiting_time);

                var query = "select LEFT(CONVERT(VARCHAR, QBASED_date, 100),6)  as slot_date, RIGHT(LEFT(CONVERT(VARCHAR, QBASED_date, 100),11),2)  as slot_year , QBASED_peep as peep , " + 
                "QBASED_current_position as current_position,  " + 
                 + req.body.different +" + QBASED_current_estimated_waiting_time as waiting_time, " + 
                "LOWER(RIGHT(CONVERT(VARCHAR, DATEADD(minute,  CASE WHEN QBASED_current_estimated_waiting_time = 0 THEN " + req.body.different +" + QBASED_current_estimated_waiting_time + @avg_waiting_time * 0.5 ELSE " + req.body.different + 
                " +  QBASED_current_estimated_waiting_time END   , '" + currentDT + "')),7)) as expected_time  ,  DATEDIFF(MINUTE, QUEUE_moved_on,  '" + currentDT + "' ) as downcount, " + 
                "QBASED_ticket_number as ticket_number , [CQ_QUEUE_BASED].QUEUE_ID as queue_id from [CQ_QUEUE_BASED] " + 
                "LEFT Join [CQ_QUEUE] on [CQ_QUEUE].QUEUE_ID = [CQ_QUEUE_BASED].QUEUE_ID " +             
                    "where QBASED_ID = '" + req.body.slot_id +  "'";
                                    
            
                

                request.query(query)
                .then(function (results) {    
                    if(results.recordset.length > 0){
                        var responseOb={                        
                            "slot": results.recordset[0],     
                            "avg_waiting_time":avg_waiting_time,                       
                            "status": 200};  
                        return res.send(responseOb);            
                    }else{
                        var responseOb={                        
                            "msg": "no resultsss", 
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
                "msg": "invalid parameter", 
                "status": 400}; 
            return res.send(responseOb); 
        }               
    });

                                 
    // enter to the queue, it is used for entering to the queue.
    app.post('/addqueue', function (req, res) {  

        //var id = req.query.id;        

        if(req.body.queue_id != null && req.body.cprofile_id != null && req.body.peep != null && req.body.department_id != null){
            conn.connect()    
            .then(async function () {
                                
                var request = new sql.Request(conn);       
                
                var check = await checkValidation(request, req.body.cprofile_id, req.body.department_id);
                if( check == 0){

                    // get waiting time from dept_setting table
                    var waiting_time = await getWaitingTime(request, req.body.queue_id);
                    // increase current people count in the queue and update waiting time of queue.
                    var current_position = await addClientTotalQueue(request, req.body.queue_id, waiting_time);

                    if(current_position != 0){

                        var datetime = new Date();
                        request.input('queue_id', sql.Int, req.body.queue_id);
                        request.input('cprofile_id', sql.Int, req.body.cprofile_id);
                        request.input('peep', sql.Int, req.body.peep);
                        request.input('current_time', sql.DateTime,  datetime);
                        var dt = common.getCurrentDate();       
                        request.input('qbased_date', sql.DateTime,  dt);
                        request.input('order_number', sql.Int, 0);
                        request.input('checked_out', sql.Int,  0);
                        request.input('checkin_time', sql.DateTime,  datetime);

                        var sec_num = ( current_position - 1 ) * waiting_time ;// * 60 * 1000;                                    
                        
                        request.input('estimated_waiting_time', sql.Int, sec_num ); //("0" + hours).slice(-2) + ":" + ("0" + minutes).slice(-2) + ":00" 
                        request.input('initial_position', sql.Int, current_position);
                        request.input('current_position', sql.Int, current_position);
                        request.input('current_estimated_waiting_time', sql.Int, sec_num);                     

                        var ticket_number = await updateLastTicketNumber(request, req.body.queue_id, current_position);        

                        request.input('ticket_number', sql.Int, ticket_number);

                        var query = "insert into [CQ_QUEUE_BASED] (QUEUE_ID,CPROFILE_ID,QBASED_peep,QBASED_created_on,QBASED_updated_on" + 
                                    ",QBASED_date,QBASED_ticket_number,QBASED_order_number,QBASED_checked_out,QBASED_checkin_time,QBASED_initial_estimated_waiting_time,QBASED_initial_position" + 
                                    ",QBASED_current_position,QBASED_current_estimated_waiting_time" + 
                                    ")"  + 
                                    " values (@queue_id,@cprofile_id,@peep,@current_time,@current_time,@qbased_date,@ticket_number,@order_number"+
                                    ",@checked_out,NULL,@estimated_waiting_time,@initial_position,@current_position,@current_estimated_waiting_time" + 
                                    "); "+ 
                                    "SELECT SCOPE_IDENTITY() AS id ";

                        request.query(query)
                        .then(function (results) {  
                            if(results.recordset.length > 0){
                                var dt = new Date();
                                var expected = new Date(dt.getTime() + sec_num * 60000)
                                var responseOb={
                                    "slot_id":results.recordset[0].id,      
                                    "ticket_number": ticket_number,    
                                    "waiting_info":{queue:current_position, waiting_time:sec_num, expected_time:expected}, 
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
                        
                    }
                    
                }else{
                    var responseOb={                        
                        "msg": "You are already in the queue", 
                        "status": 300}; 
                    return res.send(responseOb);   
                }
                
                
                
            })    
            .catch(function (err) {
                 
                conn.close();
                res.send(err);
            });   
        }else{
            var responseOb={                        
                "msg": " missing", 
                "status": 400}; 
            return res.send(responseOb);   
        }                
    });


    // this is checkin api, it is used for checkin. it will be used for web business.
    app.post('/checkin', function (req, res) {                      
        //var id = req.query.id;
        if(req.body.slot_id != null ){
            conn.connect()
            .then(async function () {                                    
                var request = new sql.Request(conn);
                var datetime = new Date();
                request.input('checkin_time', sql.DateTime,  datetime);
                var query = "UPDATE [CQ_QUEUE_BASED] SET QBASED_checkin_time=@checkin_time WHERE QBASED_checked_out = 0 and QBASED_ID = '" + req.body.slot_id +  "'";                
                request.query(query)
                .then(function (results) {
                    console.log(results.rowsAffected[0]);
                    if(results.rowsAffected[0] > 0 ) {
                        var responseOb={
                            "msg": "success",                       
                            "status": 200};
                        return res.send(responseOb);
                    }else{
                        var responseOb={
                            "msg": "no possible",                       
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
                "msg": "invalid parameter", 
                "status": 400}; 
            return res.send(responseOb); 
        }               
    });


    // close queue api, it is used close current queue in queue ticket page.
    app.post('/closequeue', function (req, res) {                      
        //var id = req.query.id;
        if(req.body.slot_id != null ){
            conn.connect()
            .then(async function () {                                    

                var request = new sql.Request(conn);
                
                var slotInfo = await getSlotInfo(request, req.body.slot_id);
                var avg_waiting_time = await getWaitingTime(request, slotInfo.queue_id);
                                
                var totalQueueRes =  await reduceClientTotalQueue(request, slotInfo.queue_id);                
                if(totalQueueRes == 1){
                   
                    await reduceCurrentQueue(request, slotInfo.queue_id,  avg_waiting_time , slotInfo.current_position);

                    var now =  new Date();
                    //await updateCheckInTime(request, slotInfo.queue_id, now);

                    request.input('checked_out', sql.Int, 1);
                    request.input('self_checkout', sql.Int, 1);
                    var datetime = new Date();
                    request.input('checkout_time', sql.DateTime, datetime);
                    
                    var query = "UPDATE [CQ_QUEUE_BASED] SET QBASED_checkout_time=@checkout_time,QBASED_checked_out=@checked_out,QBASED_self_checkout=@self_checkout WHERE QBASED_ID = '" + req.body.slot_id + "'";
                    request.query(query)
                    .then(async function (results) {                        
                        //var difference = await  getDifference(request, req.body.slot_id);
                        //if( difference != 0 && difference != null){
                        //    await makeAverageWaitingTime(request, slotInfo.queue_id, difference);
                        //}                                                                    
                        var responseOb={                        
                            //"difference":difference,
                            "msg": "success",                        
                            "status": 200};  
                        return res.send(responseOb);                 
                    })
                    // Handle sql statement execution errors
                    .catch(function (err) {            
                        conn.close();
                        res.send(err);
                    })    
                    

                }
                                         
            })    
            .catch(function (err) {
                 
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
            "' and QBASED_checked_out = 0 and ( [CQ_BUSINESS_DEPT_SETTINGS].QTYPE_ID = 3 ) and [CQ_BUSINESS_DEPARTMENTS].DEPT_ID ='" +department_id +  "'" ; 
            
            request.query(query)
            .then(function (results) {
                if(results.recordset.length >  0){
                    resolve(results.recordset[0].QBASED_ID);        
                }else{
                    resolve(0);                
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
    async function addClientTotalQueue(request, queue_id, waiting_time){
        return new Promise((resolve, reject)=>{
            var query = "update [CQ_QUEUE] set QUEUE_clients_currently_queueing =  QUEUE_clients_currently_queueing + 1, QUEUE_average_waiting_time = '" + waiting_time + "' where QUEUE_ID='" + queue_id + "'; " + 
            "select  QUEUE_clients_currently_queueing as total_queue from [CQ_QUEUE] where QUEUE_ID='" + queue_id + "'";                 

            request.query(query)
            .then(function (results) {
                if(results.recordset.length >  0){
                    resolve(results.recordset[0].total_queue);        
                }else{
                    resolve(0);                
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
    async function reduceClientTotalQueue(request, queue_id){
        return new Promise((resolve, reject)=>{   
            var currentDT = common.getCurrentDateTime();
            request.input('moved_on', sql.DateTime, currentDT );            
            var query = "update [CQ_QUEUE] set QUEUE_clients_currently_queueing =  QUEUE_clients_currently_queueing - 1, QUEUE_moved_on=@moved_on where QUEUE_ID='" + queue_id + "' and QUEUE_clients_currently_queueing > 0 ";

            console.log(query);
            
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
    async function reduceCurrentQueue(request, queue_id, avg_waiting_time, current_position){
        return new Promise((resolve, reject)=>{
            
            request.input('avg_waiting_time', sql.Int, avg_waiting_time );
            var query = "update [CQ_QUEUE_BASED] set QBASED_current_position =  QBASED_current_position - 1  , QBASED_current_estimated_waiting_time=" +
            "case when @avg_waiting_time*(QBASED_current_position - 2) < 0 then 0 else @avg_waiting_time*(QBASED_current_position - 2) end where QUEUE_ID='" 
                + queue_id + "' and QBASED_current_position != 0 and QBASED_current_position >= '" + current_position + "'";            
            
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
    async function updateCheckInTime(request, queue_id, checkin_time){
        return new Promise((resolve, reject)=>{
            
            request.input('checkin_time', sql.DateTime, checkin_time );            
            var query = "update [CQ_QUEUE_BASED] set QBASED_checkin_time=@checkin_time where QUEUE_ID='" + queue_id + "' and QBASED_current_position = 1";                
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
    async function getDifference(request, slot_id){

        return new Promise((resolve, reject)=>{            
            var query = "select DATEDIFF(minute,  QBASED_checkin_time , QBASED_checkout_time) as different from  [CQ_QUEUE_BASED]  where QBASED_ID='" + slot_id + "'";
       
            request.query(query)
            .then(function (results) {
                if(results.recordset.length > 0){
                    resolve(results.recordset[0].different);
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
    async function makeAverageWaitingTime(request, queue_id, difference){

        return new Promise((resolve, reject)=>{            
            var query = "update  [CQ_QUEUE] set QUEUE_average_waiting_time = (QUEUE_average_waiting_time + "+ difference + ") / 2 where QUEUE_ID='" + queue_id + "'";
 
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
    async function getSlotInfo(request, slot_id){
        return new Promise((resolve, reject)=>{
                        
            var query = "SELECT QUEUE_ID as queue_id , QBASED_current_position as current_position " + 
            "FROM [CQ_QUEUE_BASED] " +            
            "where QBASED_ID = '" + slot_id + "'";
    
                request.query(query)
                .then(function (results) {
                    if(results.recordset.length >  0){
                        resolve(results.recordset[0]);        
                    }else{
                        resolve(0);                
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
    async function getWaitingTime(request, queue_id){
        return new Promise((resolve, reject)=>{                        
        var query = "SELECT QUEUE_average_waiting_time as waiting_time " + 
        "FROM [CQ_QUEUE] " + 
        "LEFT Join [CQ_BUSINESS_DEPT_SETTINGS] on [CQ_BUSINESS_DEPT_SETTINGS].DEPT_ID = [CQ_QUEUE].DEPT_ID " + 
        "where [CQ_QUEUE].QUEUE_ID = '" + queue_id + "'";

            request.query(query)
            .then(function (results) {
                if(results.recordset.length >  0){
                    resolve(results.recordset[0].waiting_time);        
                }else{
                    resolve(0);                
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
    async function updateLastTicketNumber(request, queue_id, current_position){
        return new Promise((resolve, reject)=>{

            var currentDT = common.getCurrentDateTime();                        
            var query = "UPDATE [CQ_QUEUE] SET QUEUE_last_ticket_number = QUEUE_last_ticket_number + 1 + " +  common.enabled()  + ", QUEUE_moved_on = '" + currentDT + "'  WHERE QUEUE_ID ='" + queue_id + 
            "'; select QUEUE_last_ticket_number from [CQ_QUEUE] where QUEUE_ID='" + queue_id + "'";            
            // if(current_position != 1){
            //     query = "UPDATE [CQ_QUEUE] SET QUEUE_last_ticket_number = QUEUE_last_ticket_number + 1 WHERE QUEUE_ID ='" + queue_id + 
            // "'; select QUEUE_last_ticket_number from [CQ_QUEUE] where QUEUE_ID='" + queue_id + "'";   
            // }
            
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
                 
                console.log(' notify it to developer');
                resolve(0);                
            })  
        });
    }

};
module.exports = appRouter;

