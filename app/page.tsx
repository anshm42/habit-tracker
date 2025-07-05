"use client"

import { useState, useEffect } from "react"
import { Plus, Calendar, Trash2, Edit, Check, X, LogOut, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ProtectedRoute } from "@/components/protected-route"
import { ThemeToggle } from "@/components/theme-toggle"
import { LoadingSpinner } from "@/components/loading-spinner"
import { NotificationSettings } from "@/components/notification-settings"
import { NotificationPermission } from "@/components/notification-permission"
import { useUser } from "@/contexts/user-context"
import { createClient } from "@/lib/supabase/client"
import { notificationService, NotificationSettings as NotificationSettingsType } from "@/lib/notifications"

interface Habit {
  id: string
  name: string
  description: string
  frequency: "daily" | "weekly" | "monthly"
  created_at: string
  completions: string[] // Array of completion dates (YYYY-MM-DD)
  streak: number
  color: string
  user_id: string
  notification_enabled: boolean
  notification_time: string
  notification_days: string[] | null
}

const HABIT_COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-red-500",
]

function HabitTrackerApp() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [newHabit, setNewHabit] = useState({
    name: "",
    description: "",
    frequency: "daily" as "daily" | "weekly" | "monthly",
    notification_enabled: false,
    notification_time: "09:00",
    notification_days: [] as string[],
  })
  const { user, signOut } = useUser()
  const supabase = createClient()

  // Load habits from Supabase on mount
  useEffect(() => {
    if (user) {
      loadHabits()
      // Request notification permission
      notificationService.requestPermission()
    }
  }, [user])

  // Clear notifications on unmount
  useEffect(() => {
    return () => {
      notificationService.clearAll()
    }
  }, [])

  const loadHabits = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading habits:', error)
      return
    }

    setHabits(data || [])
    
    // Schedule notifications for habits that have them enabled
    if (data) {
      for (const habit of data) {
        if (habit.notification_enabled) {
          const settings: NotificationSettingsType = {
            enabled: habit.notification_enabled,
            time: habit.notification_time,
            days: habit.notification_days || undefined,
          }
          await notificationService.scheduleNotification(habit.id, habit.name, settings)
        }
      }
    }
    
    setIsLoading(false)
  }

  const createHabit = async () => {
    if (!newHabit.name.trim() || !user) return

    const habit: Omit<Habit, 'id'> = {
      name: newHabit.name,
      description: newHabit.description,
      frequency: newHabit.frequency,
      created_at: new Date().toISOString(),
      completions: [],
      streak: 0,
      color: HABIT_COLORS[Math.floor(Math.random() * HABIT_COLORS.length)],
      user_id: user.id,
      notification_enabled: newHabit.notification_enabled,
      notification_time: newHabit.notification_time,
      notification_days: newHabit.notification_days.length > 0 ? newHabit.notification_days : null,
    }

    const { data, error } = await supabase
      .from('habits')
      .insert([habit])
      .select()
      .single()

    if (error) {
      console.error('Error creating habit:', error)
      return
    }

    setHabits((prev) => [data, ...prev])
    
    // Schedule notification if enabled
    if (data.notification_enabled) {
      const settings: NotificationSettingsType = {
        enabled: data.notification_enabled,
        time: data.notification_time,
        days: data.notification_days || undefined,
      }
      await notificationService.scheduleNotification(data.id, data.name, settings)
    }
    
    setNewHabit({ 
      name: "", 
      description: "", 
      frequency: "daily",
      notification_enabled: false,
      notification_time: "09:00",
      notification_days: [],
    })
    setIsAddDialogOpen(false)
  }

  const updateHabit = async () => {
    if (!editingHabit || !editingHabit.name.trim()) return

    const { error } = await supabase
      .from('habits')
      .update({
        name: editingHabit.name,
        description: editingHabit.description,
        frequency: editingHabit.frequency,
        notification_enabled: editingHabit.notification_enabled,
        notification_time: editingHabit.notification_time,
        notification_days: editingHabit.notification_days,
      })
      .eq('id', editingHabit.id)
      .eq('user_id', user?.id)

    if (error) {
      console.error('Error updating habit:', error)
      return
    }

    // Update notification scheduling
    const settings: NotificationSettingsType = {
      enabled: editingHabit.notification_enabled,
      time: editingHabit.notification_time,
      days: editingHabit.notification_days || undefined,
    }
    await notificationService.scheduleNotification(editingHabit.id, editingHabit.name, settings)

    setHabits((prev) => prev.map((habit) => (habit.id === editingHabit.id ? editingHabit : habit)))
    setEditingHabit(null)
    setIsEditDialogOpen(false)
  }

  const deleteHabit = async (id: string) => {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', id)
      .eq('user_id', user?.id)

    if (error) {
      console.error('Error deleting habit:', error)
      return
    }

    // Remove notification for this habit
    notificationService.removeNotification(id)

    setHabits((prev) => prev.filter((habit) => habit.id !== id))
  }

  const toggleCompletion = async (habitId: string) => {
    const today = new Date().toISOString().split("T")[0]
    const habit = habits.find(h => h.id === habitId)
    if (!habit) return

    const completions = [...habit.completions]
    const todayIndex = completions.indexOf(today)

    if (todayIndex > -1) {
      // Remove completion
      completions.splice(todayIndex, 1)
    } else {
      // Add completion
      completions.push(today)
      completions.sort()
    }

    // Calculate streak
    const streak = calculateStreak(completions)

    const { error } = await supabase
      .from('habits')
      .update({ completions, streak })
      .eq('id', habitId)
      .eq('user_id', user?.id)

    if (error) {
      console.error('Error updating completion:', error)
      return
    }

    setHabits((prev) =>
      prev.map((habit) => {
        if (habit.id !== habitId) return habit
        return { ...habit, completions, streak }
      }),
    )
  }

  const calculateStreak = (completions: string[]): number => {
    if (completions.length === 0) return 0

    const sortedCompletions = [...completions].sort().reverse()
    const today = new Date().toISOString().split("T")[0]

    let streak = 0
    const currentDate = new Date()

    for (let i = 0; i < sortedCompletions.length; i++) {
      const completionDate = currentDate.toISOString().split("T")[0]

      if (sortedCompletions[i] === completionDate) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }

    return streak
  }

  const isCompletedToday = (habit: Habit): boolean => {
    const today = new Date().toISOString().split("T")[0]
    return habit.completions.includes(today)
  }

  const getCompletionRate = (habit: Habit): number => {
    const daysSinceCreated = Math.floor((Date.now() - new Date(habit.created_at).getTime()) / (1000 * 60 * 60 * 24)) + 1
    return Math.round((habit.completions.length / daysSinceCreated) * 100)
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">the 1% rule</h1>
            <p className="text-muted-foreground mt-1">small improvements, big results</p>
          </div>

          <div className="flex items-center gap-4">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="hover:scale-105 transition-transform duration-200 animate-fade-in">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Habit
                </Button>
              </DialogTrigger>
              <DialogContent className="animate-scale-in">
                <DialogHeader>
                  <DialogTitle>Create New Habit</DialogTitle>
                  <DialogDescription>Add a new habit to track your daily progress.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Habit Name</Label>
                    <Input
                      id="name"
                      value={newHabit.name}
                      onChange={(e) => setNewHabit((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Drink 8 glasses of water"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={newHabit.description}
                      onChange={(e) => setNewHabit((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Why is this habit important to you?"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select
                      value={newHabit.frequency}
                      onValueChange={(value: "daily" | "weekly" | "monthly") =>
                        setNewHabit((prev) => ({ ...prev, frequency: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <NotificationSettings
                      enabled={newHabit.notification_enabled}
                      time={newHabit.notification_time}
                      days={newHabit.notification_days}
                      frequency={newHabit.frequency}
                      onSettingsChange={(settings) => 
                        setNewHabit((prev) => ({ ...prev, ...settings }))
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(false)}
                    className="hover:scale-105 transition-transform duration-200"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={createHabit}
                    className="hover:scale-105 transition-transform duration-200"
                  >
                    Create Habit
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <ThemeToggle />

            <Button 
              variant="outline" 
              onClick={signOut}
              className="hover:scale-105 transition-transform duration-200 animate-fade-in"
              style={{ animationDelay: '0.1s' }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Stats Overview */}
        {!isLoading && habits.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="animate-fade-in hover:scale-105 transition-transform duration-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Habits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{habits.length}</div>
              </CardContent>
            </Card>
            <Card className="animate-fade-in hover:scale-105 transition-transform duration-200" style={{ animationDelay: '0.1s' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Completed Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{habits.filter(isCompletedToday).length}</div>
              </CardContent>
            </Card>
            <Card className="animate-fade-in hover:scale-105 transition-transform duration-200" style={{ animationDelay: '0.2s' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Best Streak</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.max(...habits.map((h) => h.streak), 0)} days</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Habits Grid */}
        {!isLoading && (
          habits.length === 0 ? (
            <Card className="text-center py-12 animate-bounce-in">
              <CardContent>
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-float" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No habits yet</h3>
                <p className="text-muted-foreground mb-4">Create your first habit to start tracking your progress.</p>
                <Button 
                  onClick={() => setIsAddDialogOpen(true)}
                  className="hover:scale-105 transition-transform duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Habit
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {habits.map((habit, index) => (
                <Card 
                  key={habit.id} 
                  className="relative animate-fade-in hover:scale-105 transition-all duration-300 hover:shadow-lg"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${habit.color} animate-pulse-glow`} />
                        <div>
                          <CardTitle className="text-lg">{habit.name}</CardTitle>
                          {habit.description && <CardDescription className="mt-1">{habit.description}</CardDescription>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:scale-110 transition-transform duration-200"
                          onClick={() => {
                            setEditingHabit(habit)
                            setIsEditDialogOpen(true)
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:scale-110 transition-transform duration-200"
                          onClick={() => deleteHabit(habit.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {habit.frequency}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{habit.streak} day streak</span>
                        {habit.notification_enabled && (
                          <div title="Notifications enabled">
                            <Bell className="w-3 h-3 text-blue-500" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Completion Rate</span>
                        <span>{getCompletionRate(habit)}%</span>
                      </div>
                      <Progress value={getCompletionRate(habit)} className="h-2" />
                    </div>

                    <Button
                      onClick={() => toggleCompletion(habit.id)}
                      className={`w-full transition-all duration-300 ${
                        isCompletedToday(habit)
                          ? "bg-green-600 hover:bg-green-700 animate-pulse-glow"
                          : "bg-secondary hover:bg-secondary/80 text-secondary-foreground hover:scale-105"
                      }`}
                    >
                      {isCompletedToday(habit) ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Completed Today
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4 mr-2" />
                          Mark Complete
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="animate-scale-in">
            <DialogHeader>
              <DialogTitle>Edit Habit</DialogTitle>
              <DialogDescription>Update your habit details.</DialogDescription>
            </DialogHeader>
            {editingHabit && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Habit Name</Label>
                  <Input
                    id="edit-name"
                    value={editingHabit.name}
                    onChange={(e) => setEditingHabit((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editingHabit.description}
                    onChange={(e) =>
                      setEditingHabit((prev) => (prev ? { ...prev, description: e.target.value } : null))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-frequency">Frequency</Label>
                  <Select
                    value={editingHabit.frequency}
                    onValueChange={(value: "daily" | "weekly" | "monthly") =>
                      setEditingHabit((prev) => (prev ? { ...prev, frequency: value } : null))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <NotificationSettings
                    enabled={editingHabit.notification_enabled}
                    time={editingHabit.notification_time}
                    days={editingHabit.notification_days || []}
                    frequency={editingHabit.frequency}
                    onSettingsChange={(settings) => 
                      setEditingHabit((prev) => (prev ? { ...prev, ...settings } : null))
                    }
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
                className="hover:scale-105 transition-transform duration-200"
              >
                Cancel
              </Button>
              <Button 
                onClick={updateHabit}
                className="hover:scale-105 transition-transform duration-200"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Notification Permission Banner */}
        <NotificationPermission />
      </div>
    </div>
  )
}

export default function HabitTracker() {
  return (
    <ProtectedRoute>
      <HabitTrackerApp />
    </ProtectedRoute>
  )
}
