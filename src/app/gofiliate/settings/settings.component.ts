import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GofiliateService } from '../../services/gofiliate.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  loading = false;

  constructor(
    private gofiliateService: GofiliateService,
    private router: Router,
    private toast: ToastrService
  ) {}

  ngOnInit(): void {
    console.log('Settings component initialized');
  }
}
