import { Component, OnInit } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';

@Component({
  selector: 'app-auth-guard',
  templateUrl: './auth-guard.component.html',
  styleUrls: ['./auth-guard.component.scss']
})
export class AuthGuardComponent implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() {
  }

  canActivate(route: ActivatedRouteSnapshot){
    if(localStorage.getItem('login')){
      return true;
    }

    this.router.navigate(['/login']);
    return false;
  }

}
