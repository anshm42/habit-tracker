"use client"

import { useState } from "react"
import { Bell, Clock, Calendar } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { DAYS_OF_WEEK } from "@/lib/notifications"

interface NotificationSettingsProps {
  enabled: boolean
  time: string
  days: string[]
  frequency: "daily" | "weekly" | "monthly"
  onSettingsChange: (settings: { enabled: boolean; time: string; days: string[] }) => void
}

export function NotificationSettings({
  enabled,
  time,
  days,
  frequency,
  onSettingsChange,
}: NotificationSettingsProps) {
  const handleToggle = (checked: boolean) => {
    onSettingsChange({ enabled: checked, time, days })
  }

  const handleTimeChange = (newTime: string) => {
    onSettingsChange({ enabled, time: newTime, days })
  }

  const handleDayToggle = (day: string, checked: boolean) => {
    const newDays = checked
      ? [...days, day]
      : days.filter(d => d !== day)
    onSettingsChange({ enabled, time, days: newDays })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Bell className="w-4 h-4 text-muted-foreground" />
        <Label htmlFor="notifications" className="text-sm font-medium">
          Enable Notifications
        </Label>
        <Switch
          id="notifications"
          checked={enabled}
          onCheckedChange={handleToggle}
        />
      </div>

      {enabled && (
        <div className="space-y-4 pl-6 border-l-2 border-muted">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="notification-time" className="text-sm font-medium">
                Reminder Time
              </Label>
            </div>
            <Input
              id="notification-time"
              type="time"
              value={time}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="w-32"
            />
          </div>

          {frequency === "weekly" && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <Label className="text-sm font-medium">
                  Reminder Days
                </Label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`day-${day.value}`}
                      checked={days.includes(day.value)}
                      onCheckedChange={(checked) => 
                        handleDayToggle(day.value, checked as boolean)
                      }
                    />
                    <Label 
                      htmlFor={`day-${day.value}`} 
                      className="text-sm cursor-pointer"
                    >
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {frequency === "daily" && (
            <p className="text-xs text-muted-foreground">
              You'll receive a reminder every day at {time}
            </p>
          )}

          {frequency === "weekly" && days.length > 0 && (
            <p className="text-xs text-muted-foreground">
              You'll receive reminders on {days.map(day => 
                DAYS_OF_WEEK.find(d => d.value === day)?.label
              ).join(', ')} at {time}
            </p>
          )}

          {frequency === "monthly" && (
            <p className="text-xs text-muted-foreground">
              You'll receive a reminder on the 1st of each month at {time}
            </p>
          )}
        </div>
      )}
    </div>
  )
} 