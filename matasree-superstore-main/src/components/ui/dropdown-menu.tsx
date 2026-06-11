import * as React from "react";
import { Root as DropdownMenuRoot, Trigger as DropdownMenuTriggerPrimitive, Group as DropdownMenuGroupPrimitive, Portal as DropdownMenuPortalPrimitive, Sub as DropdownMenuSubPrimitive, RadioGroup as DropdownMenuRadioGroupPrimitive, SubTrigger as DropdownMenuSubTriggerPrimitive, SubContent as DropdownMenuSubContentPrimitive, Content as DropdownMenuContentPrimitive, Item as DropdownMenuItemPrimitive, CheckboxItem as DropdownMenuCheckboxItemPrimitive, RadioItem as DropdownMenuRadioItemPrimitive, Label as DropdownMenuLabelPrimitive, Separator as DropdownMenuSeparatorPrimitive, ItemIndicator as DropdownMenuItemIndicator } from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Circle } from "lucide-react";

import { cn } from "@/lib/utils";

const DropdownMenu = DropdownMenuRoot;

const DropdownMenuTrigger = DropdownMenuTriggerPrimitive;

const DropdownMenuGroup = DropdownMenuGroupPrimitive;

const DropdownMenuPortal = DropdownMenuPortalPrimitive;

const DropdownMenuSub = DropdownMenuSubPrimitive;

const DropdownMenuRadioGroup = DropdownMenuRadioGroupPrimitive;

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuSubTriggerPrimitive>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuSubTriggerPrimitive> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuSubTriggerPrimitive
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[state=open]:bg-accent focus:bg-accent",
      inset && "pl-8",
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </DropdownMenuSubTriggerPrimitive>
));
DropdownMenuSubTrigger.displayName = DropdownMenuSubTriggerPrimitive.displayName;

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuSubContentPrimitive>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuSubContentPrimitive>
>(({ className, ...props }, ref) => (
  <DropdownMenuSubContentPrimitive
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className,
    )}
    {...props}
  />
));
DropdownMenuSubContent.displayName = DropdownMenuSubContentPrimitive.displayName;

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuContentPrimitive>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuContentPrimitive>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPortalPrimitive>
    <DropdownMenuContentPrimitive
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className,
      )}
      {...props}
    />
  </DropdownMenuPortalPrimitive>
));
DropdownMenuContent.displayName = DropdownMenuContentPrimitive.displayName;

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuItemPrimitive>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuItemPrimitive> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuItemPrimitive
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground",
      inset && "pl-8",
      className,
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = DropdownMenuItemPrimitive.displayName;

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuCheckboxItemPrimitive>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuCheckboxItemPrimitive>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuCheckboxItemPrimitive
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground",
      className,
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuItemIndicator>
        <Check className="h-4 w-4" />
      </DropdownMenuItemIndicator>
    </span>
    {children}
  </DropdownMenuCheckboxItemPrimitive>
));
DropdownMenuCheckboxItem.displayName = DropdownMenuCheckboxItemPrimitive.displayName;

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuRadioItemPrimitive>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuRadioItemPrimitive>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuRadioItemPrimitive
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </DropdownMenuItemIndicator>
    </span>
    {children}
  </DropdownMenuRadioItemPrimitive>
));
DropdownMenuRadioItem.displayName = DropdownMenuRadioItemPrimitive.displayName;

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuLabelPrimitive>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuLabelPrimitive> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuLabelPrimitive
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className)}
    {...props}
  />
));
DropdownMenuLabel.displayName = DropdownMenuLabelPrimitive.displayName;

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuSeparatorPrimitive>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuSeparatorPrimitive>
>(({ className, ...props }, ref) => (
  <DropdownMenuSeparatorPrimitive ref={ref} className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />
));
DropdownMenuSeparator.displayName = DropdownMenuSeparatorPrimitive.displayName;

const DropdownMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return <span className={cn("ml-auto text-xs tracking-widest opacity-60", className)} {...props} />;
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
};
