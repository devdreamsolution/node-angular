const common = require("./common");

const appRouter = (app, fs) => {

    const sql = require('mssql')     
    var conn = new sql.ConnectionPool(global.config);    

    // get depart ment belong to the business, it is used business details page.
    app.post('/departments', function (req, res) {  
                              
        //var id = req.query.id;     
        if(req.body.bprofile_id != null && req.body.cprofile_id != null){

            conn.connect()    
            .then(function () {                                    
                var request = new sql.Request(conn);
                var bprofile_id = req.body.bprofile_id;       
                var cprofile_id = req.body.cprofile_id;                         
                
                var dd = common.getCurrentDate();
                var dt = common.getCurrentDateTime();                

                var query = "select [CQ_BUSINESS_DEPARTMENTS].DEPT_ID as department_id, DEPT_name as name, DEPT_is_active as active, [CQ_BUSINESS_QUEUE_TYPES].QTYPE_Name as type_name , [CQ_BUSINESS_QUEUE_TYPES].QTYPE_ID as type_id " + 
                ",(select top 1 QUEUE_is_closed from [CQ_QUEUE] where DEPT_ID = [CQ_BUSINESS_DEPARTMENTS].DEPT_ID and  cast(QUEUE_date_start as DATE) = '" + dt + "'  ) as queue_is_closed " + 
                ",(select top 1 LOWER(CONVERT(VARCHAR, SETT_queue_open_from, 100)) as open_time from [CQ_BUSINESS_DEPT_SETTINGS] where DEPT_ID = [CQ_BUSINESS_DEPARTMENTS].DEPT_ID ) as open_time " +

                ",(select  top 1 [CQ_QUEUE_BASED].QBASED_ID  from [CQ_QUEUE_BASED]  " + 
                "LEFT Join [CQ_QUEUE] on [CQ_QUEUE].QUEUE_ID= [CQ_QUEUE_BASED].QUEUE_ID  " + 
                "LEFT Join [CQ_BUSINESS_DEPARTMENTS] on [CQ_BUSINESS_DEPARTMENTS].DEPT_ID= [CQ_QUEUE].DEPT_ID  " + 
                "where CPROFILE_ID='" + cprofile_id + "' and QBASED_checked_out = 0 and [CQ_QUEUE].DEPT_ID = [CQ_BUSINESS_DEPT_SETTINGS].DEPT_ID order by QBASED_ID DESC ) as checkin_slot_id " + 

                ",(select top 1 [CQ_QUEUE_APPT_BASED].ABASED_ID from [CQ_QUEUE_APPT_BASED] " + 
                "LEFT Join [CQ_QUEUE] on [CQ_QUEUE].QUEUE_ID= [CQ_QUEUE_APPT_BASED].QUEUE_ID  " + 
                "LEFT Join [CQ_BUSINESS_DEPARTMENTS] on [CQ_BUSINESS_DEPARTMENTS].DEPT_ID= [CQ_QUEUE].DEPT_ID  " + 
                "where CPROFILE_ID='" + cprofile_id + "' and ABASED_checked_out = 0 and [CQ_QUEUE].DEPT_ID = [CQ_BUSINESS_DEPT_SETTINGS].DEPT_ID order by ABASED_ID DESC) as book_slot_id " + 

                ",(SELECT Count(*) as isMenu FROM [CQ_BUSINESS_MENUS] LEFT Join [CQ_BUSINESS_MENU_ITEMS] on [CQ_BUSINESS_MENU_ITEMS].MENU_ID = [CQ_BUSINESS_MENUS].MENU_ID WHERE DEPT_ID = [CQ_BUSINESS_DEPARTMENTS].DEPT_ID and MITEM_name is not NULL)  as isMenu " + 

                ",(SELECT Count(*) FROM [CQ_QUEUE] where  DEPT_ID = [CQ_BUSINESS_DEPARTMENTS].DEPT_ID and  cast(QUEUE_date_start as DATE) = '" + dd + "' and '"+dt+"' BETWEEN cast(QUEUE_date_start as DATETIME) AND cast(QUEUE_date_end as DATETIME) )  as isIn " + 

                ", SETT_max_peep_allowed as max_peep " + 
                "from [CQ_BUSINESS_DEPARTMENTS] " + 
                "LEFT Join [CQ_BUSINESS_DEPT_SETTINGS] on [CQ_BUSINESS_DEPARTMENTS].DEPT_ID = [CQ_BUSINESS_DEPT_SETTINGS].DEPT_ID " + 
                "LEFT Join [CQ_BUSINESS_QUEUE_TYPES] on [CQ_BUSINESS_DEPT_SETTINGS].QTYPE_ID = [CQ_BUSINESS_QUEUE_TYPES].QTYPE_ID " + 
                "where BPROFILE_ID = '" + bprofile_id + "' and [CQ_BUSINESS_QUEUE_TYPES].QTYPE_Name is not NULL";
                
                
                request.query(query)
                .then(function (results) {
                    conn.close();                                     
                    var responseOb={                                   
                        "departments": results.recordset,
                        "status":200
                    }
                    res.send(responseOb);               
                })                        
                .catch(function (err) {                      
                    conn.close();
                    var responseOb={
                        "msg": err,
                        "status":300
                    }
                    res.send(responseOb);  
                })                                 
            })    
            .catch(function (err) {                
                conn.close();
                res.send(err);
            }); 

                                                  
        }else{
            var responseOb={
                "msg": "invalid parameter" ,
                "status":400
            }
            res.send(responseOb);   
        }          
    });


    // it is used for checking if the client was checkout.
    async function checkValidation(request, cprofile_id){        
        return new Promise((resolve, reject)=>{
            var query = "select * from [CQ_QUEUE_BASED] where CPROFILE_ID='" + cprofile_id + "' and QBASED_checked_out = 0";  
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


};
module.exports = appRouter;

