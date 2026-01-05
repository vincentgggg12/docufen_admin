import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { Checkbox } from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface DocuDialogProps {
  open: boolean
  toggleDialog: () => void
  title: string
  TitleIcon?: React.JSX.Element
  primaryButtonText?: string
  PrimaryIcon?: React.JSX.Element
  primaryAction?: () => void
  secondaryButtonText?: string
  SecondaryIcon?: React.JSX.Element
  secondaryAction?: () => void
  content: string | React.JSX.Element
  holdOpen?: boolean
  warning?: boolean
  working?: boolean
  agree?: boolean
}

const DocuDialog: React.FunctionComponent<DocuDialogProps> = (props) => {
  const {
    open,
    working,
    title,
    TitleIcon,
    content,
    primaryButtonText,
    PrimaryIcon,
    secondaryButtonText,
    SecondaryIcon,
    holdOpen,
    toggleDialog,
    warning,
    primaryAction,
    secondaryAction,
    agree,
  } = props
  const _agree = agree ? agree : false
  const [agreed, setAgreed] = React.useState(false)
  const modPrimaryAction = React.useCallback(() => {
    if (holdOpen && primaryAction) primaryAction()
    else if (primaryAction) {
      toggleDialog()
      setAgreed(false)
      primaryAction()
    }
  }, [holdOpen, primaryAction, toggleDialog])
  const disabled = working || (_agree && !agreed)

  return (
    <DialogPrimitive.Root open={open} onOpenChange={toggleDialog}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" 
          data-testid="docuDialog.overlay"
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg z-[12000]",
            warning ? "bg-amber-50" : "bg-white"
          )}
          data-testid="docuDialog.content"
        >
          <div className="flex flex-col gap-4">
            <DialogPrimitive.Title className="text-lg font-semibold leading-none tracking-tight" data-testid="docuDialog.title">
              {TitleIcon && <span className="mr-2 inline-flex items-center">{TitleIcon}</span>}
              {title}
            </DialogPrimitive.Title>
            
            {/* This is the key change - wrap content in Description */}
            <DialogPrimitive.Description asChild className="text-sm text-slate-500" data-testid="docuDialog.contentArea">
              <div>
                {_agree ? (
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="agree-checkbox"
                        checked={agreed}
                        onCheckedChange={(checked) => setAgreed(checked === true)}
                        className="h-4 w-4 rounded border border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                        data-testid="docuDialog.agreeCheckbox"
                      >
                        <Check className="h-4 w-4" />
                      </Checkbox>
                      <label htmlFor="agree-checkbox" className="text-sm" data-testid="docuDialog.agreeLabel">{content}</label>
                    </div>
                  </div>
                ) : (
                  content
                )}
              </div>
            </DialogPrimitive.Description>

            <div className="flex flex-row-reverse gap-2 sm:justify-end" data-testid="docuDialog.buttonContainer">
              {primaryButtonText && (
                <button
                  onClick={modPrimaryAction}
                  disabled={disabled}
                  className={cn(
                    "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                  )}
                  data-testid="docuDialog.primaryButton"
                >
                  {PrimaryIcon && <span className="mr-2">{PrimaryIcon}</span>}
                  {primaryButtonText}
                </button>
              )}
              
              {secondaryButtonText && (
                <button
                  onClick={secondaryAction}
                  className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                  data-testid="docuDialog.secondaryButton"
                >
                  {SecondaryIcon && <span className="mr-2">{SecondaryIcon}</span>}
                  {secondaryButtonText}
                </button>
              )}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export default DocuDialog
