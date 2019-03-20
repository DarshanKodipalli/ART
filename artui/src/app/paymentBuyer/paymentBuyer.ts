import { Component, OnInit, ViewChild, Input } from '@angular/core';
import {SelectionModel} from '@angular/cdk/collections';
import {MatSort, MatTableDataSource} from '@angular/material';
import {Subject} from 'rxjs/Subject';
import Swal from 'sweetalert2'
import { Router } from '@angular/router';


import { RestService } from '../services/rest.service';

export interface Payment {
  payentNumber: string;
  amount: string;
  sellerId: string;
  buyerId: string;
  createdDate: string;
  status: string;
  UTRNumber:string;
}

const ELEMENT_DATA: Payment[] = [
];

@Component({
  selector: 'app-paymentbuyer',
  templateUrl: './paymentBuyer.html'
})
export class PaymentBuyerComponent implements OnInit {
  displayedColumns: string[] = ['select', 'paymentNumber', 'amount', 'sellerId', 'buyerId', 'createdDate', 'UTRNumber', 'status', 'actions'];
  dataSource = new MatTableDataSource<Payment>(ELEMENT_DATA);
  selection = new SelectionModel<Payment>(true, []);

  
  @Input() changing: Subject<boolean>;

  loadGridSpinner:boolean = true;

  @ViewChild(MatSort) sort: MatSort;
  constructor(private service: RestService, private route:Router) { }

  private role:any;
  private fileUrl:string
  private data:any = [];
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
  timeline(data){
    localStorage.setItem("ViewTransactionsAssetData", JSON.stringify(data));
    this.route.navigate(['/timeline']);
  }  
  getOrders(){
    this.data = [];
      this.service.getPaymentsMade()
      .subscribe(res => {
        console.log(res.json());            
        var dataSource:any = [];
        dataSource = res.json().data;
        for(var i=0; i<dataSource.length;i++){
          var createdDate = dataSource[i].created.split('T')[0];
          var buyerId = 'buyer1@aeries.io';
          var sellerId = 'seller1@aeries.io';
          var bankerId = dataSource[i].banker.split('#')[1];
          dataSource[i].buyerId = buyerId;
          dataSource[i].sellerId = sellerId;
          dataSource[i].bankerId = bankerId;
          dataSource[i].createdDate = createdDate;
          dataSource[i].cost = dataSource[i].amount;
          dataSource[i].status = dataSource[i].statusMessage;
              if(dataSource[i].statusCode === 206){
                dataSource[i].toolTip = "Payment Acknowledged"
                dataSource[i].buttonType = "block"
              }else {
                dataSource[i].toolTip = "Acknowledge Payment"        
                dataSource[i].buttonType = "done_all"      
              }              
          dataSource[i].invoiceDescription = "Write your description here";
          dataSource[i].href = "http://localhost:3000/api/v1/report?template=invoice&id="+dataSource[i].invoiceNumber;
              if(dataSource[i].statusCode === 206 || dataSource[i].statusCode === 201){
                this.data.push(dataSource[i]);                
              }
        }
        this.dataSource = new MatTableDataSource<Payment>(this.data);
        setTimeout(() => {
          this.hideGridSpinner();
        } , 0);
        
        //this.dataSource.sort = this.sort;
        //console.log(invoices);
      });      
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
  }
  viewPaymentReceipt(a) {
    console.log(a);
    this.service.viewPaymentBuyer({paymentNumber: a}).subscribe(
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
  acknowledgePayment(i){
    Swal({
      title: 'Acknowledge the Payment?',
      text: 'This\'ll Acknowledge the payment!',
      type: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Acknowledge',
      cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.value) {
                console.log(i);
                this.service.approvePayment(i).subscribe(
                  (response)=>{
                    console.log(response);
                      Swal(
                      'Payment Acknowledge',
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
  }
}
