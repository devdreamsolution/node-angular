import { Injectable } from '@angular/core';
import { HttpClient, HttpBackend } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class IpServiceService {

  constructor(
    private http: HttpClient,
    private handler: HttpBackend
  ) {
    this.http = new HttpClient(this.handler);
  }
  public getIPAddress() {
    return this.http.get('http://api.ipify.org/?format=json');
  }
  public getIPData(ip: string) {
    return this.http.get(`http://ip-api.com/json/${ip}?fields=status,country,city,lat,lon`);
  }
}
