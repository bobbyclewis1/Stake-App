import { create } from 'zustand'
import { supabase } from './supabase'
import type { Database } from './supabase'

type Board = Database['public']['Tables']['boards']['Row']
type List = Database['public']['Tables']['lists']['Row']
type Card = Database['public']['Tables']['cards']['Row']

interface BoardState {
  boards: Board[]
  currentBoard: Board | null
  isLoading: boolean
  error: string | null
  fetchBoards: () => Promise<void>
  setCurrentBoard: (board: Board | null) => void
  createBoard: (title: string, description?: string) => Promise<void>
  updateBoard: (id: string, updates: Partial<Board>) => Promise<void>
  deleteBoard: (id: string) => Promise<void>
}

interface ListState {
  lists: List[]
  isLoading: boolean
  error: string | null
  fetchLists: (boardId: string) => Promise<void>
  createList: (title: string, boardId: string, position: number) => Promise<void>
  updateList: (id: string, updates: Partial<List>) => Promise<void>
  deleteList: (id: string) => Promise<void>
  reorderLists: (lists: List[]) => Promise<void>
}

interface CardState {
  cards: Card[]
  isLoading: boolean
  error: string | null
  fetchCards: (listId: string) => Promise<void>
  createCard: (title: string, listId: string, position: number) => Promise<void>
  updateCard: (id: string, updates: Partial<Card>) => Promise<void>
  deleteCard: (id: string) => Promise<void>
  moveCard: (cardId: string, newListId: string, newPosition: number) => Promise<void>
}

export const useBoardStore = create<BoardState>((set) => ({
  boards: [],
  currentBoard: null,
  isLoading: false,
  error: null,
  fetchBoards: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      set({ boards: data, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
  setCurrentBoard: (board) => set({ currentBoard: board }),
  createBoard: async (title, description) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('boards')
        .insert([{ title, description }])
        .select()
        .single()
      
      if (error) throw error
      set((state) => ({ boards: [data, ...state.boards], isLoading: false }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
  updateBoard: async (id, updates) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('boards')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      set((state) => ({
        boards: state.boards.map((board) => (board.id === id ? data : board)),
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
  deleteBoard: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const { error } = await supabase.from('boards').delete().eq('id', id)
      if (error) throw error
      set((state) => ({
        boards: state.boards.filter((board) => board.id !== id),
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
}))

export const useListStore = create<ListState>((set) => ({
  lists: [],
  isLoading: false,
  error: null,
  fetchLists: async (boardId) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('lists')
        .select('*')
        .eq('board_id', boardId)
        .order('position', { ascending: true })
      
      if (error) throw error
      set({ lists: data, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
  createList: async (title, boardId, position) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('lists')
        .insert([{ title, board_id: boardId, position }])
        .select()
        .single()
      
      if (error) throw error
      set((state) => ({ lists: [...state.lists, data], isLoading: false }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
  updateList: async (id, updates) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('lists')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      set((state) => ({
        lists: state.lists.map((list) => (list.id === id ? data : list)),
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
  deleteList: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const { error } = await supabase.from('lists').delete().eq('id', id)
      if (error) throw error
      set((state) => ({
        lists: state.lists.filter((list) => list.id !== id),
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
  reorderLists: async (lists) => {
    set({ isLoading: true, error: null })
    try {
      const updates = lists.map((list, index) => ({
        id: list.id,
        position: index,
      }))
      
      const { error } = await supabase.from('lists').upsert(updates)
      if (error) throw error
      
      set({ lists, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
}))

export const useCardStore = create<CardState>((set) => ({
  cards: [],
  isLoading: false,
  error: null,
  fetchCards: async (listId) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('list_id', listId)
        .order('position', { ascending: true })
      
      if (error) throw error
      set({ cards: data, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
  createCard: async (title, listId, position) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('cards')
        .insert([{ title, list_id: listId, position }])
        .select()
        .single()
      
      if (error) throw error
      set((state) => ({ cards: [...state.cards, data], isLoading: false }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
  updateCard: async (id, updates) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('cards')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      set((state) => ({
        cards: state.cards.map((card) => (card.id === id ? data : card)),
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
  deleteCard: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const { error } = await supabase.from('cards').delete().eq('id', id)
      if (error) throw error
      set((state) => ({
        cards: state.cards.filter((card) => card.id !== id),
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
  moveCard: async (cardId, newListId, newPosition) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('cards')
        .update({ list_id: newListId, position: newPosition })
        .eq('id', cardId)
        .select()
        .single()
      
      if (error) throw error
      set((state) => ({
        cards: state.cards.map((card) => (card.id === cardId ? data : card)),
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
})) 