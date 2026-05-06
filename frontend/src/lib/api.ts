import type {
  City,
  CreateCityInput,
  CreateLocationCostInput,
  CreateTicketInput,
  CreateTransportInput,
  CreateUserInput,
  CreateVendorInput,
  Location,
  LocationCost,
  LocationCostImportPreview,
  LocationCostImportResult,
  Ticket,
  Transport,
  UpdateUserInput,
  User,
  Vendor,
} from './types';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || API_URL;

type PaginatedResponse<T> = {
  data: T[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

class ApiClient {
  getToken() { return null; }
  setToken(_token: string) {}
  clearToken() { void this.logout().catch(() => undefined); }

  private unwrapList<T>(payload: T[] | PaginatedResponse<T>): T[] {
    return Array.isArray(payload) ? payload : payload.data || [];
  }

  private async request(endpoint: string, options: RequestInit = {}, baseUrl = API_URL) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
      cache: 'no-store',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));

      const message =
        response.status === 429
          ? 'Too many requests. Please wait a moment and try again.'
          : error.message || error.detail || 'Request failed';

      throw new Error(message);
    }

    // Handle empty responses (204 No Content)
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  // ============ Auth ============
  async login(username: string, password: string) {
    return this.request('/auth/sign-in', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }, AUTH_URL);
  }

  async logout() {
    await this.request('/auth/sign-out', { method: 'POST' }, AUTH_URL).catch(() => null);
  }

  async getMe() {
    return this.request('/auth/me', {}, AUTH_URL);
  }

  async requestPasswordReset(identifier: string) {
    return this.request('/auth/request-password-reset', {
      method: 'POST',
      body: JSON.stringify({ identifier }),
    }, AUTH_URL);
  }

  async resetPassword(token: string, password: string) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }, AUTH_URL);
  }

  // ============ Cities ============
  async getCities(): Promise<City[]> {
    return this.unwrapList(await this.request('/city'));
  }

  async createCity(data: CreateCityInput): Promise<City> {
    return this.request('/city', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCity(id: string, data: Partial<CreateCityInput>): Promise<City> {
    return this.request(`/city/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCity(id: string) {
    return this.request(`/city/${id}`, { method: 'DELETE' });
  }

  // ============ Locations ============
  async getLocations(cityId?: string): Promise<Location[]> {
    const query = cityId ? `?cityId=${encodeURIComponent(cityId)}` : '';
    return this.unwrapList(await this.request(`/location${query}`));
  }

  async createLocation(data: { locationName: string; cityId: string }): Promise<Location> {
    return this.request('/location', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLocation(id: string, data: { locationName?: string; cityId?: string }): Promise<Location> {
    return this.request(`/location/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteLocation(id: string) {
    return this.request(`/location/${id}`, { method: 'DELETE' });
  }

  // ============ Location Costs ============
  async getLocationCosts(): Promise<LocationCost[]> {
    return this.unwrapList(await this.request('/locationcost'));
  }

  async getLocationCostsByCity(cityId: string): Promise<LocationCost[]> {
    return this.unwrapList(await this.request(`/locationcost/city/${cityId}`));
  }

  async createLocationCost(data: CreateLocationCostInput): Promise<LocationCost> {
    return this.request('/locationcost', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLocationCost(id: string, data: Partial<CreateLocationCostInput>): Promise<LocationCost> {
    return this.request(`/locationcost/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteLocationCost(id: string) {
    return this.request(`/locationcost/${id}`, { method: 'DELETE' });
  }

  async previewLocationCostsImport(file: File): Promise<LocationCostImportPreview> {
    return this.uploadLocationCostsFile('/locationcost/import/preview', file);
  }

  async importLocationCosts(file: File): Promise<LocationCostImportResult> {
    return this.uploadLocationCostsFile('/locationcost/import', file);
  }

  private async uploadLocationCostsFile(endpoint: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
      cache: 'no-store',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Import failed' }));
      const message = typeof error.message === 'string' ? error.message : error.detail || 'Import failed';
      const requestError = new Error(message) as Error & { errors?: unknown[]; summary?: unknown };
      requestError.errors = error.errors;
      requestError.summary = error.summary;
      throw requestError;
    }

    return response.json();
  }

  // ============ Vendors ============
  async getVendors(): Promise<Vendor[]> {
    return this.unwrapList(await this.request('/vendor'));
  }

  async createVendor(data: CreateVendorInput): Promise<Vendor> {
    return this.request('/vendor', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateVendor(id: string, data: Partial<CreateVendorInput>): Promise<Vendor> {
    return this.request(`/vendor/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteVendor(id: string) {
    return this.request(`/vendor/${id}`, { method: 'DELETE' });
  }

  // ============ Users ============
  async getUsers(): Promise<User[]> {
    return this.unwrapList(await this.request('/user'));
  }

  async createUser(data: CreateUserInput): Promise<User> {
    return this.request('/user', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: string, data: UpdateUserInput): Promise<User> {
    return this.request(`/user/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string) {
    return this.request(`/user/${id}`, { method: 'DELETE' });
  }

  // ============ Audit Logs ============
  async getAuditLogs(params?: Record<string, string>): Promise<any[]> {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.unwrapList(await this.request(`/audit${query}`));
  }

  // ============ Transports ============
  async getTransports(): Promise<Transport[]> {
    return this.unwrapList(await this.request('/transport'));
  }

  async createTransport(data: CreateTransportInput): Promise<Transport> {
    return this.request('/transport', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTransport(id: string, data: Partial<CreateTransportInput>): Promise<Transport> {
    return this.request(`/transport/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTransport(id: string) {
    return this.request(`/transport/${id}`, { method: 'DELETE' });
  }

  // ============ Tickets ============
  async getTickets(params?: Record<string, string>): Promise<Ticket[]> {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.unwrapList(await this.request(`/ride-ticket${query}`));
  }

  async getTicket(id: string): Promise<Ticket> {
    return this.request(`/ride-ticket/${id}`);
  }

  async createTicket(data: CreateTicketInput): Promise<Ticket> {
    return this.request('/ride-ticket', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async assignTransport(ticketId: string, transportId: string) {
    return this.request(`/ride-ticket/${ticketId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ transportId }),
    });
  }

  async startRide(ticketId: string) {
    return this.request(`/ride-ticket/${ticketId}/pickup`, {
      method: 'POST',
    });
  }

  async completeRide(ticketId: string, otp: string) {
    return this.request(`/ride-ticket/${ticketId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ otp }),
    });
  }

  async deleteTicket(ticketId: string) {
    return this.request(`/ride-ticket/${ticketId}`, { method: 'DELETE' });
  }

  // ============ Invoices ============
  async getInvoices(params?: Record<string, string>): Promise<any[]> {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.unwrapList(await this.request(`/invoice${query}`));
  }

  async generateInvoice(vendorId: string, month: number, year: number) {
    return this.request('/invoice/generate', {
      method: 'POST',
      body: JSON.stringify({ vendorId, month, year }),
    });
  }

  async approveInvoice(invoiceId: string) {
    return this.request(`/invoice/${invoiceId}/approve`, { method: 'POST' });
  }

  async rejectInvoice(invoiceId: string, remarks: string) {
    return this.request(`/invoice/${invoiceId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ remarks }),
    });
  }

  async deleteInvoice(invoiceId: string) {
    return this.request(`/invoice/${invoiceId}`, { method: 'DELETE' });
  }

  async downloadInvoice(invoiceId: string): Promise<Blob> {
    const headers: Record<string, string> = {};

    const response = await fetch(`${API_URL}/invoice/${invoiceId}/download`, { headers, credentials: 'include' });
    if (!response.ok) throw new Error('Download failed');
    return response.blob();
  }

  // ============ Dashboard ============
  async getDashboardStats(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/dashboard${query}`);
  }
}

export const api = new ApiClient();
