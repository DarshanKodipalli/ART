import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminUsersBuyerDetailComponent } from './admin-users-buyer-detail.component';

describe('AdminUsersBuyerDetailComponent', () => {
  let component: AdminUsersBuyerDetailComponent;
  let fixture: ComponentFixture<AdminUsersBuyerDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminUsersBuyerDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminUsersBuyerDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
