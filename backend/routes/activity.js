const cons = require('consolidate');
const common = require('./common');

const appRouter = (app, fs) => {

    const sql = require('mssql')     
    var conn = new sql.ConnectionPool(global.config);    
   
    // get all activiy api, this is used in activity page
    app.post('/activity', function (req, res) {                      
        //var id = req.query.id;
        if(req.body.cprofile_id != null){
            conn.connect()    
            .then(async function () {

                var key = "";
                if(req.body.key != null){
                    key = req.body.key;
                }

                var dt = "";
                if(req.body.dt != null){
                    dt = req.body.dt;
                }

                var request = new sql.Request(conn);
                var booking = await getBookingActivity(request, req.body.cprofile_id, req.body.lat, req.body.lng , key, dt);
                var checkin = await getCheckinActivity(request, req.body.cprofile_id, req.body.lat, req.body.lng , key, dt);
                var queue = await getQueueActivity(request, req.body.cprofile_id, req.body.lat, req.body.lng , key, dt);
                var order = await getOrder(request, req.body.cprofile_id, req.body.lat, req.body.lng , key, dt);
                

                conn.close();
                var responseOb={                        
                    "booking": booking, 
                    "checkin": checkin, 
                    "queue": queue, 
                    "order":order,
                    "status": 200}; 
                return res.send(responseOb);            
            })    
            .catch(function (err) {                
                conn.close();
                var responseOb={             
                    "msg": err, 
                    "status": 300}; 
                return res.send(responseOb);
            });   
        }else{
            var responseOb={             
                "msg": "invalid parameter", 
                "status": 400}; 
            return res.send(responseOb); 
        }               
    });


    // inner function , get all booking activity info
    async function getBookingActivity(request, cprofile_id, lat, lng , key , dt){

        return new Promise((resolve, reject)=>{

            var PageNumber = 1;
            var distance  = common.MIN_DISTANCE_BOOKING_CLIENT_BUSINESS();
            var keyQuery = "";
            if(key != ""){
                keyQuery = " and BIS_name like '%" + key + "%' ";
            }

            var dtQuery = "";
            if(dt != ""){
                dtQuery = " and ABASED_Date = '" + dt + "' ";
            }

            var query = "declare @latitude float, @longitude float, @distance float , @PageNumber integer , @RowsOfPage integer " + 
            "select @latitude = " + lat + ", @longitude = " + lng  + ", @PageNumber = " + PageNumber + " , @distance = " + distance + ", @RowsOfPage = 100 ; " + 
            "with RestroomLocationsWithDistance as " + 
            "( " + 
            "select " + 
                "*, " + 
                "( 3959 * acos( cos( radians(@latitude) ) * cos( radians( [lat] ) ) * cos( radians( [lng] ) " + 
                "- radians(@longitude) ) + sin( radians(@latitude) ) * sin( radians( [lat] ) ) ) )  As Distance  " + 
                "FROM ( " + 

                "SELECT  Count(*) CNT,  [CQ_QUEUE_APPT_BASED].ABASED_ID as slot_id,[CQ_BUSINESS_MAPPING].MAP_google_latitud as lat, [CQ_BUSINESS_MAPPING].MAP_google_longitud as lng ,  [CQ_BUSINESS].BUSINESS_ID as id, [CQ_BUSINESS_PROFILES].BPROFILE_ID as bprofile_id, BIS_name as name,  " + 
                "BADDR_line1 as address, BIS_phone_number as phone, BIS_website as website, BADDR_postcode as postcode , BPROFILE_average_rating as star, LEFT(CONVERT(VARCHAR, ABASED_Date, 100), 6) as book_date,  RIGHT(LEFT(CONVERT(VARCHAR, ABASED_Date, 100), 11), 2) as book_year,  " + 
                " DATENAME(dw,ABASED_Date) as weekofday, DATEPART (day,ABASED_Date) as day , DATENAME(month,ABASED_Date) as month , " + 
                "LOWER(RIGHT(CONVERT(VARCHAR, ABASED_start_time, 100),7)) as start_time, LOWER(RIGHT(CONVERT(VARCHAR, ABASED_finish_time, 100),7)) as finish_time , [CQ_QUEUE_APPT_BASED].CPROFILE_ID as cprofile_id  " + 
                ", (select top 1 BPHOTO_link from [CQ_BUSINESS_PHOTOS] where BPROFILE_ID = [CQ_BUSINESS_PROFILES].BPROFILE_ID ) as photo  " + 
                ", [CQ_QUEUE_APPT_BASED].ABASED_ticket_number as ticket_number  , ABASED_checked_out as checked_out ,  [CQ_BUSINESS_DEPT_SETTINGS].QTYPE_ID " + 
                ", ( SELECT Count(*) as fav FROM [CQ_CLIENT_FAVORITES] where BPROFILE_ID = [CQ_BUSINESS_PROFILES].BPROFILE_ID and CPROFILE_ID = '" + cprofile_id + "' ) as isFavorite " + 
                ", ABASED_peep as peep, [CQ_BUSINESS_DEPARTMENTS].DEPT_ID as department_id, DEPT_name as dept_name " + 
                ", [CQ_BUSINESS_DEPT_SETTINGS].SETT_max_peep_allowed as max_peep " + 
                "FROM [CQ_QUEUE_APPT_BASED]   " + 
                "LEFT Join [CQ_QUEUE] on [CQ_QUEUE].QUEUE_ID= [CQ_QUEUE_APPT_BASED].QUEUE_ID " + 
                "LEFT Join [CQ_BUSINESS_DEPARTMENTS] on [CQ_BUSINESS_DEPARTMENTS].DEPT_ID = [CQ_QUEUE].DEPT_ID  " + 
                "LEFT Join [CQ_BUSINESS_DEPT_SETTINGS] on [CQ_BUSINESS_DEPT_SETTINGS].DEPT_ID = [CQ_BUSINESS_DEPARTMENTS].DEPT_ID  " + 
                "LEFT Join [CQ_BUSINESS_PROFILES] on [CQ_BUSINESS_PROFILES].BPROFILE_ID= [CQ_BUSINESS_DEPARTMENTS].BPROFILE_ID " + 
                "LEFT Join [CQ_BUSINESS] on [CQ_BUSINESS].BUSINESS_ID = [CQ_BUSINESS_PROFILES].BUSINESS_ID  " + 
                "LEFT Join [CQ_BUSINESS_ADDRESSES] on [CQ_BUSINESS_PROFILES].BPROFILE_ID = [CQ_BUSINESS_ADDRESSES].BPROFILE_ID  " + 
                "LEFT Join [CQ_BUSINESS_RATING] on [CQ_BUSINESS_PROFILES].BPROFILE_ID = [CQ_BUSINESS_RATING].BPROFILE_ID   " + 
                "LEFT Join [CQ_BUSINESS_MAPPING] on [CQ_BUSINESS_PROFILES].BPROFILE_ID = [CQ_BUSINESS_MAPPING].BPROFILE_ID  " + 
                "where [CQ_QUEUE_APPT_BASED].CPROFILE_ID = '" + cprofile_id + "' and ABASED_checked_out is not NULL  " + keyQuery +  dtQuery + 
                "  GROUP BY  [CQ_QUEUE_APPT_BASED].ABASED_ID, MAP_google_latitud, MAP_google_longitud,[CQ_BUSINESS].BUSINESS_ID, [CQ_BUSINESS_PROFILES].BPROFILE_ID, BIS_name,BADDR_line1,BIS_phone_number " + 
                "  ,BIS_website,BADDR_postcode,BPROFILE_average_rating,ABASED_date, ABASED_start_time, ABASED_finish_time, [CQ_QUEUE_APPT_BASED].CPROFILE_ID,ABASED_ticket_number,ABASED_checked_out,QTYPE_ID,ABASED_peep,[CQ_BUSINESS_DEPARTMENTS].DEPT_ID ,DEPT_name, [CQ_BUSINESS_DEPT_SETTINGS].SETT_max_peep_allowed " + 
                "HAVING COUNT(*) > 0 ) as mytb " +  //
                ") " + 
            "select " + 
            "* " + 
            "from RestroomLocationsWithDistance " + 
            "where Distance <= @distance   ORDER BY checked_out ASC,  slot_id DESC "; 
                       
                request.query(query)
                .then(function (results) {
                    resolve(results.recordset);                    
                })
                // Handle sql statement execution errors
                .catch(function (err) {
                    conn.close();
                    resolve(null);
                }) 
        });
    }

    // inner function , get all checkin activity info
    async function getCheckinActivity(request, cprofile_id, lat, lng, key, dt){

        return new Promise((resolve, reject)=>{


            var PageNumber = 1;
            var distance  = common.MIN_DISTANCE_BOOKING_CLIENT_BUSINESS();

            var keyQuery = "";
            if(key != ""){
                keyQuery = " and BIS_name like '%" + key + "%' ";
            }

            var dtQuery = "";
            if(dt != ""){
                dtQuery = " and QBASED_Date = '" + dt + "' ";
            }



            var query = "declare @latitude float, @longitude float, @distance float , @PageNumber integer , @RowsOfPage integer " + 
            "select @latitude = " + lat + ", @longitude = " + lng  + ", @PageNumber = " + PageNumber + " , @distance = " + distance + ", @RowsOfPage = 100 ; " + 
            "with RestroomLocationsWithDistance as " + 
            "( " + 
            "select " + 
                "*, " + 
                "( 3959 * acos( cos( radians(@latitude) ) * cos( radians( [lat] ) ) * cos( radians( [lng] ) " + 
                "- radians(@longitude) ) + sin( radians(@latitude) ) * sin( radians( [lat] ) ) ) )  As Distance  " + 
                "FROM ( " + 

                " SELECT COUNT(*) as CNT,  [CQ_QUEUE_BASED].QBASED_ID as slot_id,  [CQ_BUSINESS].BUSINESS_ID as id, [CQ_BUSINESS_PROFILES].BPROFILE_ID as bprofile_id, BIS_name as name,  " + 
                "[CQ_BUSINESS_MAPPING].MAP_google_latitud as lat, [CQ_BUSINESS_MAPPING].MAP_google_longitud as lng,  " + 
                "BADDR_line1 as address, BIS_phone_number as phone, BIS_website as website, BADDR_postcode as postcode , BPROFILE_average_rating as star, LEFT(CONVERT(VARCHAR, QBASED_Date, 100), 6) as book_date,   RIGHT(LEFT(CONVERT(VARCHAR, QBASED_Date, 100), 11), 2) as book_year, " + 
                " DATENAME(dw,QBASED_Date) as weekofday, DATEPART (day,QBASED_Date) as day , DATENAME(month,QBASED_Date) as month , " + 
                "[CQ_QUEUE_BASED].CPROFILE_ID as cprofile_id   " + 
                ", (select top 1 BPHOTO_link from [CQ_BUSINESS_PHOTOS] where BPROFILE_ID = [CQ_BUSINESS_PROFILES].BPROFILE_ID ) as photo  " + 
                ", [CQ_BUSINESS_DEPT_SETTINGS].QTYPE_ID, QBASED_checked_out as checked_out  " + 
                ", [CQ_QUEUE_BASED].QBASED_ticket_number as ticket_number  " + 
                ", LOWER(RIGHT(CONVERT(VARCHAR, QBASED_checkin_time, 100), 7)) as checkin_time  " + 
                ", LOWER(RIGHT(CONVERT(VARCHAR, QBASED_current_estimated_waiting_time , 100), 7)) as waiting_time " + 
                ", ( SELECT Count(*) as fav FROM [CQ_CLIENT_FAVORITES] where BPROFILE_ID = [CQ_BUSINESS_PROFILES].BPROFILE_ID and CPROFILE_ID = '" + cprofile_id + "' ) as isFavorite " + 
                ", QBASED_peep as peep, [CQ_BUSINESS_DEPARTMENTS].DEPT_ID as department_id , DEPT_name as dept_name " + 
                ", [CQ_BUSINESS_DEPT_SETTINGS].SETT_max_peep_allowed as max_peep " + 
                "FROM [CQ_QUEUE_BASED]  " + 
                            
                "LEFT Join [CQ_QUEUE] on [CQ_QUEUE].QUEUE_ID= [CQ_QUEUE_BASED].QUEUE_ID   " + 
                "LEFT Join [CQ_BUSINESS_DEPARTMENTS] on [CQ_BUSINESS_DEPARTMENTS].DEPT_ID = [CQ_QUEUE].DEPT_ID  " + 
                "LEFT Join [CQ_BUSINESS_DEPT_SETTINGS] on [CQ_BUSINESS_DEPT_SETTINGS].DEPT_ID = [CQ_BUSINESS_DEPARTMENTS].DEPT_ID  " + 
                "LEFT Join [CQ_BUSINESS_PROFILES] on [CQ_BUSINESS_PROFILES].BPROFILE_ID= [CQ_BUSINESS_DEPARTMENTS].BPROFILE_ID   " + 
                "LEFT Join [CQ_BUSINESS] on [CQ_BUSINESS].BUSINESS_ID = [CQ_BUSINESS_PROFILES].BUSINESS_ID   " + 
                "LEFT Join [CQ_BUSINESS_ADDRESSES] on [CQ_BUSINESS_PROFILES].BPROFILE_ID = [CQ_BUSINESS_ADDRESSES].BPROFILE_ID    " + 
                "LEFT Join [CQ_BUSINESS_RATING] on [CQ_BUSINESS_PROFILES].BPROFILE_ID = [CQ_BUSINESS_RATING].BPROFILE_ID " + 
                "LEFT Join [CQ_BUSINESS_MAPPING] on [CQ_BUSINESS_PROFILES].BPROFILE_ID = [CQ_BUSINESS_MAPPING].BPROFILE_ID " + 
                "where (QTYPE_ID = 1 or QTYPE_ID = 2) and  [CQ_QUEUE_BASED].CPROFILE_ID = '" + cprofile_id + "' and QBASED_checked_out is not NULL  " +  keyQuery + dtQuery + 
            
                "GROUP BY  [CQ_QUEUE_BASED].QBASED_ID, MAP_google_latitud, MAP_google_longitud,[CQ_BUSINESS].BUSINESS_ID, [CQ_BUSINESS_PROFILES].BPROFILE_ID, BIS_name,BADDR_line1,BIS_phone_number  " + 
                " ,BIS_website,BADDR_postcode,BPROFILE_average_rating,QBASED_date,  [CQ_QUEUE_BASED].CPROFILE_ID,QBASED_ticket_number,QBASED_checkin_time,QBASED_current_estimated_waiting_time, QTYPE_ID , QBASED_checked_out,QBASED_peep ,[CQ_BUSINESS_DEPARTMENTS].DEPT_ID, DEPT_name, [CQ_BUSINESS_DEPT_SETTINGS].SETT_max_peep_allowed " + 
                "HAVING COUNT(*) > 0 ) as mytb " +  //
                ") " + 
            "select " + 
            "* " + 
            "from RestroomLocationsWithDistance " + 
            "where Distance <= @distance   ORDER BY checked_out ASC,  slot_id DESC "; 
                                                
                request.query(query)
                .then(function (results) {
                    resolve(results.recordset);                    
                })
                // Handle sql statement execution errors
                .catch(function (err) {
                    conn.close();
                    resolve(null);
                }) 
        });

    }


    // inner function, get all queue activity info.
    async function getQueueActivity(request, cprofile_id, lat, lng, key, dt){

        return new Promise((resolve, reject)=>{


            var PageNumber = 1;
            var distance  = common.MIN_DISTANCE_BOOKING_CLIENT_BUSINESS();

            var keyQuery = "";
            if(key != ""){
                keyQuery = " and BIS_name like '%" + key + "%' ";
            }

            
            var dtQuery = "";
            if(dt != ""){
                dtQuery = " and QBASED_Date = '" + dt + "' ";
            }
                        
            var currentDT = common.getCurrentDateTime();
            
            var query = "declare @latitude float, @longitude float, @distance float , @PageNumber integer , @RowsOfPage integer " + 
            "select @latitude = " + lat + ", @longitude = " + lng  + ", @PageNumber = " + PageNumber + " , @distance = " + distance + ", @RowsOfPage = 100 ; " + 
            "with RestroomLocationsWithDistance as " + 
            "( " + 
            "select " + 
                "*, " + 
                "( 3959 * acos( cos( radians(@latitude) ) * cos( radians( [lat] ) ) * cos( radians( [lng] ) " + 
                "- radians(@longitude) ) + sin( radians(@latitude) ) * sin( radians( [lat] ) ) ) )  As Distance  " + 
                "FROM ( " + 

                " SELECT COUNT(*) as CNT,  [CQ_QUEUE_BASED].QBASED_ID as slot_id,  [CQ_BUSINESS].BUSINESS_ID as id, [CQ_BUSINESS_PROFILES].BPROFILE_ID as bprofile_id, BIS_name as name,  " + 
                "[CQ_BUSINESS_MAPPING].MAP_google_latitud as lat, [CQ_BUSINESS_MAPPING].MAP_google_longitud as lng,  " + 
                "BADDR_line1 as address, BIS_phone_number as phone, BIS_website as website, BADDR_postcode as postcode , BPROFILE_average_rating as star, LEFT(CONVERT(VARCHAR, QBASED_Date, 100), 6) as book_date,   RIGHT(LEFT(CONVERT(VARCHAR, QBASED_Date, 100), 11), 2) as book_year, " + 
                " DATENAME(dw,QBASED_Date) as weekofday, DATEPART (day,QBASED_Date) as day , DATENAME(month,QBASED_Date) as month , " + 
                "[CQ_QUEUE_BASED].CPROFILE_ID as cprofile_id   " + 
                ", (select top 1 BPHOTO_link from [CQ_BUSINESS_PHOTOS] where BPROFILE_ID = [CQ_BUSINESS_PROFILES].BPROFILE_ID ) as photo  " + 
                ", [CQ_BUSINESS_DEPT_SETTINGS].QTYPE_ID, QBASED_checked_out as checked_out  " + 
                ", [CQ_QUEUE_BASED].QBASED_ticket_number as ticket_number  " + 
                ", LOWER(RIGHT(CONVERT(VARCHAR, QBASED_checkin_time, 100), 7)) as checkin_time  " + 
                ", LOWER(RIGHT(CONVERT(VARCHAR, QBASED_current_estimated_waiting_time , 100), 7)) as waiting_time " + 
                ", [CQ_QUEUE].QUEUE_average_waiting_time as avg_waiting_time " + 
                ", [CQ_QUEUE_BASED].QBASED_current_position as  current_position,  LEFT(CONVERT(VARCHAR, CAST('" + currentDT + "' AS DATE), 100), 6)  as today " + 
                ", RIGHT(LEFT(CONVERT(VARCHAR, CAST('" + currentDT + "' AS DATE) , 100), 11), 2)  as today_year " + 
                ", ( SELECT Count(*) as fav FROM [CQ_CLIENT_FAVORITES] where BPROFILE_ID = [CQ_BUSINESS_PROFILES].BPROFILE_ID and CPROFILE_ID = '" + cprofile_id + "' ) as isFavorite " + 
                ", QBASED_peep as peep , [CQ_BUSINESS_DEPARTMENTS].DEPT_ID as department_id ,  DEPT_name as dept_name " + 
                ", [CQ_BUSINESS_DEPT_SETTINGS].SETT_max_peep_allowed as max_peep " + 
                "FROM [CQ_QUEUE_BASED]  " + 
                            
                "LEFT Join [CQ_QUEUE] on [CQ_QUEUE].QUEUE_ID= [CQ_QUEUE_BASED].QUEUE_ID   " + 
                "LEFT Join [CQ_BUSINESS_DEPARTMENTS] on [CQ_BUSINESS_DEPARTMENTS].DEPT_ID = [CQ_QUEUE].DEPT_ID  " + 
                "LEFT Join [CQ_BUSINESS_DEPT_SETTINGS] on [CQ_BUSINESS_DEPT_SETTINGS].DEPT_ID = [CQ_BUSINESS_DEPARTMENTS].DEPT_ID  " + 
                "LEFT Join [CQ_BUSINESS_PROFILES] on [CQ_BUSINESS_PROFILES].BPROFILE_ID= [CQ_BUSINESS_DEPARTMENTS].BPROFILE_ID   " + 
                "LEFT Join [CQ_BUSINESS] on [CQ_BUSINESS].BUSINESS_ID = [CQ_BUSINESS_PROFILES].BUSINESS_ID   " + 
                "LEFT Join [CQ_BUSINESS_ADDRESSES] on [CQ_BUSINESS_PROFILES].BPROFILE_ID = [CQ_BUSINESS_ADDRESSES].BPROFILE_ID    " + 
                "LEFT Join [CQ_BUSINESS_RATING] on [CQ_BUSINESS_PROFILES].BPROFILE_ID = [CQ_BUSINESS_RATING].BPROFILE_ID " + 
                "LEFT Join [CQ_BUSINESS_MAPPING] on [CQ_BUSINESS_PROFILES].BPROFILE_ID = [CQ_BUSINESS_MAPPING].BPROFILE_ID " + 
                "where (QTYPE_ID = 3 ) and  [CQ_QUEUE_BASED].CPROFILE_ID = '" + cprofile_id + "' and QBASED_checked_out is not NULL  " +  keyQuery + dtQuery + 
            
                "GROUP BY  [CQ_QUEUE_BASED].QBASED_ID, MAP_google_latitud, MAP_google_longitud,[CQ_BUSINESS].BUSINESS_ID, [CQ_BUSINESS_PROFILES].BPROFILE_ID, BIS_name,BADDR_line1,BIS_phone_number  " + 
                " ,BIS_website,BADDR_postcode,BPROFILE_average_rating,QBASED_date,  [CQ_QUEUE_BASED].CPROFILE_ID,QBASED_ticket_number,QBASED_checkin_time,QBASED_current_estimated_waiting_time, QBASED_current_position, QTYPE_ID , QBASED_checked_out,QBASED_peep , [CQ_BUSINESS_DEPARTMENTS].DEPT_ID ,DEPT_name, [CQ_BUSINESS_DEPT_SETTINGS].SETT_max_peep_allowed " + 
                ",QUEUE_average_waiting_time " + 
                "HAVING COUNT(*) > 0 ) as mytb " +  //
                ") " + 
            "select " + 
            "* " + 
            "from RestroomLocationsWithDistance " + 
            "where Distance <= @distance   ORDER BY checked_out ASC,  slot_id DESC "; 

            
                request.query(query)
                .then(function (results) {
                    resolve(results.recordset);                    
                })
                // Handle sql statement execution errors
                .catch(function (err) {
                    conn.close();
                    resolve(null);
                }) 

        });
    }


    // inner function, get all order info.
    async function getOrder(request, cprofile_id, lat, lng , key , dt){

        return new Promise((resolve, reject)=>{

            var PageNumber = 1;
            var distance  = common.MIN_DISTANCE_BOOKING_CLIENT_BUSINESS();
            var keyQuery = "";
            if(key != ""){
                keyQuery = " and BIS_name like '%" + key + "%' ";
            }

            var dtQuery = "";
            if(dt != ""){
                dtQuery = " and CORDER_created_on = '" + dt + "' ";
            }

            var query = "declare @latitude float, @longitude float, @distance float , @PageNumber integer , @RowsOfPage integer " + 
            "select @latitude = " + lat + ", @longitude = " + lng  + ", @PageNumber = " + PageNumber + " , @distance = " + distance + ", @RowsOfPage = 100 ; " + 
            "with RestroomLocationsWithDistance as " + 
            "( " + 
            "select " + 
                "*, " + 
                "( 3959 * acos( cos( radians(@latitude) ) * cos( radians( [lat] ) ) * cos( radians( [lng] ) " + 
                "- radians(@longitude) ) + sin( radians(@latitude) ) * sin( radians( [lat] ) ) ) )  As Distance  " + 
                "FROM ( " + 

                "SELECT  Count(*) CNT,  [CQ_CLIENT_ORDER].CORDER_ID as order_id,[CQ_BUSINESS_MAPPING].MAP_google_latitud as lat, [CQ_BUSINESS_MAPPING].MAP_google_longitud as lng ,  [CQ_BUSINESS].BUSINESS_ID as id, [CQ_BUSINESS_PROFILES].BPROFILE_ID as bprofile_id, BIS_name as name,  " + 
                "BADDR_line1 as address, BIS_phone_number as phone, BIS_website as website, BADDR_postcode as postcode , BPROFILE_average_rating as star, LEFT(CONVERT(VARCHAR, CORDER_created_on, 100), 6) as order_date,  RIGHT(LEFT(CONVERT(VARCHAR, CORDER_created_on, 100), 11), 2) as order_year,  " + 
                " DATENAME(dw,CORDER_created_on) as weekofday, DATEPART (day,CORDER_created_on) as day , DATENAME(month,CORDER_created_on) as month , " + 
                "LOWER(RIGHT(CONVERT(VARCHAR, CORDER_created_on, 100),7)) as start_time, LOWER(RIGHT(CONVERT(VARCHAR, CORDER_created_on, 100),7)) as finish_time , [CQ_CLIENT_ORDER].CPROFILE_ID as cprofile_id  " + 
                ", (select top 1 BPHOTO_link from [CQ_BUSINESS_PHOTOS] where BPROFILE_ID = [CQ_BUSINESS_PROFILES].BPROFILE_ID ) as photo  " + 
                ", CASE WHEN [CQ_CLIENT_ORDER].OSTATUS_ID > 0 THEN '0' ELSE '1' END as checked_out ,  [CQ_BUSINESS_DEPT_SETTINGS].QTYPE_ID " + 
                ", ( SELECT Count(*) as fav FROM [CQ_CLIENT_FAVORITES] where BPROFILE_ID = [CQ_BUSINESS_PROFILES].BPROFILE_ID and CPROFILE_ID = '" + cprofile_id + "' ) as isFavorite " + 
                ", [CQ_BUSINESS_DEPARTMENTS].DEPT_ID as department_id , DEPT_name as dept_name " + 
                ", [CQ_BUSINESS_DEPT_SETTINGS].SETT_max_peep_allowed as max_peep " + 
                ", (SELECT SUM(COS_Quantity * MITEM_unit_price) as price FROM [CQ_CLIENT_ORDER_SELECTION] LEFT Join [CQ_BUSINESS_MENU_ITEMS] on [CQ_BUSINESS_MENU_ITEMS].MITEM_ID= [CQ_CLIENT_ORDER_SELECTION].MITEM_ID where CORDER_ID = [CQ_CLIENT_ORDER].CORDER_ID) as price " + 
                "FROM [CQ_CLIENT_ORDER]   " + 
                "LEFT Join [CQ_BUSINESS_MENUS] on [CQ_BUSINESS_MENUS].MENU_ID= [CQ_CLIENT_ORDER].MENU_ID " + 
                "LEFT Join [CQ_BUSINESS_DEPARTMENTS] on [CQ_BUSINESS_DEPARTMENTS].DEPT_ID = [CQ_BUSINESS_MENUS].DEPT_ID  " + 
                "LEFT Join [CQ_BUSINESS_DEPT_SETTINGS] on [CQ_BUSINESS_DEPT_SETTINGS].DEPT_ID = [CQ_BUSINESS_DEPARTMENTS].DEPT_ID  " + 
                "LEFT Join [CQ_BUSINESS_PROFILES] on [CQ_BUSINESS_PROFILES].BPROFILE_ID= [CQ_BUSINESS_DEPARTMENTS].BPROFILE_ID " + 
                "LEFT Join [CQ_BUSINESS] on [CQ_BUSINESS].BUSINESS_ID = [CQ_BUSINESS_PROFILES].BUSINESS_ID  " + 
                "LEFT Join [CQ_BUSINESS_ADDRESSES] on [CQ_BUSINESS_PROFILES].BPROFILE_ID = [CQ_BUSINESS_ADDRESSES].BPROFILE_ID  " + 
                "LEFT Join [CQ_BUSINESS_RATING] on [CQ_BUSINESS_PROFILES].BPROFILE_ID = [CQ_BUSINESS_RATING].BPROFILE_ID   " + 
                "LEFT Join [CQ_BUSINESS_MAPPING] on [CQ_BUSINESS_PROFILES].BPROFILE_ID = [CQ_BUSINESS_MAPPING].BPROFILE_ID  " + 
                "where [CQ_CLIENT_ORDER].CPROFILE_ID = '" + cprofile_id + "' and [CQ_CLIENT_ORDER].OSTATUS_ID is not NULL  " + keyQuery +  dtQuery + 
                "  GROUP BY  [CQ_CLIENT_ORDER].CORDER_ID, MAP_google_latitud, MAP_google_longitud,[CQ_BUSINESS].BUSINESS_ID, [CQ_BUSINESS_PROFILES].BPROFILE_ID, BIS_name,BADDR_line1,BIS_phone_number " + 
                "  ,BIS_website,BADDR_postcode,BPROFILE_average_rating, CORDER_created_on, [CQ_CLIENT_ORDER].CPROFILE_ID, [CQ_CLIENT_ORDER].OSTATUS_ID,QTYPE_ID, [CQ_BUSINESS_DEPARTMENTS].DEPT_ID , DEPT_name,  [CQ_BUSINESS_DEPT_SETTINGS].SETT_max_peep_allowed " + 
                "HAVING COUNT(*) > 0 ) as mytb " +  //
                ") " + 
            "select " + 
            "* " + 
            "from RestroomLocationsWithDistance " + 
            "where Distance <= @distance   ORDER BY checked_out ASC,  order_id DESC "; 
                                    
                request.query(query)
                .then(function (results) {
                    resolve(results.recordset);                    
                })
                // Handle sql statement execution errors
                .catch(function (err) {
                    conn.close();
                    resolve(null);
                }) 
        });
    }


};
module.exports = appRouter;

