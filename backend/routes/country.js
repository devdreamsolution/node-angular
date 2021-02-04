const appRouter = (app, fs) => {

    const sql = require('mssql')     
    var conn = new sql.ConnectionPool(global.config);    

    // get all country api, it is used in register page.
    app.get('/country', function (req, res) {  
                      
        //var id = req.query.id;        
        conn.connect()    
        .then(function () {                                    
            var request = new sql.Request(conn);                       
            var query = "select * from  [CQ_ADM_COUNTRIES] WHERE COUNTRY_Is_Active = 1";
            request.query(query)
            .then(function (results) {  
                var responseOb={                        
                    "country": results.recordset, 
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
        
    });


};
module.exports = appRouter;

