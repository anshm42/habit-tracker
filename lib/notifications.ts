export interface NotificationSettings {
  enabled: boolean
  time: string // HH:MM format
  days?: string[] // For weekly habits: ['monday', 'tuesday', etc.]
}

export interface HabitNotification {
  id: string
  habitId: string
  habitName: string
  time: string
  days?: string[]
  enabled: boolean
}

class NotificationService {
  private static instance: NotificationService
  private notifications: Map<string, HabitNotification> = new Map()
  private checkInterval: NodeJS.Timeout | null = null

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission === 'denied') {
      return false
    }

    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  async scheduleNotification(habitId: string, habitName: string, settings: NotificationSettings): Promise<void> {
    if (!settings.enabled) {
      this.removeNotification(habitId)
      return
    }

    const notification: HabitNotification = {
      id: `habit-${habitId}`,
      habitId,
      habitName,
      time: settings.time,
      days: settings.days,
      enabled: settings.enabled,
    }

    this.notifications.set(habitId, notification)
    this.startChecking()
  }

  removeNotification(habitId: string): void {
    this.notifications.delete(habitId)
    
    if (this.notifications.size === 0) {
      this.stopChecking()
    }
  }

  private startChecking(): void {
    if (this.checkInterval) return

    this.checkInterval = setInterval(() => {
      this.checkNotifications()
    }, 60000) // Check every minute
  }

  private stopChecking(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  private async checkNotifications(): Promise<void> {
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5) // HH:MM format
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()

    for (const notification of this.notifications.values()) {
      if (!notification.enabled) continue

      // Check if it's time for notification
      if (notification.time === currentTime) {
        // For daily habits, show notification every day
        if (!notification.days) {
          await this.showNotification(notification)
          continue
        }

        // For weekly habits, check if today is a scheduled day
        if (notification.days.includes(currentDay)) {
          await this.showNotification(notification)
        }
      }
    }
  }

  private async showNotification(notification: HabitNotification): Promise<void> {
    if (Notification.permission !== 'granted') return

    new Notification('the 1% rule', {
      body: `Time to complete your habit: ${notification.habitName}`,
      icon: '/placeholder-logo.png',
      badge: '/placeholder-logo.png',
      tag: notification.id,
      requireInteraction: false,
      silent: false,
    })
  }

  // Get all scheduled notifications
  getScheduledNotifications(): HabitNotification[] {
    return Array.from(this.notifications.values())
  }

  // Clear all notifications (useful for sign out)
  clearAll(): void {
    this.notifications.clear()
    this.stopChecking()
  }
}

export const notificationService = NotificationService.getInstance()

// Helper function to get day names
export const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
]

// Helper function to format time for display
export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
} 