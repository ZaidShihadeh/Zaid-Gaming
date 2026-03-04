export interface EventItem {
  id: string;
  title: string;
  description?: string;
  startsAt: string; // ISO
  endsAt?: string; // ISO
  location?: string;
  streamUrl?: string;
  createdAt: string; // ISO
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  startsAt: string; // ISO
  endsAt?: string; // ISO
  location?: string;
  streamUrl?: string;
}

export interface EventsListResponse {
  success: boolean;
  events: EventItem[];
}

export interface CreateEventResponse {
  success: boolean;
  event: EventItem;
}

export interface RsvpResponse {
  success: boolean;
  rsvp: boolean;
  count: number;
}
