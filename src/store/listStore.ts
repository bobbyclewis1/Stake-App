import { create } from 'zustand';
import { supabase } from '../supabase/supabase';

interface List {
  id: string;
  title: string;
  position: number;
  board_id: string;
  created_at: string;
  updated_at: string;
}

interface Card {
  id: string;
  title: string;
  description?: string;
  position: number;
  list_id: string;
  created_at: string;
  updated_at: string;
}

interface ListState {
  lists: List[];
  cards: Card[];
  isLoading: boolean;
  error: string | null;
  fetchLists: (boardId: string) => Promise<void>;
  createList: (boardId: string, title: string) => Promise<void>;
  updateList: (id: string, updates: Partial<List>) => Promise<void>;
  deleteList: (id: string) => Promise<void>;
  moveList: (id: string, newPosition: number) => Promise<void>;
  createCard: (listId: string, title: string, description?: string) => Promise<void>;
  updateCard: (id: string, updates: Partial<Card>) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  moveCard: (id: string, newListId: string, newPosition: number) => Promise<void>;
}

export const useListStore = create<ListState>((set, get) => ({
  lists: [],
  cards: [],
  isLoading: false,
  error: null,

  fetchLists: async (boardId) => {
    set({ isLoading: true, error: null });
    try {
      const { data: listsData, error: listsError } = await supabase
        .from('lists')
        .select('*')
        .eq('board_id', boardId)
        .order('position');

      if (listsError) throw listsError;

      const { data: cardsData, error: cardsError } = await supabase
        .from('cards')
        .select('*')
        .in(
          'list_id',
          listsData.map((list) => list.id)
        )
        .order('position');

      if (cardsError) throw cardsError;

      set({
        lists: listsData,
        cards: cardsData,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch lists',
        isLoading: false,
      });
    }
  },

  createList: async (boardId, title) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('lists')
        .insert({
          title,
          board_id: boardId,
          position: get().lists.length,
        })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        lists: [...state.lists, data],
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create list',
        isLoading: false,
      });
    }
  },

  updateList: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('lists')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        lists: state.lists.map((list) =>
          list.id === id ? { ...list, ...data } : list
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update list',
        isLoading: false,
      });
    }
  },

  deleteList: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.from('lists').delete().eq('id', id);

      if (error) throw error;

      set((state) => ({
        lists: state.lists.filter((list) => list.id !== id),
        cards: state.cards.filter((card) => card.list_id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete list',
        isLoading: false,
      });
    }
  },

  moveList: async (id, newPosition) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('lists')
        .update({ position: newPosition })
        .eq('id', id);

      if (error) throw error;

      set((state) => {
        const lists = [...state.lists];
        const oldIndex = lists.findIndex((list) => list.id === id);
        const [removed] = lists.splice(oldIndex, 1);
        lists.splice(newPosition, 0, removed);
        return {
          lists: lists.map((list, index) => ({ ...list, position: index })),
          isLoading: false,
        };
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to move list',
        isLoading: false,
      });
    }
  },

  createCard: async (listId, title, description) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('cards')
        .insert({
          title,
          description,
          list_id: listId,
          position: get().cards.filter((card) => card.list_id === listId).length,
        })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        cards: [...state.cards, data],
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create card',
        isLoading: false,
      });
    }
  },

  updateCard: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('cards')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        cards: state.cards.map((card) =>
          card.id === id ? { ...card, ...data } : card
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update card',
        isLoading: false,
      });
    }
  },

  deleteCard: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.from('cards').delete().eq('id', id);

      if (error) throw error;

      set((state) => ({
        cards: state.cards.filter((card) => card.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete card',
        isLoading: false,
      });
    }
  },

  moveCard: async (id, newListId, newPosition) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('cards')
        .update({ list_id: newListId, position: newPosition })
        .eq('id', id);

      if (error) throw error;

      set((state) => {
        const cards = [...state.cards];
        const oldIndex = cards.findIndex((card) => card.id === id);
        const [removed] = cards.splice(oldIndex, 1);
        removed.list_id = newListId;
        cards.splice(newPosition, 0, removed);
        return {
          cards: cards.map((card, index) => ({
            ...card,
            position: index,
          })),
          isLoading: false,
        };
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to move card',
        isLoading: false,
      });
    }
  },
})); 