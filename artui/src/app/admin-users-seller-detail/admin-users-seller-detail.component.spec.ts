import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminUsersSellerDetailComponent } from './admin-users-seller-detail.component';

describe('AdminUsersSellerDetailComponent', () => {
  let component: AdminUsersSellerDetailComponent;
  let fixture: ComponentFixture<AdminUsersSellerDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminUsersSellerDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminUsersSellerDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
