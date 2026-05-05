/** Public comment shape returned by GET/POST /api/comments */
export interface CommentWithAuthor {
  id: string;
  content: string;
  created_at: string;
  user: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export interface CommentsListResponse {
  comments: CommentWithAuthor[];
  error?: string;
}

export interface CommentCreateResponse {
  comment: CommentWithAuthor;
  error?: string;
}
