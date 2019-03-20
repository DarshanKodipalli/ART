import { Component, OnInit } from '@angular/core';
import { AppComponent } from '../app.component';
import { Router } from '@angular/router';

import { RestService } from '../services/rest.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  error:string="";
  private loginData:any = {};
  constructor(private app: AppComponent,
            private _service: RestService,
            private router: Router ) { }

  ngOnInit() {
    this.loginData.email = "buyer1@aeries.io"
    this.loginData.password = "password"
    setTimeout(() => {
      this.app.removeLoggedIn();
    } , 0);
    
  }

  login(data){
    this.error="";
    this.app.show();
    this._service.signIn(data)
      .subscribe(res => {
        if(res){
          var loginData:any={};
          loginData = res.json();
          console.log(res.json());
          // roles seller, buyer and banker
          //var data = {"id":"1234","role":"banker"};
          localStorage.setItem("login", JSON.stringify(loginData.data));
          this.router.navigate(['/dashboard']);
        }
      },
      (error)=>{
        this.error="Email or password is wrong";
        console.log("Error:"+error);
        console.log("Display error message in user form");
        this.app.hide();
      });
  }

}
