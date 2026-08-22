import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { UserService } from '../../../core/services/user.service';
import { AuthUser, UserRole } from '../../../models/user.model';

type UiRole = 'admin' | 'user';
type UserStatus = 'active' | 'inactive';

interface UserRow {
  id: number;
  initials: string;
  name: string;
  email: string;
  role: UiRole;
  status: UserStatus;
  lastLogin: string;
}

interface FilterOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    SelectModule,
    DialogModule
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {
  private readonly userService = inject(UserService);

  readonly roleFilters: FilterOption[] = [
    { label: 'All roles', value: 'all' },
    { label: 'Admin', value: 'admin' },
    { label: 'User', value: 'user' }
  ];

  readonly statusFilters: FilterOption[] = [
    { label: 'All statuses', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' }
  ];

  readonly roleOptions: FilterOption[] = [
    { label: 'User', value: 'user' },
    { label: 'Admin', value: 'admin' }
  ];

  readonly statusOptions: FilterOption[] = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' }
  ];

  roleFilter = 'all';
  statusFilter = 'all';
  readonly searchTerm = signal('');
  readonly showAddUserDialog = signal(false);
  readonly formError = signal<string | null>(null);
  readonly loading = signal(false);

  newUserFirstname = '';
  newUserLastname = '';
  newUserEmail = '';
  newUserPassword = '';
  newUserRole: UiRole = 'user';
  newUserStatus: UserStatus = 'active';

  private readonly users = signal<UserRow[]>([]);

  readonly stats = computed(() => {
    const list = this.users();
    return {
      total: list.length,
      active: list.filter((user) => user.status === 'active').length,
      admins: list.filter((user) => user.role === 'admin').length
    };
  });

  readonly filteredUsers = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    return this.users().filter((user) => {
      const matchesRole = this.roleFilter === 'all' || user.role === this.roleFilter;
      const matchesStatus = this.statusFilter === 'all' || user.status === this.statusFilter;
      const matchesSearch =
        term === '' ||
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term);
      return matchesRole && matchesStatus && matchesSearch;
    });
  });

  ngOnInit(): void {
    this.reload();
  }

  onSearch(value: string): void {
    this.searchTerm.set(value);
  }

  openAddUserDialog(): void {
    this.resetAddUserForm();
    this.showAddUserDialog.set(true);
  }

  closeAddUserDialog(): void {
    this.showAddUserDialog.set(false);
    this.resetAddUserForm();
  }

  onDialogVisibilityChange(visible: boolean): void {
    if (visible) {
      this.showAddUserDialog.set(true);
      return;
    }
    this.closeAddUserDialog();
  }

  submitAddUser(): void {
    const firstname = this.newUserFirstname.trim();
    const lastname = this.newUserLastname.trim();
    const email = this.newUserEmail.trim().toLowerCase();
    const password = this.newUserPassword;

    if (!firstname || !lastname) {
      this.formError.set('Veuillez saisir le prénom et le nom.');
      return;
    }
    if (!email || !this.isValidEmail(email)) {
      this.formError.set('Veuillez saisir un email valide.');
      return;
    }
    if (!password || password.length < 6) {
      this.formError.set('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    this.loading.set(true);
    this.userService
      .create({
        firstname,
        lastname,
        email,
        password,
        role: this.toApiRole(this.newUserRole),
        active: this.newUserStatus === 'active'
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.closeAddUserDialog();
          this.reload();
        },
        error: (err) => {
          this.loading.set(false);
          this.formError.set(err?.error?.message || "Impossible de créer l'utilisateur.");
        }
      });
  }

  deleteUser(user: UserRow): void {
    if (!confirm(`Supprimer ${user.name} ?`)) {
      return;
    }
    this.userService.delete(user.id).subscribe({
      next: () => this.reload(),
      error: () => alert('Suppression impossible.')
    });
  }

  toggleActive(user: UserRow): void {
    this.userService
      .update(user.id, { active: user.status !== 'active' })
      .subscribe({
        next: () => this.reload()
      });
  }

  roleLabel(role: UiRole): string {
    return role === 'admin' ? 'Admin' : 'User';
  }

  statusLabel(status: UserStatus): string {
    return status === 'active' ? 'Active' : 'Inactive';
  }

  private reload(): void {
    this.userService.list().subscribe({
      next: (list) => this.users.set(list.map((u) => this.toRow(u))),
      error: () => this.users.set([])
    });
  }

  private toRow(user: AuthUser): UserRow {
    const name = `${user.firstname} ${user.lastname}`.trim();
    return {
      id: user.id,
      initials: this.getInitials(name),
      name,
      email: user.email,
      role: user.role === 'ADMIN' ? 'admin' : 'user',
      status: user.active ? 'active' : 'inactive',
      lastLogin: this.formatLastLogin(user.lastLoginAt)
    };
  }

  private formatLastLogin(value: string | null): string {
    if (!value) {
      return 'Never';
    }
    const date = new Date(value);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private toApiRole(role: UiRole): UserRole {
    return role === 'admin' ? 'ADMIN' : 'USER';
  }

  private resetAddUserForm(): void {
    this.newUserFirstname = '';
    this.newUserLastname = '';
    this.newUserEmail = '';
    this.newUserPassword = '';
    this.newUserRole = 'user';
    this.newUserStatus = 'active';
    this.formError.set(null);
  }

  private getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
