import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { cn } from "@/lib/utils"   // if you don’t have cn(), replace with tailwind-merge

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverContent = React.forwardRef(
  ({ className, align = "center", sideOffset = 4, ...props }, ref) => (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 rounded-2xl border bg-white p-4 shadow-lg outline-none animate-in fade-in-0 zoom-in-95 data-[state=open]:animate-out data-[state=closed]:animate-out",
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
)

PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent }
