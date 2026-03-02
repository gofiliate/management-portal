import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DynamicDashboardLoaderComponent } from './dynamic-dashboard-loader.component';

describe('DynamicDashboardLoaderComponent', () => {
  let component: DynamicDashboardLoaderComponent;
  let fixture: ComponentFixture<DynamicDashboardLoaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DynamicDashboardLoaderComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DynamicDashboardLoaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
