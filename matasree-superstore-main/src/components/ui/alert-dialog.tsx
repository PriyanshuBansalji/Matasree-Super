import * as React from "react";
import { Root as AlertDialogRoot, Trigger as AlertDialogTriggerPrimitive, Portal as AlertDialogPortalPrimitive, Overlay as AlertDialogOverlayPrimitive, Content as AlertDialogContentPrimitive, Title as AlertDialogTitlePrimitive, Description as AlertDialogDescriptionPrimitive, Action as AlertDialogActionPrimitive, Cancel as AlertDialogCancelPrimitive } from "@radix-ui/react-alert-dialog";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const AlertDialog = AlertDialogRoot;

const AlertDialogTrigger = AlertDialogTriggerPrimitive;

const AlertDialogPortal = AlertDialogPortalPrimitive;

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogOverlayPrimitive>,
  React.ComponentPropsWithoutRef<typeof AlertDialogOverlayPrimitive>
>(({ className, ...props }, ref) => (
  <AlertDialogOverlayPrimitive
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
    ref={ref}
  />
));
AlertDialogOverlay.displayName = AlertDialogOverlayPrimitive.displayName;

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogContentPrimitive>,
  React.ComponentPropsWithoutRef<typeof AlertDialogContentPrimitive>
>(({ className, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogContentPrimitive
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className,
      )}
      {...props}
    />
  </AlertDialogPortal>
));
AlertDialogContent.displayName = AlertDialogContentPrimitive.displayName;

const AlertDialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />
);
AlertDialogHeader.displayName = "AlertDialogHeader";

const AlertDialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
);
AlertDialogFooter.displayName = "AlertDialogFooter";

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogTitlePrimitive>,
  React.ComponentPropsWithoutRef<typeof AlertDialogTitlePrimitive>
>(({ className, ...props }, ref) => (
  <AlertDialogTitlePrimitive ref={ref} className={cn("text-lg font-semibold", className)} {...props} />
));
AlertDialogTitle.displayName = AlertDialogTitlePrimitive.displayName;

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogDescriptionPrimitive>,
  React.ComponentPropsWithoutRef<typeof AlertDialogDescriptionPrimitive>
>(({ className, ...props }, ref) => (
  <AlertDialogDescriptionPrimitive ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
AlertDialogDescription.displayName = AlertDialogDescriptionPrimitive.displayName;

const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogActionPrimitive>,
  React.ComponentPropsWithoutRef<typeof AlertDialogActionPrimitive>
>(({ className, ...props }, ref) => (
  <AlertDialogActionPrimitive ref={ref} className={cn(buttonVariants(), className)} {...props} />
));
AlertDialogAction.displayName = AlertDialogActionPrimitive.displayName;

const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogCancelPrimitive>,
  React.ComponentPropsWithoutRef<typeof AlertDialogCancelPrimitive>
>(({ className, ...props }, ref) => (
  <AlertDialogCancelPrimitive
    ref={ref}
    className={cn(buttonVariants({ variant: "outline" }), "mt-2 sm:mt-0", className)}
    {...props}
  />
));
AlertDialogCancel.displayName = AlertDialogCancelPrimitive.displayName;

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
