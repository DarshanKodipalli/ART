import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoiceNewDetailComponent } from './invoice-new-detail.component';

describe('InvoiceNewDetailComponent', () => {
  let component: InvoiceNewDetailComponent;
  let fixture: ComponentFixture<InvoiceNewDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InvoiceNewDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InvoiceNewDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
