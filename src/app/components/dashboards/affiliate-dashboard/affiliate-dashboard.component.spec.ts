import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AffiliateDashboardComponent } from './affiliate-dashboard.component';

describe('AffiliateDashboardComponent', () => {
  let component: AffiliateDashboardComponent;
  let fixture: ComponentFixture<AffiliateDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AffiliateDashboardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AffiliateDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
