const cons = require('consolidate');
const common = require('./common');

const userRoutes = (app, fs) => {
        
    const sql = require('mssql')   
    var conn = new sql.ConnectionPool(global.config);          
    
    // this api is not used in mobile app, but it will be used in web part.
    app.post('/getBusinessListByName', function (req, res) {

        if(req.body.name != null && req.body.lat != null && req.body.lng != null){
            conn.connect()    
            .then(function () {

                var request = new sql.Request(conn);            
                
                var PageNumber = 0;
                if(req.body.page != null){
                    PageNumber = req.body.page;
                }                
                var distance = common.MIN_DISTANCE_BOOKING_CLIENT_BUSINESS();
                var row_number = common.NUMBER_BUSINESS_ON_SEARCH_PAGE();
                var query = "declare @latitude float, @longitude float, @distance float , @PageNumber integer , @RowsOfPage integer " + 
                    "select @latitude = " + req.body.lat + ", @longitude = " + req.body.lng  + ", @PageNumber = " + PageNumber + " , @distance = " + distance + ", @RowsOfPage = " + row_number +" ; " + 
                    "with RestroomLocationsWithDistance as " + 
                    "( " + 
                    "select " + 
                        "*, " + 
                        "( 3959 * acos( cos( radians(@latitude) ) * cos( radians( [lat] ) ) * cos( radians( [lng] ) " + 
                        "- radians(@longitude) ) + sin( radians(@latitude) ) * sin( radians( [lat] ) ) ) )  As Distance  " +            
                        "FROM (SELECT [CQ_BUSINESS].BUSINESS_ID as id,  BIS_name as name, BPHOTO_link as photo , BADDR_line1 as address , BADDR_postcode as postcode , BRATE_stars as star, MAP_google_latitud as lat, MAP_google_longitud as lng " + 
                        "FROM [CQ_BUSINESS]  " + 
                        "LEFT Join [CQ_BUSINESS_PROFILES] on [CQ_BUSINESS].BUSINESS_ID = [CQ_BUSINESS_PROFILES].BUSINESS_ID " + 
                        "LEFT Join [CQ_BUSINESS_PHOTOS] on [CQ_BUSINESS_PROFILES].BPROFILE_ID = [CQ_BUSINESS_PHOTOS].BPROFILE_ID " + 
                        "LEFT Join [CQ_BUSINESS_ADDRESSES] on [CQ_BUSINESS_PROFILES].BPROFILE_ID = [CQ_BUSINESS_ADDRESSES].BPROFILE_ID " + 
                        "LEFT Join [CQ_BUSINESS_RATING] on [CQ_BUSINESS_PROFILES].BPROFILE_ID = [CQ_BUSINESS_RATING].BPROFILE_ID " + 
                        "LEFT Join [CQ_BUSINESS_MAPPING] on [CQ_BUSINESS_PROFILES].BPROFILE_ID = [CQ_BUSINESS_MAPPING].BPROFILE_ID WHERE [CQ_BUSINESS].BIS_name like '%" + req.body.name+ "%' ) as mytb " + 
                        ") " + 
                    "select " + 
                    "* " + 
                    "from RestroomLocationsWithDistance " + 
                    "where Distance <= @distance  order by Distance"; 
                if(req.body.page != null ){
                    query = query  + " OFFSET (@PageNumber-1)*@RowsOfPage ROWS  " +
                    "FETCH NEXT @RowsOfPage ROWS ONLY";  
                }
  
                
                request.query(query)
                .then(function (results) {                           
                    var responseOb={
                        "msg": "success",
                        "businessList": results.recordset,
                        "status":200
                    }                    
                    res.send(responseOb);   
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
                "msg": "no search key",                
                "status":300
            }
            res.send(responseOb);   
        }        
    });  


    // get business by department id , it is used for web menu page for getting the business name and menu name.
    app.post('/getBusinessByDept', function (req, res) {

        if(req.body.department_id != null){
            conn.connect()    
            .then(async function () {

                var request = new sql.Request(conn);            

                var menu = await getMenuName(request, req.body.department_id); 
                var query = "SELECT B.BIS_name as business_name , B.BIS_is_active as business_active , D.DEPT_name as department_name, D.DEPT_is_active as department_active " + 
                            ", ( select top 1 BPHOTO_link from [CQ_BUSINESS_PHOTOS] where D.BPROFILE_ID = C.BPROFILE_ID ) as photo " + 
                            " FROM [CQ_BUSINESS] B , [CQ_BUSINESS_PROFILES] C " +
                            ", [CQ_BUSINESS_DEPARTMENTS] D  WHERE C.BUSINESS_ID = B.BUSINESS_ID  and D.BPROFILE_ID = C.BPROFILE_ID " +
                            " and D.DEPT_ID = " + req.body.department_id + "  and B.BIS_is_active = 1 and D.DEPT_is_active = 1 ";
                            
                request.query(query)
                .then(async function (results) {                                                         
                    
                    if(results.recordset.length > 0){
                        var responseOb={
                            "msg": "success",
                            "business": results.recordset[0],
                            "menu":menu,
                            "status":200
                        }                    
                        res.send(responseOb);   
                    }else{
                        var responseOb={
                            "msg": "error",
                            "business": null,
                            "menu":menu,
                            "status":300
                        }                    
                        res.send(responseOb);   
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
                "msg": "no department id",                
                "status":300
            }
            res.send(responseOb);   
        }        
    });  


    // get business photo from business profile id. it is used in business details page.
    app.post('/getphotos', function (req, res) {
        if(req.body.bprofile_id != null){
            conn.connect()    
            .then(async function () {
                var request = new sql.Request(conn);   
                var photos = await getBusinessPhotos(request, req.body.bprofile_id);
                var responseOb={                        
                    "photos": photos, 
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

    // filter all business by condition, it is used in search page.
    app.post('/getBusinessListByFilter', function (req, res) {

        if( req.body.lat != null && req.body.lng != null, req.body.cprofile_id){
            conn.connect()    
            .then(async function () {

                var request = new sql.Request(conn);     
                
                var PageNumber = 1;   
                if(req.body.page != null){
                    PageNumber = req.body.page;
                }             

                var active = 1;
                var activeQuery = "";
                if(req.body.active != null){                     
                    if(req.body.active != -1){
                        active = req.body.active;
                        activeQuery = "[CQ_BUSINESS].BIS_is_active = '" + active + "'";
                    }else{
                        activeQuery = "1=1"; //([CQ_BUSINESS].BIS_is_active = '1' or [CQ_BUSINESS].BIS_is_active = '0')
                    }
                }
           
                var take_away = 0;
                var takeAwayQuery = "";
                if(req.body.take_away != null){
                    if(req.body.take_away != -1){
                        take_away = req.body.take_away;
                        takeAwayQuery = " and [CQ_BUSINESS_DEPT_SETTINGS].SETT_take_away = '" + req.body.take_away  + "'";
                    }            
                }

                var delivery = 0;
                var deliveryQuery = "";
                if(req.body.delivery != null){
                    if(req.body.delivery != -1){
                        deliveryQuery = " and [CQ_BUSINESS_DEPT_SETTINGS].SETT_delivery = '" + req.body.delivery + "'";
                    }                    
                }
                var favourites = 0;
                var favouriteQuery = "";
                if(req.body.favourites != null){
                    if(req.body.favourites != -1){
                        favourites = 1;
                        favouriteQuery = " and [CQ_CLIENT_FAVORITES].CFAV_ID is not NULL and [CQ_CLIENT_FAVORITES].CPROFILE_ID = '" + req.body.cprofile_id +  "'";
                    }                    
                }
                var pick_up = 0;
                var pickUpQuery = "";
                if(req.body.pick_up != null){
                    if(req.body.pick_up != -1){                        
                        pickUpQuery = " and [CQ_BUSINESS_DEPT_SETTINGS].SETT_pick_collect = '" + req.body.pick_up + "'";
                    }
                }

                var categoryQuery  = "";
                if(req.body.category_id != null){
                    if(req.body.category_id != -1){
                        categoryQuery = " and [CQ_BUSINESS].CATG_ID = '" + req.body.category_id + "'";
                    }                    
                }

                var distance = common.MIN_DISTANCE_BOOKING_CLIENT_BUSINESS();
                if(req.body.distance != null){
                    distance = req.body.distance;
                }
                var keyQuery = "";
                if(req.body.key != null){
                    if(req.body.key != ""){
                        keyQuery = " and [CQ_BUSINESS].BIS_name like '%" + req.body.key + "%'";
                    }
                }

                //( SELECT Count(*) as fav FROM [CQ_CLIENT_FAVORITES] where BPROFILE_ID = [CQ_BUSINESS_PROFILES].BPROFILE_ID and CPROFILE_ID = '" + cprofile_id + "' ) 

                var query = "declare @latitude float, @longitude float, @distance float , @PageNumber integer , @RowsOfPage integer " + 
                    "select @latitude = " + req.body.lat + ", @longitude = " + req.body.lng  + ", @PageNumber = " + PageNumber + " , @distance = " + distance + ", @RowsOfPage = " + common.NUMBER_BUSINESS_ON_SEARCH_PAGE() +" ; " + 
                    "with RestroomLocationsWithDistance as " + 
                    "( " + 
                    "select " + 
                        "*, " + 
                        "( 3959 * acos( cos( radians(@latitude) ) * cos( radians( [lat] ) ) * cos( radians( [lng] ) " + 
                        "- radians(@longitude) ) + sin( radians(@latitude) ) * sin( radians( [lat] ) ) ) )  As Distance  " +            
                        "FROM (SELECT COUNT(*) AS CNT , [CQ_BUSINESS].BUSINESS_ID as id, [CQ_BUSINESS_PROFILES].BPROFILE_ID as bprofile_id, BIS_name as name,  BADDR_line1 as address , " +  //BPHOTO_link as photo ,
                        "BIS_phone_number as phone, BIS_website as website, BADDR_postcode as postcode , BPROFILE_average_rating as star, MAP_google_latitud as lat, MAP_google_longitud as lng " + 
                        ", ( select count(*) from [CQ_BUSINESS_DEPARTMENTS] where BPROFILE_ID = [CQ_BUSINESS_PROFILES].BPROFILE_ID ) as department_count " + 
                        ", ( select top 1 QTYPE_ID from [CQ_BUSINESS_DEPARTMENTS]  LEFT Join [CQ_BUSINESS_DEPT_SETTINGS] on [CQ_BUSINESS_DEPARTMENTS].DEPT_ID = [CQ_BUSINESS_DEPT_SETTINGS].DEPT_ID  where BPROFILE_ID = [CQ_BUSINESS_PROFILES].BPROFILE_ID ) as qtype_id " + 
                        ", ( select top 1 BPHOTO_link from [CQ_BUSINESS_PHOTOS] where BPROFILE_ID = [CQ_BUSINESS_PROFILES].BPROFILE_ID ) as photo " + 
                        ", ( SELECT Count(*) as fav FROM [CQ_CLIENT_FAVORITES] where BPROFILE_ID = [CQ_BUSINESS_PROFILES].BPROFILE_ID and CPROFILE_ID = '" + req.body.cprofile_id + "' ) as isFavorite " + 
                        "FROM [CQ_BUSINESS]  " + 
                        "LEFT Join [CQ_BUSINESS_PROFILES] on [CQ_BUSINESS].BUSINESS_ID = [CQ_BUSINESS_PROFILES].BUSINESS_ID " + 
                        //"LEFT Join [CQ_BUSINESS_PHOTOS] on [CQ_BUSINESS_PROFILES].BPROFILE_ID = [CQ_BUSINESS_PHOTOS].BPROFILE_ID " + 
                        "LEFT Join [CQ_BUSINESS_ADDRESSES] on [CQ_BUSINESS_PROFILES].BPROFILE_ID = [CQ_BUSINESS_ADDRESSES].BPROFILE_ID " + 
                        "LEFT Join [CQ_BUSINESS_RATING] on [CQ_BUSINESS_PROFILES].BPROFILE_ID = [CQ_BUSINESS_RATING].BPROFILE_ID " + 
                        "LEFT Join [CQ_BUSINESS_MAPPING] on [CQ_BUSINESS_PROFILES].BPROFILE_ID = [CQ_BUSINESS_MAPPING].BPROFILE_ID " + 
                        "LEFT Join [CQ_ADM_CATEGORIES] on [CQ_BUSINESS].CATG_ID = [CQ_ADM_CATEGORIES].CATG_ID " + 
                        "LEFT Join [CQ_BUSINESS_DEPARTMENTS] on [CQ_BUSINESS_PROFILES].BPROFILE_ID = [CQ_BUSINESS_DEPARTMENTS].BPROFILE_ID " + 
                        "LEFT Join [CQ_BUSINESS_FAVORITES] on [CQ_BUSINESS_PROFILES].BPROFILE_ID = [CQ_BUSINESS_FAVORITES].BPROFILE_ID " + 
                        "LEFT Join [CQ_BUSINESS_DEPT_SETTINGS] on [CQ_BUSINESS_DEPARTMENTS].DEPT_ID = [CQ_BUSINESS_DEPT_SETTINGS].DEPT_ID " + 
                        "LEFT Join [CQ_CLIENT_FAVORITES] on [CQ_BUSINESS_PROFILES].BPROFILE_ID = [CQ_CLIENT_FAVORITES].BPROFILE_ID " + 
                        "WHERE " + activeQuery + pickUpQuery + takeAwayQuery + 
                        deliveryQuery + categoryQuery  + favouriteQuery +  keyQuery 
                        + " GROUP BY  [CQ_BUSINESS].BUSINESS_ID, [CQ_BUSINESS_PROFILES].BPROFILE_ID, BIS_name,BIS_phone_number,BIS_website, BADDR_line1,BADDR_postcode,BPROFILE_average_rating,MAP_google_latitud,MAP_google_longitud  HAVING COUNT(*) >= 1 ) as mytb " +  //
                        ") " + 
                    "select " + 
                    "* " + 
                    "from RestroomLocationsWithDistance " + 
                    "where Distance <= @distance  order by Distance"; 

                if(req.body.page != null ){
                    query = query  + " OFFSET (@PageNumber-1)*@RowsOfPage ROWS  " +
                    "FETCH NEXT @RowsOfPage ROWS ONLY";  
                }
                var count = 0;
                if(PageNumber == 1){
                    count = await getNotificationCount1(request, req.body.cprofile_id) + await getNotificationCount2(request,  req.body.cprofile_id) + await getNotificationCount3(request,  req.body.cprofile_id);
                }                
                                
                await request.query(query)
                .then(async function (results) {           
                    var businessList = [];
                    for(i = 0; i < results.recordset.length; i++){                         
                         var item = {"business":results.recordset[i]};
                         businessList.push(item);                         
                         //results.recordset[i].photos = photos;
                    }
                    conn.close();
                    var responseOb={
                        "notification":count,
                        "msg": "success",
                        "businessList": businessList, 
                        "query":query,
                        "status":200
                    }                    
                    res.send(responseOb);   
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
                "msg": "no search key",                
                "status":300
            }
            res.send(responseOb);   
        }        
    });  


    // get busines open time, it is used in business details page.
    app.post('/opentime', function (req, res) { 
        if(req.body.bprofile_id != null){
            conn.connect()
            .then(function () {                                    
                var request = new sql.Request(conn);   

                var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
                var now = new Date();
                var weekofday =  now.getDay();
                var day = days[ now.getDay() ];

            
                let current_time = common.getCurrentTime();                

                var sel = "*";
                var where = "";

                var currentDT = common.getCurrentDateTime();
                         

                sel = "BTIMES_ID,  LOWER(RIGHT(CONVERT(VARCHAR, BTIMES_sunday_from, 100),7)) as sunday_from   , LOWER(RIGHT(CONVERT(VARCHAR, BTIMES_sunday_to, 100),7)) as sunday_to " + 
                    ", LOWER(RIGHT(CONVERT(VARCHAR, BTIMES_monday_from, 100),7)) as monday_from   , LOWER(RIGHT(CONVERT(VARCHAR, BTIMES_monday_to, 100),7)) as monday_to " + 
                    ", LOWER(RIGHT(CONVERT(VARCHAR, BTIMES_tuesday_from, 100),7)) as tuesday_from   , LOWER(RIGHT(CONVERT(VARCHAR, BTIMES_tuesday_to, 100),7)) as tuesday_to " + 
                    ", LOWER(RIGHT(CONVERT(VARCHAR, BTIMES_wednesday_from, 100),7)) as wednesday_from   , LOWER(RIGHT(CONVERT(VARCHAR, BTIMES_wednesday_to, 100),7)) as wednesday_to " + 
                    ", LOWER(RIGHT(CONVERT(VARCHAR, BTIMES_thursday_from, 100),7)) as thursday_from   , LOWER(RIGHT(CONVERT(VARCHAR, BTIMES_thursday_to, 100),7)) as thursday_to " + 
                    ", LOWER(RIGHT(CONVERT(VARCHAR, BTIMES_friday_from, 100),7)) as friday_from   , LOWER(RIGHT(CONVERT(VARCHAR, BTIMES_friday_to, 100),7)) as friday_to " + 
                    ", LOWER(RIGHT(CONVERT(VARCHAR, BTIMES_saturday_from, 100),7)) as saturday_from   , LOWER(RIGHT(CONVERT(VARCHAR, BTIMES_saturday_to, 100),7)) as saturday_to ";                       
                    
                switch(weekofday){
                    case 0:                        
                        sel = sel + ", LOWER(RIGHT(CONVERT(VARCHAR, BTIMES_sunday_from, 100),7)) as from_time   ,  DATEDIFF(MINUTE,  '" + current_time + "' , BTIMES_sunday_from  ) as different,  LOWER(RIGHT(CONVERT(VARCHAR, BTIMES_sunday_to, 100),7)) as to_time "
                        sel = sel + ", (case when BTIMES_ID in (SELECT BTIMES_ID FROM [CQ_BUSINESS_OPENING_TIMES] where  CAST(GETDATE() AS TIME) BETWEEN cast(BTIMES_sunday_from as TIME) AND cast(BTIMES_sunday_to as TIME)) then 0 else 1 end) as isIn ";
                        sel = sel + ", (case when BTIMES_ID in (SELECT BTIMES_ID FROM [CQ_BUSINESS_OPENING_TIMES] where  cast(BTIMES_sunday_from as TIME) is NULL or  cast(BTIMES_sunday_to as TIME) is NULL ) then 1 else 0 end) as isClosed ";
                        where = ' and BTIMES_sunday_from is not NULL ';
                    break;
                    case 1:                        
                        sel = sel +  ", LOWER(RIGHT(CONVERT(VARCHAR, BTIMES_monday_from, 100),7)) as from_time   ,  DATEDIFF(MINUTE,  '" + current_time + "' , BTIMES_monday_from  ) as different,  LOWER(RIGHT(CONVERT(VARCHAR, BTIMES_monday_to, 100),7)) as to_time"
                        sel = sel + ", (case when BTIMES_ID in (SELECT BTIMES_ID FROM [CQ_BUSINESS_OPENING_TIMES] where  CAST(GETDATE() AS TIME) BETWEEN cast(BTIMES_monday_from as TIME) AND cast(BTIMES_monday_to as TIME)) then 1 else 0 end) as isIn ";
                        sel = sel + ", (case when BTIMES_ID in (SELECT BTIMES_ID FROM [CQ_BUSINESS_OPENING_TIMES] where  cast(BTIMES_monday_from as TIME) is NULL or  cast(BTIMES_monday_to as TIME) is NULL ) then 1 else 0 end) as isClosed ";
                        where = ' and BTIMES_monday_from is not NULL';
                    break;
                    case 2:                        
                        sel = sel +  ", LOWER(RIGHT(CONVERT(VARCHAR, BTIMES_tuesday_from, 100),7)) as from_time   ,  DATEDIFF(MINUTE,  '" + current_time + "' , BTIMES_tuesday_from  ) as different, LOWER(RIGHT(CONVERT(VARCHAR, BTIMES_tuesday_to, 100),7)) as to_time"
                        sel = sel + ", (case when BTIMES_ID in (SELECT BTIMES_ID FROM [CQ_BUSINESS_OPENING_TIMES] where  '" + current_time + "' BETWEEN cast(BTIMES_tuesday_from as TIME) AND cast(BTIMES_tuesday_to as TIME)) then 1 else 0 end) as isIn ";
                        sel = sel + ", (case when BTIMES_ID in (SELECT BTIMES_ID FROM [CQ_BUSINESS_OPENING_TIMES] where  cast(BTIMES_tuesday_from as TIME) is NULL or  cast(BTIMES_tuesday_to as TIME) is NULL ) then 1 else 0 end) as isClosed ";
                        where = ' and BTIMES_tuesday_from is not NULL';
                    break;
                    case 3:                        
                        sel = sel + ", LOWER(RIGHT(CONVERT(VARCHAR, BTIMES_wednesday_from, 100),7)) as from_time , DATEDIFF(MINUTE,  '" + current_time + "' , BTIMES_wednesday_from  ) as different  , LOWER(RIGHT(CONVERT(VARCHAR, BTIMES_wednesday_to, 100),7)) as to_time"
                        sel = sel + ", (case when BTIMES_ID in (SELECT BTIMES_ID FROM [CQ_BUSINESS_OPENING_TIMES] where  CAST(GETDATE() AS TIME) BETWEEN cast(BTIMES_wednesday_from as TIME) AND cast(BTIMES_wednesday_to as TIME)) then 1 else 0 end) as isIn ";
                        sel = sel + ", (case when BTIMES_ID in (SELECT BTIMES_ID FROM [CQ_BUSINESS_OPENING_TIMES] where  cast(BTIMES_wednesday_from as TIME) is NULL or  cast(BTIMES_wednesday_to as TIME) is NULL ) then 1 else 0 end) as isClosed ";
                        where = ' and BTIMES_wednesday_from is not NULL';
                    break;
                    case 4:                        
                        sel = sel + ", LOWER(RIGHT(CONVERT(VARCHAR, BTIMES_thursday_from, 100),7)) as from_time   , DATEDIFF(MINUTE,  '" + current_time + "' , BTIMES_thursday_from  ) as different  , LOWER(RIGHT(CONVERT(VARCHAR, BTIMES_thursday_to, 100),7)) as to_time"
                        sel = sel + ", (case when BTIMES_ID in (SELECT BTIMES_ID FROM [CQ_BUSINESS_OPENING_TIMES] where  CAST(GETDATE() AS TIME) BETWEEN cast(BTIMES_thursday_from as TIME) AND cast(BTIMES_thursday_to as TIME)) then 1 else 0 end) as isIn ";
                        sel = sel + ", (case when BTIMES_ID in (SELECT BTIMES_ID FROM [CQ_BUSINESS_OPENING_TIMES] where  cast(BTIMES_thursday_from as TIME) is NULL or  cast(BTIMES_thursday_to as TIME) is NULL ) then 1 else 0 end) as isClosed ";
                        where = ' and BTIMES_thursday_from is not NULL';
                    break;
                    case 5:                        
                        sel = sel + ", LOWER(RIGHT(CONVERT(VARCHAR, BTIMES_friday_from, 100),7)) as from_time   , DATEDIFF(MINUTE,  '" + current_time + "' , BTIMES_friday_from  ) as different  , LOWER(RIGHT(CONVERT(VARCHAR, BTIMES_friday_to, 100),7)) as to_time"
                        sel = sel + ", (case when BTIMES_ID in (SELECT BTIMES_ID FROM [CQ_BUSINESS_OPENING_TIMES] where  CAST(GETDATE() AS TIME) BETWEEN cast(BTIMES_friday_from as TIME) AND cast(BTIMES_friday_to as TIME)) then 1 else 0 end) as isIn ";
                        sel = sel + ", (case when BTIMES_ID in (SELECT BTIMES_ID FROM [CQ_BUSINESS_OPENING_TIMES] where  cast(BTIMES_friday_from as TIME) is NULL or  cast(BTIMES_friday_to as TIME) is NULL ) then 1 else 0 end) as isClosed ";
                        where = ' and BTIMES_friday_from is not NULL';
                    break;
                    case 6:
                        sel = sel + ", LOWER(RIGHT(CONVERT(VARCHAR, BTIMES_saturday_from, 100),7)) as from_time   , DATEDIFF(MINUTE,  '" + current_time + "' , BTIMES_saturday_from  ) as different  , LOWER(RIGHT(CONVERT(VARCHAR, BTIMES_saturday_to, 100),7)) as to_time"
                        sel = sel + ", (case when BTIMES_ID in (SELECT BTIMES_ID FROM [CQ_BUSINESS_OPENING_TIMES] where  CAST(GETDATE() AS TIME) BETWEEN cast(BTIMES_saturday_from as TIME) AND cast(BTIMES_saturday_to as TIME)) then 1 else 0 end) as isIn ";
                        sel = sel + ", (case when BTIMES_ID in (SELECT BTIMES_ID FROM [CQ_BUSINESS_OPENING_TIMES] where  cast(BTIMES_saturday_from as TIME) is NULL or  cast(BTIMES_saturday_to as TIME) is NULL ) then 1 else 0 end) as isClosed ";
                        //where = ' and BTIMES_saturday_from is not NULL';
                    break;
                }
                
                var query = "select  " + sel + " from [CQ_BUSINESS_OPENING_TIMES] where BPROFILE_ID = '" + req.body.bprofile_id + "' and BTIMES_is_active = 1 " + where;                                                
                
                request.query(query)
                .then(function (results) {                            
                    var responseOb={        
                        "weekofday":day,                
                        "shift": results.recordset,  
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

    // get open tim of business, it is a refernece to be used in the futuer...()
    app.post('/opentime1', function (req, res) { 
        if(req.body.bprofile_id != null){
            conn.connect()
            .then(function () {                                    
                var request = new sql.Request(conn);          
                var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
                var now = new Date();
                var weekofday =  now.getDay();
                var day = days[ now.getDay() ];

                var sel = "*";
                var where = "";

                switch(weekofday){
                    case 0:                        
                        sel = "BTIMES_ID,  RIGHT(CONVERT(VARCHAR, BTIMES_sunday_from, 100),7) as from_time   , RIGHT(CONVERT(VARCHAR, BTIMES_sunday_to, 100),7) as to_time "
                        + ", (case when BTIMES_ID in (SELECT BTIMES_ID FROM [CQ_BUSINESS_OPENING_TIMES] where  CAST(GETDATE() AS TIME) BETWEEN cast(BTIMES_sunday_from as TIME) AND cast(BTIMES_sunday_to as TIME)) then 1 else 0 end) as isIn ";
                        where = ' and BTIMES_sunday_from is not NULL and ';
                    break;
                    case 1:                        
                        sel = "BTIMES_ID,  RIGHT(CONVERT(VARCHAR, BTIMES_monday_from, 100),7) as from_time   , RIGHT(CONVERT(VARCHAR, BTIMES_monday_to, 100),7) as to_time"
                        + ", (case when BTIMES_ID in (SELECT BTIMES_ID FROM [CQ_BUSINESS_OPENING_TIMES] where  CAST(GETDATE() AS TIME) BETWEEN cast(BTIMES_monday_from as TIME) AND cast(BTIMES_monday_to as TIME)) then 1 else 0 end) as isIn ";
                        where = ' and BTIMES_monday_from is not NULL';
                    break;
                    case 2:                        
                        sel = "BTIMES_ID,  RIGHT(CONVERT(VARCHAR, BTIMES_tuesday_from, 100),7) as from_time   , RIGHT(CONVERT(VARCHAR, BTIMES_tuesday_to, 100),7) as to_time"
                        + ", (case when BTIMES_ID in (SELECT BTIMES_ID FROM [CQ_BUSINESS_OPENING_TIMES] where  CAST(GETDATE() AS TIME) BETWEEN cast(BTIMES_tuesday_from as TIME) AND cast(BTIMES_tuesday_to as TIME)) then 1 else 0 end) as isIn ";
                        where = ' and BTIMES_tuesday_from is not NULL';
                    break;
                    case 3:                        
                        sel = "BTIMES_ID,  RIGHT(CONVERT(VARCHAR, BTIMES_wednesday_from, 100),7) as from_time   , RIGHT(CONVERT(VARCHAR, BTIMES_wednesday_to, 100),7) as to_time"
                        + ", (case when BTIMES_ID in (SELECT BTIMES_ID FROM [CQ_BUSINESS_OPENING_TIMES] where  CAST(GETDATE() AS TIME) BETWEEN cast(BTIMES_wednesday_from as TIME) AND cast(BTIMES_wednesday_to as TIME)) then 1 else 0 end) as isIn ";
                        where = ' and BTIMES_wednesday_from is not NULL';
                    break;
                    case 4:                        
                        sel = "BTIMES_ID,  RIGHT(CONVERT(VARCHAR, BTIMES_thirsday_from, 100),7) as from_time   , RIGHT(CONVERT(VARCHAR, BTIMES_thirsday_to, 100),7) as to_time"
                        + ", (case when BTIMES_ID in (SELECT BTIMES_ID FROM [CQ_BUSINESS_OPENING_TIMES] where  CAST(GETDATE() AS TIME) BETWEEN cast(BTIMES_thirsday_from as TIME) AND cast(BTIMES_thirsday_to as TIME)) then 1 else 0 end) as isIn ";
                        where = ' and BTIMES_thirsday_from is not NULL';
                    break;
                    case 5:                        
                        sel = "BTIMES_ID,  RIGHT(CONVERT(VARCHAR, BTIMES_friday_from, 100),7) as from_time   , RIGHT(CONVERT(VARCHAR, BTIMES_friday_to, 100),7) as to_time"
                        + ", (case when BTIMES_ID in (SELECT BTIMES_ID FROM [CQ_BUSINESS_OPENING_TIMES] where  CAST(GETDATE() AS TIME) BETWEEN cast(BTIMES_friday_from as TIME) AND cast(BTIMES_friday_to as TIME)) then 1 else 0 end) as isIn ";
                        where = ' and BTIMES_friday_from is not NULL';
                    break;
                    case 6:
                        sel = " BTIMES_ID,  RIGHT(CONVERT(VARCHAR, BTIMES_saturday_from, 100),7) as from_time   , RIGHT(CONVERT(VARCHAR, BTIMES_saturday_to, 100),7) as to_time"
                        + ", (case when BTIMES_ID in (SELECT BTIMES_ID FROM [CQ_BUSINESS_OPENING_TIMES] where  CAST(GETDATE() AS TIME) BETWEEN cast(BTIMES_saturday_from as TIME) AND cast(BTIMES_saturday_to as TIME)) then 1 else 0 end) as isIn ";
                        where = ' and BTIMES_saturday_from is not NULL';
                    break;
                }
                    
                var query = "select " + sel + " from [CQ_BUSINESS_OPENING_TIMES] where BPROFILE_ID = '" + req.body.bprofile_id + "'" + where;
                request.query(query)
                .then(function (results) {                            
                    var responseOb={        
                        "weekofday":day,                
                        "shift": results.recordset,  
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


    // get business photo from business id. this is used in business details page of mobile app.
    async function getBusinessPhotos(request, bprofile_id){
        return new Promise((resolve, reject) => {

            //request.input('bprofile_id', sql.Int, bprofile_id);
            var myquery = "select BPHOTO_link as photo_link from  [CQ_BUSINESS_PHOTOS] where BPROFILE_ID='" + bprofile_id + "' and BPHOTO_type = '1'";
            request.query(myquery)
            .then(function (results) {
                resolve(results.recordset);                
            })
            // Handle sql statement execution errors
            .catch(function (err) {            
                //conn.close();                
                resolve([]);
                
            })   
        });        
    }

    // get total book number . This is inner function of this file.
    async function getNotificationCount1(request, cprofile_id){
        return new Promise((resolve, reject) => {            
            var myquery = "select count(*) as cnt FROM [CQ_QUEUE_APPT_BASED] where [CQ_QUEUE_APPT_BASED].CPROFILE_ID = '" + cprofile_id + "' and ABASED_checked_out = 0";
            request.query(myquery)
            .then(function (results) {   
                if(results.recordset.length > 0){
                    resolve(results.recordset[0].cnt);
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
    // get total queue and checkin number . This is inner function of this file.
    async function getNotificationCount2(request, cprofile_id){
        return new Promise((resolve, reject) => {
            //request.input('bprofile_id', sql.Int, bprofile_id);
            var myquery = "select count(*) as cnt FROM [CQ_QUEUE_BASED] " + 
            "where [CQ_QUEUE_BASED].CPROFILE_ID = '" + cprofile_id + "' and QBASED_checked_out = 0";
            //(QTYPE_ID = 1 or QTYPE_ID = 2 or QTYPE_ID = 3) and
            request.query(myquery)
            .then(function (results) {   
                if(results.recordset.length > 0){
                    resolve(results.recordset[0].cnt);
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

    // get total order count , this is inner function of this file
    async function getNotificationCount3(request, cprofile_id){
        return new Promise((resolve, reject) => {

            //request.input('bprofile_id', sql.Int, bprofile_id);
            var myquery = "select count(*) as cnt FROM [CQ_CLIENT_ORDER] " + 
            "where [CQ_CLIENT_ORDER].CPROFILE_ID = '" + cprofile_id + "'";
            //(QTYPE_ID = 1 or QTYPE_ID = 2 or QTYPE_ID = 3) and

            request.query(myquery)
            .then(function (results) {   
                if(results.recordset.length > 0){
                    resolve(results.recordset[0].cnt);
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

    async function getMenuName(request, dept_id){
        return new Promise((resolve, reject) => {

            //request.input('bprofile_id', sql.Int, bprofile_id);
            var myquery = "SELECT B.[MENU_ID] ,B.[DEPT_ID] ,B.[MENU_name] ,B.[MENU_type] ,B.[BPHOTO_ID] " + 
                            ", ( select top 1 BPHOTO_link from [CQ_BUSINESS_PHOTOS] where  BPHOTO_ID = B.[BPHOTO_ID] ) as photo " + 
                            "FROM  [dbo].CQ_BUSINESS_DEPARTMENTS A, [dbo].[CQ_BUSINESS_MENUS] B WHERE B.DEPT_ID = A.DEPT_ID " + 
                            " and B.DEPT_ID = " + dept_id + " and B.MENU_is_active=1";
            request.query(myquery)
            .then(function (results) {   
                if(results.recordset.length > 0){
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


    




  };
  
  module.exports = userRoutes;