import { create } from 'zustand';
import { supabase } from '../supabase/supabase';

interface Label {
  id: string;
  name: string;
  color: string;
  board_id: string;
  created_at: string;
}

interface LabelState {
  labels: Label[];
  isLoading: boolean;
  error: string | null;
  fetchLabels: (boardId: string) => Promise<void>;
  createLabel: (boardId: string, name: string, color: string) => Promise<void>;
  updateLabel: (id: string, updates: Partial<Label>) => Promise<void>;
  deleteLabel: (id: string) => Promise<void>;
  addLabelToCard: (cardId: string, labelId: string) => Promise<void>;
  removeLabelFromCard: (cardId: string, labelId: string) => Promise<void>;
}

export const useLabelStore = create<LabelState>((set, get) => ({
  labels: [],
  isLoading: false,
  error: null,

  fetchLabels: async (boardId) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('labels')
        .select('*')
        .eq('board_id', boardId)
        .order('created_at');

      if (error) throw error;

      set({ labels: data, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch labels',
        isLoading: false,
      });
    }
  },

  createLabel: async (boardId, name, color) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('labels')
        .insert({
          name,
          color,
          board_id: boardId,
        })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        labels: [...state.labels, data],
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create label',
        isLoading: false,
      });
    }
  },

  updateLabel: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('labels')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        labels: state.labels.map((label) =>
          label.id === id ? { ...label, ...data } : label
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update label',
        isLoading: false,
      });
    }
  },

  deleteLabel: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.from('labels').delete().eq('id', id);

      if (error) throw error;

      set((state) => ({
        labels: state.labels.filter((label) => label.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete label',
        isLoading: false,
      });
    }
  },

  addLabelToCard: async (cardId, labelId) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('card_labels')
        .insert({
          card_id: cardId,
          label_id: labelId,
        });

      if (error) throw error;

      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error
          ? error.message
          : 'Failed to add label to card',
        isLoading: false,
      });
    }
  },

  removeLabelFromCard: async (cardId, labelId) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('card_labels')
        .delete()
        .match({ card_id: cardId, label_id: labelId });

      if (error) throw error;

      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error
          ? error.message
          : 'Failed to remove label from card',
        isLoading: false,
      });
    }
  },
})); 