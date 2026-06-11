const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src/components/ui');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  // Match `import * as X from "Y"`
  const regex = /import\s+\*\s+as\s+(\w+)\s+from\s+["'](@radix-ui\/.*?|recharts)["'];?/g;
  
  let match;
  while ((match = regex.exec(originalContent)) !== null) {
    const importStatement = match[0];
    const identifier = match[1];
    const moduleName = match[2];
    
    // Find usages of identifier.X
    // This could be something like AccordionPrimitive.Root or RechartsPrimitive.LegendProps
    const usageRegex = new RegExp(`${identifier}\\.([A-Za-z0-9_]+)`, 'g');
    const usedProperties = new Set();
    let usageMatch;
    while ((usageMatch = usageRegex.exec(originalContent)) !== null) {
      usedProperties.add(usageMatch[1]);
    }
    
    const usedPropsArray = Array.from(usedProperties).sort();
    if (usedPropsArray.length > 0) {
      // For types, we might want to just import them normally or as types, but regular import is fine for both in TypeScript mostly unless `isolatedModules` complains, but let's just use regular import.
      const newImport = `import { ${usedPropsArray.join(', ')} } from "${moduleName}";`;
      content = content.replace(importStatement, newImport);
      content = content.replace(new RegExp(`${identifier}\\.`, 'g'), '');
    } else {
      // If none used, maybe just remove the import
      content = content.replace(importStatement, '');
    }
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}
