import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FormSchemaService } from '../../../services/form-schema.service';
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
export class FormBuilderShellComponent implements OnInit {
  private readonly formSchemaService = inject(FormSchemaService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly schemaKeyPattern = /^[a-z0-9_]+$/;

  public schemas: FormSchemaSummary[] = [];
  public isLoading = true;
  public errorMessage: string | null = null;
  public previewedSchemaId: number | null = null;
  public previewSchema: FormSchema | null = null;
  public previewLoadingSchemaId: number | null = null;
  public previewErrorMessage: string | null = null;

  public showNewSchemaForm = false;
  public newSchema: NewSchemaDraft = this.createEmptySchemaDraft();
  public isCreating = false;
  public createError: string | null = null;

  public ngOnInit(): void {
    this.loadSchemas();
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
    return this.isSupportedSchemaDraft(schema.schema_type, schema.form_type);
  }

  public openSchemaEditor(schema: FormSchemaSummary): void {
    void this.router.navigate(['/gofiliate/form-builder/schemas', schema.schema_id]);
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
}
