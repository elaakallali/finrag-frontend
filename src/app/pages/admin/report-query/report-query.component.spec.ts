import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportQueryComponent } from './report-query.component';

describe('ReportQueryComponent', () => {
  let component: ReportQueryComponent;
  let fixture: ComponentFixture<ReportQueryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportQueryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportQueryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
