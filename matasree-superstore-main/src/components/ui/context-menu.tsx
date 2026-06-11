import * as React from "react";
import { Root as ContextMenuRoot, Trigger as ContextMenuTriggerPrimitive, Group as ContextMenuGroupPrimitive, Portal as ContextMenuPortalPrimitive, Sub as ContextMenuSubPrimitive, RadioGroup as ContextMenuRadioGroupPrimitive, SubTrigger as ContextMenuSubTriggerPrimitive, SubContent as ContextMenuSubContentPrimitive, Content as ContextMenuContentPrimitive, Item as ContextMenuItemPrimitive, CheckboxItem as ContextMenuCheckboxItemPrimitive, RadioItem as ContextMenuRadioItemPrimitive, Label as ContextMenuLabelPrimitive, Separator as ContextMenuSeparatorPrimitive, ItemIndicator as ContextMenuItemIndicator } from "@radix-ui/react-context-menu";
import { Check, ChevronRight, Circle } from "lucide-react";

import { cn } from "@/lib/utils";

const ContextMenu = ContextMenuRoot;

const ContextMenuTrigger = ContextMenuTriggerPrimitive;

const ContextMenuGroup = ContextMenuGroupPrimitive;

const ContextMenuPortal = ContextMenuPortalPrimitive;

const ContextMenuSub = ContextMenuSubPrimitive;

const ContextMenuRadioGroup = ContextMenuRadioGroupPrimitive;

const ContextMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof ContextMenuSubTriggerPrimitive>,
  React.ComponentPropsWithoutRef<typeof ContextMenuSubTriggerPrimitive> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <ContextMenuSubTriggerPrimitive
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[state=open]:bg-accent data-[state=open]:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
      inset && "pl-8",
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </ContextMenuSubTriggerPrimitive>
));
ContextMenuSubTrigger.displayName = ContextMenuSubTriggerPrimitive.displayName;

const ContextMenuSubContent = React.forwardRef<
  React.ElementRef<typeof ContextMenuSubContentPrimitive>,
  React.ComponentPropsWithoutRef<typeof ContextMenuSubContentPrimitive>
>(({ className, ...props }, ref) => (
  <ContextMenuSubContentPrimitive
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className,
    )}
    {...props}
  />
));
ContextMenuSubContent.displayName = ContextMenuSubContentPrimitive.displayName;

const ContextMenuContent = React.forwardRef<
  React.ElementRef<typeof ContextMenuContentPrimitive>,
  React.ComponentPropsWithoutRef<typeof ContextMenuContentPrimitive>
>(({ className, ...props }, ref) => (
  <ContextMenuPortalPrimitive>
    <ContextMenuContentPrimitive
      ref={ref}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className,
      )}
      {...props}
    />
  </ContextMenuPortalPrimitive>
));
ContextMenuContent.displayName = ContextMenuContentPrimitive.displayName;

const ContextMenuItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuItemPrimitive>,
  React.ComponentPropsWithoutRef<typeof ContextMenuItemPrimitive> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <ContextMenuItemPrimitive
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground",
      inset && "pl-8",
      className,
    )}
    {...props}
  />
));
ContextMenuItem.displayName = ContextMenuItemPrimitive.displayName;

const ContextMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuCheckboxItemPrimitive>,
  React.ComponentPropsWithoutRef<typeof ContextMenuCheckboxItemPrimitive>
>(({ className, children, checked, ...props }, ref) => (
  <ContextMenuCheckboxItemPrimitive
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground",
      className,
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <ContextMenuItemIndicator>
        <Check className="h-4 w-4" />
      </ContextMenuItemIndicator>
    </span>
    {children}
  </ContextMenuCheckboxItemPrimitive>
));
ContextMenuCheckboxItem.displayName = ContextMenuCheckboxItemPrimitive.displayName;

const ContextMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuRadioItemPrimitive>,
  React.ComponentPropsWithoutRef<typeof ContextMenuRadioItemPrimitive>
>(({ className, children, ...props }, ref) => (
  <ContextMenuRadioItemPrimitive
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <ContextMenuItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </ContextMenuItemIndicator>
    </span>
    {children}
  </ContextMenuRadioItemPrimitive>
));
ContextMenuRadioItem.displayName = ContextMenuRadioItemPrimitive.displayName;

const ContextMenuLabel = React.forwardRef<
  React.ElementRef<typeof ContextMenuLabelPrimitive>,
  React.ComponentPropsWithoutRef<typeof ContextMenuLabelPrimitive> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <ContextMenuLabelPrimitive
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold text-foreground", inset && "pl-8", className)}
    {...props}
  />
));
ContextMenuLabel.displayName = ContextMenuLabelPrimitive.displayName;

const ContextMenuSeparator = React.forwardRef<
  React.ElementRef<typeof ContextMenuSeparatorPrimitive>,
  React.ComponentPropsWithoutRef<typeof ContextMenuSeparatorPrimitive>
>(({ className, ...props }, ref) => (
  <ContextMenuSeparatorPrimitive ref={ref} className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />
));
ContextMenuSeparator.displayName = ContextMenuSeparatorPrimitive.displayName;

const ContextMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return <span className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)} {...props} />;
};
ContextMenuShortcut.displayName = "ContextMenuShortcut";

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
};
