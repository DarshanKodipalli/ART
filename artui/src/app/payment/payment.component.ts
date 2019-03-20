import { Component, OnInit, ViewChild, Input } from '@angular/core';
import {SelectionModel} from '@angular/cdk/collections';
import {MatSort, MatTableDataSource} from '@angular/material';
import { PaymentPageComponent } from '../payment-page/payment-page.component';
import {Subject} from 'rxjs/Subject';
import Swal from 'sweetalert2'
import { Router } from '@angular/router';

import { RestService } from '../services/rest.service';

export interface Payment {
  orderNumber: string;
  amount: string;
  sellerId: string;
  bankerId: string;
  createdDate: string;
  status: string;
  utrNumber:string;
}

const ELEMENT_DATA: Payment[] = [
];

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent implements OnInit {
  displayedColumns: string[] = ['select', 'orderNumber', 'amount','utrNumber', 'sellerId', 'bankerId', 'createdDate', 'status', 'transaction'];
  dataSource = new MatTableDataSource<Payment>(ELEMENT_DATA);
  selection = new SelectionModel<Payment>(true, []);

  
  @Input() changing: Subject<boolean>;

  loadGridSpinner:boolean = true;

  @ViewChild(MatSort) sort: MatSort;
  constructor(private payment: PaymentPageComponent,
          private service: RestService,private route:Router) { }
  private searchParams:any = {};
  private role:any;
  private fileUrl:string
  ngOnInit() {
    var loginData = JSON.parse(localStorage.getItem("login"));
    this.role = loginData.role;

    // loadData
    this.getOrders();
    this.changing.subscribe(v=>{
      console.log("tab changed"+v);
      // refresh grid on tab change
      this.reloadGrid();
    });
  }

  getOrders(){
    if(this.role === 'banker'){
      this.service.getToBeApprovedInvoices()
      .subscribe(res => {
        console.log(res.json());
        let invoices = JSON.parse(res['_body']).invoices;
            
            var dataSource:any = [];
            dataSource = res.json().invoices;
            for(var i=0; i<dataSource.length;i++){
              var createdDate = dataSource[i].created.split('T')[0];
              var buyerId = dataSource[i].buyer.split('#')[1];
              var sellerId = dataSource[i].seller.split('#')[1];
              var bankerId = dataSource[i].banker.split('#')[1];
              dataSource[i].buyerId = buyerId;
              dataSource[i].sellerId = sellerId;
              dataSource[i].bankerId = bankerId;
              dataSource[i].createdDate = createdDate;
              dataSource[i].cost = dataSource[i].amount;
              dataSource[i].status = dataSource[i].statusMessage;
              if(dataSource[i].statusCode === 108 && this.role === "banker"){
                dataSource[i].toolTip = "Accept Proposal and Make Payment"
                dataSource[i].buttonType = "done_all"
              }else if(dataSource[i].statusCode === 109 && this.role === "banker"){
                dataSource[i].toolTip = "Payment Made"
                dataSource[i].buttonType = "block"              
              }else if(dataSource[i].statusCode === 109 && this.role === "buyer"){
                dataSource[i].toolTip = "Make Payment "
                dataSource[i].buttonType = "send"              
              }else if(dataSource[i].statusCode === 103 && this.role === "seller") {
                dataSource[i].toolTip = "Invoice Sent"        
                dataSource[i].buttonType = "block"      
              }else if(dataSource[i].statusCode === 107 && this.role === "buyer"){
                dataSource[i].toolTip = "Invoice Proposed"        
                dataSource[i].buttonType = "block"      
              }else if(dataSource[i].statusCode === 103 && this.role === "buyer"){
                dataSource[i].toolTip = "Approve Invoice"        
                dataSource[i].buttonType = "done"      
              }else if(dataSource[i].statusCode === 106  && this.role === "buyer"){
                dataSource[i].toolTip = "Propose Invoice"        
                dataSource[i].buttonType = "input"      
              }else{
                dataSource[i].toolTip = "Invoice Sent"        
                dataSource[i].buttonType = "block"                    
              }

              dataSource[i].invoiceDescription = "Write your description here";
              dataSource[i].href = "http://localhost:3000/api/v1/report?template=invoice&id="+dataSource[i].invoiceNumber;
            }
                this.dataSource = new MatTableDataSource<Payment>(dataSource);
        setTimeout(() => {
          this.hideGridSpinner();
        } , 0);
        
        //this.dataSource.sort = this.sort;
        //console.log(invoices);
      });
    }else if(this.role === "buyer"){
      this.service.getToBeApprovedInvoices()
      .subscribe(res => {
        console.log(res.json());
        let invoices = JSON.parse(res['_body']).invoices;
            
            var dataSource:any = [];
            dataSource = res.json().invoices;
            var buyerPayment:any = [];
            for(var i=0; i<dataSource.length;i++){
              var createdDate = dataSource[i].created.split('T')[0];
              var buyerId = dataSource[i].buyer.split('#')[1];
              var sellerId = dataSource[i].seller.split('#')[1];
              var bankerId = dataSource[i].banker.split('#')[1];
              dataSource[i].buyerId = buyerId;
              dataSource[i].sellerId = sellerId;
              dataSource[i].bankerId = bankerId;
              dataSource[i].createdDate = createdDate;
              dataSource[i].cost = dataSource[i].amount;
              dataSource[i].status = dataSource[i].statusMessage;
              if(dataSource[i].statusCode === 109 && dataSource[i].sellerPaymentStatus){
                dataSource[i].toolTip = "Make Payment to the Banker"
                dataSource[i].buttonType = "payment"
                buyerPayment.push(dataSource[i]);
              }else{
                dataSource[i].toolTip = "Payment Acknowledged"
                dataSource[i].buttonType = "block"              
                buyerPayment.push(dataSource[i]);
              }                            
              dataSource[i].invoiceDescription = "Write your description here";
              dataSource[i].href = "http://localhost:3000/api/v1/report?template=invoice&id="+dataSource[i].invoiceNumber;
            }
                this.dataSource = new MatTableDataSource<Payment>(buyerPayment);
        setTimeout(() => {
          this.hideGridSpinner();
        } , 0);
        //this.dataSource.sort = this.sort;
        //console.log(invoices);
      });      
    }else{  
      this.service.getPaymentsMade()
      .subscribe(res => {
        console.log(res.json());            
        var dataSource:any = [];
        dataSource = res.json().data;
        for(var i=0; i<dataSource.length;i++){
          var createdDate = dataSource[i].created.split('T')[0];
          var buyerId = 'buyer1@aeries.io';
          var sellerId = dataSource[i].seller.split('#')[1];
          var bankerId = dataSource[i].banker.split('#')[1];
          dataSource[i].buyerId = buyerId;
          dataSource[i].sellerId = sellerId;
          dataSource[i].bankerId = bankerId;
          dataSource[i].createdDate = createdDate;
          dataSource[i].cost = dataSource[i].amount;
          dataSource[i].status = dataSource[i].statusMessage;
              if(dataSource[i].statusCode === 201){
                dataSource[i].toolTip = "Acknowledge Payment"
                dataSource[i].buttonType = "done_all"
              }else if(dataSource[i].statusCode === 205){
                dataSource[i].toolTip = "Payment Acknowledged"
                dataSource[i].buttonType = "block"              
              }else {
                dataSource[i].toolTip = "Make Payment"        
                dataSource[i].buttonType = "payment"      
              }              

          dataSource[i].invoiceDescription = "Write your description here";
          dataSource[i].href = "http://localhost:3000/api/v1/report?template=invoice&id="+dataSource[i].invoiceNumber;
        }
        this.dataSource = new MatTableDataSource<Payment>(dataSource);
        setTimeout(() => {
          this.hideGridSpinner();
        } , 0);
        
        //this.dataSource.sort = this.sort;
        //console.log(invoices);
      });      
    }
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected() ?
        this.selection.clear() :
        this.dataSource.data.forEach(row => this.selection.select(row));
  }

  addTab(row) {
    //console.log("Adding Tab: Clicked row"+JSON.stringify(row));
    this.payment.addTab(row.orderNumber, 'detail');
  }

  showGridSpinner(){
    this.loadGridSpinner = true;
  }

  hideGridSpinner() {
    this.loadGridSpinner = false;
  }

  reloadGrid() {
    this.showGridSpinner();
    this.getOrders(); // send filter parameters along
  }

  addNewOrderTab(){
    this.payment.addTab(null, 'new');
  }
  paymentSearch(searchParams){
    console.log(searchParams);
    this.service.searchPayments(searchParams).subscribe(
      (response)=>{
        console.log(response.json());
      },(error)=>{
        console.log(error);
      })
  }    
  timeline(data){
    localStorage.setItem("ViewTransactionsAssetData", JSON.stringify(data));
    this.route.navigate(['/timeline']);
  }  
  viewPaymentReceipt(a) {
    console.log(a);
    this.service.viewPayment({paymentNumber: a}).subscribe(
        (response) => {
            console.log(response);
            var resp: any = response;
            console.log(resp);
            var file = new Blob([resp.json()], {
                type: 'application/pdf'
            });
            this.fileUrl = URL.createObjectURL(file);
            console.log(this.fileUrl);
            window.open(this.fileUrl, '_blank');
        },
        (error) => console.log(error));
  }
  addNewOrderTabBanker(paymentData){
    if(paymentData.statusCode === 201){
      Swal({
        title: 'Acknowledge the Payment?',
        text: 'This\'ll Acknowledge the payment!',
        type: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Acknowledge',
        cancelButtonText: 'Cancel'
      }).then((result) => {
          if (result.value) {
                  this.service.approvePayment(paymentData).subscribe(
                    (response)=>{
                      console.log(response);
                        Swal(
                        'Payment Acknowledged',
                        'Transaction Hash: '+response.json().transactionHash+'',
                        'success'
                      ).then((newResult)=>{
                        if(newResult.value){
                         this.reloadGrid(); 
                        }
                      })
                    },(error)=>{
                      console.log(error);
                    })
            } else if (result.dismiss === Swal.DismissReason.cancel) {
          Swal(
            'Cancelled',
            'A Payment isn\'t Acknowledge yet',
            'error'
          )
        }
      })      
    }else if(paymentData.statusCode === 109){
       localStorage.setItem("PaymentInvoice",JSON.stringify(paymentData));
       this.payment.addTab(null, 'new'); 
    }else{
      Swal({
        title: 'Accept the Proposal and Make Payment?',
        text: 'This\'ll accept the proposal!',
        type: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Accept',
        cancelButtonText: 'Cancel'
      }).then((result) => {
          if (result.value) {
                  this.service.approveBankerPayment(paymentData).subscribe(
                    (response)=>{
                      console.log(response);
                        Swal(
                        'Proposal Accepted. Make Payment?',
                        'Transaction Hash: '+response.json().transactionHash+'',
                        'success'
                      ).then((newResult)=>{
                        if(newResult.value){
                           localStorage.setItem("PaymentInvoice",JSON.stringify(paymentData));
                           this.payment.addTab(null, 'new'); 
                        }
                      })
                    },(error)=>{
                      console.log(error);
                    })
            } else if (result.dismiss === Swal.DismissReason.cancel) {
          Swal(
            'Cancelled',
            'A Payment isn\'t Acknowledge yet',
            'error'
          )
        }
      })      
    }
  }
}
