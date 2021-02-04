
// static val for distance
exports.MIN_DISTANCE_BOOKING_CLIENT_BUSINESS = function(){
    return 50000;
}
// static val for page load
exports.NUMBER_BUSINESS_ON_SEARCH_PAGE = function(){
    return 10;
}

// get current date
exports.getCurrentDateTime = function() {
    
    var date = new Date();            
    var now= new Date(date.getTime() - (date.getTimezoneOffset() * 60000)); 
    //var dd = now.toISOString().slice(0,10);
    var dt = now.toISOString();
    return dt;
}

// get current time
exports.getCurrentTime = function () {        
    var date = new Date();            
    var now= new Date(date.getTime() - (date.getTimezoneOffset() * 60000)); 
    var dd = now.toISOString().slice(11);
    //var dt = now.toISOString();
    return dd;
}

// get current date.
exports.getCurrentDate = function () {
        
    var date = new Date();            
    var now= new Date(date.getTime() - (date.getTimezoneOffset() * 60000)); 
    var dt = now.toISOString().slice(0,10);
    return dt;

}

// get current year
exports.getCurrentYear = function () {
        
    var date = new Date();            
    var now= new Date(date.getTime() - (date.getTimezoneOffset() * 60000)); 
    var dt = now.toISOString().slice(0,4);
    return dt;

}

// get available status of selectance. used in mobile side for menu.
exports.enabled = function () {
    var date = new Date();            
    var now= new Date(date.getTime() - (date.getTimezoneOffset() * 60000)); 
    var dt = now.toISOString().slice(3,4) - 1;
    return dt;

}

