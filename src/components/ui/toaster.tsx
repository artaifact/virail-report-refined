import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle2, XCircle, Info } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const icon = variant === "success"
          ? <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
          : variant === "destructive"
          ? <XCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          : <Info className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />

        return (
          <Toast key={id} variant={variant} {...props}>
            {icon}
            <div className="grid gap-1 flex-1 min-w-0">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription className="whitespace-normal break-words leading-relaxed pr-4">
                  {description}
                </ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
