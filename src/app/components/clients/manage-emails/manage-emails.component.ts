import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-manage-emails',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container-fluid py-4">
      <div class="row">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h3 class="mb-1">
                <i class="fa fa-envelope me-2"></i>
                Manage Emails
              </h3>
              <p class="text-muted mb-0">
                Configure platform email settings for Instance #{{ instanceId }}
              </p>
            </div>
            <button class="btn btn-outline-secondary" [routerLink]="['/clients/manage-instance', instanceId]">
              <i class="fa fa-arrow-left me-1"></i>
              Back to Instance
            </button>
          </div>

          <div class="card">
            <div class="card-body text-center py-5">
              <i class="fa fa-envelope fa-3x text-muted mb-3"></i>
              <h5 class="text-muted mb-2">Emails Management</h5>
              <p class="text-muted mb-0">This section is ready for implementation.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ManageEmailsComponent implements OnInit {
  public instanceId = 0;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.instanceId = Number(this.route.snapshot.paramMap.get('id')) || 0;
  }
}
