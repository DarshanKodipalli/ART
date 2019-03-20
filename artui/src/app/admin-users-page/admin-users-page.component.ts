import { Component, OnInit, AfterContentInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatTabChangeEvent } from '@angular/material';
import { ViewChild, Input } from '@angular/core';
import {SelectionModel} from '@angular/cdk/collections';
import {MatSort, MatTableDataSource} from '@angular/material';
import { InvoicePageComponent } from '../invoice-page/invoice-page.component';
import {Subject} from 'rxjs/Subject';
import Swal from 'sweetalert2'
import { Router } from '@angular/router';
import { RestService } from '../services/rest.service';
import { AppComponent } from '../app.component';
import { isArray } from 'util';

export interface User {
  username: string,
  firstName: string;
  lastName: string;
  email: string;
  statusMessage: string;
  maxlimit: string;
  companyName: string;
}
const ELEMENT_DATA: User[] = [
];
@Component({
  selector: 'app-admin-users-page',
  templateUrl: './admin-users-page.component.html',
  styleUrls: ['./admin-users-page.component.scss']
})
export class AdminUsersPageComponent implements OnInit {

  displayedColumns: string[] = ['select', 'username', 'firstName', 'lastName', 'email', 'companyName', 'maxlimit', 'statusMessage', 'actions'];
  dataSource:any = new MatTableDataSource<User>(ELEMENT_DATA);
  selection = new SelectionModel<User>(true, []);

  private invoiceNumber:String = "";
  private currentTab:String = "";
  private currentIndex:number = 0;
  private changingValue: Subject<boolean> = new Subject();
  private usersList:any = [];
  private buyerList:any = [];
  private BuyerCount:any;
  constructor(private route: ActivatedRoute,private http:RestService,
            private app: AppComponent, private rout:Router) { 
  }


  ngOnInit(){
  this.http.getAllUsers().subscribe(
    (response)=>{
      console.log("Users List:")
      this.usersList = response.json().data;
      console.log(this.usersList);
      for(var i=0;i<this.usersList.length;i++){
        if(this.usersList[i].firstName){
          this.usersList[i].statusMessage = "Profile is Updated";
          this.usersList[i].statusColor = true;
        }else{
          this.usersList[i].firstName = "N/A";
          this.usersList[i].lastName = "N/A";
          this.usersList[i].companyName = "N/A";
          this.usersList[i].statusMessage = "Profile is not Updated";
          this.usersList[i].statusColor = false;                              
        }
        if(this.usersList[i].maxlimit === 0){
          this.usersList[i].maxlimit = "Credit not set"
        }
        if((this.usersList[i].role === "Buyer") || (this.usersList[i].role === "buyer")){
          this.buyerList.push(this.usersList[i]);
          this.BuyerCount+=1;
        }
      }
      this.dataSource = new MatTableDataSource<User>(this.buyerList);
      console.log(this.usersList);
    },(error)=>{
      console.log(error);
    })
  }

  ngAfterContentInit() {
    setTimeout(() => {
      this.app.hide();
    } , 0);
  }

  tabs = ['User List'];
  selected = new FormControl(0);

  addTab(id, page){
    this.invoiceNumber = id;
    //console.log(this.tabs.indexOf('Invoice Detail'));
    if(page == 'detail'){
      if(this.tabs.indexOf('Invoice Detail') == -1){
        this.tabs.push('Invoice Detail');
      }
      this.currentTab = 'Invoice Detail';
      
    } else if(page == 'new'){
      if(this.tabs.indexOf('New Invoice') == -1){
        this.tabs.push('New Invoice');
      }
      this.currentTab = 'New Invoice';
    }
    //console.log("current tab value is "+this.currentTab.valueOf());
    //console.log("Array index of"+this.tabs.indexOf(this.currentTab.valueOf()));
    this.selected.setValue(this.tabs.indexOf(this.currentTab.valueOf()));
    
  }
  setCreditLimit(userData){
    localStorage.setItem("userCreditData",JSON.stringify(userData))
    this.rout.navigate(['setCreditLimit']);
  }
  removeTab(){
    console.log("Removing detail tab. pass index");
    this.tabs.splice(1, 1);
  }

  onLinkClick(event: MatTabChangeEvent) {
    console.log('event => ', event);
    console.log('index => ', event.index);
    console.log('tab => ', event.tab);
    this.currentIndex = event.index;
    this.currentTab = event.tab.textLabel;
    if(event.index == 0){
      this.changingValue.next(true);
      window.history.replaceState({},'',`/invoice`);
    }else if(this.invoiceNumber){
      window.history.replaceState({},'',`/invoice?invoiceNumber=`+this.invoiceNumber);
    }else{
      window.history.replaceState({},'',`/createinvoice`);
    }
  }

  getCurrentTab(){
    return this.currentTab;
  }

  getCurrentIndex(){
    return this.currentIndex;
  }

  createBuyer(){
    this.rout.navigate(['/createbuyer']);
  }
}