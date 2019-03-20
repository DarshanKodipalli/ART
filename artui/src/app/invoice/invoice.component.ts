import { Component, OnInit, ViewChild, Input } from '@angular/core';
import {SelectionModel} from '@angular/cdk/collections';
import {MatSort, MatTableDataSource} from '@angular/material';
import { InvoicePageComponent } from '../invoice-page/invoice-page.component';
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
  selector: 'app-invoice',
  templateUrl: './invoice.component.html',
  styleUrls: ['./invoice.component.scss']
})
export class InvoiceComponent implements OnInit {

  displayedColumns: string[] = ['select', 'invoiceNumber', 'orderNumber', 'amount', 'sellerId', 'bankerId', 'createdDate', 'status', 'transaction'];
  dataSource:any = new MatTableDataSource<Invoice>(ELEMENT_DATA);
  selection = new SelectionModel<Invoice>(true, []);

  
  @Input() changing: Subject<boolean>;

  loadGridSpinner:boolean = true;

  @ViewChild(MatSort) sort: MatSort;
  constructor(private invoice: InvoicePageComponent,
          private http: RestService, private route: Router) { }
  private fileUrl:string
  private role:String;
  private createInvoice:any = {};
  private searchParams:any = {};
  ngOnInit() {
    // loadData
    var loginData = JSON.parse(localStorage.getItem("login"));
    this.role = loginData.role;
    this.getInvoices();
    this.changing.subscribe(v=>{
      console.log("tab changed"+v);
      // refresh grid on tab change
      this.reloadGrid();
    });
  }

  getInvoices(){
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
            if(dataSource[i].statusCode === 107 && this.role === "seller"){
              dataSource[i].toolTip = "Invoice Sent"
              dataSource[i].buttonType = "block"
            }else if(dataSource[i].statusCode === 101 && this.role === "seller"){
              dataSource[i].toolTip = "Send Invoice"
              dataSource[i].buttonType = "send"              
            }else if(dataSource[i].statusCode === 103 && this.role === "seller") {
              dataSource[i].toolTip = "Invoice Sent"        
              dataSource[i].buttonType = "block"      
            }else if(dataSource[i].statusCode === 107 && this.role === "buyer"){
              dataSource[i].toolTip = "Propose Invoice"        
              dataSource[i].buttonType = "input"      
            }else if(dataSource[i].statusCode === 103 && this.role === "buyer"){
              dataSource[i].toolTip = "Approve Invoice"        
              dataSource[i].buttonType = "done"      
            }else if(dataSource[i].statusCode === 104  && this.role === "buyer"){
              dataSource[i].toolTip = "Approve Invoice"        
              dataSource[i].buttonType = "done"      
            }else{
              dataSource[i].toolTip = "Invoice Sent"        
              dataSource[i].buttonType = "block"                    
            }

            dataSource[i].href = "http://localhost:3000/api/v1/report?template=invoice&id="+dataSource[i].invoiceNumber;
          }
              this.dataSource = new MatTableDataSource<Invoice>(dataSource);
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
    this.invoice.addTab(row.invoiceNumber, 'detail');
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
  invoiceSearch(searchParams){
    console.log(searchParams);
    this.http.searchInvoices(searchParams).subscribe(
      (response)=>{
        console.log(response.json());
      },(error)=>{
        console.log(error);
      })
  }  
  viewSignedInvoice(element){
    console.log(element);
    this.http.viewSignedInvoiceFromChecked(element).subscribe(
        (response) => {
            console.log(response);
            var resp: any = response;
            console.log(resp);
            var file = new Blob([resp.json()], {
                type: 'application/pdf'
            });
            this.fileUrl = URL.createObjectURL(file);
            var a = document.createElement('a');
            a.setAttribute('style','display:none');
            a.href = this.fileUrl;
            a.download = response.json().filename;
            a.click()
            window.URL.revokeObjectURL(this.fileUrl);
            console.log(this.fileUrl);
            window.open(this.fileUrl, '_blank');
        },
        (error) => console.log(error));    
  }
  addNewInvoiceTab(){
    this.invoice.addTab(null, 'new');
  }
  addNewInvoiceTabWithElement(element){
    if(element.statusCode === 104){
          this.http.viewSignedInvoiceFromChecked(element).subscribe(
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
                    var invoiceApproveData:any = {};
                    invoiceApproveData.id = element.invoiceNumber;
                    invoiceApproveData.orderNumber = element.orderNumber;
                    invoiceApproveData.itmes = element.items;
                    console.log(invoiceApproveData);
                    this.http.approveInvoice(invoiceApproveData).subscribe(
                      (response)=>{
                        console.log(response.json())
                        Swal(
                          'Invoice Approved',
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
        },
        (error) => console.log(error));    
    }else if(element.statusCode === 107){
      Swal({
        title: 'Propose the Invoice to the Banker?',
        text: 'This\'ll propose an Invoice to the banker !',
        type: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Propose',
        cancelButtonText: 'Cancel'
      }).then((result) => {
          if (result.value) {
            var sendInvoiceData:any = {};
            sendInvoiceData.id = element.invoiceNumber;
            sendInvoiceData.orderNumber = element.orderNumber;
            sendInvoiceData.invoiceDescription = element.invoiceDescription;
            console.log(sendInvoiceData);
            this.http.proposeInvoice(sendInvoiceData).subscribe(
              (response)=>{
                  Swal(
                    'Invoice Proposed',
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
            'A Invoice isn\'t proposed to the Buyer yet',
            'error'
          )
        }
      })    
    }else{
      localStorage.setItem("InvoiceData",JSON.stringify(element));
      this.invoice.addTab(null, 'new');          
    }
  }

}
