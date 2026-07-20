"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ModeToggle({ isOpen }: { isOpen?: boolean }) {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={
        <Button 
          variant="ghost" 
          className={`h-10 w-full hover:bg-primary/20 ${isOpen ? "justify-start gap-3 px-4" : "justify-center px-0"}`}
        />
      }>
        <div className="relative h-4 w-4 shrink-0 flex items-center justify-center">
          <Sun className={cn("absolute h-4 w-4 rotate-0 transition-all text-muted-foreground", "scale-100", "dark:scale-0 dark:-rotate-90")} />
          <Moon className={cn("absolute h-4 w-4 rotate-90 transition-all text-muted-foreground", "scale-0", "dark:scale-100 dark:rotate-0")} />
        </div>
        {isOpen && <span className="text-sm text-muted-foreground tracking-widest font-normal">Theme</span>}
        <span className="sr-only">Toggle theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={isOpen ? "start" : "center"} side={isOpen ? "top" : "right"}>
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
