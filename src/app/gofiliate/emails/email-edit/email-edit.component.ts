import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GofiliateService, EmailTemplate } from '../../../services/gofiliate.service';
import { ToastrService } from 'ngx-toastr';
import { QuillEditorComponent } from 'ngx-quill';

@Component({
  selector: 'app-email-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, QuillEditorComponent],
  templateUrl: './email-edit.component.html',
  styleUrl: './email-edit.component.scss'
})
export class EmailEditComponent implements OnInit {
  emailForm!: FormGroup;
  emailId: number | null = null;
  loading = true;
  isNewEmail = false;
  viewMode: 'visual' | 'html' = 'visual';

  quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'header': 1 }, { 'header': 2 }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ]
  };

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private gofiliateService: GofiliateService,
    private toast: ToastrService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['email_id'];
      if (id === 'new') {
        this.isNewEmail = true;
        this.loading = false;
      } else {
        this.emailId = +id;
        this.loadEmail();
      }
    });
  }

  initForm(): void {
    this.emailForm = this.fb.group({
      email_id: [null],
      email_name: ['', [Validators.required, Validators.maxLength(50)]],
      email_description: ['', [Validators.required, Validators.maxLength(100)]],
      email_trigger: ['', [Validators.required, Validators.maxLength(50)]],
      email_from: ['', [Validators.required, Validators.maxLength(100), Validators.email]],
      email_title: ['', [Validators.required, Validators.maxLength(255)]],
      email_text: ['', Validators.required],
      email_type: [null],
      email_status: [1]
    });
  }

  loadEmail(): void {
    if (!this.emailId) return;
    
    this.loading = true;
    this.gofiliateService.getEmailTemplate(this.emailId).subscribe({
      next: (response) => {
        if (response.result && response.email) {
          this.emailForm.patchValue(response.email);
        } else {
          this.toast.error('Email template not found');
          this.router.navigate(['/gofiliate/emails']);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading email template:', error);
        this.toast.error('Failed to load email template');
        this.loading = false;
        this.router.navigate(['/gofiliate/emails']);
      }
    });
  }

  onSubmit(): void {
    if (this.emailForm.invalid) {
      this.toast.warning('Please fill in all required fields correctly');
      return;
    }

    const formData = this.emailForm.value;
    
    this.gofiliateService.saveEmailTemplate(formData).subscribe({
      next: (response) => {
        if (response.code === 200) {
          this.toast.success(
            response.message || (this.isNewEmail ? 'Email template created successfully' : 'Email template updated successfully'),
            'Success'
          );
          this.router.navigate(['/gofiliate/emails']);
        } else {
          this.toast.error(response.message || 'Failed to save email template', 'Error');
        }
      },
      error: (error) => {
        console.error('Error saving email template:', error);
        this.toast.error('Failed to save email template', 'Error');
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/gofiliate/emails']);
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'visual' ? 'html' : 'visual';
  }
}
