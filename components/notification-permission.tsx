"use client"

import { useState, useEffect } from "react"
import { Bell, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { notificationService } from "@/lib/notifications"

export function NotificationPermission() {
  const [showBanner, setShowBanner] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission | null>(null)

  useEffect(() => {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      return
    }

    const currentPermission = Notification.permission
    setPermission(currentPermission)

    // Show banner if permission is not granted and not denied
    if (currentPermission === 'default') {
      setShowBanner(true)
    }
  }, [])

  const requestPermission = async () => {
    const granted = await notificationService.requestPermission()
    setPermission(Notification.permission)
    
    if (granted) {
      setShowBanner(false)
    }
  }

  const dismissBanner = () => {
    setShowBanner(false)
  }

  if (!showBanner || permission === 'denied') {
    return null
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 animate-slide-in">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Bell className="w-5 h-5 text-blue-500 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-sm mb-1">Enable Notifications</h4>
            <p className="text-xs text-muted-foreground mb-3">
              Get reminded to complete your habits on time and build better routines.
            </p>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={requestPermission}
                className="text-xs"
              >
                Enable
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={dismissBanner}
                className="text-xs"
              >
                Later
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 -mt-1 -mr-1"
            onClick={dismissBanner}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 