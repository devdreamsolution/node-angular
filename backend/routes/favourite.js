const appRouter = (app, fs) => {

    const sql = require('mssql')     
    var conn = new sql.ConnectionPool(global.config);    


    // get favorite business api, it is used in favorite page.
    app.post('/favourite', function (req, res) {                                
        //var id = req.query.id;     
        if(req.body.cprofile_id != null && req.body.bprofile_id != null){            

            conn.connect()    
            .then(function () {                                    
                var request = new sql.Request(conn);

                if(req.body.favourite  != null){ // updated favorite 

                }else{  // add favorite    
                
                    var cprofile_id= req.body.cprofile_id;
                    var bprofile_id = req.body.bprofile_id;                                
                    var query = "select * from [CQ_CLIENT_FAVORITES] where CPROFILE_ID ='" + cprofile_id + "' and BPROFILE_ID = '" + bprofile_id + "'";
                    request.query(query)
                    .then(function (results) {

                        if(results.recordset.length > 0){
                            deleteFavorite(request, cprofile_id, bprofile_id);
                            var responseOb={                        
                                "msg": "success" ,
                                "status":300
                            }
                            res.send(responseOb); 

                        }else{
                            addFavourite(request, cprofile_id, bprofile_id);
                            var responseOb={                        
                                "msg": "success" ,
                                "status":200
                            }
                            res.send(responseOb); 

                        }                        
                        
                        
                    })                        
                    .catch(function (err) {                          
                        conn.close();
                        var responseOb={
                            "msg": err,
                            "status":300
                        }
                        res.send(responseOb);  
                    })   
                  
                }
                
                
                
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

    //inner function
    async function addFavourite(request, cprofile_id, bprofile_id){

        request.input('cprofile_id', sql.Int, cprofile_id);
        request.input('bprofile_id', sql.Int, bprofile_id);
        
        var datetime = new Date();        
        request.input('cfav_is_deleted', sql.Int, 0);
        request.input('cfav_updated_on', sql.DateTime, datetime);

        var query = "insert into [CQ_CLIENT_FAVORITES] (CPROFILE_ID , BPROFILE_ID , CFAV_is_deleted, CFAV_updated_on) " + 
                    "values (@cprofile_id,@bprofile_id,@cfav_is_deleted,@cfav_updated_on); " + 
                    "SELECT SCOPE_IDENTITY() AS id";
        request.query(query)
        .then(function (results) {
            if(results.recordset.length > 0){
                var id = results.recordset[0].id;                
            }            
            conn.close();
            return true;
        })                        
        .catch(function (err) {  
            conn.close();
            return false;
        })   
    }

    //inner function
    async function deleteFavorite(request, cprofile_id, bprofile_id){

        request.input('cprofile_id', sql.Int, cprofile_id);
        request.input('bprofile_id', sql.Int, bprofile_id);
        
        var datetime = new Date();        
        //request.input('cfav_is_deleted', sql.Int, 0);
        //request.input('cfav_updated_on', sql.DateTime, datetime);

        var query = "delete from [CQ_CLIENT_FAVORITES] where CPROFILE_ID=@cprofile_id and BPROFILE_ID=@bprofile_id";
        request.query(query)
        .then(function (results) {                      
            conn.close();
            return true;
        })                        
        .catch(function (err) {  
            conn.close();
            return false;
        })   
    }


};
module.exports = appRouter;

