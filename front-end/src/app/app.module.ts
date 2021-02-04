import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { OrderHeaderComponent } from './components/shared/layout/header/orderheader/orderheader.component';
import { MenuComponent } from './components/menu/menu.component';
import { OrderComponent } from './components/order/order.component';
import { FooterComponent } from './components/shared/layout/footer/footer.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatExpansionModule } from '@angular/material/expansion';
import { MenuService } from '../../src/app/services/menu.service'
import { HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { PathLocationStrategy, LocationStrategy } from '@angular/common';
import { AuthInterceptor } from './guards/auth.interceptor';
import { AuthGuard } from './guards/auth.guard';
import { HttpClientModule } from '@angular/common/http';
import { SharedService } from '../app/services/shared.service';
import { MenuItemComponent } from '../app/components/shared/menu-item/menu-item.component';
import { ConfirmationDialogComponent } from './components/shared/dialog/confirmation-dialog/confirmation-dialog.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';



@NgModule({
  declarations: [
    AppComponent,
    OrderHeaderComponent,
    MenuComponent,
    OrderComponent,
    FooterComponent,
    MenuItemComponent,
    ConfirmationDialogComponent
  ],
  imports: [
    FormsModule,
    BrowserModule,
    AppRoutingModule,
    MatExpansionModule,
    BrowserAnimationsModule,
    HttpClientModule,
    NgbModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: LocationStrategy, useClass: PathLocationStrategy },
    AuthGuard, SharedService
  ],
  bootstrap: [AppComponent]
})

export class AppModule { }
