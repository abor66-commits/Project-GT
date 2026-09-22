export interface Company {
  id: string;
  name: string;
  industry: string;
  size_scale: string;
  website: string;
  status: 'Lead' | 'Client';
  owner: string;
}

export interface Contact {
  id: string;
  companyId: string;
  name: string;
  role: string;
  email: string;
  phone: string;
}

export const mockCompanies: Company[] = [
  { id: '1', name: 'Acme Corp', industry: 'Technology', size_scale: '1000+', website: 'acme.com', status: 'Client', owner: 'John Doe' },
  { id: '2', name: 'Global Industries', industry: 'Manufacturing', size_scale: '500-1000', website: 'global.com', status: 'Lead', owner: 'Jane Smith' },
  { id: '3', name: 'TechStart', industry: 'Software', size_scale: '10-50', website: 'techstart.io', status: 'Lead', owner: 'John Doe' },
];

export const mockContacts: Contact[] = [
  { id: '1', companyId: '1', name: 'Alice Wong', role: 'CTO', email: 'alice@acme.com', phone: '+123456789' },
  { id: '2', companyId: '1', name: 'Bob Lee', role: 'VP Sales', email: 'bob@acme.com', phone: '+987654321' },
  { id: '3', companyId: '2', name: 'Charlie Chen', role: 'CEO', email: 'charlie@global.com', phone: '+555666777' },
];
