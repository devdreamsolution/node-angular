import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';



type Menu = {
  'name': string,
  'description': string,
  'departmentId': number
};

type Photo = {
  'profileId': number,
  'type': number,
  'photoUrl': string
};

type Category = {
  'name': string,
  'description': string,
  'googleRef': string,
  'googleCode': string,
  'transactionId': string,
};
type MenuCategory = {
  'name': string,
  'description': string  
};

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  constructor(private http: HttpClient) { }

  // by carl 
  getMenuByDepartment(body) {
    return this.http.post(`${environment.apiUrl}/menus`, body);
  }
  getBusinessByDepartment(body){
    return this.http.post(`${environment.apiUrl}/getBusinessByDept`, body);
  }

  
  //get Category  
  getCategories() {
    return this.http.get(`${environment.apiUrl}/getCategories`);
  }
  //get Menues  
  getMenus(businessId: any) {
    return this.http.get(`${environment.apiUrl}/menu/getMenus/${businessId}`);
  }


  //get Menues  
  getMenuById(deptId: any, menuId: any) {
    return this.http.get(`${environment.apiUrl}/menu/getMenus/${deptId}/${menuId}`);
  }

  //get Category  
  getMenuCategories(profileId: any) {    
    return this.http.get(`${environment.apiUrl}/businessMenu/getMenuCategories/${profileId}`);
  }
  //get SubCategory  
  getMenuSubCategories(profileId: any) {    
    return this.http.get(`${environment.apiUrl}/businessMenu/getMenuSubCategories/${profileId}`);
  }
  //get menuItem
  getMenuItems(profileId: any) {
    return this.http.get(`${environment.apiUrl}/businessMenu/getMenuItems/${profileId}`);
  }
  // add department
  addUpdateMenuCategory(body) {
    
    return this.http.put(`${environment.apiUrl}/businessMenu/addUpdateMenuCategory`, body);
  }
  addUpdateMenuSubCategory(body) {    
    return this.http.put(`${environment.apiUrl}/businessMenu/addUpdateMenuSubCategory`, body);
  }
  delete(body) {
    return this.http.put(`${environment.apiUrl}/businessMenu/delete`, body);
  }

  addUpdateMenuItem(body) {
    return this.http.post(`${environment.apiUrl}/businessMenu/addUpdateMenuItem`, body);
  }
  addMenuImage(body) {
    
    return this.http.post(`${environment.apiUrl}/businessMenu/addMenuImage`, body);
  }
  addUpdateMenu(body) {
    return this.http.post(`${environment.apiUrl}/businessMenu/addUpdateMenu`, body);
  }
  
}
