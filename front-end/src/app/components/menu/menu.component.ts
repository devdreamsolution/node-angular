import { Component, OnInit } from '@angular/core';
import { Menu, MenuCategory, MenuItem } from '../../models/menu.model';
import { MenuService } from '../../services/menu.service';
import { ActivatedRoute } from '@angular/router';
import { ResponseApi } from '../../models/response.model'
import { environment } from '../../../environments/environment';
import { SharedService } from '../../services/shared.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {
  searchmodel = "";
  port = environment.apiServer;  
  businessData :any;
  menuData:any;
  menu: any;
  origin_menu:any;  
  isMenuActive:boolean = true;  
  isBusinessActive:boolean = true;
  totalPrice: number = 0;
  menuItems: MenuItem[] = [];  
  departmentId: number;
  menuId: number;
  currentItemPrice: number = 0;
  constructor(private menuService: MenuService, private sharedService: SharedService, private route: ActivatedRoute) {
    this.sharedService.changeHeaderText("Menu");
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.departmentId = params.dept_id;
      this.menuId = params.menu_id;     
      console.log("param menu id", this.menuId); 
      this.getMenus(this.departmentId, this.menuId);
      this.getBusiness(this.departmentId);    
      this.sharedService.changeDeptId(this.departmentId); 
    });

    
    this.sharedService.menuItemObserv.subscribe(menu_items =>{
      if(menu_items != null){
        this.menuItems = menu_items;        
      }
      if( menu_items != null &&  menu_items.length == 0){
        this.totalPrice = 0;        
      }
    });
    
    this.sharedService.changeHeaderText("Menu");
    
  }

  getMenus(deptId, menuId) {

    if (typeof Number(deptId) === 'number' && typeof Number(menuId) === 'number') {

        var body = { department_id : deptId, menu_id:menuId};
        this.menuService.getMenuByDepartment(body).subscribe(res => {      
          var response = JSON.parse(JSON.stringify(res))      
          console.log("api menu call", response);
          if(response.status == 200){        
            this.menu = response.menus;      
            this.origin_menu = response.menus;
    
            if(this.menu.length == 0){          
              this.isMenuActive = false;
            }
    
            if(this.menu != null && this.menuItems != null && this.menuItems.length > 0){
              for(var category = 0; category < this.menu.length; category++){
                for(var subcategory = 0; subcategory < this.menu[category].items.length; subcategory++){          
                  for(var k = 0; k < this.menu[category].items[subcategory].items.length; k++){
                    var index = -1;
                    for(var j = 0 ; j < this.menuItems.length ; j++){
                      if(this.menuItems[j].item_id ==   this.menu[category].items[subcategory].items[k].item_id ){ 
                        index = j;
                      }                
                    }
                    if(index != -1 ){
                      this.menu[category].items[subcategory].items[k] = this.menuItems[index];
                    }                  
                  }
                }
              }                
            }else{          
              this.totalPrice = 0;    
              this.setOrder();      
            }
          }      
        });        
    }
    
  }

  // get business information by department id.
  getBusiness(deptId) {
    var body = { department_id : deptId};
    this.menuService.getBusinessByDepartment(body).subscribe(res => {      
      var response = JSON.parse(JSON.stringify(res))      
      if(response.status == 200){                
        this.businessData = response.business;
        this.menuData = response.menu;        
      }else{
        this.businessData = response.business;
        this.menuData = response.menu;
      }
      if(this.businessData != null && this.businessData.business_active == true){
        this.isBusinessActive = true;
      }else{
        this.isBusinessActive = false;
      }

    });
  }


  getSelectedItemList(){
    for(var category = 0; category < this.menu.length; category++){
      for(var subcategory = 0; subcategory < this.menu[category].items.length; subcategory++){        
        for(var k = 0; k < this.menu[category].items[subcategory].items.length; k++){
          if(this.menu[category].items[subcategory].items[k].count > 0){
            this.menuItems.push(this.menu[category].items[subcategory].items[k]);
          }          
        }
      }
    }    
    this.setOrder();
  }
  
  setOrder() {
    this.getTotal();
    this.sharedService.changeMenuItem(this.menuItems);
    this.sharedService.changeTotalPrice(this.totalPrice);
    this.sharedService.changeTotalQuantity(this.menuItems);
    this.sharedService.changeMenuId(this.menuId);
  }
  

  getTotal() {
    this.totalPrice = 0;
    this.menuItems.forEach(mi => {
      this.totalPrice = this.totalPrice + (mi.unit_price * mi.count);
    });
  }

  plus(item: MenuItem) {
    
    item.count = item.count + 1;
    if (this.menuItems.find(mi => mi.item_id == item.item_id) == null) {
      this.menuItems.push(item);
    }else {
      this.menuItems.forEach(mi => {
        if (mi.item_id == item.item_id) {
          mi.count = item.count;
        }
      });
    }
    //sessionStorage.setItem("menus", JSON.stringify(this.menu));
    this.setOrder()
  }

  minus(item: MenuItem) {
    if (item.count != 0) {
      item.count = item.count - 1;
      this.menuItems.forEach(mi => {
        if (mi.item_id == item.item_id) {
          mi.count = item.count;
        }
      });
      //sessionStorage.setItem("menus", JSON.stringify(this.menu));
      this.setOrder()
    }
  }

  accordianToggle(id) {

    var ext = id;
    if(id == undefined){
      ext = '';
    }

    const ele = document.getElementById('top_' + ext);
    const anEle = document.getElementById("ioc_" + ext);
    
    let toggle = false;
        
    if(ele != undefined ){
      toggle = ele.classList.contains("show");    
    }
    
    const eles = document.getElementsByClassName('top_angle'); 
    for (var i = 0; i < eles.length; ++i) {        
      eles[i].removeAttribute("style");      
    }

    anEle.setAttribute("style", "transform: translateY(-50%) rotate(180deg)");

    // hide all expanded ones
    const topViews = document.getElementsByClassName('top');  
    for (var i = 0; i < topViews.length; ++i) {
      var item = topViews[i];      
      if (item['classList'].contains("show")  && item.getAttribute("id") != "top_"){
        item['classList'].remove("show");
      } // && item.getAttribute("id") != parentID)        
    }

    if (!toggle) {      
      ele.classList.add("show");
    } else {      
      ele.classList.remove("show");
      anEle.removeAttribute("style");
    }

  }


  subAccordianToggle(cat_id, sub_id) {
    const ele = document.getElementById('bottom_' + cat_id + "_" + sub_id);
    const anEle = document.getElementById("ioc_" + cat_id + "_" + sub_id );

    let toggle = ele.classList.contains("show");    
    
    const eles = document.getElementsByClassName('sub_angle'); 
    for (var i = 0; i < eles.length; ++i) {        
      eles[i].removeAttribute("style");      
    }
    anEle.setAttribute("style", "transform: translateY(-50%) rotate(180deg)");

    // hide all expanded ones
    const bottomViews = document.getElementsByClassName('bottom');

    for (var i = 0; i < bottomViews.length; ++i) {
      var item = bottomViews[i];               
      var splitted1 = item.getAttribute("id").split("_"); 
      if (item['classList'].contains("show")  && item.getAttribute("id") != "bottom_" 
          && item.getAttribute("id") != "bottom__" && splitted1[2] != ''){
        item['classList'].remove("show");
      } // && item.getAttribute("id") != parentID)        
    }


    if (!toggle) {
      ele.classList.add("show");
    } else {      
      ele.classList.remove("show");
      anEle.removeAttribute("style");      
    }
  }


  setFilter() {

    var filtered_data = [];
    var isCat = false;
    var isSub = false;

    for(var category = 0; category < this.origin_menu.length; category++){

      var tmp = {};
      var sub = [];      

      if(this.searchmodel != null && this.searchmodel.length > 0 ){  
        isCat = false;
         if(this.origin_menu[category].category  != null &&  this.origin_menu[category].category.toLowerCase().includes(this.searchmodel.toLowerCase()) ){           
            isCat = true;
         }

        for(var subcategory = 0; subcategory < this.origin_menu[category].items.length; subcategory++){

          isSub = false;

          if(this.origin_menu[category].items[subcategory].subcategory  != null &&  this.origin_menu[category].items[subcategory].subcategory.toLowerCase().includes(this.searchmodel.toLowerCase()) ){
              isSub = true;
          }
          var items = [];
          for(var k = 0; k < this.origin_menu[category].items[subcategory].items.length; k++){              
            var obj = {};
            if( isCat || isSub || this.origin_menu[category].items[subcategory].items[k].name.toLowerCase().includes(this.searchmodel.toLowerCase())  ){
              var it = this.origin_menu[category].items[subcategory].items[k];
              var index =  -1;
              for(var j = 0 ; j < this.menuItems.length ; j++){
                if(this.menuItems[j].item_id ==   this.origin_menu[category].items[subcategory].items[k].item_id ){      
                  index = j;
                }                
              }

              if(index != -1){
                obj = {'menu_id':it.menu_id, 'item_id':it.item_id, 'name':it.name, 'item_link':it.item_link, 'des':it.des , 'unit_price':it.unit_price, 'count':this.menuItems[index].count, 
                'selected':0 , 'allergies':it.allergies , 'glutten_free':it.glutten_free , 'vegetarian':it.vegetarian, 'vegan':it.vegan};  
              }else{
                obj = {'menu_id':it.menu_id, 'item_id':it.item_id, 'name':it.name, 'item_link':it.item_link, 'des':it.des , 'unit_price':it.unit_price, 'count':0, 
                'selected':0 , 'allergies':it.allergies , 'glutten_free':it.glutten_free , 'vegetarian':it.vegetarian, 'vegan':it.vegan};
              }
              items.push(obj);

            }                   
          }
          var v1 = {subcategory:null, sub_id:null, isShown:true, items:items};
          sub.push(v1);
          
        }
      }    
      tmp = {category:null, cat_id:null, isShown:true, items:sub};
      filtered_data.push(tmp);
    }

    
    if(this.searchmodel == null || this.searchmodel.length == 0){
      filtered_data = [];
      for(var category = 0; category < this.origin_menu.length; category++){
        for(var subcategory = 0; subcategory < this.origin_menu[category].items.length; subcategory++){          
          for(var k = 0; k < this.origin_menu[category].items[subcategory].items.length; k++){
            for(var j = 0 ; j < this.menuItems.length ; j++){
              console.log(j);
              if(this.menuItems[j].item_id ==   this.origin_menu[category].items[subcategory].items[k].item_id ){
                this.origin_menu[category].items[subcategory].items[k] = this.menuItems[j];
              }
            }            
          }
        }
      }      
      this.menu = this.origin_menu;
    }else{
      this.menu = filtered_data;
    }

  }

  updateVisibility(data) {
    const itemcategories = []
    for (let index = 0; index < data.menuCategories.length; index++) {
      const categories = data.menuCategories[index];
      categories.visible = false;
      let isCategoryMatched = false;
      if (categories.name && categories.name.toLowerCase().includes(this.searchmodel.toLocaleLowerCase())) {
        categories.visible = true;
        isCategoryMatched = true;
        for (let j = 0; j < categories.menuItems.length; j++) {
          const ch = categories.menuItems[j];
          ch.visible = isCategoryMatched;
        }

        for (let k = 0; k < categories.menuSubCategories.length; k++) {
          const mch = categories.menuSubCategories[k];
          mch.visible = true;
          for (let n = 0; n < mch.menuItems.length; n++) {
            const mchItem = mch.menuItems[n];
            categories.visible = true;
            mch.visible = true;
            mchItem.visible = true;

          }
        }

      }

      if (categories.menuItems && categories.menuItems.length > 0 && !isCategoryMatched)
        for (let l = 0; l < categories.menuItems.length; l++) {
          const ch = categories.menuItems[l];
          ch.visible = false;
          if (ch.name && ch.name.toLowerCase().includes(this.searchmodel.toLocaleLowerCase())) {
            categories.visible = true;
            ch.visible = true;

          }
        }

      if (categories.menuSubCategories && categories.menuSubCategories.length > 0 && !isCategoryMatched) {
        for (let k = 0; k < categories.menuSubCategories.length; k++) {
          const mch = categories.menuSubCategories[k];
          let isSubCategoryMatched = false
          mch.visible = false;
          if (mch.name && mch.name.toLowerCase().includes(this.searchmodel.toLocaleLowerCase())) {
            categories.visible = true;
            mch.visible = true;
            isSubCategoryMatched = true;

          }

          if (mch.menuItems && mch.menuItems.length > 0 && !isSubCategoryMatched)
            for (let n = 0; n < mch.menuItems.length; n++) {
              const mchItem = mch.menuItems[n];
              mchItem.visible = false;

              if (mchItem.name && mchItem.name.toLowerCase().includes(this.searchmodel.toLocaleLowerCase())) {
                categories.visible = true;
                mch.visible = true;
                mchItem.visible = true;

              }
            }
        }
      }

      itemcategories.push(categories);
    }
    return itemcategories;
  }

  endSearch(){
    this.searchmodel = '';
    this.setFilter();
  }
}
