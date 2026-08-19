export type ClientType = "particulier" | "professionnel";

export interface Client {
  id: string;

  type: ClientType;

  firstName?: string;
  lastName?: string;
  companyName?: string;

  phone: string;
  email?: string;

  address: {
    street: string;
    postalCode: string;
    city: string;
    country: string;
  };

  notes?: string;

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}