# Script to fix tree-shaking imports for @radix-ui components

$uiComponentDir = "src/components/ui"

# Define replacements for each file
$replacements = @(
    @{
        file = "form.tsx"
        oldImport = 'import * as LabelPrimitive from "@radix-ui/react-label";'
        newImport = 'import { Root as LabelRoot } from "@radix-ui/react-label";'
        replacements = @(
            @{ old = "React.ElementRef<typeof LabelPrimitive.Root>"; new = "React.ElementRef<typeof LabelRoot>" },
            @{ old = "React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>"; new = "React.ComponentPropsWithoutRef<typeof LabelRoot>" }
        )
    },
    @{
        file = "hover-card.tsx"
        oldImport = 'import * as HoverCardPrimitive from "@radix-ui/react-hover-card";'
        newImport = 'import { Root as HoverCardRoot, Trigger as HoverCardTriggerPrimitive, Content as HoverCardContentPrimitive } from "@radix-ui/react-hover-card";'
        replacements = @(
            @{ old = 'const HoverCard = HoverCardPrimitive.Root;'; new = 'const HoverCard = HoverCardRoot;' },
            @{ old = 'const HoverCardTrigger = HoverCardPrimitive.Trigger;'; new = 'const HoverCardTrigger = HoverCardTriggerPrimitive;' }
        )
    },
    @{
        file = "popover.tsx"
        oldImport = 'import * as PopoverPrimitive from "@radix-ui/react-popover";'
        newImport = 'import { Root as PopoverRoot, Trigger as PopoverTriggerPrimitive, Content as PopoverContentPrimitive, Anchor as PopoverAnchorPrimitive } from "@radix-ui/react-popover";'
        replacements = @(
            @{ old = 'const Popover = PopoverPrimitive.Root;'; new = 'const Popover = PopoverRoot;' }
        )
    },
    @{
        file = "menubar.tsx"
        oldImport = 'import * as MenubarPrimitive from "@radix-ui/react-menubar";'
        newImport = 'import { Root as MenubarRoot, Menu as MenubarMenuPrimitive, Group as MenubarGroupPrimitive, Portal as MenubarPortalPrimitive, Sub as MenubarSubPrimitive, RadioGroup as MenubarRadioGroupPrimitive, SubTrigger as MenubarSubTriggerPrimitive, SubContent as MenubarSubContentPrimitive, Content as MenubarContentPrimitive, Item as MenubarItemPrimitive, CheckboxItem as MenubarCheckboxItemPrimitive, RadioItem as MenubarRadioItemPrimitive, Label as MenubarLabelPrimitive, Separator as MenubarSeparatorPrimitive, Trigger as MenubarTriggerPrimitive, ItemIndicator as MenubarItemIndicator } from "@radix-ui/react-menubar";'
        replacements = @()
    }
)

foreach ($replacement in $replacements) {
    $filepath = Join-Path $uiComponentDir $replacement.file
    
    if (Test-Path $filepath) {
        Write-Host "Processing $($replacement.file)..."
        $content = Get-Content $filepath -Raw
        
        # Replace import statement
        $content = $content -replace [regex]::Escape($replacement.oldImport), $replacement.newImport
        
        # Apply additional replacements
        foreach ($rep in $replacement.replacements) {
            $content = $content -replace [regex]::Escape($rep.old), $rep.new
        }
        
        Set-Content $filepath $content
        Write-Host "  ✓ Updated"
    }
}

Write-Host "Done!"
