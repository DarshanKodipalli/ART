import { Component, OnInit } from '@angular/core';
import { OrderPageComponent } from '../order-page/order-page.component';
import {MatSort, MatTableDataSource, MatPaginator} from '@angular/material';

export interface PeriodicElement {
  name: string;
  position: number;
  weight: number;
  symbol: string;
}

export interface Items {
  id: string;
  description: string;
  units: string;
  price: string;
}

const ELEMENT_DATA: PeriodicElement[] = [
  {position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H'},
  {position: 2, name: 'Helium', weight: 4.0026, symbol: 'He'},
  {position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li'},
  {position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be'},
  {position: 5, name: 'Boron', weight: 10.811, symbol: 'B'},
  {position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C'},
  {position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N'},
  {position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O'},
  {position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F'},
  {position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne'},
];

@Component({
  selector: 'app-order-detail',
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss']
})
export class OrderDetailComponent implements OnInit {
  displayedColumns: string[] = ['position', 'name', 'weight', 'symbol'];
  private newItemAttribute: any = {};
  private itemsAddedBool:boolean = false;
  private totalCost:any;
  private newItem:any = [];
  private totalItemsAdded:number = 0;
  private dataSource :any = [];
  private orderDetails:any = {};
  constructor(private order: OrderPageComponent) {
    this.orderDetails = JSON.parse(localStorage.getItem("orderDetail"));
    console.log(this.orderDetails);
    this.dataSource = this.orderDetails.items;
    console.log(this.dataSource)
   }

  ngOnInit() {
  }
  addItem(itemDetails){
    this.itemsAddedBool = true;
    console.log(itemDetails);
    this.totalCost += itemDetails.price;
    this.newItem.push(itemDetails);
    this.newItemAttribute = {};
    ++this.totalItemsAdded; 
    console.log(this.newItem);
    this.dataSource = this.newItem;
  }
  removeTab(){
    this.order.removeTab();
  }

}
