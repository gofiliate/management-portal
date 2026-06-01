import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-manage-signup-schema',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './manage-signup-schema.component.html',
  styleUrl: './manage-signup-schema.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManageSignupSchemaComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  public instanceId = 0;
  public errorMessage: string | null = null;

  public ngOnInit(): void {
    this.instanceId = Number(this.route.snapshot.paramMap.get('id') || 0);
    if (!this.instanceId) {
      this.errorMessage = 'A valid instance id is required.';
      this.cdr.markForCheck();
      return;
    }

    void this.router.navigate(['/gofiliate/form-builder/signup'], {
      queryParams: {
        back: 'instance',
        instanceId: this.instanceId
      }
    });
  }
}
