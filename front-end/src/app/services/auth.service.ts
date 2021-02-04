import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  BusinessLogin(body) {
    alert("auth Serive call");
    //return this.http.get("http://localhost:1111/api/auth/user");
    return this.http.post(`${environment.apiUrl}/auth/business_login`, body);
  }

  BusinessSignUp(body) {
    return this.http.post(`${environment.apiUrl}/businessRegisteration`, body);
  }

  isLoggedIn() {
    return !!localStorage.getItem('Jwt_Token');
  }
  getToken() {
    return localStorage.getItem('Jwt_Token');
  }
  logOut() {
    localStorage.clear();
    this.router.navigate(['/']);
  }
}
