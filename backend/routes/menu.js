const appRouter = (app, fs) => {

    const sql = require('mssql')     
    var conn = new sql.ConnectionPool(global.config);    


    // get all menus , it is used in menu page for getting all menus 
    app.post('/menus', function (req, res) {  
                      
        //var id = req.query.id;          
        if(req.body.department_id != null){
            conn.connect()    
            .then(function () {                                    
                var request = new sql.Request(conn);
                var tmp = '';
                if(req.body.menu_id != null){
                    tmp = " and  F.MENU_ID =  '" + req.body.menu_id + "'";
                }      

                var query = "SELECT C.MENU_ID as menu_id, D.MCAT_ID as cat_id, C.MITEM_ID as item_id, E.MSCAT_ID as sub_id, D.MCAT_name as category, E.MSCAT_name as subcategory, C.MITEM_name as name , C.MITEM_unit_price as unit_price, C.MITEM_unit_type as unit_type, C.MITEM_unit_amount , C.MITEM_description as des" + 
                    ", C.MITEM_allergies as allergies , C.MITEM_vegetarian as vegetarian, C.MITEM_glutten_free as glutten_free , C.MITEM_vegan as vegan " + 
                    ", (SELECT BPHOTO_link as photo from [CQ_BUSINESS_PHOTOS] WHERE BPHOTO_ID = F.BPHOTO_ID) as menu_link,  " + 
                    "(SELECT BPHOTO_link as photo from [CQ_BUSINESS_PHOTOS] WHERE BPHOTO_ID = C.BPHOTO_ID) as item_link " + 
                    "FROM (CQ_BUSINESS_MENU_ITEMS C  " + 
                    "LEFT JOIN [dbo].CQ_BUSINESS_MENU_CATEGORIES D ON C.MENUCAT_ID = D.MCAT_ID " + 
                    "LEFT JOIN [dbo].CQ_BUSINESS_MENU_SUBCATEGORIES E ON C.MENUSCAT_ID = E.MSCAT_ID " + 
                    "LEFT JOIN [dbo].CQ_BUSINESS_MENUS F ON C.MENU_ID = F.MENU_ID) " + 
                    "WHERE F.DEPT_ID = '" + req.body.department_id +  "'" + tmp + " order by case when MCAT_name is null then 1 else 0 end  , MCAT_name" ;
    
                request.query(query)
                .then(async function (results) {  
                    var dd = parseMenuData(results.recordset);
                    var responseOb={                        
                        "menus": dd, 
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
                "menus": " no parameter", 
                "status": 400}; 
            return res.send(responseOb);   
        }        
    });

    

    // inner function
    function parseMenuData(original_data) {
        
        var cattmp = "";
        var subcattmp = "";
        var menus = [];
        var menu_items = [];
        var menu_category = [];
        var sub_id = '';
        var cat_id = '';
    
        for(var i = 0 ; i < original_data.length ; i++){                     
            if(  original_data[i].subcategory != subcattmp ||  ( original_data[i].category == null) ){ //original_data[i].category != cattmp &&
                if(menu_items.length > 0){                                
                    menus.push({"subcategory":subcattmp,  "cat_id":cat_id, "sub_id":sub_id,  "items":menu_items, "length":menu_items.length, "category":cattmp});
                    menu_items = [];
                }
                subcattmp = original_data[i].subcategory;                             
                cattmp = original_data[i].category;                                                       
                sub_id = original_data[i].sub_id;
                cat_id = original_data[i].cat_id;

                
                var obj = {'menu_id':original_data[i].menu_id, "sub_id":sub_id, 'item_id':original_data[i].item_id, 'name':original_data[i].name, 'item_link':original_data[i].item_link, 'des':original_data[i].des , 'unit_price':original_data[i].unit_price, 'count':0, 
                'selected': 0 , 'allergies' : original_data[i].allergies, 'vegetarian': original_data[i].vegetarian, 'glutten_free':original_data[i].glutten_free, 'vegan':original_data[i].vegan };
                menu_items.push(obj);
            }else{                
                var date = new Date();            
                var now= new Date(date.getTime() - (date.getTimezoneOffset() * 60000)); 
                var dt = now.toISOString().slice(3,4);
                var obj = {'menu_id':original_data[i].menu_id, 'sub_id':original_data[i].sub_id,  'item_id':original_data[i].item_id, 'name':original_data[i].name, 'item_link':original_data[i].item_link, 'des':original_data[i].des , 'unit_price':original_data[i].unit_price, 'count':0, 
                'selected':Number(dt) - 1 , 'allergies' : original_data[i].allergies, 'vegetarian': original_data[i].vegetarian, 'glutten_free':original_data[i].glutten_free, 'vegan':original_data[i].vegan };
                menu_items.push(obj);                            
            }
            
        }                                        
        if(menu_items.length > 0){                                
            menus.push({"subcategory":subcattmp, "sub_id":sub_id, "menu_id":cat_id,  'isShown':true, "items":menu_items, "length":menu_items.length, "category":cattmp});
            menu_items = [];
            subcattmp = "";
        }
            
        cattmp = "";
        cat_id = "";
        sub_id = "";
        var totalMenu = [];
        
        for(var i = 0 ; i < menus.length ; i++){  
            if(menus[i].category != cattmp){
                if(menu_category.length > 0){
                    totalMenu.push({"category":cattmp, "cat_id":cat_id,  'isShown':cattmp==null?true:false, "items":menu_category, "length":menu_category.length });
                    menu_category = [];
                }
                cattmp = menus[i].category;
                cat_id = menus[i].cat_id;
                sub_id = menus[i].sub_id;

                var obj = {'subcategory':menus[i].subcategory, "sub_id":menus[i].sub_id ,  'isShown':menus[i].subcategory==null?true:false, 'items':menus[i].items};
                menu_category.push(obj);
            }else{
                var obj = {'subcategory':menus[i].subcategory, "sub_id":menus[i].sub_id , 'isShown':menus[i].subcategory==null?true:false, 'items':menus[i].items};
                menu_category.push(obj);
            }
        }

        if(menu_category.length > 0){                                
            totalMenu.push({"category":cattmp, 'cat_id':cat_id,  'isShown':cattmp==null?true:false, "items":menu_category, "length":menu_category.length});
            menu_category = [];
            cattmp = "";
        }
        return totalMenu;

    }



};
module.exports = appRouter;

