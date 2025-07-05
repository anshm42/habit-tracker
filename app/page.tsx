"use client"

import { useState, useEffect } from "react"
import { Plus, Calendar, Trash2, Edit, Check, X } from "lucide-react"
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

interface Habit {
  id: string
  name: string
  description: string
  frequency: "daily" | "weekly" | "monthly"
  createdAt: string
  completions: string[] // Array of completion dates (YYYY-MM-DD)
  streak: number
  color: string
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

export default function HabitTracker() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [newHabit, setNewHabit] = useState({
    name: "",
    description: "",
    frequency: "daily" as const,
  })

  // Load habits from localStorage on mount
  useEffect(() => {
    const savedHabits = localStorage.getItem("habits")
    if (savedHabits) {
      setHabits(JSON.parse(savedHabits))
    }
  }, [])

  // Save habits to localStorage whenever habits change
  useEffect(() => {
    localStorage.setItem("habits", JSON.stringify(habits))
  }, [habits])

  const createHabit = () => {
    if (!newHabit.name.trim()) return

    const habit: Habit = {
      id: Date.now().toString(),
      name: newHabit.name,
      description: newHabit.description,
      frequency: newHabit.frequency,
      createdAt: new Date().toISOString(),
      completions: [],
      streak: 0,
      color: HABIT_COLORS[Math.floor(Math.random() * HABIT_COLORS.length)],
    }

    setHabits((prev) => [...prev, habit])
    setNewHabit({ name: "", description: "", frequency: "daily" })
    setIsAddDialogOpen(false)
  }

  const updateHabit = () => {
    if (!editingHabit || !editingHabit.name.trim()) return

    setHabits((prev) => prev.map((habit) => (habit.id === editingHabit.id ? editingHabit : habit)))
    setEditingHabit(null)
    setIsEditDialogOpen(false)
  }

  const deleteHabit = (id: string) => {
    setHabits((prev) => prev.filter((habit) => habit.id !== id))
  }

  const toggleCompletion = (habitId: string) => {
    const today = new Date().toISOString().split("T")[0]

    setHabits((prev) =>
      prev.map((habit) => {
        if (habit.id !== habitId) return habit

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
    const daysSinceCreated = Math.floor((Date.now() - new Date(habit.createdAt).getTime()) / (1000 * 60 * 60 * 24)) + 1
    return Math.round((habit.completions.length / daysSinceCreated) * 100)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Habit Tracker</h1>
            <p className="text-gray-600 mt-1">Build better habits, one day at a time</p>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Habit
              </Button>
            </DialogTrigger>
            <DialogContent>
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
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createHabit}>Create Habit</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Overview */}
        {habits.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Habits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{habits.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Completed Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{habits.filter(isCompletedToday).length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Best Streak</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.max(...habits.map((h) => h.streak), 0)} days</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Habits Grid */}
        {habits.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No habits yet</h3>
              <p className="text-gray-600 mb-4">Create your first habit to start tracking your progress.</p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Habit
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {habits.map((habit) => (
              <Card key={habit.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${habit.color}`} />
                      <div>
                        <CardTitle className="text-lg">{habit.name}</CardTitle>
                        {habit.description && <CardDescription className="mt-1">{habit.description}</CardDescription>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
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
                        className="h-8 w-8 text-red-600 hover:text-red-700"
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
                      <span className="text-sm text-gray-600">{habit.streak} day streak</span>
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
                    className={`w-full ${
                      isCompletedToday(habit)
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-700"
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
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
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
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={updateHabit}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
