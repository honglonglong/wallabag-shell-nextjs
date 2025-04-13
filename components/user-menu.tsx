"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User } from "lucide-react"
import { clearToken, clearCredentials } from "@/lib/token-storage"
import { useToast } from "@/hooks/use-toast"

export default function UserMenu() {
  const router = useRouter()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = () => {
    clearToken()
    clearCredentials()

    // Remove cookies by setting them to expire
    document.cookie = "wallabag_setup_complete=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    document.cookie = "wallabag_url=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"

    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    })

    router.push("/login")
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <User className="h-5 w-5" />
          <span className="sr-only">User menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
