import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentNewDetailComponent } from './payment-new-detail.component';

describe('PaymentNewDetailComponent', () => {
  let component: PaymentNewDetailComponent;
  let fixture: ComponentFixture<PaymentNewDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PaymentNewDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PaymentNewDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
