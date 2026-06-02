import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { FormSchemaService } from '../../../services/form-schema.service';

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
  private readonly formSchemaService = inject(FormSchemaService);

  public instanceId = 0;
  public errorMessage: string | null = null;

  public ngOnInit(): void {
    void this.redirectToCurrentSchema();
  }

  private async redirectToCurrentSchema(): Promise<void> {
    this.instanceId = Number(this.route.snapshot.paramMap.get('id') || 0);
    if (!this.instanceId) {
      this.errorMessage = 'A valid instance id is required.';
      this.cdr.markForCheck();
      return;
    }

    try {
      const distribution = await firstValueFrom(this.formSchemaService.getCurrentInstanceDistribution(this.instanceId));
      if (distribution.form_schema_id) {
        await this.router.navigate(['/gofiliate/form-builder/schemas', distribution.form_schema_id], {
          queryParams: {
            back: 'instance',
            instanceId: this.instanceId
          }
        });
        return;
      }
    } catch (error) {
      if (!(error instanceof HttpErrorResponse) || error.status !== 404) {
        this.errorMessage = error instanceof HttpErrorResponse
          ? error.error?.message || error.message || 'Unable to open the shared signup schema editor.'
          : 'Unable to open the shared signup schema editor.';
        this.cdr.markForCheck();
        return;
      }
    }

    await this.router.navigate(['/gofiliate/form-builder/signup'], {
      queryParams: {
        back: 'instance',
        instanceId: this.instanceId
      }
    });
  }
}
