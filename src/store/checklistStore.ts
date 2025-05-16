import { create } from 'zustand';
import { supabase } from '../supabase/supabase';

interface Checklist {
  id: string;
  title: string;
  card_id: string;
  position: number;
  created_at: string;
}

interface ChecklistItem {
  id: string;
  title: string;
  is_complete: boolean;
  checklist_id: string;
  position: number;
  due_date?: string;
  assignee_id?: string;
  created_at: string;
}

interface ChecklistState {
  checklists: Checklist[];
  checklistItems: ChecklistItem[];
  isLoading: boolean;
  error: string | null;
  fetchChecklists: (cardId: string) => Promise<void>;
  createChecklist: (cardId: string, title: string) => Promise<void>;
  updateChecklist: (id: string, updates: Partial<Checklist>) => Promise<void>;
  deleteChecklist: (id: string) => Promise<void>;
  createChecklistItem: (
    checklistId: string,
    title: string,
    dueDate?: string,
    assigneeId?: string
  ) => Promise<void>;
  updateChecklistItem: (
    id: string,
    updates: Partial<ChecklistItem>
  ) => Promise<void>;
  deleteChecklistItem: (id: string) => Promise<void>;
  toggleChecklistItem: (id: string) => Promise<void>;
  moveChecklistItem: (
    id: string,
    newChecklistId: string,
    newPosition: number
  ) => Promise<void>;
}

export const useChecklistStore = create<ChecklistState>((set, get) => ({
  checklists: [],
  checklistItems: [],
  isLoading: false,
  error: null,

  fetchChecklists: async (cardId) => {
    set({ isLoading: true, error: null });
    try {
      const { data: checklistsData, error: checklistsError } = await supabase
        .from('checklists')
        .select('*')
        .eq('card_id', cardId)
        .order('position');

      if (checklistsError) throw checklistsError;

      const { data: itemsData, error: itemsError } = await supabase
        .from('checklist_items')
        .select('*')
        .in(
          'checklist_id',
          checklistsData.map((checklist) => checklist.id)
        )
        .order('position');

      if (itemsError) throw itemsError;

      set({
        checklists: checklistsData,
        checklistItems: itemsData,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error
          ? error.message
          : 'Failed to fetch checklists',
        isLoading: false,
      });
    }
  },

  createChecklist: async (cardId, title) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('checklists')
        .insert({
          title,
          card_id: cardId,
          position: get().checklists.length,
        })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        checklists: [...state.checklists, data],
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error
          ? error.message
          : 'Failed to create checklist',
        isLoading: false,
      });
    }
  },

  updateChecklist: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('checklists')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        checklists: state.checklists.map((checklist) =>
          checklist.id === id ? { ...checklist, ...data } : checklist
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error
          ? error.message
          : 'Failed to update checklist',
        isLoading: false,
      });
    }
  },

  deleteChecklist: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.from('checklists').delete().eq('id', id);

      if (error) throw error;

      set((state) => ({
        checklists: state.checklists.filter((checklist) => checklist.id !== id),
        checklistItems: state.checklistItems.filter(
          (item) => item.checklist_id !== id
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error
          ? error.message
          : 'Failed to delete checklist',
        isLoading: false,
      });
    }
  },

  createChecklistItem: async (checklistId, title, dueDate, assigneeId) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('checklist_items')
        .insert({
          title,
          checklist_id: checklistId,
          position: get().checklistItems.filter(
            (item) => item.checklist_id === checklistId
          ).length,
          due_date: dueDate,
          assignee_id: assigneeId,
        })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        checklistItems: [...state.checklistItems, data],
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error
          ? error.message
          : 'Failed to create checklist item',
        isLoading: false,
      });
    }
  },

  updateChecklistItem: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('checklist_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        checklistItems: state.checklistItems.map((item) =>
          item.id === id ? { ...item, ...data } : item
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error
          ? error.message
          : 'Failed to update checklist item',
        isLoading: false,
      });
    }
  },

  deleteChecklistItem: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('checklist_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        checklistItems: state.checklistItems.filter((item) => item.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error
          ? error.message
          : 'Failed to delete checklist item',
        isLoading: false,
      });
    }
  },

  toggleChecklistItem: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const item = get().checklistItems.find((item) => item.id === id);
      if (!item) throw new Error('Checklist item not found');

      const { data, error } = await supabase
        .from('checklist_items')
        .update({ is_complete: !item.is_complete })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        checklistItems: state.checklistItems.map((item) =>
          item.id === id ? { ...item, ...data } : item
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error
          ? error.message
          : 'Failed to toggle checklist item',
        isLoading: false,
      });
    }
  },

  moveChecklistItem: async (id, newChecklistId, newPosition) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('checklist_items')
        .update({
          checklist_id: newChecklistId,
          position: newPosition,
        })
        .eq('id', id);

      if (error) throw error;

      set((state) => {
        const items = [...state.checklistItems];
        const oldIndex = items.findIndex((item) => item.id === id);
        const [removed] = items.splice(oldIndex, 1);
        removed.checklist_id = newChecklistId;
        items.splice(newPosition, 0, removed);
        return {
          checklistItems: items.map((item, index) => ({
            ...item,
            position: index,
          })),
          isLoading: false,
        };
      });
    } catch (error) {
      set({
        error: error instanceof Error
          ? error.message
          : 'Failed to move checklist item',
        isLoading: false,
      });
    }
  },
})); 