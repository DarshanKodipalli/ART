import { Component, OnInit } from '@angular/core';
import { InvoicePageComponent } from '../invoice-page/invoice-page.component';
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
  selector: 'app-invoice-detail',
  templateUrl: './invoice-detail.component.html',
  styleUrls: ['./invoice-detail.component.scss']
})
export class InvoiceDetailComponent implements OnInit {

  displayedColumns: string[] = ['position', 'name', 'weight', 'symbol'];
  dataSource = ELEMENT_DATA;
  private invoiceData:any = {};
  constructor(private invoice: InvoicePageComponent, private http:RestService, private route:Router) {
    this.invoiceData = JSON.parse(localStorage.getItem("InvoiceData"));
    console.log(this.invoiceData);
   }

  private title: String ='';
  ngOnInit() {
    console.log("loading page");
    this.title = this.invoice.getCurrentTab();
  }

  removeTab(){
    this.invoice.removeTab();
  }
  sendInvoiceDirectly(invoice){
    console.log(invoice);
    console.log(this.http.getInvoice());
    if(this.http.getInvoice()){
      var formData = this.http.getInvoice();
      console.log(this.http.getInvoice())
      console.log(formData)
      var sendInvoiceData:any = invoice;
      sendInvoiceData.id = invoice.invoiceNumber;
      sendInvoiceData.sendDirectly = false;
      sendInvoiceData.orderNumber = invoice.orderNumber;
      sendInvoiceData.invoiceDescription = invoice.invoiceDescription;
      console.log(sendInvoiceData);
      formData.append('InvoiceData',JSON.stringify(sendInvoiceData))
      console.log("_____________")
      console.log(formData)
      console.log("_____________")            
      this.http.sendInvoice(formData).subscribe(
        (response)=>{
            Swal(
              'Invoice Sent',
              'Transaction Hash: '+response.json().transactionHash+'',
              'success'
            ).then((newResult)=>{
              if(newResult.value){
                this.route.navigate(['dashboard'])
                console.log("Done");
              }
            })
        },(error)=>{
          console.log(error);
        })    
      }          
  }

}
