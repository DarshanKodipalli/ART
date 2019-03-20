import { Component, ElementRef, Input, ViewChild,OnInit } from '@angular/core';
import { RestService } from '../services/rest.service';
import Swal from 'sweetalert2'
import { Router } from '@angular/router';
declare var jquery:any;
declare var $ :any;
@Component({
  selector: 'app-invoice-new-detail',
  templateUrl: './invoice-new-detail.component.html',
  styleUrls: ['./invoice-new-detail.component.scss']
})
export class InvoiceNewDetailComponent implements OnInit {
  private imageSrc:String;
 	private checkerDetail:any = {};
  constructor( private http:RestService, private route:Router) {
    var data = JSON.parse(localStorage.getItem("InvoiceCheckerData"));
    console.log(data);
    this.checkerDetail = data;
   }
    @Input() multiple: boolean = false;
    @ViewChild('fileInput') inputEl: ElementRef;
  ngOnInit() {
  }
readURL(event: Event): void {
  let inputEl: HTMLInputElement = this.inputEl.nativeElement;
  console.log(inputEl);
  console.log(event);
    if (inputEl.files) {
        const file = inputEl.files[0];

        const reader = new FileReader();
        reader.onload = e => this.imageSrc = reader.result;

        reader.readAsDataURL(file);
    }
    let fileCount: number = inputEl.files.length;
    let formData = new FormData();
    if (fileCount > 0) { // a file was selected
        for (let i = 0; i < fileCount; i++) {
            formData.append('files', inputEl.files.item(i));
        }
    this.http.setSignatureTemp(formData);
    }

}  
  approveInvoice(element){
      Swal({
        title: 'Approve the Invoice?',
        text: 'This\'ll Approve the Invoice you have Received!',
        type: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Approve',
        cancelButtonText: 'Cancel'
      }).then((result) => {
          if (result.value) {
              console.log(element);
              console.log(this.http.getSignatureTemp());
              var formData = this.http.getSignatureTemp();
              var invoiceApproveData:any = {};
              invoiceApproveData.id = element.invoiceNumber;
              invoiceApproveData.orderNumber = element.orderNumber;
              invoiceApproveData.itmes = element.items;
              console.log(invoiceApproveData);
              formData.append("checkerApproveData",JSON.stringify(invoiceApproveData))
              this.http.checkerApproveInvoice(formData).subscribe(
                (response)=>{
                  console.log(response.json())
                  Swal(
                    'Invoice Approved and Signed',
                    'Transaction Hash: '+response.json().transactionHash+'',
                    'success'
                  ).then((newResult)=>{
                    if(newResult.value){
                      this.route.navigate(['dashboard'])
                    }
                  })
                },(error)=>{
                  console.log(error);
                })
            } else if (result.dismiss === Swal.DismissReason.cancel) {
          Swal(
            'Cancelled',
            'A Invoice isn\'t Approved yet',
            'error'
          )
        }
      })      
    }    
  }