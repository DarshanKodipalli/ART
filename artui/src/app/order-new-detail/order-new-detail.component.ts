import { Component, OnInit } from '@angular/core';
import { OrderPageComponent } from '../order-page/order-page.component';
import Swal from 'sweetalert2'
import { RestService } from '../services/rest.service';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
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
  selector: 'app-order-new-detail',
  templateUrl: './order-new-detail.component.html',
  styleUrls: ['./order-new-detail.component.scss']
})
export class OrderNewDetailComponent implements OnInit {
  displayedColumns: string[] = ['position', 'name', 'weight', 'symbol'];
  private newItemAttribute: any = {};
  private itemsAddedBool:boolean = false;
  private totalCost:any;
  private newItem:any = [];
  private totalItemsAdded:number = 0;
  private dataSource :any = [];
  private sellerID:String = "";
  constructor(private order: OrderPageComponent, private http:RestService,  private rout: Router, private spinnerService:Ng4LoadingSpinnerService) {
      this.sellerID = "seller1@aeries.io"
   }

  ngOnInit() {
  }
  addItem(itemDetails){
    this.dataSource = [];
    this.itemsAddedBool = true;
    console.log(itemDetails);
    this.totalCost += itemDetails.price;
    this.newItem.push(itemDetails);
    this.newItemAttribute = {};
    ++this.totalItemsAdded; 
    console.log(this.newItem);
    this.dataSource = this.newItem;
  }
    createOrder(seller: any) {
    Swal({
      title: 'Create Purchase Order?',
      text: 'This\'ll create a new Purchase order with the fields provided!',
      type: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.value) {
        this.spinnerService.show()
        var orderData:any = {};
        orderData.seller = seller;
        orderData.items = this.newItem;
        console.log(orderData);
        this.http.addAsset(orderData).subscribe(
          (response)=>{
            if(response){
              this.spinnerService.hide();
              console.log("Response");
              var resp = response.json()
              Swal(
                'Purchase Order created',
                'Transaction Hash: '+resp.transactionHash+'',
                'success'
              ).then((newResult)=>{
                if(newResult.value){
                  this.rout.navigate(['/order']);
                }
              })
            }
          },(error)=>{

          });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal(
          'Cancelled',
          'A new asset isn\'t added yet',
          'error'
        )
      }
    })
    }  
  removeTab(){
    this.order.removeTab();
  }
}
