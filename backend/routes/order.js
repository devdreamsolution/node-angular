const cons = require("consolidate");
const common = require('./common');

const appRouter = (app, fs) => {
    
    const sql = require('mssql')     
    var conn = new sql.ConnectionPool(global.config);    


    // make a new order, it is used in selected order page ( called by clicking confirm roder)
    app.post('/order', function (req, res) {  

        //var id = req.query.id;
        if(  req.body.menuId != null ){
            conn.connect()    
            .then(async function () {
                                
                var request = new sql.Request(conn);

                var cprofile_id = req.body.cprofile_id;
                if(req.body.cprofile_id == null || req.body.cprofile_id == "undefined"){
                    var profile  = await insertTempProfile(request);
                    cprofile_id = profile.id;
                }        

                request.input('menu_id', sql.Int, req.body.menuId);
                request.input('cprofile_id', sql.Int, cprofile_id);
                request.input('coupon_id', sql.Int, 0);
                request.input('payment_id', sql.Int, 0);
                
                request.input('ostatus_id', sql.Int, 1);
                request.input('corder_paid', sql.Int, 0);
                request.input('corder_total', sql.Float, 0);
                request.input('checked_out', sql.Int, 0);
                request.input('checkedout_time', sql.DateTime, common.getCurrentDateTime());
                request.input('created_on', sql.DateTime, common.getCurrentDateTime());
                request.input('created_by', sql.Int, 0);
                request.input('updated_by', sql.Int, 0);

                var order = await insertOrder(request);

                if(order != null){
                    request.input('order_id', sql.Int, order.id);
                    var menus = req.body.menus;
                    for(var i = 0 ; i < menus.length ; i++ ){
                        if(menus[i].count > 0){
                            await insertOrderItem(request,  menus[i]);
                        }                        
                    }

                    var info = await getOrderInfo(request, order.id);
                    var responseOb={                             
                        "id": order.id,
                        "info":info,
                        "cprofile_id":cprofile_id,
                        "status":200
                    }
                    res.send(responseOb);   
                    
                }else{
                    var responseOb={                             
                        "msg":"no order",
                        "status":300
                    }
                    res.send(responseOb);   
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


    // get order api , it is for getting order items by order id. (it will be used later.)
    app.post('/getorder', function (req, res) {  

        //var id = req.query.id;
        if( req.body.order_id ){
            conn.connect()    
            .then(async function () {
                                
                var request = new sql.Request(conn);

                var dtInfo = await getOrderInfo(request, req.body.order_id);
                var query = "SELECT MITEM_name as name,  COS_Quantity as count, 0 as selected,  MITEM_unit_price as unit_price, (COS_Quantity * MITEM_unit_price) as price  " + 
                            "FROM [CQ_CLIENT_ORDER_SELECTION]  " + 
                            "LEFT Join [CQ_BUSINESS_MENU_ITEMS] on [CQ_BUSINESS_MENU_ITEMS].MITEM_ID= [CQ_CLIENT_ORDER_SELECTION].MITEM_ID  " + 
                            "where CORDER_ID = '" + req.body.order_id + "'";


                request.query(query)
                .then(function (results) {
                    if(results.recordset.length >  0){
                        var responseOb={                                                         
                            "order_items":results.recordset,
                            "date":dtInfo,
                            "status":200
                        }
                        res.send(responseOb);   
                    }else{
                        var responseOb={                                                        
                            "msg":"error",
                            "status":300
                        }
                        res.send(responseOb);
                    }                
                })                
                .catch(function (err) {            
                    //conn.close();                    
                    resolve(null);    
                }) 

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


    

    // inner function
    async function getOrderInfo(request, order_id){
        return new Promise((resolve, reject)=>{
                                
             var query = "select  DATENAME(dw,CORDER_created_on) as weekofday, DATEPART (day,CORDER_created_on) as day , DATENAME(month,CORDER_created_on) as month ,  LOWER(RIGHT(CONVERT(VARCHAR, CORDER_created_on, 100),7)) as time   from [CQ_CLIENT_ORDER] where CORDER_ID = '" + order_id + "'";
    
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
    async function insertOrder(request){
        return new Promise((resolve, reject)=>{
                                
             var query = "insert into [CQ_CLIENT_ORDER] (MENU_ID , CPROFILE_ID , PAYMENT_ID , OSTATUS_ID , CORDER_paid " + 
                                    ", CORDER_total , CORDER_checked_out , CORDER_checkout_date_time " + 
                                    ", CORDER_created_on , CORDER_updated_on " + 
                                    ")"  + 
                                    " values (@menu_id ,@cprofile_id ,@payment_id ,@ostatus_id ,@corder_paid ,@corder_total ,@checked_out ,@checkedout_time "+
                                    ",@created_on ,@created_on " + 
                                    "); "+ 
                                    "SELECT SCOPE_IDENTITY() AS id ";
    
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
    async function insertOrderItem(request, menu){
        return new Promise((resolve, reject)=>{
                                
             var query = "insert into [CQ_CLIENT_ORDER_SELECTION] (CORDER_ID , MITEM_ID ,  COS_Quantity , COS_created_by " + 
                                    ", COS_Updated_by  " + 
                                    ", COS_Created_on , COS_Updated_on " + 
                                    ")"  + 
                                    " values (@order_id ," +menu.item_id+ " ," + menu.count + " ,0 , 0 "+
                                    ",@created_on ,@created_on " + 
                                    "); "+ 
                                    "SELECT SCOPE_IDENTITY() AS id";
    
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
    async function insertTempProfile(request) {

        return new Promise((resolve, reject)=>{
            
            var query = "insert into [CQ_CLIENT_PROFILES] (CPROFILE_is_temp_ID, CPROFILE_is_active , CPROFILE_created_on  ) " + 
                        "values ('1', '1', GETDATE()); " + 
                        "SELECT SCOPE_IDENTITY() AS id";
   
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

      
    };


};
module.exports = appRouter;



