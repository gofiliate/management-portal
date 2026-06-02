import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { FormSchemaService } from '../../services/form-schema.service';
import { ActionGuardService } from '../../services/action-guard.service';
import { CreateFormSchemaRequest, FormSchema, FormSchemaSummary } from '../../models/form-schema.model';

interface NewSchemaDraft {
  schemaType: string;
  formType: string;
  schemaKey: string;
  label: string;
}

interface StatusBadge {
  className: string;
  label: string;
}

@Component({
  selector: 'app-form-builder-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './form-builder-shell.component.html',
  styleUrl: './form-builder-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormBuilderShellComponent implements OnInit, OnDestroy {
  private readonly formSchemaService = inject(FormSchemaService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly actionGuard = inject(ActionGuardService);
  private readonly schemaKeyPattern = /^[a-z0-9_]+$/;
  private readonly subscriptions = new Subscription();
  private awaitingPermissionResponse = false;

  public schemas: FormSchemaSummary[] = [];
  public isLoading = true;
  public errorMessage: string | null = null;
  public previewedSchemaId: number | null = null;
  public previewSchema: FormSchema | null = null;
  public previewLoadingSchemaId: number | null = null;
  public previewErrorMessage: string | null = null;
  public copyingSchemaId: number | null = null;

  public showNewSchemaForm = false;
  public newSchema: NewSchemaDraft = this.createEmptySchemaDraft();
  public isCreating = false;
  public createError: string | null = null;
  public permissionsResolved = false;
  public permissionsLoading = true;

  public ngOnInit(): void {
    this.subscriptions.add(this.actionGuard.actions$.subscribe(() => {
      this.cdr.markForCheck();
    }));

    this.subscriptions.add(this.actionGuard.loading$.subscribe((loading) => {
      this.permissionsLoading = loading;
      if (this.awaitingPermissionResponse && !loading) {
        const shouldLoadSchemas = !this.permissionsResolved && this.canViewPage;
        this.awaitingPermissionResponse = false;
        this.permissionsResolved = true;
        if (shouldLoadSchemas) {
          this.loadSchemas();
          return;
        }
      }

      this.cdr.markForCheck();
    }));

    this.awaitingPermissionResponse = true;
    this.actionGuard.refreshActions();
  }

  public ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  public loadSchemas(previewSchemaId?: number): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.cdr.markForCheck();

    this.formSchemaService.listSchemas().subscribe({
      next: (schemas) => {
        this.schemas = [...schemas].sort((left, right) => {
          const leftIdentity = `${left.schema_type}:${left.form_type}:${left.label?.trim() || left.schema_key}`;
          const rightIdentity = `${right.schema_type}:${right.form_type}:${right.label?.trim() || right.schema_key}`;
          return leftIdentity.localeCompare(rightIdentity);
        });
        this.isLoading = false;

        if (previewSchemaId) {
          const matchingSchema = this.schemas.find((schema) => schema.schema_id === previewSchemaId);
          if (matchingSchema) {
            this.loadSchemaPreview(matchingSchema);
            return;
          }
        }

        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.errorMessage = this.extractErrorMessage(error, 'Failed to load form schemas. Please try again.');
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  public openNewSchemaForm(): void {
    if (!this.canCreateSchemas) {
      return;
    }

    this.showNewSchemaForm = true;
    this.createError = null;
    this.newSchema = this.createEmptySchemaDraft();
    this.cdr.markForCheck();
  }

  public cancelNewSchema(): void {
    this.showNewSchemaForm = false;
    this.createError = null;
    this.newSchema = this.createEmptySchemaDraft();
    this.cdr.markForCheck();
  }

  public normaliseSchemaKey(): void {
    this.newSchema.schemaKey = this.sanitiseSchemaKey(this.newSchema.schemaKey);
  }

  public onSchemaTypeChanged(): void {
    if (this.newSchema.schemaType === 'internal') {
      this.newSchema.formType = 'onboarding';
      if (!this.newSchema.schemaKey || this.newSchema.schemaKey === 'affiliate_signup') {
        this.newSchema.schemaKey = 'otp_onboarding';
      }
      if (!this.newSchema.label || this.newSchema.label === 'Affiliate Signup Form') {
        this.newSchema.label = 'OTP Onboarding Form';
      }
      return;
    }

    this.newSchema.formType = 'signup';
    if (!this.newSchema.schemaKey || this.newSchema.schemaKey === 'otp_onboarding') {
      this.newSchema.schemaKey = 'affiliate_signup';
    }
    if (!this.newSchema.label || this.newSchema.label === 'OTP Onboarding Form') {
      this.newSchema.label = 'Affiliate Signup Form';
    }
  }

  public createNewSchema(): void {
    if (!this.canCreateSchemas) {
      return;
    }

    const schemaKey = this.sanitiseSchemaKey(this.newSchema.schemaKey);
    const label = this.newSchema.label.trim();

    if (!schemaKey || !label) {
      this.createError = 'Schema key and label are required.';
      this.cdr.markForCheck();
      return;
    }

    if (!this.schemaKeyPattern.test(schemaKey)) {
      this.createError = 'Schema key must use lowercase letters, numbers, and underscores only.';
      this.cdr.markForCheck();
      return;
    }

    if (!this.isSupportedSchemaDraft(this.newSchema.schemaType, this.newSchema.formType)) {
      this.createError = 'Only external signup schemas and internal onboarding schemas are supported right now.';
      this.cdr.markForCheck();
      return;
    }

    this.isCreating = true;
    this.createError = null;
    this.newSchema = {
      ...this.newSchema,
      schemaKey,
      label
    };
    this.cdr.markForCheck();

    const payload: CreateFormSchemaRequest = {
      form_type: this.newSchema.formType,
      schema_type: this.newSchema.schemaType,
      schema_key: schemaKey,
      label
    };

    this.formSchemaService.createDraft(payload).subscribe({
      next: (schema) => {
        this.isCreating = false;
        this.showNewSchemaForm = false;
        this.createError = null;
        this.newSchema = this.createEmptySchemaDraft();
        void this.router.navigate(['/gofiliate/form-builder/schemas', schema.schema_id]);
      },
      error: (error: unknown) => {
        this.createError = this.extractErrorMessage(error, 'Failed to create schema. Please try again.');
        this.isCreating = false;
        this.cdr.markForCheck();
      }
    });
  }

  public toggleSchemaPreview(schema: FormSchemaSummary): void {
    if (this.previewedSchemaId === schema.schema_id && !this.previewLoadingSchemaId) {
      this.previewedSchemaId = null;
      this.previewSchema = null;
      this.previewErrorMessage = null;
      this.cdr.markForCheck();
      return;
    }

    this.loadSchemaPreview(schema);
  }

  public isPreviewOpen(schema: FormSchemaSummary): boolean {
    return this.previewedSchemaId === schema.schema_id;
  }

  public isPreviewLoading(schema: FormSchemaSummary): boolean {
    return this.previewLoadingSchemaId === schema.schema_id;
  }

  public getSchemaIcon(schema: FormSchemaSummary): string {
    if (schema.form_type === 'onboarding') {
      return 'fa fa-sitemap';
    }

    if (schema.is_active) {
      return 'fa fa-wpforms';
    }

    return schema.status === 'draft'
      ? 'fa fa-pencil-square-o'
      : 'fa fa-file-text-o';
  }

  public getStatusBadge(schema: FormSchemaSummary): StatusBadge {
    if (schema.is_active) {
      return { className: 'bg-success-subtle text-success-emphasis', label: 'Active' };
    }

    if (schema.status === 'draft') {
      return { className: 'bg-warning-subtle text-warning-emphasis', label: 'Draft' };
    }

    return { className: 'bg-secondary-subtle text-secondary-emphasis', label: this.toTitleCase(schema.status) };
  }

  public trackBySchema(_: number, schema: FormSchemaSummary): number {
    return schema.schema_id;
  }

  public getAudienceBadgeClass(schema: FormSchemaSummary): string {
    return schema.schema_type === 'internal'
      ? 'bg-dark-subtle text-dark-emphasis'
      : 'bg-info-subtle text-info-emphasis';
  }

  public getAudienceLabel(schema: FormSchemaSummary): string {
    return schema.schema_type === 'internal' ? 'OTP internal' : 'External portal';
  }

  public getFormTypeLabel(schema: FormSchemaSummary): string {
    return schema.form_type === 'onboarding' ? 'Onboarding' : this.toTitleCase(schema.form_type);
  }

  public canOpenEditor(schema: FormSchemaSummary): boolean {
    return this.canViewPage && this.isSupportedSchemaDraft(schema.schema_type, schema.form_type);
  }

  public openSchemaEditor(schema: FormSchemaSummary): void {
    void this.router.navigate(['/gofiliate/form-builder/schemas', schema.schema_id]);
  }

  public canCopySchema(schema: FormSchemaSummary): boolean {
    return this.canCreateSchemas && this.isSupportedSchemaDraft(schema.schema_type, schema.form_type);
  }

  public isCopyingSchema(schema: FormSchemaSummary): boolean {
    return this.copyingSchemaId === schema.schema_id;
  }

  public copySchema(schema: FormSchemaSummary): void {
    if (!this.canCopySchema(schema) || this.copyingSchemaId !== null) {
      return;
    }

    this.copyingSchemaId = schema.schema_id;
    this.errorMessage = null;
    this.cdr.markForCheck();

    const payload: CreateFormSchemaRequest = {
      form_type: schema.form_type,
      schema_type: schema.schema_type,
      schema_key: this.buildCopiedSchemaKey(schema),
      label: this.buildCopiedSchemaLabel(schema),
      clone_from_schema_id: schema.schema_id
    };

    this.formSchemaService.createDraft(payload).subscribe({
      next: (copiedSchema) => {
        this.copyingSchemaId = null;
        void this.router.navigate(['/gofiliate/form-builder/schemas', copiedSchema.schema_id]);
      },
      error: (error: unknown) => {
        this.errorMessage = this.extractErrorMessage(error, 'Failed to copy schema. Please try again.');
        this.copyingSchemaId = null;
        this.cdr.markForCheck();
      }
    });
  }

  private loadSchemaPreview(schema: FormSchemaSummary): void {
    this.previewedSchemaId = schema.schema_id;
    this.previewSchema = null;
    this.previewErrorMessage = null;
    this.previewLoadingSchemaId = schema.schema_id;
    this.cdr.markForCheck();

    this.formSchemaService.getSchema(schema.schema_id).subscribe({
      next: (formSchema) => {
        if (this.previewedSchemaId !== schema.schema_id) {
          return;
        }

        this.previewSchema = {
          ...formSchema,
          sections: formSchema.sections ?? [],
          fields: formSchema.fields ?? []
        };
        this.previewLoadingSchemaId = null;
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        if (this.previewedSchemaId !== schema.schema_id) {
          return;
        }

        this.previewSchema = null;
        this.previewLoadingSchemaId = null;
        this.previewErrorMessage = this.extractErrorMessage(error, 'Unable to load schema details.');
        this.cdr.markForCheck();
      }
    });
  }

  private createEmptySchemaDraft(): NewSchemaDraft {
    return {
      schemaType: 'external',
      formType: 'signup',
      schemaKey: 'affiliate_signup',
      label: 'Affiliate Signup Form'
    };
  }

  private isSupportedSchemaDraft(schemaType: string, formType: string): boolean {
    return (schemaType === 'external' && formType === 'signup')
      || (schemaType === 'internal' && formType === 'onboarding');
  }

  private sanitiseSchemaKey(schemaKey: string): string {
    return schemaKey.trim().toLowerCase().replace(/[\s-]+/g, '_');
  }

  private buildCopiedSchemaKey(schema: FormSchemaSummary): string {
    const existingKeys = new Set(
      this.schemas
        .filter((candidate) => candidate.form_type === schema.form_type && candidate.schema_type === schema.schema_type)
        .map((candidate) => candidate.schema_key)
    );

    const baseKey = this.sanitiseSchemaKey(`${schema.schema_key}_copy`);
    let candidateKey = baseKey;
    let suffix = 2;

    while (existingKeys.has(candidateKey)) {
      candidateKey = `${baseKey}_${suffix}`;
      suffix += 1;
    }

    return candidateKey;
  }

  private buildCopiedSchemaLabel(schema: FormSchemaSummary): string {
    const sourceLabel = (schema.label || this.toTitleCase(schema.schema_key)).trim();
    const baseLabel = `Copy - ${sourceLabel}`;
    const existingLabels = new Set(
      this.schemas
        .filter((candidate) => candidate.form_type === schema.form_type && candidate.schema_type === schema.schema_type)
        .map((candidate) => candidate.label?.trim())
        .filter((label): label is string => Boolean(label))
    );

    let candidateLabel = baseLabel;
    let suffix = 2;

    while (existingLabels.has(candidateLabel)) {
      candidateLabel = `${baseLabel} (${suffix})`;
      suffix += 1;
    }

    return candidateLabel;
  }

  private extractErrorMessage(error: unknown, fallbackMessage: string): string {
    if (typeof error === 'object' && error !== null) {
      const errorWithMessage = error as {
        message?: string;
        error?: {
          message?: string;
        };
      };

      return errorWithMessage.error?.message || errorWithMessage.message || fallbackMessage;
    }

    return fallbackMessage;
  }

  private toTitleCase(value: string): string {
    return value
      .split(/[_\s-]+/)
      .filter((part) => part.length > 0)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  public get canViewPage(): boolean {
    return this.actionGuard.canView();
  }

  public get canCreateSchemas(): boolean {
    return this.canViewPage && this.actionGuard.canCreate();
  }
}
