import { create } from 'zustand';
import { supabase } from '../supabase/supabase';

interface Board {
  id: string;
  title: string;
  description?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

interface BoardState {
  boards: Board[];
  currentBoard: Board | null;
  isLoading: boolean;
  error: string | null;
  fetchBoards: () => Promise<void>;
  setCurrentBoard: (board: Board | null) => void;
  createBoard: (title: string, description?: string) => Promise<void>;
  updateBoard: (id: string, updates: Partial<Board>) => Promise<void>;
  deleteBoard: (id: string) => Promise<void>;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  boards: [],
  currentBoard: null,
  isLoading: false,
  error: null,

  fetchBoards: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ boards: data, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch boards',
        isLoading: false,
      });
    }
  },

  setCurrentBoard: (board) => {
    set({ currentBoard: board });
  },

  createBoard: async (title, description) => {
    set({ isLoading: true, error: null });
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('boards')
        .insert({
          title,
          description,
          owner_id: user.user.id,
        })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        boards: [data, ...state.boards],
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create board',
        isLoading: false,
      });
    }
  },

  updateBoard: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('boards')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        boards: state.boards.map((board) =>
          board.id === id ? { ...board, ...data } : board
        ),
        currentBoard: state.currentBoard?.id === id
          ? { ...state.currentBoard, ...data }
          : state.currentBoard,
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update board',
        isLoading: false,
      });
    }
  },

  deleteBoard: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.from('boards').delete().eq('id', id);

      if (error) throw error;

      set((state) => ({
        boards: state.boards.filter((board) => board.id !== id),
        currentBoard: state.currentBoard?.id === id ? null : state.currentBoard,
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete board',
        isLoading: false,
      });
    }
  },
})); 