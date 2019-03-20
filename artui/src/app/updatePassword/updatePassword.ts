import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2'
import { RestService } from '../services/rest.service';

@Component({
  selector: 'app-password-update',
  templateUrl: './updatePassword.html'
})
export class UpdatePasswordComponent implements OnInit {

  private updatePassword:any = {};
  constructor(private route: Router, private http:RestService) { }

  ngOnInit() {
    console.log("Update Password")
    this.updatePassword.newPassword = "password"
    this.updatePassword.newMatchPassword = "password"
    var loginData = JSON.parse(localStorage.getItem("login"));
  }

  logout(){
    localStorage.clear();
    this.route.navigate(['login']);
  }

  updateUserPassword(updatePassword){
    Swal({
      title: 'Change the Password?',
      text: 'This\'ll change the password !',
      type: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Change',
      cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.value) {
    console.log(updatePassword);
    this.http.updatePassword(updatePassword).subscribe(
      (response)=>{
                Swal(
                  'Password Updated',
                  'Please Login again to Continue',
                  'success'
                ).then((newResult)=>{
                  if(newResult.value){
        console.log(response);
                    localStorage.clear();
                    this.route.navigate(["login"]);
                  }
                })
      },(error)=>{
        console.log(error);
      })
          } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal(
          'Cancelled',
          'The Password isn\'t Changed',
          'error'
        )
      }
    })        
  }  
}
