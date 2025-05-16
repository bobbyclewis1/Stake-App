import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useBoardStore } from '../lib/store'
import { Button } from '../components/ui/button'
import { Plus } from 'lucide-react'
import { BoardList } from '../components/boards/BoardList'
import { BoardContent } from '../components/boards/BoardContent'
import { ThemeToggle } from '../components/ThemeToggle'

export function BoardsPage() {
  const { user, signOut } = useAuth()
  const { boards, fetchBoards, currentBoard, setCurrentBoard } = useBoardStore()
  const navigate = useNavigate()

  useEffect(() => {
    fetchBoards()
  }, [fetchBoards])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-100 dark:bg-gray-800 border-r flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h1 className="text-xl font-bold">TempoFlow</h1>
          <ThemeToggle />
        </div>
        <div className="p-4">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => setCurrentBoard(null)}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Board
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <BoardList boards={boards} />
        </div>
        <div className="p-4 border-t">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
              {user?.email?.[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {currentBoard ? (
          <BoardContent board={currentBoard} />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Welcome to TempoFlow</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Select a board or create a new one to get started</p>
              <Button onClick={() => setCurrentBoard(null)}>
                <Plus className="mr-2 h-4 w-4" />
                Create New Board
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 