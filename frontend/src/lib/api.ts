const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  getToken() {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || error.detail || 'Request failed');
    }

    // Handle empty responses (204 No Content)
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  // ============ Auth ============
  async login(username: string, password: string) {
    const data = await this.request('/auth/sign-in', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  // ============ Cities ============
  async getCities() {
    return this.request('/city');
  }

  async createCity(data: any) {
    return this.request('/city', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCity(id: string, data: any) {
    return this.request(`/city/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCity(id: string) {
    return this.request(`/city/${id}`, { method: 'DELETE' });
  }

  // ============ Locations ============
  async getLocations() {
    return this.request('/location');
  }

  async createLocation(data: any) {
    return this.request('/location', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLocation(id: string, data: any) {
    return this.request(`/location/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteLocation(id: string) {
    return this.request(`/location/${id}`, { method: 'DELETE' });
  }

  // ============ Location Costs ============
  async getLocationCosts() {
    return this.request('/locationcost');
  }

  async getLocationCostsByCity(cityId: string) {
    return this.request(`/locationcost/city/${cityId}`);
  }

  async createLocationCost(data: any) {
    return this.request('/locationcost', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLocationCost(id: string, data: any) {
    return this.request(`/locationcost/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteLocationCost(id: string) {
    return this.request(`/locationcost/${id}`, { method: 'DELETE' });
  }

  // ============ Vendors ============
  async getVendors() {
    return this.request('/vendor');
  }

  async createVendor(data: any) {
    return this.request('/vendor', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateVendor(id: string, data: any) {
    return this.request(`/vendor/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteVendor(id: string) {
    return this.request(`/vendor/${id}`, { method: 'DELETE' });
  }

  // ============ Users ============
  async getUsers() {
    return this.request('/user');
  }

  async createUser(data: any) {
    return this.request('/user', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: string, data: any) {
    return this.request(`/user/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string) {
    return this.request(`/user/${id}`, { method: 'DELETE' });
  }

  // ============ Audit Logs ============
  async getAuditLogs(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/audit${query}`);
  }

  // ============ Transports ============
  async getTransports() {
    return this.request('/transport');
  }

  async createTransport(data: any) {
    return this.request('/transport', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTransport(id: string, data: any) {
    return this.request(`/transport/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTransport(id: string) {
    return this.request(`/transport/${id}`, { method: 'DELETE' });
  }

  // ============ Tickets ============
  async getTickets(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/ride-ticket${query}`);
  }

  async getTicket(id: string) {
    return this.request(`/ride-ticket/${id}`);
  }

  async createTicket(data: any) {
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

  // ============ Invoices ============
  async getInvoices(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/invoice${query}`);
  }

  async generateInvoice(vendorId: string, month: number, year: number) {
    return this.request('/invoice/generate', {
      method: 'POST',
      body: JSON.stringify({ vendorId, month, year }),
    });
  }

  async downloadInvoice(invoiceId: string): Promise<Blob> {
    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/invoice/${invoiceId}/download`, { headers });
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
