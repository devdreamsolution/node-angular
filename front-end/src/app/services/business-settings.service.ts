import { environment } from './../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';


type mappingData = {
  'address': string,
  'cityId': string,
  'postCode': string,
  'countryId': string
};
type forgotPassword = {
  'email': string,
  'url': string
};



type token = {
  'key': string,
};
type newPassword = {
  'key': string,
  'newPassword': string,
};
@Injectable({
  providedIn: 'root',
})
export class BusinessSettingsService {
  constructor(private http: HttpClient) { }

  businessProfileSettings(body) {
    console.log('body', body);
    return this.http.post(`${environment.apiUrl}/businessUpdate`, body);
  }

  shareQR(body) {
    return this.http.post(
      `${environment.apiUrl}/businessSettingRoute/qrcode`,
      body
    );
  }
  getQRDetails(profileId) {
    return this.http.get(`${environment.apiUrl}/businessSettingRoute/qrcode/${profileId}`);
  }

  manageOpeningShifts(body) {
    return this.http.post(`${environment.apiUrl}/businessShift`, body);
  }

  getOpeningShifts(profileId: number) {
    return this.http.get(`${environment.apiUrl}/businessShift/${profileId}`);
  }

  getBusinessProfile(body) {
    return this.http.post(`${environment.apiUrl}/businessProfile`, body);
  }

  // get all countries
  getAllCountries() {
    return this.http.get(`${environment.apiUrl}/getCountries`);
  }
  // get respected cities with country ID
  getCities(id: number) {
    const body = {
      countryId: id
    };
    return this.http.post(`${environment.apiUrl}/getCities`, body);
  }


  // update mapping data
  getMappingData(id: number) {
    return this.http.get(`${environment.apiUrl}/businessSettingRoute/mapData/${id}`);
  }
  // update mapping data
  updateMapping(data: mappingData) {
    return this.http.post(`${environment.apiUrl}/businessSettingRoute/mapData`, data);
  }

  // send email for forgot password
  forgotPassword(data: forgotPassword) {
    return this.http.post(`${environment.apiUrl}/business/forgotPassword`, data);
  }

  validateToken(data: token) {
    return this.http.post(`${environment.apiUrl}/business/passwordLinkValidation`, data);
  }
  // update new password
  newPassword(data: newPassword) {
    return this.http.post(`${environment.apiUrl}/business/newPassword`, data);
  }

  // add department
  addDepartment(body) {
    return this.http.post(`${environment.apiUrl}/businessSettingRoute/businessDepartment/`, body);
  }

  // get Depmartments
  getDepartments(profileId) {
    console.log('service', profileId);
    return this.http.get(`${environment.apiUrl}/businessSettingRoute/businessDepartment/${profileId}`);
  }
  // get Depmartments
  getBusinessDepartments(profileId) {
    console.log('service', profileId);
    return this.http.get(`${environment.apiUrl}/businessSettingRoute/businessDepartment/${profileId}`);
  }
  // get Depmartment
  getDepartment(deptId) {
    return this.http.get(`${environment.apiUrl}/businessSettingRoute/businessDepartment/department/${deptId}`);
  }
  // get Depmartment
  updateDepartment(body) {
    return this.http.put(`${environment.apiUrl}/businessSettingRoute/businessDepartment/department/`, body);
  }


}
