import { M3ExpressiveIndicator } from "@/components/shared/M3ExpressiveIndicator"
import { cn } from "@/lib/utils"

function Spinner({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn("size-6", className)}
      {...props}
    >
      <M3ExpressiveIndicator className="w-full h-full" />
    </div>
  )
}

export { Spinner }
