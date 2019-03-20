import { Component, OnInit, AfterContentInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatTabChangeEvent } from '@angular/material';
import {Subject} from 'rxjs/Subject';

import { AppComponent } from '../app.component';
import { isArray } from 'util';

@Component({
  selector: 'app-order-page',
  templateUrl: './order-page.component.html',
  styleUrls: ['./order-page.component.scss']
})
export class OrderPageComponent implements OnInit {
  private orderNumber:String = "";
  private currentTab:String = "";
  private currentIndex:number = 0;
  private changingValue: Subject<boolean> = new Subject();

  constructor(private route: ActivatedRoute,
            private app: AppComponent) { }


  ngOnInit(){
    setTimeout(() => {
      this.app.setLoggedIn();
      this.app.show();
    } , 0);
    console.log(this.route.snapshot);
    let path;
    if(isArray(this.route.snapshot.url)){
      path = this.route.snapshot.url[0]['path'];
    } else {
      path = this.route.snapshot.url['path'];
    }
    console.log(path);
    //console.log("snapshot url is "+this.route.snapshot+"-"+this.route.snapshot.url);
    if(path === 'createorder'){
      this.currentTab = 'New Order';
      this.addTab(null, 'new');
    }else if(path === 'order'){
      this.orderNumber = this.route.snapshot.queryParamMap.get('orderNumber');
      if(this.orderNumber){
        this.addTab(this.orderNumber, 'detail');
      }
    }
  }

  ngAfterContentInit() {
    setTimeout(() => {
      this.app.hide();
    } , 0);
  }

  tabs = ['Order List'];
  selected = new FormControl(0);

  addTab(id, page){
    this.orderNumber=id;
    //console.log(this.tabs.indexOf('Order Detail'));
    if(page == 'detail'){
      if(this.tabs.indexOf('Order Detail') == -1){
        this.tabs.push('Order Detail');
      }
      this.currentTab = 'Order Detail';
      
    } else if(page == 'new'){
      if(this.tabs.indexOf('New Order') == -1){
        this.tabs.push('New Order');
      }
      this.currentTab = 'New Order';
    }
    //console.log("current tab value is "+this.currentTab.valueOf());
    //console.log("Array index of"+this.tabs.indexOf(this.currentTab.valueOf()));
    this.selected.setValue(this.tabs.indexOf(this.currentTab.valueOf()));
    
  }

  removeTab(){
    console.log("Removing detail tab. pass index");
    this.tabs.splice(1, 1);
  }

  onLinkClick(event: MatTabChangeEvent) {
    console.log('event => ', event);
    console.log('index => ', event.index);
    console.log('tab => ', event.tab);
    this.currentIndex = event.index;
    this.currentTab = event.tab.textLabel;
    if(event.index == 0){
      //window.history.pushState({},'',`/order`);
      this.changingValue.next(true);
      window.history.replaceState({},'',`/order`);
      // reloadGrid();
    }else if(this.orderNumber){
      //window.history.pushState({},'',`/order?orderNumber=`+this.orderNumber);
      window.history.replaceState({},'',`/order?orderNumber=`+this.orderNumber);
    }else{
      window.history.replaceState({},'',`/createorder`);
    }
    //this.router.navigate(['contacts']); 
  }

  getCurrentTab(){
    return this.currentTab;
  }

  getCurrentIndex(){
    return this.currentIndex;
  }


}
