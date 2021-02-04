import { Component, OnInit } from '@angular/core';
import { SharedService } from '../../services/shared.service';
import { OrderService } from '../../services/order.service';

import { MenuItem } from '../../models/menu.model';
import { Router } from '@angular/router';
import {ConfirmationDialogServiceService} from '../shared/dialog/confirmation-dialog/confirmation-dialog-service.service';

@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.scss']
})
export class OrderComponent implements OnInit {
  menuItems: MenuItem[];
  totalPrice: number = 0;
  taxes :number = 0;
  service_charges: number = 0;
  discount : number = 0;
  grand_total:number = 0;
  submitted: boolean;
  currentTime = new Date();
  client_name = "";
  table_number = "";
  deptId = 0;
  menuId = 0;
  constructor(private sharedService: SharedService, private router: Router, private orderService: OrderService, private confirmationDialogService:ConfirmationDialogServiceService) {
    
    this.submitted = false;
  }

  ngOnInit(): void {
    console.log("order called");
    this.getMenuItems();
    
    console.log(this.menuId);
  }

  
  public openConfirmationDialog() {
    this.confirmationDialogService.confirm('Please confirm.', 'Do you really want to order this menu items?')
    .then((confirmed) => {
      if(confirmed){
        this.onOrderSubmit();
      }else{
        console.log("canceld");
      }            
    })
    .catch(() => console.log('User dismissed the dialog (e.g., by using ESC, clicking the cross icon, or clicking outside the dialog)'));
  }

  plus(item: MenuItem) {
    item.count = item.count + 1;
    this.getTotal();    
  }

  minus(item: MenuItem) {
    if (item.count != 0) {
      item.count = item.count - 1;
    }
    if (item.count === 0) this.menuItems = this.menuItems.filter(i => i.item_id != item.item_id);
    if (this.menuItems.length === 0 ) this.submitted = true;
    this.getTotal();
  }

  getTotal() {
    this.totalPrice = 0;
    if (this.menuItems) {      
      console.log(this.menuItems);
      this.menuItems.forEach(mi => {
        this.totalPrice = this.totalPrice + (mi.unit_price * mi.count);        
      });      
    }
    this.sharedService.changeTotalPrice(this.totalPrice);
    this.sharedService.changeTotalQuantity(this.menuItems);
    console.log("called menu items", this.menuItems);
    this.sharedService.changeMenuItemSourceFromOrder(this.menuItems);  

  }
  getMenuItems() {
    this.sharedService.currentMenuItem.subscribe(menuItem => {
      this.menuItems = menuItem;
      this.getTotal();
    });    

    this.sharedService.currentMenuId.subscribe(menuId =>{
      this.menuId = menuId;
    });
    this.sharedService.currentDeptId.subscribe(deptId =>{
      this.deptId = deptId;
    });
  }

  onOrderSubmit() {
    console.log(this.menuItems);  
    console.log(this.client_name);
    console.log(this.table_number);
    let data = {
      cprofile_id : sessionStorage.getItem("cprofile_id"),
      menus : this.menuItems,
      menuId : this.menuId,
      client_name:this.client_name,
      table_number:this.table_number,
      total_price:this.totalPrice
    }
    
    console.log("submit data",data);
    this.orderService.addOrderItems(data).subscribe(r => {
      
      this.submitted = true;      
      console.log(r);
      sessionStorage.setItem("cprofile_id", r['cprofile_id']);      
      this.sharedService.changeMenuItemSourceFromOrder([]); 
      this.totalPrice =  Math.floor(r['order'].total);
      this.taxes = Math.floor(r['order'].taxes);
      this.service_charges = Math.floor(r['order'].service_charges);
      this.discount = Math.floor(r['order'].discount);  
      this.grand_total = Math.floor(r['order'].grand_total);  
    }, err => console.log(err))
  }
  
  goBack(){        
    this.sharedService.changeHeaderText("Menu");
  }

  navigationToMenu() {    
    this.sharedService.changeTotalPrice(0);
    this.sharedService.changeTotalQuantity([]);
    this.sharedService.changeMenuItem([]);    
    this.sharedService.changeHeaderText("Menu");    
    this.router.navigate(['/menu/' + this.deptId + '/' + this.menuId]);

  }
}
