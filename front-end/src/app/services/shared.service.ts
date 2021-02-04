import { Injectable } from "@angular/core";
import { BehaviorSubject } from 'rxjs';
import { MenuItem } from "../models/menu.model";


@Injectable()
export class SharedService {
  private MenuItemSource = new BehaviorSubject<MenuItem[]>(null);
  currentMenuItem = this.MenuItemSource.asObservable();


  private TotalPriceSource = new BehaviorSubject<number>(0);
  currentTotalPrice = this.TotalPriceSource.asObservable();

  private headerTextSource = new BehaviorSubject<string>("Menu");
  currentHeaderText = this.headerTextSource.asObservable();

  private deptIdSource = new BehaviorSubject<number>(0);
  currentDeptId = this.deptIdSource.asObservable();


  private menuIdSource = new BehaviorSubject<number>(0);
  currentMenuId = this.menuIdSource.asObservable();

  private totalQuantitySource = new BehaviorSubject<number>(0);
  currentTotalQuantity = this.totalQuantitySource.asObservable();
  
  private menuItemSourceFromOrder = new BehaviorSubject<MenuItem[]>(null);
  menuItemObserv = this.menuItemSourceFromOrder.asObservable();


  constructor() {
  }

  changeMenuItem(obj: MenuItem[]) {
    this.MenuItemSource.next(obj);
  }
  changeTotalPrice(obj: number) {
    this.TotalPriceSource.next(obj);
  }
  
  changeHeaderText(obj: string) {
    this.headerTextSource.next(obj);
  }

  changeDeptId(obj: number) {
    this.deptIdSource.next(obj);
  }

  changeMenuId(obj: number) {
    this.menuIdSource.next(obj);
  }


  
  changeTotalQuantity(obj: MenuItem[]) {
    let totalQty = 0
    if (obj){
      obj.forEach(mi => {
        totalQty = totalQty + mi.count;
      });
    }
    this.totalQuantitySource.next(totalQty);
  }

  changeMenuItemSourceFromOrder(obj:MenuItem[]){
    this.menuItemSourceFromOrder.next(obj);    
  }

}
