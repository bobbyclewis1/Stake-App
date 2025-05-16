import { useBoardStore } from '../../lib/store'
import type { Database } from '../../lib/supabase'

type Board = Database['public']['Tables']['boards']['Row']

interface BoardListProps {
  boards: Board[]
}

export function BoardList({ boards }: BoardListProps) {
  const { setCurrentBoard } = useBoardStore()

  return (
    <div className="space-y-1 p-2">
      {boards.map((board) => (
        <button
          key={board.id}
          className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-200 transition-colors"
          onClick={() => setCurrentBoard(board)}
        >
          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-blue-500 mr-2" />
            <span className="truncate">{board.title}</span>
          </div>
        </button>
      ))}
    </div>
  )
} 