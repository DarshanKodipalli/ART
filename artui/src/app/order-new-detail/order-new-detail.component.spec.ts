import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderNewDetailComponent } from './order-new-detail.component';

describe('OrderNewDetailComponent', () => {
  let component: OrderNewDetailComponent;
  let fixture: ComponentFixture<OrderNewDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OrderNewDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderNewDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
