import { useState, useEffect } from 'react'
import { useAuth } from '../../lib/auth'
import type { Database } from '../../lib/supabase'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { X, UserPlus } from 'lucide-react'
import { supabase } from '../../lib/storage'
import { useToast } from '../ui/use-toast'

type BoardMember = Database['public']['Tables']['board_members']['Row']
type User = Database['public']['Tables']['users']['Row']

const MEMBER_ROLES = [
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
  { value: 'viewer', label: 'Viewer' },
]

interface BoardMembersProps {
  boardId: string
  currentUserRole: string
}

export function BoardMembers({ boardId, currentUserRole }: BoardMembersProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [members, setMembers] = useState<BoardMember[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberRole, setNewMemberRole] = useState('member')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchMembers = async () => {
      const { data, error } = await supabase
        .from('board_members')
        .select(`
          *,
          users (
            email,
            avatar_url,
            full_name
          )
        `)
        .eq('board_id', boardId)

      if (error) {
        console.error('Failed to fetch members:', error)
        return
      }

      setMembers(data)
    }

    fetchMembers()

    // Subscribe to member changes
    const subscription = supabase
      .channel(`board-members:${boardId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'board_members',
          filter: `board_id=eq.${boardId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMembers((prev) => [...prev, payload.new as BoardMember])
          } else if (payload.eventType === 'DELETE') {
            setMembers((prev) =>
              prev.filter((m) => m.id !== payload.old.id)
            )
          } else if (payload.eventType === 'UPDATE') {
            setMembers((prev) =>
              prev.map((m) =>
                m.id === payload.new.id ? (payload.new as BoardMember) : m
              )
            )
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [boardId])

  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) return

    setIsLoading(true)
    try {
      // First, check if the user exists
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', newMemberEmail)
        .single()

      if (userError) {
        throw new Error('User not found')
      }

      // Add member to board
      const { error } = await supabase.from('board_members').insert([
        {
          board_id: boardId,
          user_id: userData.id,
          role: newMemberRole,
          added_by: user?.id,
        },
      ])

      if (error) throw error

      setNewMemberEmail('')
      setNewMemberRole('member')
      toast({
        title: 'Success',
        description: 'Member added successfully.',
      })
    } catch (error) {
      console.error('Failed to add member:', error)
      toast({
        title: 'Error',
        description: 'Failed to add member. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('board_members')
        .delete()
        .eq('id', memberId)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Member removed successfully.',
      })
    } catch (error) {
      console.error('Failed to remove member:', error)
      toast({
        title: 'Error',
        description: 'Failed to remove member. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('board_members')
        .update({ role: newRole })
        .eq('id', memberId)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Member role updated successfully.',
      })
    } catch (error) {
      console.error('Failed to update role:', error)
      toast({
        title: 'Error',
        description: 'Failed to update role. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const canManageMembers = ['owner', 'admin'].includes(currentUserRole)

  return (
    <div className="space-y-4">
      {canManageMembers && (
        <div className="flex space-x-2">
          <Input
            type="email"
            placeholder="Enter email address"
            value={newMemberEmail}
            onChange={(e) => setNewMemberEmail(e.target.value)}
            disabled={isLoading}
          />
          <Select
            value={newMemberRole}
            onValueChange={setNewMemberRole}
            disabled={isLoading}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MEMBER_ROLES.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleAddMember}
            disabled={isLoading || !newMemberEmail.trim()}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100"
          >
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={member.users?.avatar_url} />
                <AvatarFallback>
                  {member.users?.email?.[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">
                  {member.users?.full_name || member.users?.email}
                </p>
                <p className="text-xs text-gray-500">{member.users?.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {canManageMembers && (
                <Select
                  value={member.role}
                  onValueChange={(value) => handleUpdateRole(member.id, value)}
                  disabled={member.role === 'owner'}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEMBER_ROLES.map((role) => (
                      <SelectItem
                        key={role.value}
                        value={role.value}
                        disabled={role.value === 'owner'}
                      >
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {canManageMembers && member.role !== 'owner' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveMember(member.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 