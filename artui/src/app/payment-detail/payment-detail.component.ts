import { Component, OnInit } from '@angular/core';
import { PaymentPageComponent } from '../payment-page/payment-page.component';
import { RestService } from '../services/rest.service';
import Swal from 'sweetalert2'
import { Router } from '@angular/router';

export interface PeriodicElement {
  name: string;
  position: number;
  weight: number;
  symbol: string;
}

const ELEMENT_DATA: PeriodicElement[] = [

];

@Component({
  selector: 'app-payment-detail',
  templateUrl: './payment-detail.component.html',
  styleUrls: ['./payment-detail.component.scss']
})
export class PaymentDetailComponent implements OnInit {
  displayedColumns: string[] = ['position', 'name', 'weight', 'symbol'];
  dataSource = ELEMENT_DATA;
  private paymentData:any = {};
  private role:any;
  constructor(private payment: PaymentPageComponent, private http:RestService, private route:Router) {
    this.paymentData = JSON.parse(localStorage.getItem("PaymentInvoice"));
    console.log(this.paymentData)
    var loginData = JSON.parse(localStorage.getItem("login"));
    this.role = loginData.role;    
   }

  private title: String ='';
  ngOnInit() {
    console.log("loading page");
    this.title = this.payment.getCurrentTab();
  }

  removeTab(){
    this.payment.removeTab();
  }

  makePayment(invoiceData){
    if(this.role === 'banker'){
      Swal({
        title: 'Record the Payent?',
        text: 'This\'ll record the payment you\'ve made to the Seller !',
        type: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Record',
        cancelButtonText: 'Cancel'
      }).then((result) => {
          if (result.value) {
            if(this.http.getPayment()){
                var formData = this.http.getPayment();
                
                formData.append('paymentData',JSON.stringify(invoiceData));
            console.log(invoiceData);
            this.http.makePayment(formData).subscribe(
              (response)=>{
                  Swal(
                    'Payment Recorded',
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
          }
             else if (result.dismiss === Swal.DismissReason.cancel) {
          Swal(
            'Cancelled',
            'A Invoice isn\'t Sent to the Buyer yet',
            'error'
          )
        }
      })
    }else{
    Swal({
      title: 'Record the Payent?',
      text: 'This\'ll record the payment you\'ve made to the Banker !',
      type: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Record',
      cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.value) {
        if(this.http.getPayment()){
            var formData = this.http.getPayment();
            formData.append('paymentData',JSON.stringify(invoiceData));
          console.log(invoiceData);
          this.http.makePayment(formData).subscribe(
            (response)=>{
                Swal(
                  'Payment Recorded',
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
          'A Invoice isn\'t Sent to the Buyer yet',
          'error'
        )
      }
  }
    })
  }      
  }
}
