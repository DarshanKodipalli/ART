import { Component, OnInit, ViewChild, Input } from '@angular/core';
import {SelectionModel} from '@angular/cdk/collections';
import {MatSort, MatTableDataSource} from '@angular/material';
import {Subject} from 'rxjs/Subject';
import Swal from 'sweetalert2'


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
  selector: 'app-auditorpayment',
  templateUrl: './auditorPayment.html',
  styleUrls: ['./auditorPayment.scss']
})
export class AuditorPaymentComponent implements OnInit {
  displayedColumns: string[] = ['select', 'orderNumber', 'amount','utrNumber', 'sellerId', 'bankerId', 'createdDate', 'status'];
  dataSource = new MatTableDataSource<Payment>(ELEMENT_DATA);
  selection = new SelectionModel<Payment>(true, []);

  
  @Input() changing: Subject<boolean>;

  loadGridSpinner:boolean = true;

  @ViewChild(MatSort) sort: MatSort;
  constructor(
          private service: RestService) { }

  private role:any;
  private fileUrl:string
  ngOnInit() {
    var loginData = JSON.parse(localStorage.getItem("login"));
    this.role = loginData.role;

    // loadData
    this.getOrders();
/*    this.changing.subscribe(v=>{
      console.log("tab changed"+v);
      // refresh grid on tab change
      this.reloadGrid();
    });*/
  }

  getOrders(){
    this.service.getPayments().subscribe(
    (res) => {
      console.log(res.json());
      let orders = res.json().data;
      for(var i=0; i<orders.length;i++){
          var createdDate = orders[i].created.split('T')[0];
          var bankerId = orders[i].banker.split('#')[1];
          orders[i].buyerId ="buyer1@aeries.io"
          orders[i].bankerId = bankerId;
          orders[i].createdDate = createdDate;
          orders[i].status = orders[i].statusMessage;
          orders[i].disabled = false;
          if(orders[i].statusCode === 3){
            orders[i].disabled = true
          } 
      }
      this.dataSource = new MatTableDataSource<Payment>(orders);
      this.dataSource.sort = this.sort;
      setTimeout(() => {
        this.hideGridSpinner();
      } , 0);
      
      //this.dataSource.sort = this.sort;
      //console.log(orders);
    },(error)=>{
      console.log(error)
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
}
