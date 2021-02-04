import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MenuComponent } from './components/menu/menu.component';
import { OrderComponent } from './components/order/order.component';
import { OrderHeaderComponent } from './components/shared/layout/header/orderheader/orderheader.component';


const routes: Routes = [
  {
    path: '',
    component: OrderHeaderComponent,
    children: [
      { path: "menu/:dept_id/:menu_id", component: MenuComponent, data: { title: "Menu" } },
      { path: "order", component: OrderComponent, data: { title: "Order" } }  
    ]
  },
  //{ path: "menu", component: MenuComponent, data: { title: "Menu" } },
  //{ path: "order", component: OrderComponent, data: { title: "Order" } }  
  //{
  //  path: '',
  //  component: AdminComponent,
  //  children: [
  //    { path: 'settings', component: SettingComponent, canActivate: [AuthGuard], data: { title: "settings", expectedRole: ["admin", "user", "support"] } },
  //    { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard], data: { title: "profile", expectedRole: ["admin", "user", "support"] } },
  //    //{ path: "changepassword", component: ChangepasswordComponent, canActivate: [AuthGuard], data: { title: "Change Password", expectedRole: ["admin", "user","support"] } },

  //    { path: "dashboard", component: DashboardComponent, canActivate: [AuthGuard], data: { title: "Dashboard", expectedRole: ["admin", "user", "support"] } },
  //    { path: "dashboard/:admin_consent/:tenant", component: DashboardComponent, canActivate: [AuthGuard], data: { title: "Dashboard", expectedRole: ["admin", "user", "support"] } },

  //    { path: "discoverymap", component: DiscoverymapComponent, canActivate: [AuthGuard], data: { title: "Cdata", expectedRole: ["admin", "user", "support"] } },

  //    { path: 'cost-and-usage/budget-bucket', component: BudgetBucketComponent, canActivate: [AuthGuard], data: { title: "settings", expectedRole: ["admin", "user", "support"] } },
  //    { path: "cost-and-usage/billingdatareport", component: BillingdatareportComponent, canActivate: [AuthGuard], data: { title: "Billing Report", expectedRole: ["admin", "user", "support"] } },
  //    //{ path: "cost-and-usage/billingdatareport/:AzureInfoId/:SubscriptionGuid/:Level/:LevelValue", component: BillingdatareportComponent, canActivate: [AuthGuard], data: { title: "Billing Report", expectedRole: ["admin", "user","support"] } },
  //    { path: "cost-and-usage/usageanalysis", component: UsageanalysisComponent, canActivate: [AuthGuard], data: { title: "Usage Analysis", expectedRole: ["admin", "user", "support"] } },
  //    { path: "cost-and-usage/serviceusage", component: ServiceUsageComponent, canActivate: [AuthGuard], data: { title: "Service Usage", expectedRole: ["admin", "user", "support"] } },
  //    { path: "cost-and-usage/indexing", component: IndexingComponent, canActivate: [AuthGuard], data: { title: "Indexing", expectedRole: ["admin", "user", "support"] } },

  //    { path: 'optimisation/reservedinstances', component: RidashboardComponent, canActivate: [AuthGuard], data: { title: "Reserved Instance", expectedRole: ["admin", "user", "support"] } },

  //    { path: 'license-upgrade', component: LicenseUpgradeComponent, canActivate: [AuthGuard], data: { title: "license Upgrade", expectedRole: ["admin", "user", "support"] } },
  //    { path: 'upgrade-to-buisness', component: UpgradetobuisnessComponent, canActivate: [AuthGuard], data: { title: "license Upgrade", expectedRole: ["admin", "user", "support"] } },

  //    //---Only Admin Screens
  //    { path: "admin/c-connector", component: CconnectorComponent, canActivate: [AuthGuard], data: { title: "C-Connector", expectedRole: ["admin", "support"] } },
  //    { path: 'admin/billing', component: BillingComponent, canActivate: [AuthGuard], data: { title: "billing", expectedRole: ["admin", "support"] } },
  //    { path: 'admin/members', component: MembersComponent, canActivate: [AuthGuard], data: { title: "billing", expectedRole: ["admin", "support"] } },
  //    { path: 'admin/settings', component: AdminSettingsComponent, canActivate: [AuthGuard], data: { title: "settings", expectedRole: ["admin", "support"] } }
  //  ]
  //}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})

export class AppRoutingModule { }
