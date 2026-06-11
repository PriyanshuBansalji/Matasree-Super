const fs = require('fs');
const path = require('path');

// Define all remaining files that need fixing
const filesToFix = {
  'form.tsx': {
    oldImport: 'import * as LabelPrimitive from "@radix-ui/react-label";',
    newImport: 'import { Root as LabelRoot } from "@radix-ui/react-label";',
    replacements: [
      { old: 'typeof LabelPrimitive.Root', new: 'typeof LabelRoot' }
    ]
  },
  'hover-card.tsx': {
    oldImport: 'import * as HoverCardPrimitive from "@radix-ui/react-hover-card";',
    newImport: 'import { Root as HoverCardRoot, Trigger as HoverCardTriggerPrimitive, Content as HoverCardContentPrimitive } from "@radix-ui/react-hover-card";',
    replacements: [
      { old: 'const HoverCard = HoverCardPrimitive.Root;', new: 'const HoverCard = HoverCardRoot;' },
      { old: 'const HoverCardTrigger = HoverCardPrimitive.Trigger;', new: 'const HoverCardTrigger = HoverCardTriggerPrimitive;' },
      { old: 'typeof HoverCardPrimitive.Content', new: 'typeof HoverCardContentPrimitive' },
      { old: '<HoverCardPrimitive.Content', new: '<HoverCardContentPrimitive' },
      { old: 'HoverCardPrimitive.Trigger', new: 'HoverCardTriggerPrimitive' }
    ]
  },
  'popover.tsx': {
    oldImport: 'import * as PopoverPrimitive from "@radix-ui/react-popover";',
    newImport: 'import { Root as PopoverRoot, Trigger as PopoverTriggerPrimitive, Content as PopoverContentPrimitive, Anchor as PopoverAnchorPrimitive } from "@radix-ui/react-popover";',
    replacements: [
      { old: 'const Popover = PopoverPrimitive.Root;', new: 'const Popover = PopoverRoot;' },
      { old: 'const PopoverTrigger = PopoverPrimitive.Trigger;', new: 'const PopoverTrigger = PopoverTriggerPrimitive;' },
      { old: 'typeof PopoverPrimitive.Content', new: 'typeof PopoverContentPrimitive' },
      { old: '<PopoverPrimitive.Content', new: '<PopoverContentPrimitive' },
      { old: 'PopoverPrimitive.Anchor', new: 'PopoverAnchorPrimitive' }
    ]
  }
};

const uiDir = path.join(__dirname, 'matasree-superstore-main', 'src', 'components', 'ui');

Object.entries(filesToFix).forEach(([filename, fixConfig]) => {
  const filepath = path.join(uiDir, filename);
  
  if (!fs.existsSync(filepath)) {
    console.log(`⚠️  ${filename} not found`);
    return;
  }
  
  try {
    let content = fs.readFileSync(filepath, 'utf8');
    
    // Replace import
    content = content.replace(fixConfig.oldImport, fixConfig.newImport);
    
    // Apply other replacements
    fixConfig.replacements.forEach(rep => {
      content = content.replace(new RegExp(rep.old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), rep.new);
    });
    
    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`✓ ${filename} fixed`);
  } catch (error) {
    console.error(`✗ Error fixing ${filename}:`, error.message);
  }
});

console.log('\nTree-shaking import fixes complete!');
