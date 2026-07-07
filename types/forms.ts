export interface StudentData {
  displayName: string;
  email: string;
  university: string;
  branch: string;
  department: string;
  membershipType: 'Student' | 'Graduate' | 'Professional';
  interests: string[];
  phoneNumber?: string;
  password?: string; // used only for form state, not saved to db directly
}

export interface OrganizerRequest {
  organizationName: string;
  organizerName: string;
  email: string;
  ieeeSection: string;
  organizationDescription: string;
  contactNumber: string;
  logo?: string;
  linkedIn?: string;
  website?: string;
  password?: string; // used only for form state, not saved to db directly
}

export interface RegistrationData {
  eventId: string;
  userId: string;
  fullName: string;
  university: string;
  department: string;
  membershipId?: string;
  phoneNumber: string;
  teamName?: string;
  experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  specialNotes?: string;
}
