export interface Persona {
  username: string;
  bio: string;
}

export interface GeneratorFormData {
  companyInfo: string;
  companyWebsite: string;
  personas: Persona[];
  subreddits: string[];
  topics: string[];
  postsPerWeek: number;
}

export interface Comment {
  id: string; // Generated on server
  persona: string;
  text: string;
  timestamp: string; // ISO string
  replies?: Comment[];
}

export interface Post {
  id: string; // Generated on server
  title: string;
  body: string;
  subreddit: string;
  persona: string;
  topic: string;
  timestamp: string; // ISO string
  comments?: Comment[];
}

export interface CalendarData {
  week_start: string;
  posts: Post[];
  qualityScore?: number;
  critique?: string;
}
