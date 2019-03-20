import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2'
import { Router } from '@angular/router';
import { RestService } from '../services/rest.service';
import { MatTabChangeEvent } from '@angular/material';
import { ViewChild, Input } from '@angular/core';
import {SelectionModel} from '@angular/cdk/collections';
import {MatSort, MatTableDataSource} from '@angular/material';

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
  selector: 'app-admin-users',
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.scss']
})
export class AdminUsersComponent implements OnInit {

  constructor(private rout:Router, private http:RestService) { }

  displayedColumns: string[] = ['select', 'username', 'firstName', 'lastName', 'email', 'companyName', 'maxlimit', 'statusMessage', 'actions'];
  dataSource:any = new MatTableDataSource<User>(ELEMENT_DATA);
  selection = new SelectionModel<User>(true, []);
  private usersList:any = [];
  private sellerList:any = [];
  private BuyerCount:any;
  private options:any = [];
  private optionSelected: any;
  ngOnInit() {
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
        if((this.usersList[i].role === "sellerchecker") || (this.usersList[i].role === "seller")){
          if(this.usersList[i].role === "seller"){
            this.usersList[i].sellerRole = "Maker"
          }else{
            this.usersList[i].sellerRole = "Checker"
            this.options.push(this.usersList[i].email);
          }
          this.sellerList.push(this.usersList[i]);
          this.BuyerCount+=1;
        }
      }
      this.dataSource = new MatTableDataSource<User>(this.sellerList);
      console.log(this.usersList);
    },(error)=>{
      console.log(error);
    })
  }
  setCreditLimit(userData){
    userData.options = this.options;
    localStorage.setItem("userCreditData",JSON.stringify(userData))
    this.rout.navigate(['setCreditLimit']);
  }  
  createSeller(){
    this.rout.navigate(['/createseller']);
  }  
}
