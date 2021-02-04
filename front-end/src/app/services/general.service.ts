import { environment } from './../../environments/environment.prod';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GeneralService {
  constructor(private http: HttpClient) {}

  checkUniqueRecord(body) {
    return this.http.post(`${environment.apiUrl}/validateData`, body);
  }
}
