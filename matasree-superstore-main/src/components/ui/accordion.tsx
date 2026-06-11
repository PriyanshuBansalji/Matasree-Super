import * as React from "react";
import { Root as AccordionRoot, Item as AccordionItemPrimitive, Trigger as AccordionTriggerPrimitive, Header as AccordionHeader, Content as AccordionContentPrimitive } from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

const Accordion = AccordionRoot;

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionItemPrimitive>,
  React.ComponentPropsWithoutRef<typeof AccordionItemPrimitive>
>(({ className, ...props }, ref) => (
  <AccordionItemPrimitive ref={ref} className={cn("border-b", className)} {...props} />
));
AccordionItem.displayName = "AccordionItem";

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionTriggerPrimitive>,
  React.ComponentPropsWithoutRef<typeof AccordionTriggerPrimitive>
>(({ className, children, ...props }, ref) => (
  <AccordionHeader className="flex">
    <AccordionTriggerPrimitive
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
    </AccordionTriggerPrimitive>
  </AccordionHeader>
));
AccordionTrigger.displayName = AccordionTriggerPrimitive.displayName;

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionContentPrimitive>,
  React.ComponentPropsWithoutRef<typeof AccordionContentPrimitive>
>(({ className, children, ...props }, ref) => (
  <AccordionContentPrimitive
    ref={ref}
    className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn("pb-4 pt-0", className)}>{children}</div>
  </AccordionContentPrimitive>
));

AccordionContent.displayName = AccordionContentPrimitive.displayName;

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
