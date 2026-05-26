export type MemberRole = 'pending' | 'member' | 'student' | 'board' | 'president' | 'admin' | 'rejected';
export type RequestStatus = 'pending' | 'accepted' | 'rejected';
export type NotifType = 'announcement' | 'event' | 'system' | 'mentorship';
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';

export interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  city: string | null;
  sector: string | null;
  position: string | null;
  role: MemberRole;
  is_mentor: boolean;
  mentor_bio: string | null;
  member_code: string | null;
  avatar_url: string | null;
  expo_push_token: string | null;
  push_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Broadcast {
  id: string;
  title: string;
  body: string;
  type: NotifType;
  urgent: boolean;
  target_roles: MemberRole[] | null;
  sent_count: number;
  failed_count: number;
  created_by: string | null;
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  city: string | null;
  starts_at: string;
  ends_at: string | null;
  max_attendees: number | null;
  image_url: string | null;
  is_published: boolean;
  created_by: string | null;
  created_at: string;
  // joined
  attendee_count?: number;
  is_attending?: boolean;
}

export interface EventAttendee {
  event_id: string;
  user_id: string;
  registered_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string | null;
  instructor: string | null;
  duration_hours: number | null;
  level: CourseLevel | null;
  image_url: string | null;
  is_published: boolean;
  created_at: string;
  // joined
  enrollment?: CourseEnrollment | null;
}

export interface CourseEnrollment {
  course_id: string;
  user_id: string;
  progress: number;
  completed_at: string | null;
  enrolled_at: string;
}

export interface MentorshipRequest {
  id: string;
  mentee_id: string;
  mentor_id: string;
  message: string | null;
  status: RequestStatus;
  created_at: string;
  // joined
  mentor?: Profile;
  mentee?: Profile;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  type: 'general' | 'event' | 'system';
  published_at: string;
  created_by: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  type: NotifType;
  read: boolean;
  related_id: string | null;
  created_at: string;
}

export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      events: { Row: Event; Insert: Partial<Event>; Update: Partial<Event> };
      event_attendees: { Row: EventAttendee; Insert: Omit<EventAttendee, 'registered_at'>; Update: never };
      courses: { Row: Course; Insert: Partial<Course>; Update: Partial<Course> };
      course_enrollments: { Row: CourseEnrollment; Insert: Partial<CourseEnrollment>; Update: Partial<CourseEnrollment> };
      mentorship_requests: { Row: MentorshipRequest; Insert: Partial<MentorshipRequest>; Update: Partial<MentorshipRequest> };
      announcements: { Row: Announcement; Insert: Partial<Announcement>; Update: Partial<Announcement> };
      notifications: { Row: Notification; Insert: Partial<Notification>; Update: Partial<Notification> };
    };
  };
};
