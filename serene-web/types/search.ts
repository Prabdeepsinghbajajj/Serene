export interface SearchUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  is_following: boolean;
}

export interface SearchResponse {
  users: SearchUser[];
  error?: string;
}
