import * as React from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FloatingActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode
}

export const FloatingActionButton = React.forwardRef<HTMLButtonElement, FloatingActionButtonProps>(
  ({ className, icon, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        size="icon"
        className={cn(
          "fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-4 h-14 w-14 rounded-full shadow-2xl z-50 animate-in fade-in zoom-in duration-300",
          "bg-primary hover:bg-primary/90 text-primary-foreground",
          "[&_svg]:size-6",
          className
        )}
        {...props}
      >
        {icon || <Plus />}
      </Button>
    )
  }
)
FloatingActionButton.displayName = "FloatingActionButton"
