import { Component, OnInit, ViewChild, Input } from '@angular/core';
import {SelectionModel} from '@angular/cdk/collections';
import {MatSort, MatTableDataSource, MatPaginator} from '@angular/material';
import {Subject} from 'rxjs/Subject';
import Swal from 'sweetalert2'
import { RestService } from '../services/rest.service';
import { Router } from '@angular/router';

export interface Order {
  orderNumber: string;
  amount: string;
  sellerId: string;
  bankerId: string;
  createdDate: string;
  status: string;
}

const ELEMENT_DATA: Order[] = [
];

@Component({
  selector: 'app-auditororder',
  templateUrl: './auditorOrder.html',
  styleUrls: ['./auditorOrder.scss']
})
export class AuditorOrderComponent implements OnInit {
  displayedColumns: string[] = ['select', 'orderNumber', 'amount', 'sellerId', 'bankerId', 'createdDate', 'status'];
  dataSource = new MatTableDataSource<Order>(ELEMENT_DATA);
  selection = new SelectionModel<Order>(true, []);
  private toolTip:String = "Submit the Order";
  private buttonType:String = "done"
  @Input() changing: Subject<boolean>;

  loadGridSpinner:boolean = true;

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(private service: RestService, private http:RestService, private rout:Router) {
      if(JSON.parse(localStorage.getItem("login")).role === 'seller'){
        this.toolTip = "Approve the Order and create an Invoice  "
      }
   }

  ngOnInit() {
    // loadData
    this.getOrders();
/*    this.changing.subscribe(v=>{
      console.log("tab changed"+v);
      // refresh grid on tab change
      this.reloadGrid();
    });*/
  }
viewTransaction(i){
      console.log(i);
      localStorage.setItem('ViewTransactionsAssetData',JSON.stringify(i));
      this.rout.navigate(['/timeline']);
      
}
  getOrders(){
    this.service.getAllOrders().subscribe(
    (res) => {
      console.log(res.json());
      let orders = res.json().orders;
      for(var i=0; i<orders.length;i++){
          var createdDate = orders[i].created.split('T')[0];
          var sellerId = orders[i].seller.split('#')[1];
          var bankerId = orders[i].banker.split('#')[1];
          orders[i].sellerId = sellerId;
          orders[i].bankerId = bankerId;
          orders[i].createdDate = createdDate;
          orders[i].status = orders[i].statusMessage;
          orders[i].disabled = false;
          if(orders[i].statusCode === 3){
            orders[i].disabled = true
          } 
      }
      this.dataSource = new MatTableDataSource<Order>(orders);
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
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
  submitOrder(order){
/*    if(order.statusCode === 3 ){
        Swal(
          'Order Already Submitted',
        ).then((newResult)=>{
          if(newResult.value){
          }
        })
    }else{
*/      if(JSON.parse(localStorage.getItem('login')).role === "buyer"){
        console.log(order);
        Swal({
          title: 'Submit a purchase order?',
          text: 'This\'ll Submit the purchase order you have created!',
          type: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Submit',
          cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.value) {
                console.log(order);
                var placeOrder:any = {};
                for(var i=0;i<order.items.length;i++){
                  delete order.items[i].$class;
                }
                placeOrder.items = order.items;
                placeOrder.seller = order.sellerId;
                placeOrder.id = order.orderNumber
                console.log(placeOrder);
                this.http.placeOrder(placeOrder).subscribe(
                  (response)=>{
                    console.log(response.json())
                    Swal(
                      'Purchase Order Submitted',
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
              'A PO isn\'t submitted yet',
              'error'
            )
          }
        })      
      }else if(JSON.parse(localStorage.getItem('login')).role === "seller"){
        Swal({
          title: 'Approve the Order and Create an Invoice?',
          text: 'This\'ll Approve and create an Invoice !',
          type: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Okay',
          cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.value) {
          console.log(order)
          var approveOrderData:any = {};
          approveOrderData.$class = "io.aeries.art.order.RequestShipping";
          approveOrderData.orderNumber = order.orderNumber;
          for(var i=0;i<order.items.length;i++){
            delete order.items[i].$class;
          }
          approveOrderData.items = order.items;
          this.http.approveOrder(approveOrderData).subscribe(
            (response)=>{
              console.log("Response from approveOrderData");
              console.log(response);
              this.http.createInvoice(approveOrderData).subscribe(
                (response)=>{
                    Swal(
                      'Invoice Created',
                      'Transaction Hash: '+response.json().transactionHash+'',
                      'success'
                    ).then((newResult)=>{
                      if(newResult.value){
                        this.reloadGrid();
                      }
                    })
                },
                (error)=>{
                  console.log(error);
                })
            },(error)=>{
              console.log(error);
            })
              } else if (result.dismiss === Swal.DismissReason.cancel) {
            Swal(
              'Cancelled',
              'A Invoice isn\'t Created yet',
              'error'
            )
          }
        })  
      }
/*    }*/
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
