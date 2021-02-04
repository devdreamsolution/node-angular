const appRouter = (app, fs) => {

    const sql = require('mssql')     
    var conn = new sql.ConnectionPool(global.config);    

    // get category api, it is used for business search . called on filter dialog.
    app.get('/categories', function (req, res) {  
                      
        //var id = req.query.id;        
        conn.connect()    
        .then(function () {                                    
            var request = new sql.Request(conn);                       
            var query = "SELECT CATG_ID, CATG_Name FROM [CQ_ADM_CATEGORIES]";
            request.query(query)
            .then(function (results) {  
                var responseOb={                        
                    "categories": results.recordset, 
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

