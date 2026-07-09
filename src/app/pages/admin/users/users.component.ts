import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';

type UserRole = 'admin' | 'user';
type UserStatus = 'active' | 'inactive';

interface UserRow {
  initials: string;
  name: string;
  email: string;
  role: UserRole;
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
export class UsersComponent {
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

  newUserName = '';
  newUserEmail = '';
  newUserRole: UserRole = 'user';
  newUserStatus: UserStatus = 'active';

  private readonly users = signal<UserRow[]>([
    {
      initials: 'DA',
      name: 'Dhouha Admin',
      email: 'd.admin@talan.com',
      role: 'admin',
      status: 'active',
      lastLogin: 'Today'
    },
    {
      initials: 'MB',
      name: 'Mohamed Ben Ali',
      email: 'm.benali@talan.com',
      role: 'user',
      status: 'active',
      lastLogin: 'Yesterday'
    },
    {
      initials: 'SK',
      name: 'Sara Khelifi',
      email: 's.khelifi@talan.com',
      role: 'user',
      status: 'active',
      lastLogin: 'Jun 25'
    },
    {
      initials: 'AH',
      name: 'Ahmed Hamdi',
      email: 'a.hamdi@talan.com',
      role: 'admin',
      status: 'inactive',
      lastLogin: 'Jun 20'
    }
  ]);

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
      const matchesRole =
        this.roleFilter === 'all' || user.role === this.roleFilter;
      const matchesStatus =
        this.statusFilter === 'all' || user.status === this.statusFilter;
      const matchesSearch =
        term === '' ||
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term);

      return matchesRole && matchesStatus && matchesSearch;
    });
  });

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
    const name = this.newUserName.trim();
    const email = this.newUserEmail.trim().toLowerCase();

    if (!name) {
      this.formError.set('Please enter a full name.');
      return;
    }

    if (!email) {
      this.formError.set('Please enter an email address.');
      return;
    }

    if (!this.isValidEmail(email)) {
      this.formError.set('Please enter a valid email address.');
      return;
    }

    const emailTaken = this.users().some(
      (user) => user.email.toLowerCase() === email
    );
    if (emailTaken) {
      this.formError.set('A user with this email already exists.');
      return;
    }

    this.users.update((users) => [
      {
        initials: this.getInitials(name),
        name,
        email,
        role: this.newUserRole,
        status: this.newUserStatus,
        lastLogin: 'Never'
      },
      ...users
    ]);

    this.closeAddUserDialog();
  }

  roleLabel(role: UserRole): string {
    return role === 'admin' ? 'Admin' : 'User';
  }

  statusLabel(status: UserStatus): string {
    return status === 'active' ? 'Active' : 'Inactive';
  }

  private resetAddUserForm(): void {
    this.newUserName = '';
    this.newUserEmail = '';
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
