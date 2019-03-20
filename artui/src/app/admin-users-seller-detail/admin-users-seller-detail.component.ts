import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2'
import { Router } from '@angular/router';
import { RestService } from '../services/rest.service';

@Component({
  selector: 'app-admin-users-seller-detail',
  templateUrl: './admin-users-seller-detail.component.html',
  styleUrls: ['./admin-users-seller-detail.component.scss']
})
export class AdminUsersSellerDetailComponent implements OnInit {

  private signupData:any = {};
  constructor(private http:RestService, private rout:Router) {

   }
private options:any = ["Seller","SellerChecker"];
private optionSelected: any;

onOptionsSelected(event){
 console.log(event); //option value will be sent as event
}  
  ngOnInit() {
  }

  addUser(signUpData,data){
    Swal({
      title: 'Create a User?',
      text: 'This\'ll create an user!',
      type: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Create',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      console.log(signUpData)
      console.log(data)
      signUpData.role = data.toLowerCase();
        if (result.value) {
          console.log(signUpData)
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
