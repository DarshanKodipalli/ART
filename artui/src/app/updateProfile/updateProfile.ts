import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2'
import { RestService } from '../services/rest.service';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';

@Component({
  selector: 'app-profile',
  templateUrl: './updateProfile.html'
})
export class UpdateProfileComponent implements OnInit {

  private updateUser:any = {};
  constructor(private route: Router, private http:RestService, private spinner:Ng4LoadingSpinnerService) { }

  ngOnInit() {
    console.log("Update Profile")
    var loginData = JSON.parse(localStorage.getItem("login"));
    this.updateUser.email = loginData.email;
    this.updateUser.username = loginData.username;
    console.log(loginData);
  }

  logout(){
    localStorage.clear();
    this.route.navigate(['login']);
  }

  updateUserProfile(updateUser){
    Swal({
      title: 'Update the User Profile?',
      text: 'This\'ll update the User profile !',
      type: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Update',
      cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.value) {
    console.log(updateUser);
    this.spinner.show();
    this.http.updateProfile(updateUser).subscribe(
      (response)=>{
        this.spinner.hide();
                Swal(
                  'Profile Updated',
                  'Transaction Hash: '+response.json().transactionHash+'',
                  'success'
                ).then((newResult)=>{
                  if(newResult.value){
        console.log(response);
                 this.route.navigate(['dashboard']);
                  }
                })
      },(error)=>{
        console.log(error);
      })
          } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal(
          'Cancelled',
          'A Profile isn\'t Updated',
          'error'
        )
      }
    })    
  }  
}
