import { create } from 'zustand';
import { supabase } from '../supabase/supabase';

interface Comment {
  id: string;
  content: string;
  card_id: string;
  author_id: string;
  created_at: string;
  updated_at: string;
}

interface CommentState {
  comments: Comment[];
  isLoading: boolean;
  error: string | null;
  fetchComments: (cardId: string) => Promise<void>;
  createComment: (cardId: string, content: string) => Promise<void>;
  updateComment: (id: string, content: string) => Promise<void>;
  deleteComment: (id: string) => Promise<void>;
}

export const useCommentStore = create<CommentState>((set, get) => ({
  comments: [],
  isLoading: false,
  error: null,

  fetchComments: async (cardId) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('card_id', cardId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      set({ comments: data, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch comments',
        isLoading: false,
      });
    }
  },

  createComment: async (cardId, content) => {
    set({ isLoading: true, error: null });
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('comments')
        .insert({
          content,
          card_id: cardId,
          author_id: user.user.id,
        })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        comments: [...state.comments, data],
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create comment',
        isLoading: false,
      });
    }
  },

  updateComment: async (id, content) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('comments')
        .update({ content })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        comments: state.comments.map((comment) =>
          comment.id === id ? { ...comment, ...data } : comment
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update comment',
        isLoading: false,
      });
    }
  },

  deleteComment: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.from('comments').delete().eq('id', id);

      if (error) throw error;

      set((state) => ({
        comments: state.comments.filter((comment) => comment.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete comment',
        isLoading: false,
      });
    }
  },
})); 