'use client'

import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'

interface ToastProps {
  show: boolean
  message: string
  onClose: () => void
}

export function IosToast({ show, message, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (show) {
      setIsVisible(true)
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(onClose, 300)
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [show, onClose])

  if (!show && !isVisible) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 pointer-events-none">
      <div
        className={`
          transform transition-all duration-300 ease-out
          ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}
        `}
      >
        <div className="bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto">
          <div className="flex items-center gap-3 p-4">
            <div className="flex shrink-0 items-center justify-center size-10 rounded-full bg-primary/10 pointer-events-none">
              <Check className="size-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0 pointer-events-none">
              <p className="text-sm font-medium text-foreground truncate">
                {message}
              </p>
            </div>
          </div>
          <div className="h-1 bg-muted overflow-hidden pointer-events-none">
            <div 
              className="h-full bg-primary transition-all duration-[2500ms] ease-linear"
              style={{ 
                width: isVisible ? '100%' : '0%',
                transitionDelay: isVisible ? '0ms' : '0ms'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
