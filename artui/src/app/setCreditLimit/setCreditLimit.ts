import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2'
import { RestService } from '../services/rest.service';

@Component({
  selector: 'app-setcreditlimit',
  templateUrl: './setCreditLimit.html'
})
export class SetCreditLimitComponent implements OnInit {

  private userData:any = {};
  constructor(private route: Router, private http:RestService) { }

  ngOnInit() {
    console.log("Set Credit Limit")
    this.userData = JSON.parse(localStorage.getItem("userCreditData"));
    console.log(this.userData);
  }

  logout(){
    localStorage.clear();
    this.route.navigate(['login']);
  }
  setCreditLimit(userData,checker){
    Swal({
      title: 'Set the Credit limit to '+userData.limit+' ?',
      text: 'This\'ll update the credit limit you\'ve set to the user !',
      type: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Set',
      cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.value) {
          console.log(userData);
          if(this.userData.role === "seller"){
            userData.checker = checker;
          }
          this.http.setCreditLimit(userData).subscribe(
            (response)=>{
                Swal(
                  'Credit limit Set',
                  'Transaction Hash: '+response.json().transactionHash+'',
                  'success'
                ).then((newResult)=>{
                  if(newResult.value){
                    this.route.navigate(['dashboard']);
                  }
                })
            },(error)=>{
              console.log(error);
            })
          }
           else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal(
          'Cancelled',
          'Credit limit isn\'t updated',
          'error'
        )
      }
    })
  }
}