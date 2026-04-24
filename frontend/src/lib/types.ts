export interface City {
  _id: string;
  cityId: string;
  cityName: string;
}

export interface Location {
  _id: string;
  locationName: string;
  cityId?: City | string;
}

export interface Vendor {
  _id: string;
  vendorName: string;
  contact?: string;
  email?: string;
  cityId?: City | string;
}

export interface Transport {
  _id: string;
  vehicleNo: string;
  type?: string;
  ownerDetails?: string;
  contact?: string;
  vendorId?: Vendor | string;
  cityId?: City | string;
}

export interface User {
  _id: string;
  username: string;
  role: 'SUPERADMIN' | 'VENDOR' | 'TRANSPORT' | 'USER';
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  cityId?: City | string;
  vendorId?: Vendor | string;
  transportId?: Transport | string;
  active?: boolean;
}

export interface Ticket {
  _id: string;
  status: string;
  pickupDate?: string;
  otp?: string;
  cost?: number;
  userId?: User | string;
  cityId?: City | string;
  pickupLocationId?: Location | string;
  dropLocationId?: Location | string;
  transportId?: Transport | string;
  vendorId?: Vendor | string;
}

export interface CreateCityInput {
  cityId: string;
  cityName: string;
}

export interface CreateVendorInput {
  vendorName: string;
  contact?: string;
  email?: string;
  cityId: string;
  userId?: string;
}

export interface CreateUserInput {
  username: string;
  password: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role: User['role'];
  cityId?: string;
}

export interface UpdateUserInput extends Partial<CreateUserInput> {}

export interface CreateTransportInput {
  vehicleNo: string;
  type?: string;
  ownerDetails?: string;
  contact?: string;
  vendorId: string;
  cityId: string;
  userId?: string;
}

export interface CreateTicketInput {
  pickupLocationId: string;
  dropLocationId: string;
  pickupDate: string;
}

export interface LocationCost {
  _id: string;
  fromLocationId?: Location | string;
  toLocationId?: Location | string;
  cityId?: City | string;
  cost: number;
  distance: number;
}

export interface CreateLocationCostInput {
  fromLocationId: string;
  toLocationId: string;
  cityId: string;
  cost: number;
  distance: number;
}
