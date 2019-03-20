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

@Component({
  selector: 'app-admin-users-buyer-detail',
  templateUrl: './admin-users-buyer-detail.component.html',
  styleUrls: ['./admin-users-buyer-detail.component.scss']
})
export class AdminUsersBuyerDetailComponent implements OnInit {

  private signupData:any = {};
  constructor(private http:RestService, private rout:Router) {
  		this.signupData.role = "Buyer"
   }

  ngOnInit() {
  	
  }

  addUser(signUpData){
    Swal({
      title: 'Create a User?',
      text: 'This\'ll create an user!',
      type: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Create',
      cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.value) {
          signUpData.role = signUpData.role.toLowerCase();
          this.http.SignUp(signUpData).subscribe(
            (response)=>{
              console.log(response);
                this.rout.navigate(['/users']);
            },(error)=>{
              console.log(error)
            })
          }
           else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal(
          'Cancelled',
          'A User is not created',
          'error'
        )
      }
    })
  }

}
