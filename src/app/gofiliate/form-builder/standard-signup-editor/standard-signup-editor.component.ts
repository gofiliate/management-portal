import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Data, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription, combineLatest, forkJoin, Observable, of } from 'rxjs';
import { FormSchemaService } from '../../../services/form-schema.service';
import { ActionGuardService } from '../../../services/action-guard.service';
import {
  CreateFormSchemaRequest,
  FormSchema,
  FormSchemaDistributionSummary,
  FormSchemaField,
  FormSchemaFieldInput,
  FormSchemaOption,
  FormSchemaSection,
  FormSchemaSectionInput,
  FormSchemaSummary,
  InstanceSummary,
  PublishFormSchemaRequest,
  SaveFormSchemaRequest
} from '../../../models/form-schema.model';

type CustomFieldType = FormSchemaField['field_type'];

interface FieldTypeOption {
  value: CustomFieldType;
  label: string;
}

interface EditorRouteConfig {
  formType?: string;
  schemaType?: string;
  schemaKey?: string;
  title?: string;
}

@Component({
  selector: 'app-standard-signup-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './standard-signup-editor.component.html',
  styleUrl: './standard-signup-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StandardSignupEditorComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formSchemaService = inject(FormSchemaService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly actionGuard = inject(ActionGuardService);
  private readonly subscriptions = new Subscription();
  private awaitingPermissionResponse = false;

  private readonly keyPattern = /^[a-z0-9_]+$/;
  private readonly signupFieldTypes: FieldTypeOption[] = [
    { value: 'text', label: 'Text' },
    { value: 'email', label: 'Email' },
    { value: 'password', label: 'Password' },
    { value: 'select', label: 'Select' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'checkbox_group', label: 'Checkbox Group' }
  ];
  private readonly onboardingFieldTypes: FieldTypeOption[] = [
    { value: 'text', label: 'Text' },
    { value: 'email', label: 'Email' },
    { value: 'tel', label: 'Telephone' },
    { value: 'url', label: 'URL' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'color', label: 'Color' },
    { value: 'textarea', label: 'Textarea' },
    { value: 'select', label: 'Select' }
  ];

  private preferredInstanceId: number | null = null;
  private backMode: 'builder' | 'instance' = 'builder';
  private routeTitle: string | null = null;
  private lastRouteFingerprint = '';

  public loading = true;
  public saving = false;
  public publishing = false;
  public distributing = false;
  public deleting = false;
  public distributionsLoading = false;

  public pageTitle = 'Schema Editor';
  public pageDescription = 'Manage form schemas and versions.';
  public backButtonLabel = 'Back to Form Builder';
  public backRoute: Array<string | number> = ['/gofiliate/form-builder'];

  public currentFormType = 'signup';
  public currentSchemaType = 'external';
  public currentSchemaKey = 'affiliate_signup';

  public schemas: FormSchemaSummary[] = [];
  public selectedSchemaId: number | null = null;
  public selectedSchema: FormSchemaSummary | null = null;
  public editableSchema: FormSchema | null = null;
  public instances: InstanceSummary[] = [];
  public selectedInstanceIds = new Set<number>();
  public distributions: FormSchemaDistributionSummary[] = [];
  public errorMessage: string | null = null;
  public validationError: string | null = null;
  public expandedFieldId: number | null = null;
  public permissionsResolved = false;
  public permissionsLoading = true;

  public ngOnInit(): void {
    this.subscriptions.add(this.actionGuard.actions$.subscribe(() => {
      this.cdr.markForCheck();
    }));

    this.subscriptions.add(this.actionGuard.loading$.subscribe((loading) => {
      this.permissionsLoading = loading;
      if (this.awaitingPermissionResponse && !loading) {
        this.awaitingPermissionResponse = false;
        this.permissionsResolved = true;
      }
      this.cdr.markForCheck();
    }));

    this.awaitingPermissionResponse = true;
    this.actionGuard.refreshActions();

    this.subscriptions.add(combineLatest([
      this.route.paramMap,
      this.route.queryParamMap,
      this.route.data
    ]).subscribe(([paramMap, queryParamMap, data]) => {
      const schemaId = this.parsePositiveInt(paramMap.get('id'));
      const instanceId = this.parsePositiveInt(queryParamMap.get('instanceId'));
      const back = queryParamMap.get('back') === 'instance' ? 'instance' : 'builder';
      const fingerprint = JSON.stringify({
        schemaId,
        instanceId,
        back,
        title: data['title'] ?? null,
        formType: data['defaultFormType'] ?? null,
        schemaType: data['defaultSchemaType'] ?? null,
        schemaKey: data['defaultSchemaKey'] ?? null
      });

      if (fingerprint === this.lastRouteFingerprint) {
        return;
      }

      this.lastRouteFingerprint = fingerprint;
      this.applyRouteConfig(data as EditorRouteConfig);
      this.applyBackNavigation(back, instanceId);

      if (schemaId) {
        this.loadRouteSchema(schemaId);
        return;
      }

      this.loadPageData();
    }));
  }

  public ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  public get supportedFieldTypes(): FieldTypeOption[] {
    return this.supportsSections ? this.onboardingFieldTypes : this.signupFieldTypes;
  }

  public get canCreateDraft(): boolean {
    return this.hasCreatePermission && !this.loading && !this.publishing && !this.distributing && !this.deleting;
  }

  public get canEditSelectedSchema(): boolean {
    return this.hasEditPermission && this.selectedSchema?.status === 'draft';
  }

  public get canPublishSelectedSchema(): boolean {
    return this.hasEditPermission && this.selectedSchema?.status === 'draft';
  }

  public get canDeleteSelectedSchema(): boolean {
    return this.hasDeletePermission && this.selectedSchema?.status === 'draft';
  }

  public get canDistributeSelectedSchema(): boolean {
    return this.hasEditPermission
      && this.isDistributableSchemaFamily
      && !!this.selectedSchema?.is_active
      && this.selectedInstanceIds.size > 0;
  }

  public get editorLocked(): boolean {
    return !this.canEditSelectedSchema || this.saving || this.publishing || this.distributing || this.deleting;
  }

  public get supportsSections(): boolean {
    return this.currentSchemaType === 'internal' && this.currentFormType === 'onboarding';
  }

  public get isDistributableSchemaFamily(): boolean {
    return this.currentSchemaType === 'external' && this.currentFormType === 'signup';
  }

  public get showMarketingChannelsPreset(): boolean {
    return this.isDistributableSchemaFamily;
  }

  public get canViewPage(): boolean {
    return this.actionGuard.canView();
  }

  public get hasCreatePermission(): boolean {
    return this.canViewPage && this.actionGuard.canCreate();
  }

  public get hasEditPermission(): boolean {
    return this.canViewPage && this.actionGuard.canEdit();
  }

  public get hasDeletePermission(): boolean {
    return this.canViewPage && this.actionGuard.canDelete();
  }

  public get editorLockReason(): string | null {
    if (!this.canViewPage) {
      return 'You do not have permission to view this schema editor.';
    }

    if (!this.selectedSchema) {
      return null;
    }

    if (this.selectedSchema?.status !== 'draft') {
      return this.hasCreatePermission
        ? 'This schema version is published. Create a draft to make changes.'
        : 'This schema version is published and cannot be edited directly.';
    }

    if (!this.hasEditPermission) {
      return 'You do not have permission to edit draft schemas.';
    }

    return null;
  }

  public get selectedInstanceCount(): number {
    return this.selectedInstanceIds.size;
  }

  public createDraft(): void {
    if (!this.canCreateDraft) {
      return;
    }

    const cloneSourceId = this.selectedSchema?.schema_id
      ?? this.schemas.find((schema) => schema.is_active)?.schema_id
      ?? this.schemas[0]?.schema_id;

    const payload: CreateFormSchemaRequest = {
      form_type: this.currentFormType,
      schema_type: this.currentSchemaType,
      schema_key: this.currentSchemaKey,
      label: this.selectedSchema?.label || this.defaultLabel,
      clone_from_schema_id: cloneSourceId
    };

    this.loading = true;
    this.errorMessage = null;
    this.validationError = null;
    this.cdr.markForCheck();

    this.formSchemaService.createDraft(payload).subscribe({
      next: (schema) => {
        this.navigateToSchema(schema.schema_id);
      },
      error: (error: unknown) => {
        this.errorMessage = this.extractErrorMessage(error, 'Failed to create a new draft.');
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  public saveDraft(): void {
    if (!this.editableSchema || !this.canEditSelectedSchema) {
      return;
    }

    this.normalizeEditableSchema();
    const validationError = this.validateEditableSchema();
    if (validationError) {
      this.validationError = validationError;
      this.cdr.markForCheck();
      return;
    }

    this.saving = true;
    this.errorMessage = null;
    this.validationError = null;
    this.cdr.markForCheck();

    this.formSchemaService.saveSchema(this.editableSchema.schema_id, this.buildSaveRequest(this.editableSchema)).subscribe({
      next: (schema) => {
        this.saving = false;
        this.loadPageData(schema.schema_id, schema);
      },
      error: (error: unknown) => {
        this.errorMessage = this.extractErrorMessage(error, 'Failed to save the draft schema.');
        this.saving = false;
        this.cdr.markForCheck();
      }
    });
  }

  public publishDraft(): void {
    if (!this.selectedSchemaId || !this.canPublishSelectedSchema) {
      return;
    }

    if (this.editableSchema && this.canEditSelectedSchema) {
      this.normalizeEditableSchema();
      const validationError = this.validateEditableSchema();
      if (validationError) {
        this.validationError = validationError;
        this.cdr.markForCheck();
        return;
      }
    }

    this.publishing = true;
    this.errorMessage = null;
    this.validationError = null;
    this.cdr.markForCheck();

    const payload: PublishFormSchemaRequest = {};
    this.formSchemaService.publishSchema(this.selectedSchemaId, payload).subscribe({
      next: (response) => {
        this.publishing = false;
        this.loadPageData(response.schema.schema_id, response.schema);
      },
      error: (error: unknown) => {
        this.errorMessage = this.extractErrorMessage(error, 'Failed to publish the schema.');
        this.publishing = false;
        this.cdr.markForCheck();
      }
    });
  }

  public distributeSchema(): void {
    if (!this.selectedSchemaId || !this.canDistributeSelectedSchema) {
      return;
    }

    this.distributing = true;
    this.errorMessage = null;
    this.cdr.markForCheck();

    this.formSchemaService.distributeSchema(this.selectedSchemaId, {
      instance_ids: Array.from(this.selectedInstanceIds)
    }).subscribe({
      next: (response) => {
        this.distributing = false;
        this.loadPageData(response.schema.schema_id, response.schema);
      },
      error: (error: unknown) => {
        this.errorMessage = this.extractErrorMessage(error, 'Failed to distribute the schema.');
        this.distributing = false;
        this.cdr.markForCheck();
      }
    });
  }

  public deleteDraft(): void {
    if (!this.selectedSchemaId || !this.canDeleteSelectedSchema) {
      return;
    }

    if (!window.confirm('Delete this draft schema? This cannot be undone.')) {
      return;
    }

    this.deleting = true;
    this.errorMessage = null;
    this.cdr.markForCheck();

    this.formSchemaService.deleteSchema(this.selectedSchemaId).subscribe({
      next: () => {
        this.deleting = false;
        this.loadPageData();
      },
      error: (error: unknown) => {
        this.errorMessage = this.extractErrorMessage(error, 'Failed to delete the draft schema.');
        this.deleting = false;
        this.cdr.markForCheck();
      }
    });
  }

  public onSchemaSelected(schemaId: string | number): void {
    const nextSchemaId = Number(schemaId);
    if (!Number.isFinite(nextSchemaId) || nextSchemaId <= 0 || nextSchemaId === this.selectedSchemaId) {
      return;
    }

    this.navigateToSchema(nextSchemaId);
  }

  public addSection(): void {
    if (!this.editableSchema || !this.supportsSections) {
      return;
    }

    const nextIndex = (this.editableSchema.sections?.length || 0) + 1;
    const sectionKey = this.generateUniqueKey(
      this.editableSchema.sections?.map((section) => section.section_key) || [],
      `section_${nextIndex}`
    );

    const nextSection: FormSchemaSection = {
      section_id: -Date.now() - nextIndex,
      section_key: sectionKey,
      label: `Section ${nextIndex}`,
      description: '',
      step_index: nextIndex,
      display_order: nextIndex * 10,
      is_required: false,
      is_active: true
    };

    this.editableSchema = {
      ...this.editableSchema,
      sections: [...(this.editableSchema.sections || []), nextSection]
    };

    this.normalizeEditableSchema();
  }

  public removeSection(sectionId: number): void {
    if (!this.editableSchema || !this.supportsSections) {
      return;
    }

    const section = (this.editableSchema.sections || []).find((item) => item.section_id === sectionId);
    if (!section) {
      return;
    }

    this.editableSchema = {
      ...this.editableSchema,
      sections: (this.editableSchema.sections || []).filter((item) => item.section_id !== sectionId),
      fields: (this.editableSchema.fields || []).filter((field) => field.section_key !== section.section_key)
    };

    this.normalizeEditableSchema();
  }

  public moveSection(sectionId: number, direction: -1 | 1): void {
    if (!this.editableSchema || !this.supportsSections) {
      return;
    }

    const sections = [...(this.editableSchema.sections || [])];
    const index = sections.findIndex((section) => section.section_id === sectionId);
    const targetIndex = index + direction;

    if (index < 0 || targetIndex < 0 || targetIndex >= sections.length) {
      return;
    }

    [sections[index], sections[targetIndex]] = [sections[targetIndex], sections[index]];
    this.editableSchema = {
      ...this.editableSchema,
      sections
    };

    this.normalizeEditableSchema();
  }

  public onSectionKeyBlur(section: FormSchemaSection): void {
    section.section_key = this.generateUniqueKey(
      (this.editableSchema?.sections || [])
        .filter((candidate) => candidate.section_id !== section.section_id)
        .map((candidate) => candidate.section_key),
      section.section_key || section.label || 'section'
    );
    this.normalizeEditableSchema();
  }

  public addCustomField(fieldType: CustomFieldType): void {
    if (!this.editableSchema) {
      return;
    }

    if (this.supportsSections && !(this.editableSchema.sections || []).length) {
      this.addSection();
    }

    const nextIndex = (this.editableSchema.fields?.length || 0) + 1;
    const fieldKey = this.generateUniqueKey(
      this.editableSchema.fields?.map((field) => field.field_key) || [],
      `field_${nextIndex}`
    );
    const firstSectionKey = this.supportsSections ? this.editableSchema.sections?.[0]?.section_key || null : null;

    const field: FormSchemaField = {
      field_id: -Date.now() - nextIndex,
      field_key: fieldKey,
      field_type: fieldType,
      label: `Field ${nextIndex}`,
      help_text: '',
      placeholder: this.supportsPlaceholder(fieldType) ? '' : null,
      section_key: firstSectionKey,
      step_index: firstSectionKey ? 1 : this.getDefaultStepIndex(),
      display_order: nextIndex * 10,
      is_system: false,
      is_required: false,
      is_active: true,
      options_source: null,
      validation: null,
      options: this.supportsStaticOptionsByType(fieldType)
        ? [this.createOption('option_1', 'Option 1', 10)]
        : []
    };

    this.editableSchema = {
      ...this.editableSchema,
      fields: [...(this.editableSchema.fields || []), field]
    };

    this.normalizeEditableSchema();
  }

  public addFieldToSection(sectionKey: string): void {
    if (!this.editableSchema || !this.supportsSections) {
      return;
    }

    const nextIndex = (this.editableSchema.fields?.length || 0) + 1;
    const fieldKey = this.generateUniqueKey(
      this.editableSchema.fields?.map((field) => field.field_key) || [],
      `field_${nextIndex}`
    );

    const field: FormSchemaField = {
      field_id: -Date.now() - nextIndex,
      field_key: fieldKey,
      field_type: this.onboardingFieldTypes[0].value,
      label: `Field ${nextIndex}`,
      help_text: '',
      placeholder: '',
      section_key: sectionKey,
      step_index: this.getSectionStepIndex(sectionKey),
      display_order: ((this.editableSchema.fields?.length || 0) + 1) * 10,
      is_system: false,
      is_required: false,
      is_active: true,
      options_source: null,
      validation: null,
      options: []
    };

    this.editableSchema = {
      ...this.editableSchema,
      fields: [...(this.editableSchema.fields || []), field]
    };

    this.normalizeEditableSchema();
    this.expandedFieldId = field.field_id;
  }

  public addMarketingChannelsPreset(): void {
    if (!this.editableSchema || !this.showMarketingChannelsPreset) {
      return;
    }

    const existingKeys = new Set((this.editableSchema.fields || []).map((field) => field.field_key));
    if (existingKeys.has('marketing_channels')) {
      this.validationError = 'The marketing channels field already exists in this schema.';
      this.cdr.markForCheck();
      return;
    }

    const field: FormSchemaField = {
      field_id: -Date.now(),
      field_key: 'marketing_channels',
      field_type: 'checkbox_group',
      label: 'Marketing Channels',
      help_text: 'Choose how you would like to hear from us.',
      placeholder: null,
      section_key: null,
      step_index: this.getDefaultStepIndex(),
      display_order: ((this.editableSchema.fields?.length || 0) + 1) * 10,
      is_system: false,
      is_required: false,
      is_active: true,
      options_source: null,
      validation: null,
      options: [
        this.createOption('email', 'Email', 10),
        this.createOption('sms', 'SMS', 20),
        this.createOption('phone', 'Phone', 30),
        this.createOption('post', 'Post', 40)
      ]
    };

    this.editableSchema = {
      ...this.editableSchema,
      fields: [...(this.editableSchema.fields || []), field]
    };

    this.normalizeEditableSchema();
  }

  public removeField(fieldId: number): void {
    if (!this.editableSchema) {
      return;
    }

    this.editableSchema = {
      ...this.editableSchema,
      fields: (this.editableSchema.fields || []).filter((field) => field.field_id !== fieldId)
    };

    if (this.expandedFieldId === fieldId) {
      this.expandedFieldId = null;
    }

    this.normalizeEditableSchema();
  }

  public moveField(fieldId: number, direction: -1 | 1): void {
    if (!this.editableSchema) {
      return;
    }

    const fields = [...(this.editableSchema.fields || [])];
    const index = fields.findIndex((field) => field.field_id === fieldId);
    const targetIndex = index + direction;

    if (index < 0 || targetIndex < 0 || targetIndex >= fields.length) {
      return;
    }

    [fields[index], fields[targetIndex]] = [fields[targetIndex], fields[index]];
    this.editableSchema = {
      ...this.editableSchema,
      fields
    };

    this.normalizeEditableSchema();
  }

  public toggleFieldExpanded(fieldId: number): void {
    this.expandedFieldId = this.expandedFieldId === fieldId ? null : fieldId;
  }

  public isFieldExpanded(fieldId: number): boolean {
    return this.expandedFieldId === fieldId;
  }

  public moveFieldWithinSection(sectionKey: string, fieldId: number, direction: -1 | 1): void {
    if (!this.editableSchema || !this.supportsSections) {
      return;
    }

    const sectionFields = this.getFieldsForSection(sectionKey);
    const index = sectionFields.findIndex((field) => field.field_id === fieldId);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= sectionFields.length) {
      return;
    }

    const reorderedSectionFields = [...sectionFields];
    [reorderedSectionFields[index], reorderedSectionFields[targetIndex]] = [reorderedSectionFields[targetIndex], reorderedSectionFields[index]];

    const reorderedQueue = [...reorderedSectionFields];
    this.editableSchema = {
      ...this.editableSchema,
      fields: (this.editableSchema.fields || []).map((field) => (
        field.section_key === sectionKey ? reorderedQueue.shift() || field : field
      ))
    };

    this.normalizeEditableSchema();
  }

  public canMoveFieldWithinSection(sectionKey: string, fieldId: number, direction: -1 | 1): boolean {
    const sectionFields = this.getFieldsForSection(sectionKey);
    const index = sectionFields.findIndex((field) => field.field_id === fieldId);
    const targetIndex = index + direction;
    return index >= 0 && targetIndex >= 0 && targetIndex < sectionFields.length;
  }

  public onFieldTypeChanged(field: FormSchemaField): void {
    if (!this.supportedFieldTypes.some((option) => option.value === field.field_type)) {
      field.field_type = this.supportedFieldTypes[0].value;
    }

    if (!this.supportsPlaceholder(field.field_type)) {
      field.placeholder = null;
    } else if (field.placeholder == null) {
      field.placeholder = '';
    }

    if (!this.supportsStaticOptions(field)) {
      field.options = [];
      field.options_source = null;
      return;
    }

    if (!field.options?.length) {
      field.options = [this.createOption('option_1', 'Option 1', 10)];
    }
  }

  public addOption(field: FormSchemaField): void {
    if (!this.supportsStaticOptions(field)) {
      return;
    }

    const nextIndex = (field.options?.length || 0) + 1;
    const optionKey = this.generateUniqueKey(
      field.options?.map((option) => option.option_value) || [],
      `option_${nextIndex}`
    );

    field.options = [
      ...(field.options || []),
      this.createOption(optionKey, `Option ${nextIndex}`, nextIndex * 10)
    ];
  }

  public removeOption(field: FormSchemaField, optionKey: string): void {
    field.options = (field.options || [])
      .filter((option) => option.option_value !== optionKey)
      .map((option, index) => ({
        ...option,
        display_order: (index + 1) * 10
      }));
  }

  public moveOption(field: FormSchemaField, optionKey: string, direction: -1 | 1): void {
    const options = [...(field.options || [])];
    const index = options.findIndex((option) => option.option_value === optionKey);
    const targetIndex = index + direction;

    if (index < 0 || targetIndex < 0 || targetIndex >= options.length) {
      return;
    }

    [options[index], options[targetIndex]] = [options[targetIndex], options[index]];
    field.options = options.map((option, position) => ({
      ...option,
      display_order: (position + 1) * 10
    }));
  }

  public toggleInstance(instanceId: number, selected: boolean): void {
    const next = new Set(this.selectedInstanceIds);
    if (selected) {
      next.add(instanceId);
    } else {
      next.delete(instanceId);
    }
    this.selectedInstanceIds = next;
  }

  public selectAllInstances(): void {
    this.selectedInstanceIds = new Set(
      this.instances
        .filter((instance) => instance.is_active)
        .map((instance) => instance.instance_id)
    );
  }

  public deselectAllInstances(): void {
    this.selectedInstanceIds = new Set();
  }

  public getSectionFieldCount(sectionKey: string): number {
    return (this.editableSchema?.fields || []).filter((field) => field.section_key === sectionKey).length;
  }

  public getFieldsForSection(sectionKey: string): FormSchemaField[] {
    return [...(this.editableSchema?.fields || [])]
      .filter((field) => field.section_key === sectionKey)
      .sort((left, right) => left.display_order - right.display_order);
  }

  public getFieldPreviewMeta(field: FormSchemaField): string {
    const meta: string[] = [this.getFieldTypeLabel(field.field_type)];
    if (this.hasDynamicOptionsSource(field)) {
      meta.push('Dynamic options');
    }
    if (field.is_required) {
      meta.push('Required');
    }
    if (field.is_active === false) {
      meta.push('Inactive');
    }
    return meta.join(' • ');
  }

  public hasUnassignedFields(): boolean {
    return (this.editableSchema?.fields || []).some((field) => !field.section_key);
  }

  public getUnassignedFields(): FormSchemaField[] {
    return [...(this.editableSchema?.fields || [])]
      .filter((field) => !field.section_key)
      .sort((left, right) => left.display_order - right.display_order);
  }

  public getSectionKeyMessage(section: FormSchemaSection): string | null {
    if (!section.section_key?.trim()) {
      return 'Section key is required.';
    }

    if (!this.keyPattern.test(section.section_key.trim())) {
      return 'Use lowercase letters, numbers, and underscores only.';
    }

    const duplicates = (this.editableSchema?.sections || [])
      .filter((candidate) => candidate.section_id !== section.section_id)
      .some((candidate) => candidate.section_key.trim() === section.section_key.trim());

    return duplicates ? 'Section key must be unique.' : null;
  }

  public getFieldKeyMessage(field: FormSchemaField): string | null {
    if (!field.field_key?.trim()) {
      return 'Field key is required.';
    }

    if (!this.keyPattern.test(field.field_key.trim())) {
      return 'Use lowercase letters, numbers, and underscores only.';
    }

    const duplicates = (this.editableSchema?.fields || [])
      .filter((candidate) => candidate.field_id !== field.field_id)
      .some((candidate) => candidate.field_key.trim() === field.field_key.trim());

    return duplicates ? 'Field key must be unique.' : null;
  }

  public getOptionMessage(field: FormSchemaField, option: FormSchemaOption): string | null {
    if (!option.option_value?.trim()) {
      return 'Option value is required.';
    }

    if (!this.keyPattern.test(option.option_value.trim())) {
      return 'Use lowercase letters, numbers, and underscores only.';
    }

    if (!option.option_label?.trim()) {
      return 'Option label is required.';
    }

    const duplicates = (field.options || [])
      .filter((candidate) => candidate.option_value !== option.option_value)
      .some((candidate) => candidate.option_value.trim() === option.option_value.trim());

    return duplicates ? 'Option value must be unique in this field.' : null;
  }

  public hasDynamicOptionsSource(field: FormSchemaField): boolean {
    return field.field_type === 'select' && !!field.options_source?.trim();
  }

  public getSchemaVersionLabel(schema: FormSchemaSummary): string {
    const status = schema.is_active ? 'Active' : this.toTitleCase(schema.status);
    return `v${schema.version} - ${status}`;
  }

  public getFieldTypeLabel(fieldType: string): string {
    return this.supportedFieldTypes.find((option) => option.value === fieldType)?.label || this.toTitleCase(fieldType);
  }

  public trackBySchema(_: number, schema: FormSchemaSummary): number {
    return schema.schema_id;
  }

  public trackByField(_: number, field: FormSchemaField): number {
    return field.field_id;
  }

  public trackBySection(_: number, section: FormSchemaSection): number {
    return section.section_id;
  }

  public trackByDistribution(_: number, distribution: FormSchemaDistributionSummary): number {
    return distribution.distribution_id;
  }

  private applyRouteConfig(data: EditorRouteConfig): void {
    this.routeTitle = data.title || null;
    this.currentFormType = data.formType || this.currentFormType;
    this.currentSchemaType = data.schemaType || this.currentSchemaType;
    this.currentSchemaKey = data.schemaKey || this.currentSchemaKey;
    this.refreshContextCopy();
  }

  private applyBackNavigation(back: 'builder' | 'instance', instanceId: number | null): void {
    this.backMode = back;
    this.preferredInstanceId = instanceId;

    if (back === 'instance' && instanceId) {
      this.backButtonLabel = 'Back to Instance';
      this.backRoute = ['/clients/manage-instance', instanceId];
      return;
    }

    this.backButtonLabel = 'Back to Form Builder';
    this.backRoute = ['/gofiliate/form-builder'];
  }

  private loadRouteSchema(schemaId: number): void {
    this.loading = true;
    this.errorMessage = null;
    this.validationError = null;
    this.selectedSchemaId = schemaId;
    this.cdr.markForCheck();

    this.formSchemaService.getSchema(schemaId).subscribe({
      next: (schema) => {
        this.currentFormType = schema.form_type;
        this.currentSchemaType = schema.schema_type;
        this.currentSchemaKey = schema.schema_key;
        this.refreshContextCopy();
        this.loadPageData(schema.schema_id, schema);
      },
      error: (error: unknown) => {
        this.errorMessage = this.extractErrorMessage(error, 'Failed to load the schema.');
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private loadPageData(preferredSchemaId?: number, preloadedSchema?: FormSchema): void {
    this.loading = true;
    this.errorMessage = null;
    this.validationError = null;
    this.cdr.markForCheck();

    const instances$: Observable<InstanceSummary[]> = this.isDistributableSchemaFamily
      ? this.formSchemaService.listInstances()
      : of([]);

    forkJoin({
      schemas: this.formSchemaService.listSchemas(this.currentFormType, this.currentSchemaType),
      instances: instances$
    }).subscribe({
      next: ({ schemas, instances }) => {
        const matchingSchemas = schemas.filter(
          (schema) => !this.currentSchemaKey || schema.schema_key === this.currentSchemaKey
        );

        this.schemas = this.sortSchemas(matchingSchemas);
        this.instances = instances;
        this.syncSelectedInstances();

        const nextSchemaId = this.resolveSchemaSelection(preferredSchemaId);
        if (!nextSchemaId) {
          this.selectedSchemaId = null;
          this.selectedSchema = null;
          this.editableSchema = null;
          this.distributions = [];
          this.loading = false;
          this.cdr.markForCheck();
          return;
        }

        if (preloadedSchema && preloadedSchema.schema_id === nextSchemaId) {
          this.setSelectedSchema(preloadedSchema);
          return;
        }

        this.loadSchema(nextSchemaId);
      },
      error: (error: unknown) => {
        this.errorMessage = this.extractErrorMessage(error, 'Failed to load schema versions.');
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private loadSchema(schemaId: number): void {
    this.formSchemaService.getSchema(schemaId).subscribe({
      next: (schema) => this.setSelectedSchema(schema),
      error: (error: unknown) => {
        this.errorMessage = this.extractErrorMessage(error, 'Failed to load schema details.');
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private setSelectedSchema(schema: FormSchema): void {
    this.selectedSchemaId = schema.schema_id;
    this.selectedSchema = this.toSummary(schema);
    this.schemas = this.sortSchemas(this.upsertSummary(this.schemas, this.selectedSchema));
    this.editableSchema = this.cloneSchema(schema);
    this.expandedFieldId = null;
    this.normalizeEditableSchema();
    this.loadDistributions(schema.schema_id);
  }

  private loadDistributions(schemaId: number): void {
    if (!this.isDistributableSchemaFamily) {
      this.distributions = [];
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }

    this.distributionsLoading = true;
    this.cdr.markForCheck();

    this.formSchemaService.listDistributions(schemaId).subscribe({
      next: (distributions) => {
        this.distributions = distributions;
        this.distributionsLoading = false;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.distributions = [];
        this.distributionsLoading = false;
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private normalizeEditableSchema(): void {
    if (!this.editableSchema) {
      return;
    }

    const normalizedSections = this.supportsSections
      ? [...(this.editableSchema.sections || [])]
          .map((section, index) => ({
            ...section,
            section_key: this.sanitiseKey(section.section_key || section.label || `section_${index + 1}`),
            label: section.label?.trim() || `Section ${index + 1}`,
            description: section.description?.trim() || null,
            step_index: index + 1,
            display_order: (index + 1) * 10,
            is_required: !!section.is_required,
            is_active: section.is_active !== false
          }))
      : [];

    const sectionOrder = new Map(normalizedSections.map((section, index) => [section.section_key, index + 1]));
    const normalizedFields = this.sortEditableFields(this.editableSchema.fields || [], normalizedSections)
      .map((field, index) => {
        const sectionKey = this.supportsSections
          ? (field.section_key ? this.sanitiseKey(field.section_key) : normalizedSections[0]?.section_key || null)
          : null;

        return {
          ...field,
          field_key: this.sanitiseKey(field.field_key || field.label || `field_${index + 1}`),
          label: field.label?.trim() || `Field ${index + 1}`,
          help_text: field.help_text?.trim() || null,
          placeholder: this.supportsPlaceholder(field.field_type)
            ? (field.placeholder?.trim() || null)
            : null,
          section_key: sectionKey,
          step_index: this.supportsSections
            ? sectionOrder.get(sectionKey || '') || 1
            : Math.max(1, Number(field.step_index) || 1),
          display_order: (index + 1) * 10,
          is_system: this.supportsSections ? false : !!field.is_system,
          is_required: !!field.is_required,
          is_active: field.is_active !== false,
          options_source: field.options_source || null,
          validation: field.validation || null,
          options: this.supportsStaticOptionsByType(field.field_type)
            ? (field.options || []).map((option, optionIndex) => ({
                ...option,
                option_id: option.option_id,
                option_value: this.sanitiseKey(option.option_value || `option_${optionIndex + 1}`),
                option_label: option.option_label?.trim() || `Option ${optionIndex + 1}`,
                display_order: (optionIndex + 1) * 10,
                is_default: !!option.is_default,
                is_active: option.is_active !== false
              }))
            : []
        };
      });

    this.editableSchema = {
      ...this.editableSchema,
      sections: normalizedSections,
      fields: normalizedFields
    };
  }

  private validateEditableSchema(): string | null {
    if (!this.editableSchema?.label?.trim()) {
      return 'Schema label is required.';
    }

    const fields = this.editableSchema.fields || [];
    if (fields.length === 0) {
      return 'At least one field is required.';
    }

    if (this.supportsSections) {
      const sections = this.editableSchema.sections || [];
      if (sections.length === 0) {
        return 'At least one onboarding section is required.';
      }

      const sectionKeys = new Set<string>();
      for (const section of sections) {
        if (!section.section_key?.trim()) {
          return 'Every onboarding section needs a section key.';
        }
        if (!this.keyPattern.test(section.section_key.trim())) {
          return `Section key "${section.section_key}" must use lowercase letters, numbers, and underscores only.`;
        }
        if (sectionKeys.has(section.section_key.trim())) {
          return `Section key "${section.section_key}" is duplicated.`;
        }
        if (!section.label?.trim()) {
          return `Section "${section.section_key}" needs a label.`;
        }
        sectionKeys.add(section.section_key.trim());
      }

      const allowedFieldTypes = new Set(this.onboardingFieldTypes.map((option) => option.value));
      for (const field of fields) {
        if (!field.section_key || !sectionKeys.has(field.section_key.trim())) {
          return `Field "${field.field_key || field.label}" must belong to a valid onboarding section.`;
        }
        if (!allowedFieldTypes.has(field.field_type)) {
          return `Field "${field.field_key}" uses an unsupported onboarding field type.`;
        }
      }
    }

    const fieldKeys = new Set<string>();
    for (const field of fields) {
      if (!field.field_key?.trim()) {
        return 'Every field needs a field key.';
      }
      if (!this.keyPattern.test(field.field_key.trim())) {
        return `Field key "${field.field_key}" must use lowercase letters, numbers, and underscores only.`;
      }
      if (fieldKeys.has(field.field_key.trim())) {
        return `Field key "${field.field_key}" is duplicated.`;
      }
      if (!field.label?.trim()) {
        return `Field "${field.field_key}" needs a label.`;
      }

      fieldKeys.add(field.field_key.trim());

      if (this.supportsStaticOptionsByType(field.field_type) && !this.hasDynamicOptionsSource(field)) {
        if (!(field.options || []).length) {
          return `Field "${field.field_key}" needs at least one option.`;
        }

        const optionKeys = new Set<string>();
        for (const option of field.options || []) {
          if (!option.option_value?.trim()) {
            return `Field "${field.field_key}" has an option without a value.`;
          }
          if (!this.keyPattern.test(option.option_value.trim())) {
            return `Option value "${option.option_value}" in field "${field.field_key}" must use lowercase letters, numbers, and underscores only.`;
          }
          if (!option.option_label?.trim()) {
            return `Option "${option.option_value}" in field "${field.field_key}" needs a label.`;
          }
          if (optionKeys.has(option.option_value.trim())) {
            return `Option value "${option.option_value}" is duplicated in field "${field.field_key}".`;
          }
          optionKeys.add(option.option_value.trim());
        }
      }
    }

    return null;
  }

  private buildSaveRequest(schema: FormSchema): SaveFormSchemaRequest {
    const request: SaveFormSchemaRequest = {
      label: schema.label.trim(),
      fields: schema.fields.map((field, index): FormSchemaFieldInput => ({
        field_key: field.field_key.trim(),
        field_type: field.field_type,
        label: field.label.trim(),
        help_text: field.help_text?.trim() || null,
        placeholder: this.supportsPlaceholder(field.field_type)
          ? (field.placeholder?.trim() || null)
          : null,
        section_key: this.supportsSections ? field.section_key || null : null,
        step_index: this.supportsSections
          ? this.getSectionStepIndex(field.section_key || null)
          : Math.max(1, Number(field.step_index) || 1),
        display_order: (index + 1) * 10,
        is_system: this.supportsSections ? false : !!field.is_system,
        is_required: !!field.is_required,
        is_active: field.is_active !== false,
        options_source: field.options_source || null,
        validation: field.validation || null,
        options: (field.options || []).map((option, optionIndex) => ({
          option_value: option.option_value.trim(),
          option_label: option.option_label.trim(),
          display_order: (optionIndex + 1) * 10,
          is_default: !!option.is_default,
          is_active: option.is_active !== false
        }))
      }))
    };

    if (this.supportsSections) {
      request.sections = (schema.sections || []).map((section, index): FormSchemaSectionInput => ({
        section_key: section.section_key.trim(),
        label: section.label.trim(),
        description: section.description?.trim() || null,
        display_order: (index + 1) * 10,
        is_required: !!section.is_required,
        is_active: section.is_active !== false
      }));
    }

    return request;
  }

  private cloneSchema(schema: FormSchema): FormSchema {
    return {
      ...schema,
      sections: [...(schema.sections || [])]
        .sort((left, right) => left.display_order - right.display_order)
        .map((section) => ({ ...section })),
      fields: this.sortEditableFields(schema.fields || [], schema.sections || [])
        .map((field) => ({
          ...field,
          options: [...(field.options || [])]
            .sort((left, right) => left.display_order - right.display_order)
            .map((option) => ({ ...option }))
        }))
    };
  }

  private resolveSchemaSelection(preferredSchemaId?: number): number | null {
    const candidates = [preferredSchemaId, this.selectedSchemaId];
    for (const candidate of candidates) {
      if (candidate && this.schemas.some((schema) => schema.schema_id === candidate)) {
        return candidate;
      }
    }

    return this.schemas.find((schema) => schema.is_active)?.schema_id
      ?? this.schemas[0]?.schema_id
      ?? null;
  }

  private syncSelectedInstances(): void {
    if (!this.isDistributableSchemaFamily) {
      this.selectedInstanceIds = new Set();
      return;
    }

    const validIds = new Set(this.instances.map((instance) => instance.instance_id));
    if (this.preferredInstanceId && validIds.has(this.preferredInstanceId)) {
      this.selectedInstanceIds = new Set([this.preferredInstanceId]);
      return;
    }

    this.selectedInstanceIds = new Set(
      Array.from(this.selectedInstanceIds).filter((instanceId) => validIds.has(instanceId))
    );
  }

  private navigateToSchema(schemaId: number): void {
    void this.router.navigate(['/gofiliate/form-builder/schemas', schemaId], {
      queryParams: this.backMode === 'instance' && this.preferredInstanceId
        ? { back: 'instance', instanceId: this.preferredInstanceId }
        : undefined
    });
  }

  private getSectionStepIndex(sectionKey: string | null): number {
    if (!sectionKey) {
      return 1;
    }

    const section = (this.editableSchema?.sections || []).find((candidate) => candidate.section_key === sectionKey);
    return section?.step_index || 1;
  }

  private getDefaultStepIndex(): number {
    return Math.max(1, ...((this.editableSchema?.fields || []).map((field) => field.step_index || 1)));
  }

  private sortEditableFields(fields: FormSchemaField[], sections: FormSchemaSection[] = []): FormSchemaField[] {
    const sectionOrder = new Map(
      [...sections]
        .sort((left, right) => left.display_order - right.display_order)
        .map((section, index) => [section.section_key, index + 1])
    );

    return [...fields].sort((left, right) => {
      if (this.supportsSections) {
        const leftOrder = sectionOrder.get(left.section_key || '') || Number.MAX_SAFE_INTEGER;
        const rightOrder = sectionOrder.get(right.section_key || '') || Number.MAX_SAFE_INTEGER;
        if (leftOrder !== rightOrder) {
          return leftOrder - rightOrder;
        }
      } else {
        const leftStep = Math.max(1, Number(left.step_index) || 1);
        const rightStep = Math.max(1, Number(right.step_index) || 1);
        if (leftStep !== rightStep) {
          return leftStep - rightStep;
        }
      }

      if (left.display_order !== right.display_order) {
        return left.display_order - right.display_order;
      }

      if (left.field_id !== right.field_id) {
        return left.field_id - right.field_id;
      }

      return left.field_key.localeCompare(right.field_key);
    });
  }

  public supportsStaticOptions(field: FormSchemaField): boolean {
    return this.supportsStaticOptionsByType(field.field_type) && !field.options_source;
  }

  private supportsStaticOptionsByType(fieldType: CustomFieldType): boolean {
    return fieldType === 'select' || fieldType === 'checkbox_group';
  }

  private supportsPlaceholder(fieldType: CustomFieldType): boolean {
    return !['checkbox', 'checkbox_group', 'select', 'color', 'date'].includes(fieldType);
  }

  private createOption(optionKey: string, label: string, displayOrder: number): FormSchemaOption {
    return {
      option_id: -Date.now() - displayOrder,
      option_value: optionKey,
      option_label: label,
      display_order: displayOrder,
      is_default: false,
      is_active: true
    };
  }

  private sanitiseKey(value: string): string {
    return value.trim().toLowerCase().replace(/[\s-]+/g, '_').replace(/[^a-z0-9_]/g, '');
  }

  private generateUniqueKey(existingKeys: string[], baseValue: string): string {
    const existing = new Set(existingKeys.map((key) => key.trim()));
    const base = this.sanitiseKey(baseValue) || 'field';
    if (!existing.has(base)) {
      return base;
    }

    let suffix = 2;
    while (existing.has(`${base}_${suffix}`)) {
      suffix += 1;
    }

    return `${base}_${suffix}`;
  }

  private upsertSummary(summaries: FormSchemaSummary[], summary: FormSchemaSummary): FormSchemaSummary[] {
    const remaining = summaries.filter((candidate) => candidate.schema_id !== summary.schema_id);
    return [...remaining, summary];
  }

  private sortSchemas(summaries: FormSchemaSummary[]): FormSchemaSummary[] {
    return [...summaries].sort((left, right) => {
      if (left.is_active !== right.is_active) {
        return left.is_active ? -1 : 1;
      }
      return right.version - left.version;
    });
  }

  private refreshContextCopy(): void {
    this.pageTitle = this.routeTitle
      || (this.supportsSections ? 'Onboarding Schema Editor' : 'Signup Schema Editor');
    this.pageDescription = this.supportsSections
      ? 'Edit OTP onboarding sections and the fields rendered inside each step.'
      : 'Edit external signup schemas, manage versions, and distribute active versions to instances.';
  }

  private toSummary(schema: FormSchema): FormSchemaSummary {
    return {
      schema_id: schema.schema_id,
      form_type: schema.form_type,
      schema_type: schema.schema_type,
      schema_key: schema.schema_key,
      version: schema.version,
      label: schema.label,
      status: schema.status,
      is_active: schema.is_active,
      is_default_seed: schema.is_default_seed,
      published_at: schema.published_at,
      last_synced_at: schema.last_synced_at,
      sync_error: schema.sync_error,
      created: schema.created,
      updated: schema.updated
    };
  }

  private parsePositiveInt(value: string | null): number | null {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
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

  private get defaultLabel(): string {
    return this.supportsSections ? 'OTP Onboarding Form' : 'Affiliate Signup Form';
  }
}
