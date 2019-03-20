import { Component, OnInit, AfterContentInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatTabChangeEvent } from '@angular/material';
import {Subject} from 'rxjs/Subject';

import { AppComponent } from '../app.component';
import { isArray } from 'util';

@Component({
  selector: 'app-payment-page',
  templateUrl: './payment-page.component.html',
  styleUrls: ['./payment-page.component.scss']
})
export class PaymentPageComponent implements OnInit {

  private paymentNumber:String = "";
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
    if(path === 'createpayment'){
      this.currentTab = 'New Payment';
      this.addTab(null, 'new');
    }else if(path === 'payment'){
      this.paymentNumber = this.route.snapshot.queryParamMap.get('paymentNumber');
      if(this.paymentNumber){
        this.addTab(this.paymentNumber, 'detail');
      }
    }
  }

  ngAfterContentInit() {
    setTimeout(() => {
      this.app.hide();
    } , 0);
  }

  tabs = ['Payment List'];
  selected = new FormControl(0);

  addTab(id, page){
    this.paymentNumber = id;
    //console.log(this.tabs.indexOf('Payment Detail'));
    if(page == 'detail'){
      if(this.tabs.indexOf('Payment Detail') == -1){
        this.tabs.push('Payment Detail');
      }
      this.currentTab = 'Payment Detail';
      
    } else if(page == 'new'){
      if(this.tabs.indexOf('New Payment') == -1){
        this.tabs.push('New Payment');
      }
      this.currentTab = 'New Payment';
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
      this.changingValue.next(true);
      window.history.replaceState({},'',`/payment`);
      // reloadGrid();
    }else if(this.paymentNumber){
      window.history.replaceState({},'',`/payment?paymentNumber=`+this.paymentNumber);
    }else{
      window.history.replaceState({},'',`/createpayment`);
    }
  }

  getCurrentTab(){
    return this.currentTab;
  }

  getCurrentIndex(){
    return this.currentIndex;
  }


}
