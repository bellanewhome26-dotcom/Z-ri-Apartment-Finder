export interface Apartment {
  id: string;
  title: string;
  address: string;
  district: string;
  zip: string;
  rooms: number;
  area: number; // m²
  price: number; // CHF
  availableFrom: string;
  source: string; // e.g. Homegate, Flatfox, Comparis, Ron Orp
  url: string;
  features: string[];
  description: string;
  viewingTime?: string; // ISO date or descriptive
  status: 'New' | 'Interested' | 'Viewing Scheduled' | 'Applied' | 'Rejected' | 'Accepted';
  contactEmail?: string;
  emailId?: string;
  notes: string;
  score: number; // calculated match score (1-100)
  lat: number;
  lng: number;
  commuteTimeHB?: number; // minutes to Zürich HB
  taxMultiplier?: number; // municipal multiplier e.g. 119%
}

export interface EmailAlert {
  id: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
  body: string;
  parsed: boolean;
  apartmentId?: string;
  category?: 'Apartment' | 'Unrelated';
}

export interface ViewingEvent {
  id: string;
  apartmentId: string;
  title: string;
  start: string;
  end: string;
  location: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  eventId?: string; // Google Calendar event ID
}

export interface UploadedFile {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
  type: string;
  summary: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  referencedApartmentId?: string;
}

export interface DatabaseState {
  emails: EmailAlert[];
  apartments: Apartment[];
  viewings: ViewingEvent[];
  files: UploadedFile[];
  chatHistory: ChatMessage[];
  profile?: CandidateProfile;
}

export interface CandidateProfile {
  fullName: string;
  age: number;
  jobPosition: string;
  employer: string;
  annualSalary: number;
  phone: string;
  email: string;
  additionalNotes: string;
}
