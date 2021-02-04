const cons = require('consolidate');
const common = require('./common');

const appRouter = (app, fs) => {

    const sql = require('mssql')     
    var conn = new sql.ConnectionPool(global.config);    

    // get all available slots, it is used in booking page.
    app.post('/availableslots', function (req, res) {  
                      
        //var id = req.query.id;        
        if( req.body.department_id != null && req.body.slot_id != null ){
            conn.connect()  
            .then(async function () {                                    
                var request = new sql.Request(conn);
                var slots ;
               
                var peep = 0;
                var pageNumber = req.body.page;
                if(req.body.slot_id == -1 || req.body.slot_id == null){
                    if(req.body.dt != null && req.body.dt != ""){ // search by date
                        pageNumber = await getPageNumberFromDate(request, req.body.department_id, req.body.dt);                        
                        slots = await getAvailableSlots(request, pageNumber , req.body.department_id);
                    }else { // by pagination
                        slots = await getAvailableSlots(request, pageNumber , req.body.department_id);
                    }

                }else{ // for change book

                    var slotInfo = await getSlotDate(request, req.body.slot_id);
                    if(slotInfo != null){       

                        if(req.body.dt != null && req.body.dt != ""){ // search by date
                            pageNumber = await getPageNumberFromDate(request, req.body.department_id, req.body.dt);
                            slots = await getAvailableSlots(request, pageNumber , req.body.department_id);
                        }else{
                            slots = await getAvailableSlotsBySlotDate(request, pageNumber, req.body.department_id, req.body.slot_id);
                        }                        
                        peep = slotInfo.peep;
                    }else{
                        conn.close();
                        var responseOb={                        
                            "msg": "no slot date", 
                            "status": 300}; 
                        return res.send(responseOb);     
                    }
                }                                               

                var responseOb={     
                    "current_page":pageNumber,
                    "slots": slots, 
                    "peep":peep,
                    "status": 200}; 
                return res.send(responseOb);                
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


    // get all available date , it is used  in booking page.
    app.post('/availabledates', function (req, res) {
                      
        //var id = req.query.id;        
        if(req.body.department_id != null){
            conn.connect()    
            .then(function () {                                    
                var request = new sql.Request(conn); 

                var dt = common.getCurrentDate(); 

                var query = "SELECT LEFT(CONVERT(date, ABASED_date), 10) as dt  FROM [CQ_QUEUE_APPT_BASED]  where QUEUE_ID in " + 
                            "(SELECT QUEUE_ID  FROM [CQ_QUEUE] where DEPT_ID = '" + req.body.department_id+ "')  and ABASED_date >= '"+dt+"' group by ABASED_date order by ABASED_date";
                
                request.query(query)
                .then(async function (results) {  
                    
                    var slots = [];               
                    var peep = 0;
                    var totalPageNumber = await getTotalPageNumber(request, req.body.department_id);
                    var pageNumber = 1;
                    var slots;
                    if(results.recordset.length > 0){

                        if(req.body.slot_id == -1 || req.body.slot_id == null){ // show today's slots if slot_id == null
                            slots = await getAvailableSlots(request, pageNumber, req.body.department_id);
                        }else{ // show slots belong to the slot_id' date.
                            var slotInfo = await getSlotDate(request, req.body.slot_id);                            
                            if(slotInfo != null){
                                pageNumber = await getPageNumberFromSlotId(request, req.body.department_id, req.body.slot_id);                                
                                slots = await getAvailableSlotsBySlotDate(request, pageNumber, req.body.department_id, req.body.slot_id);                                                               
                                peep = slotInfo.peep;  
                            }else{
                                conn.close();
                                var responseOb={                        
                                    "msg": "no slot date", 
                                    "status": 300}; 
                                return res.send(responseOb);     
                            }
                        }                                                 
                    }
                    
                                                            
                    var responseOb={     
                        "totalPageNumber":totalPageNumber,
                        "current_page":pageNumber,
                        "peep":peep,
                        "slots": slots, 
                        "dates": results.recordset, 
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
        }else{
            var responseOb={                        
                "msg": "invalid parameter", 
                "status": 400}; 
            return res.send(responseOb);   
        }
    });

    // get current book by slot id and cprofie id, it is used in booking page.
    app.post('/book', function (req, res) {                      
        //var id = req.query.id;
        if(req.body.slot_id != null && req.body.cprofile_id != null && req.body.peep != null){
            conn.connect()    
            .then(async function () {                                    

                var request = new sql.Request(conn);
                request.input('cprofile_id', sql.Int, req.body.cprofile_id == 0 ? NULL : req.body.cprofile_id);
                request.input('status_id', sql.Int, req.body.cprofile_id == 0 ? 1:3);
                request.input('peep', sql.Int, req.body.peep);
                                
                var flag = await checkSlot(request, req.body.slot_id);
                if(req.body.cprofile_id != 0 && flag == 0){
                    conn.close();
                    var responseOb={                        
                        "msg": "assigned already",                        
                        "status": 300};
                    return res.send(responseOb);
                }

                var success = true;
                if(req.body.type == "cancel"){
                    success = await updateSlotByCancel(request, req.body.old_slot_id);
                }                
                var queue_id = await getQueueId(request, req.body.slot_id);

                if( success && queue_id != 0){
                    var ticket_number = await updateLastTicketNumber(request, queue_id);
                    if(ticket_number  != 0){
                        request.input('ticket_number', sql.Int, ticket_number);

                        var query = "UPDATE [CQ_QUEUE_APPT_BASED] SET CPROFILE_ID =@cprofile_id,ASTATUS_ID=@status_id,ABASED_peep=@peep,ABASED_ticket_number=@ticket_number  WHERE ABASED_ID = '" + req.body.slot_id +  "'";
                        request.query(query)
                        .then(function (results) {
    
                            var responseOb={                        
                                "msg": "success",
                                "ticket_number": ticket_number,                            
                                "status": 200};  
                            return res.send(responseOb);                 
                        })
                        // Handle sql statement execution errors
                        .catch(function (err) {            
                            conn.close();
                            res.send(err);
                        })   
                    }                                           
                }else{
                    var responseOb={                        
                        "msg": "no queue", 
                        "status": 400}; 
                    return res.send(responseOb); 
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


    
    // cancel current book api, it is used in booking ticket page.
    app.post('/cancelbook', function (req, res) {                      
        //var id = req.query.id;
        if(req.body.slot_id != null ){
            conn.connect()
            .then(async function () {                                    

                var request = new sql.Request(conn);
                //var bUserId  = await  getBusinessUserId(request, req.body.bprofile_id);                
                request.input('status_id', sql.Int, 1);
                request.input('peep', sql.Int, 0);
                request.input('checked_out', sql.Int, 0);

                var query = "UPDATE [CQ_QUEUE_APPT_BASED] SET ASTATUS_ID=@status_id,CPROFILE_ID=NULL,ABASED_peep=@peep,ABASED_checked_out=@checked_out  WHERE ABASED_ID = '" + req.body.slot_id +  "'";                
                request.query(query)
                .then(function (results) {    
                    conn.close();
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
        }else{
            var responseOb={                        
                "msg": "invalid parameter", 
                "status": 400}; 
            return res.send(responseOb); 
        }               
    });

    // close book api , it is used in booking ticket page.
    app.post('/closebook', function (req, res) {                      
        //var id = req.query.id;
        if(req.body.slot_id != null ){
            conn.connect()
            .then(async function () {                                    

                var request = new sql.Request(conn);
                //var bUserId  = await  getBusinessUserId(request, req.body.bprofile_id);                
                request.input('checked_out', sql.Int, 1);

                var query = "UPDATE [CQ_QUEUE_APPT_BASED] SET ABASED_checked_out=@checked_out  WHERE ABASED_ID = '" + req.body.slot_id +  "'";                
                request.query(query)
                .then(function (results) {    
                    conn.close();
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
        }else{
            var responseOb={                        
                "msg": "invalid parameter", 
                "status": 400}; 
            return res.send(responseOb); 
        }               
    });


    // get all availabel slots. it is used in booking page.
    app.post('/getbookslot', function (req, res) {                      
        //var id = req.query.id;
        if(req.body.slot_id != null && req.body.slot_id != "" ){
            conn.connect()
            .then(async function () {                                    

                var request = new sql.Request(conn);

                var query = "select LEFT(CONVERT(VARCHAR, ABASED_date, 100), 6) as slot_date, RIGHT(LEFT(CONVERT(VARCHAR, ABASED_date, 100), 11), 2) as slot_year " +
                 ",ABASED_peep as peep , ABASED_ticket_number as ticket_number ,QUEUE_ID as queue_id , LOWER(CONVERT(VARCHAR, ABASED_start_time, 100)) as open_time  " + 
                 ",DATENAME(dw,ABASED_Date) as weekofday, DATEPART (day,ABASED_Date) as day , DATENAME(month,ABASED_Date) as month " + 
                "from [CQ_QUEUE_APPT_BASED]  where ABASED_ID = '" + req.body.slot_id  + "'";                
                request.query(query)
                .then(function (results) {    
                    if(results.recordset.length > 0){
                        var responseOb={                        
                            "slot": results.recordset[0], 
                            "status": 200};  
                        return res.send(responseOb);            
                    }else{
                        var responseOb={                        
                            "msg": "no results", 
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



    // inner function    
    async function getQueueId(request, slot_id){
        return new Promise((resolve, reject)=>{
            var query = "select QUEUE_ID from [CQ_QUEUE_APPT_BASED] where ABASED_ID='" + slot_id + "'";            
            request.query(query)
            .then(function (results) {
                if(results.recordset.length >  0){
                    resolve(results.recordset[0].QUEUE_ID);        
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
    async function checkSlot(request, slot_id){
        return new Promise((resolve, reject)=>{
            var query = "select QUEUE_ID from [CQ_QUEUE_APPT_BASED] where ABASED_ID='" + slot_id + "' and ASTATUS_ID = 1";            
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
                resolve(0);                
            })  
        });
    }

    // inner function
    async function updateSlotByCancel(request, slot_id){

        return new Promise((resolve, reject)=>{

            
            var query = "UPDATE [CQ_QUEUE_APPT_BASED] SET ASTATUS_ID=1,CPROFILE_ID=NULL,ABASED_peep=0,ABASED_checked_out=0  WHERE ABASED_ID = '" + slot_id +  "'";

            request.query(query)
            .then(function (results) {
                resolve(true);             
            })
            // Handle sql statement execution errors
            .catch(function (err) {            
                
                resolve(false);
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
                resolve(0);                
            })  
        });
    }

    // inner function ( will be used in next time)
    async function getBusinessUserId(request, bprofile_id){
        return new Promise((resolve, reject)=>{
            var query = "SELECT BUSER_ID FROM [CQ_BUSINESS_USERS] WHERE BPROFILE_ID='" + bprofile_id + "'";
            request.query(query)
            .then(function (results) {
                if(results.recordset.length >  0){
                    resolve(results.recordset[0].BUSER_ID);        
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
    async function getSlotDate(request, slot_id){
        return new Promise((resolve, reject)=>{
            var query = "SELECT  LEFT(CONVERT(date, ABASED_date), 10) as dt, ABASED_peep as peep  FROM [CQ_QUEUE_APPT_BASED] WHERE ABASED_ID ='" + slot_id + "'";
            request.query(query)
            .then(function (results) {
                if(results.recordset.length >  0){
                    resolve(results.recordset[0]);        
                }else{
                    resolve(null);                
                }                
            })
            // Handle sql statement execution errors
            .catch(function (err) {            
                //conn.close();                
                resolve(null);                
            })  
        });
    }

    // inner function
    async function getAvailableSlots(request , page, department_id){
        return new Promise((resolve, reject)=>{
    
            var currentDate = common.getCurrentDate();
            var currentTime = common.getCurrentTime();                    
            var query = '';            
            // query = "select ABASED_ID as slot_id,  LOWER(RIGHT(CONVERT(VARCHAR, ABASED_start_time, 100),7)) as start_time , LOWER(RIGHT(CONVERT(VARCHAR, ABASED_finish_time, 100),7)) as finish_time " +
            // ", (case when DATEPART(HOUR, ABASED_start_time) <= 5 then 'night' when DATEPART(HOUR, ABASED_start_time) <= 18 then 'day' else 'night' end) as isIn  " +
            // "from  [CQ_QUEUE_APPT_BASED]  " +
            // "LEFT Join [CQ_QUEUE] on [CQ_QUEUE].QUEUE_ID= [CQ_QUEUE_APPT_BASED].QUEUE_ID  " + 
            // "where ASTATUS_ID = 1 and ABASED_is_active = 1 and DEPT_ID = '" +  department_id + "' and ABASED_date ='" + currentDate + "' and ABASED_start_time > '" + currentTime + "' order by ABASED_start_time";        
            query = "select ABASED_ID as slot_id, LOWER(RIGHT(CONVERT(VARCHAR, ABASED_start_time, 100),7)) as start_time , LOWER(RIGHT(CONVERT(VARCHAR, ABASED_finish_time, 100),7)) as finish_time " +
            ", (case when DATEPART(HOUR, ABASED_start_time) <=5 then 'night' when DATEPART(HOUR, ABASED_start_time) <= 18 then 'day' else 'night' end) as isIn  " +
            "from  [CQ_QUEUE_APPT_BASED]  " +
            "LEFT Join [CQ_QUEUE] on [CQ_QUEUE].QUEUE_ID= [CQ_QUEUE_APPT_BASED].QUEUE_ID  " + 
            "where ASTATUS_ID = 1 and ABASED_is_active = 1 and ABASED_date ='" + currentDate + "' and DEPT_ID = '" +  department_id + "' order by ABASED_start_time";                           

            request.input('PageNumber', sql.Int, page);
            request.input('RowsOfPage', sql.Int, 20);

            query = "select ABASED_ID as slot_id, LEFT(ABASED_date ,10) as defaultSlotDate,  FORMAT(ABASED_date, 'ddd dd MMM', 'en-US') as slotDate , LOWER(RIGHT(CONVERT(VARCHAR, ABASED_start_time, 100),7)) as start_time , LOWER(RIGHT(CONVERT(VARCHAR, ABASED_finish_time, 100),7)) as finish_time " +
                ", (case when DATEPART(HOUR, ABASED_start_time) <= 5 then 'night' when DATEPART(HOUR, ABASED_start_time) <= 18 then 'day' else 'night' end) as isIn  " +
                "from  [CQ_QUEUE_APPT_BASED]  " +
                "LEFT Join [CQ_QUEUE] on [CQ_QUEUE].QUEUE_ID= [CQ_QUEUE_APPT_BASED].QUEUE_ID  " + 
                "where ASTATUS_ID = 1 and ABASED_is_active = 1 and DEPT_ID = '" +  department_id + "' and  ( ( ABASED_date ='" + currentDate + "' and ABASED_start_time > '" + currentTime + "' ) or  ABASED_date > '" + currentDate + "')  order by ABASED_date, ABASED_start_time "+ 
                " OFFSET (@PageNumber-1)*@RowsOfPage ROWS  " +
                    "FETCH NEXT @RowsOfPage ROWS ONLY";  

           
            request.query(query)
            .then(function (results) {                  
                resolve(results.recordset);
            })
            // Handle sql statement execution errors
            .catch(function (err) {            
                conn.close();
                resolve([]);   
            })             
        });                
    }

    // inner function
    async function getTotalPageNumber(request , department_id){
        return new Promise((resolve, reject)=>{    
            var currentDate = common.getCurrentDate();
            var currentTime = common.getCurrentTime();                    
            var query = '';                        
            query = "select case when count(*) - count(*)/10 > 0 then count(*) / 20 + 1 else count(*) end as n " +
                "from  [CQ_QUEUE_APPT_BASED]  " +
                "LEFT Join [CQ_QUEUE] on [CQ_QUEUE].QUEUE_ID= [CQ_QUEUE_APPT_BASED].QUEUE_ID  " + 
                "where ASTATUS_ID = 1 and ABASED_is_active = 1 and DEPT_ID = '" +  department_id + "' and  ( ( ABASED_date ='" + currentDate + "' and ABASED_start_time > '" + currentTime + "' ) or  ABASED_date > '" + currentDate + "')";            
            
            request.query(query)
            .then(function (results) {                  
                if(results.recordset.length > 0){
                    resolve(results.recordset[0].n);
                }else{
                    resolve(0);
                }          
            })
            // Handle sql statement execution errors
            .catch(function (err) {                
                resolve(0);
            })             
        });                
    }

    // inner function
    async function getPageNumberFromDate(request , department_id, choosen_date){
        return new Promise((resolve, reject)=>{    
            var currentDate = common.getCurrentDate();
            var currentTime = common.getCurrentTime();                    
                                    
            var query = "With mytable as ( select  (ROW_NUMBER() OVER( ORDER BY ABASED_date ) / 20) + 1 AS 'rownumber', ABASED_date " +
            "from  [CQ_QUEUE_APPT_BASED]  LEFT Join [CQ_QUEUE] " +
            "on [CQ_QUEUE].QUEUE_ID= [CQ_QUEUE_APPT_BASED].QUEUE_ID  where ASTATUS_ID = 1 and ABASED_is_active = 1 and DEPT_ID = '" + department_id + "'  " +
            "and  ( ( ABASED_date ='" + currentDate + "' and ABASED_start_time > '" + currentTime + "' ) or  " +
            "ABASED_date > '" + currentDate + "')  ) " +
            "select top 1 * from mytable where ABASED_date = '" + choosen_date + "';";               
                        

            request.query(query)
            .then(function (results) {                  
                if(results.recordset.length > 0){
                    resolve(results.recordset[0].rownumber);
                }else{
                    resolve(0);
                }                
            })
            // Handle sql statement execution errors
            .catch(function (err) {                
                resolve(0);
            })             
        });                
    }

    // inner function
    async function getPageNumberFromSlotId(request , department_id, slot_id){
        return new Promise((resolve, reject)=>{    
            var currentDate = common.getCurrentDate();
            var currentTime = common.getCurrentTime();                    
                                    
            var query = "With mytable as ( select  (ROW_NUMBER() OVER( ORDER BY ABASED_date , ABASED_start_time) / 20) + 1 AS 'rownumber', ABASED_date, ABASED_ID " +
            "from  [CQ_QUEUE_APPT_BASED]  LEFT Join [CQ_QUEUE] " +
            "on [CQ_QUEUE].QUEUE_ID= [CQ_QUEUE_APPT_BASED].QUEUE_ID  where (ASTATUS_ID = 1 or ABASED_ID = '" + slot_id + "' ) and ABASED_is_active = 1 and DEPT_ID = '" + department_id + "'  " +
            "and  ( ( ABASED_date ='" + currentDate + "' and ABASED_start_time > '" + currentTime + "' ) or  " +
            "ABASED_date > '" + currentDate + "')  ) " +
            "select top 1 * from mytable where ABASED_ID = '" + slot_id + "';";                        

            request.query(query)
            .then(function (results) {                  
                if(results.recordset.length > 0){
                    resolve(results.recordset[0].rownumber);
                }else{
                    resolve(0);
                }                
            })
            // Handle sql statement execution errors
            .catch(function (err) {                
                resolve(0);
            })             
        });                
    }

    // inner function
    async function getAvailableSlotsBySlotDate(request , page, department_id, slot_id){

        return new Promise((resolve, reject)=>{
    
            var currentDate = common.getCurrentDate();
            var currentTime = common.getCurrentTime();
                    
            var query = '';                                               
            request.input('PageNumber', sql.Int, page);
            request.input('RowsOfPage', sql.Int, 20);

            query = "select ABASED_ID as slot_id, LEFT(ABASED_date ,10) as defaultSlotDate,  FORMAT(ABASED_date, 'ddd dd MMM', 'en-US') as slotDate , LOWER(RIGHT(CONVERT(VARCHAR, ABASED_start_time, 100),7)) as start_time , LOWER(RIGHT(CONVERT(VARCHAR, ABASED_finish_time, 100),7)) as finish_time " +
                ", (case when DATEPART(HOUR, ABASED_start_time) <= 5 then 'night' when DATEPART(HOUR, ABASED_start_time) <= 18 then 'day' else 'night' end) as isIn  " +
                "from  [CQ_QUEUE_APPT_BASED]  " +
                "LEFT Join [CQ_QUEUE] on [CQ_QUEUE].QUEUE_ID= [CQ_QUEUE_APPT_BASED].QUEUE_ID  " + 
                "where (ASTATUS_ID = 1 or ABASED_ID  = '" + slot_id + "') and ABASED_is_active = 1 and DEPT_ID = '" +  department_id + "' and  ( ( ABASED_date ='" + currentDate + "' and ABASED_start_time > '" + currentTime + "' ) or  ABASED_date > '" + currentDate + "')  order by ABASED_date, ABASED_start_time "+ 
                " OFFSET (@PageNumber-1)*@RowsOfPage ROWS  " +
                    "FETCH NEXT @RowsOfPage ROWS ONLY";  
           
            console.log(query);

            request.query(query)
            .then(function (results) {                  
                resolve(results.recordset);
            })
            // Handle sql statement execution errors
            .catch(function (err) {            
                conn.close();
                resolve([]);   
            })             
        });   

                     
    }


    

};
module.exports = appRouter;

