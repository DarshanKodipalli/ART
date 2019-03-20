import { Component, OnInit, ViewChild, Input } from '@angular/core';
import {SelectionModel} from '@angular/cdk/collections';
import {MatSort, MatTableDataSource} from '@angular/material';
import {Subject} from 'rxjs/Subject';
import Swal from 'sweetalert2'
import { Router } from '@angular/router';
import { RestService } from '../services/rest.service';

export interface Invoice {
  invoiceNumber: string,
  orderNumber: string;
  amount: string;
  sellerId: string;
  bankerId: string;
  createdDate: string;
  status: string;
}

const ELEMENT_DATA: Invoice[] = [
];

@Component({
  selector: 'app-approve-invoice',
  templateUrl: './sellerCheckerApproveInvoice.html'
})
export class SellerCheckerApproveInvoice implements OnInit {

  displayedColumns: string[] = ['select', 'invoiceNumber', 'orderNumber', 'amount', 'sellerId', 'bankerId', 'createdDate', 'status', 'transaction'];
  dataSource:any = new MatTableDataSource<Invoice>(ELEMENT_DATA);
  selection = new SelectionModel<Invoice>(true, []);

  
  @Input() changing: Subject<boolean>;

  loadGridSpinner:boolean = true;

  @ViewChild(MatSort) sort: MatSort;
  constructor(
          private http: RestService, private route: Router) { }
  private fileUrl:string
  private role:String;
  private actualData:any = [];
  ngOnInit() {
    // loadData
    var loginData = JSON.parse(localStorage.getItem("login"));
    this.role = loginData.role;
    this.getInvoices();
  }

  getInvoices(){
    this.dataSource = [];
    this.actualData = [];
    this.http.getToBeApprovedInvoices()
    .subscribe(res => {
      console.log(res.json());
      let invoices = JSON.parse(res['_body']).invoices;
          
          var dataSource:any = [];
          dataSource = res.json().invoices;
          for(var i=0; i<dataSource.length;i++){
            var createdDate = dataSource[i].created.split('T')[0];
            var buyerId = dataSource[i].buyer.split('#')[1];
            var bankerId = dataSource[i].banker.split('#')[1];
            dataSource[i].buyerId = buyerId;
            dataSource[i].bankerId = bankerId;
            dataSource[i].createdDate = createdDate;
            dataSource[i].cost = dataSource[i].amount;
            dataSource[i].status = dataSource[i].statusMessage;
            dataSource[i].invoiceDescription = "Write your description here";
            if(dataSource[i].statusCode === 103){
              dataSource[i].toolTip = "Approve Invoice"
              dataSource[i].buttonType = "done_all"
              this.actualData.push(dataSource[i]);
            }else if(dataSource[i].statusCode === 104){
              dataSource[i].toolTip = "Invoice Approved"        
              dataSource[i].buttonType = "block"     
              this.actualData.push(dataSource[i]);               
            }else{

            }
            dataSource[i].href = "http://localhost:3000/api/v1/report?template=invoice&id="+dataSource[i].invoiceNumber;
          }
              this.dataSource = new MatTableDataSource<Invoice>(this.actualData);
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
  timeline(data){
    localStorage.setItem("ViewTransactionsAssetData", JSON.stringify(data));
    this.route.navigate(['/timeline']);
  }
  createInvoiceDirectly(){
    this.route.navigate(['createInvoice'])
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
    this.getInvoices(); // send filter parameters along
  }

  viewInvoice(a) {
    console.log(a);
    this.http.viewInvoice({invoiceNumber: a}).subscribe(
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

  addNewInvoiceTab(){
  }
  addNewInvoiceTabWithElement(element){
    localStorage.setItem("InvoiceCheckerData",JSON.stringify(element));
    this.route.navigate(['detailapproveInvoice']);          
/*    Swal({
      title: 'Approve the Invoice?',
      text: 'This\'ll Approve the Invoice you have Received!',
      type: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Approve',
      cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.value) {
            console.log(element);
            var invoiceApproveData:any = {};
            invoiceApproveData.id = element.invoiceNumber;
            invoiceApproveData.orderNumber = element.orderNumber;
            invoiceApproveData.itmes = element.items;
            console.log(invoiceApproveData);
            this.http.checkerApproveInvoice(invoiceApproveData).subscribe(
              (response)=>{
                console.log(response.json())
                Swal(
                  'Invoice Approved and Signed',
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
          'A Invoice isn\'t Approved yet',
          'error'
        )
      }
    })      
  }*/
}
}