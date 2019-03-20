import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2'
import { RestService } from '../services/rest.service';

@Component({
  selector: 'app-createDirectInvoice',
  templateUrl: './createInvoice.html'
})
export class CreateInvoiceDirectlyComponent implements OnInit {

  private sendInvo:any = {};
  constructor(private route: Router, private http:RestService) { }

  ngOnInit() {
    console.log("Update Profile")
    var loginData = JSON.parse(localStorage.getItem("login"));
    console.log(loginData);
  }

  logout(){
    localStorage.clear();
    this.route.navigate(['login']);
  }

  sendInvoiceDirectly(invoice){
    console.log(invoice);
    console.log(this.http.getDirectInvoiceTemp());
    if(this.http.getDirectInvoiceTemp()){
      invoice.sendDirectly = true;
      this.http.createInvoice(invoice).subscribe(
        (response)=>{
          console.log(response.json());
          var invoiceData:any = {};
          invoiceData = invoice;
          invoiceData.id = response.json().invoiceNumber;
          var formData = this.http.getDirectInvoiceTemp();
          console.log(this.http.getDirectInvoiceTemp())
          formData.append("InvoiceData",JSON.stringify(invoiceData));
          console.log(formData)          
            this.http.sendInvoice(formData).subscribe(
              (response)=>{
                  Swal(
                    'Invoice Sent',
                    'Transaction Hash: '+response.json().transactionHash+'',
                    'success'
                  ).then((newResult)=>{
                    if(newResult.value){
                      this.route.navigate(['invoice'])
                    }
                  })
              },(error)=>{
                console.log(error);
              })    
          },
        (error)=>{
          console.log(error);
        })      
    }
  }
}
