import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { connectableObservableDescriptor } from 'rxjs/internal/observable/ConnectableObservable';
import { MenuItem } from '../../../../../models/menu.model';
import { SharedService } from '../../../../../services/shared.service';
import { MenuService } from '../../../../../services/menu.service';

@Component({
  selector: 'app-orderheader',
  templateUrl: './orderheader.component.html',
  styleUrls: ['./orderheader.component.scss']
})
export class OrderHeaderComponent implements OnInit {
  menuItems: MenuItem[];
  totalPrice: number = 0;
  headerText: string;
  totalQuantity: number = 0;
  isNew:number = 0;
  businessData:any;
  menuData:any;

  constructor(private menuService: MenuService, public router: Router, private sharedService: SharedService) { }
  
  ngOnInit(): void {

    this.sharedService.currentTotalPrice.subscribe(totalPrice => {
      this.totalPrice = totalPrice;
    });

    this.sharedService.currentTotalQuantity.subscribe(totalQuantity => {
      this.totalQuantity = totalQuantity;
      console.log("total", totalQuantity);
    });
  

    this.sharedService.currentHeaderText.subscribe(headerText => {
      if(headerText != null){
        console.log("callederr");
        //this.headerText = headerText;
      }      
    });  

    this.headerText = "Menu";
    
    this.sharedService.currentDeptId.subscribe(dept_id => {
      console.log("my dept id", dept_id);
      if(dept_id != 0){
        this.getBusiness(dept_id);
      }      
    }); 

    

  }

  ngAfterViewInit() {
    console.log("header view called");    
  }

  getBusiness(deptId) {
    var body = { department_id : deptId};
    this.menuService.getBusinessByDepartment(body).subscribe(res => {      
      var response = JSON.parse(JSON.stringify(res));
      console.log("my response", response);
      if(response.status == 200){
        console.log("header page", response.menus); 
        
        this.businessData = response.business;
        this.menuData = response.menu;

      }else if(response.staus == 300){

      }

    });
  }


  getTotal() {
    this.menuItems.forEach(mi => {
      this.totalPrice = 0;
      var eachItem = mi.unit_price * mi.count;
      this.totalPrice = this.totalPrice + eachItem;
    });
  }
  getBackgroundImageUrl(){
    if(this.menuData != null && this.menuData.photo.includes("http")){
      return `url(${this.menuData.photo})`   
    }  

    if(this.businessData != null){
      return `url(${this.businessData.photo})`   
    }    
  }
  goBack(){    
    
    this.headerText = "Menu";
  }
  order() {

    //this.headerText = "Your Order";
    var countl;
    this.sharedService.currentTotalQuantity.subscribe(r =>{
      countl = r;
    });    
    if (countl)
      this.router.navigate(['order']);          
  }

  onBack(){
    window.history.back();
  }

}
