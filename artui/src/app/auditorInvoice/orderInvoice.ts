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
  selector: 'app-auditorinvoice',
  templateUrl: './auditorInvoice.html',
  styleUrls: ['./auditorInvoice.scss']
})
export class AuditorInvoiceComponent implements OnInit {

  displayedColumns: string[] = ['select', 'invoiceNumber', 'orderNumber', 'amount', 'sellerId', 'bankerId', 'createdDate', 'status'];
  dataSource:any = new MatTableDataSource<Invoice>(ELEMENT_DATA);
  selection = new SelectionModel<Invoice>(true, []);

  
  @Input() changing: Subject<boolean>;

  loadGridSpinner:boolean = true;

  @ViewChild(MatSort) sort: MatSort;
  constructor(
          private http: RestService, private route: Router) { }
  private fileUrl:string
  private role:String;
  private createInvoice:any = {};
  ngOnInit() {
    // loadData
    var loginData = JSON.parse(localStorage.getItem("login"));
    this.role = loginData.role;
    this.getInvoices();
/*    this.changing.subscribe(v=>{
      console.log("tab changed"+v);
      // refresh grid on tab change
      this.reloadGrid();
    });*/
  }

  getInvoices(){
    this.http.getToBeApprovedInvoices()
    .subscribe(res => {
      console.log(res.json());
      let invoices = res.json().invoices;
      for(var i=0; i<invoices.length;i++){
          var createdDate = invoices[i].created.split('T')[0];
          var sellerId = invoices[i].seller.split('#')[1];
          var bankerId = invoices[i].banker.split('#')[1];
          var buyerId = invoices[i].buyer.split('#')[1];
          invoices[i].sellerId = sellerId;
          invoices[i].buyerId = buyerId;
          invoices[i].bankerId = bankerId;
          invoices[i].createdDate = createdDate;
          invoices[i].status = invoices[i].statusMessage;
          invoices[i].disabled = false;
          if(invoices[i].statusCode === 3){
            invoices[i].disabled = true
          } 
      }

      this.dataSource = new MatTableDataSource<Invoice>(invoices);
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
  }
}
