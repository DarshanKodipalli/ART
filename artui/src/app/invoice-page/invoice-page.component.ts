import { Component, OnInit, AfterContentInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatTabChangeEvent } from '@angular/material';
import {Subject} from 'rxjs/Subject';

import { AppComponent } from '../app.component';
import { isArray } from 'util';


@Component({
  selector: 'app-invoice-page',
  templateUrl: './invoice-page.component.html',
  styleUrls: ['./invoice-page.component.scss']
})
export class InvoicePageComponent implements OnInit {

  private invoiceNumber:String = "";
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
    if(path === 'createinvoice'){
      this.currentTab = 'New Invoice';
      this.addTab(null, 'new');
    }else if(path === 'invoice'){
      this.invoiceNumber = this.route.snapshot.queryParamMap.get('invoiceNumber');
      if(this.invoiceNumber){
        this.addTab(this.invoiceNumber, 'detail');
      }
    }
  }

  ngAfterContentInit() {
    setTimeout(() => {
      this.app.hide();
    } , 0);
  }

  tabs = ['Invoice List'];
  selected = new FormControl(0);

  addTab(id, page){
    this.invoiceNumber = id;
    //console.log(this.tabs.indexOf('Invoice Detail'));
    if(page == 'detail'){
      if(this.tabs.indexOf('Invoice Detail') == -1){
        this.tabs.push('Invoice Detail');
      }
      this.currentTab = 'Invoice Detail';
      
    } else if(page == 'new'){
      if(this.tabs.indexOf('New Invoice') == -1){
        this.tabs.push('New Invoice');
      }
      this.currentTab = 'New Invoice';
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
      window.history.replaceState({},'',`/invoice`);
      // reloadGrid();
    }else if(this.invoiceNumber){
      window.history.replaceState({},'',`/invoice?invoiceNumber=`+this.invoiceNumber);
    }else{
      window.history.replaceState({},'',`/createinvoice`);
    }
  }

  getCurrentTab(){
    return this.currentTab;
  }

  getCurrentIndex(){
    return this.currentIndex;
  }

}
