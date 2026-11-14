const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log(' VERIFYING LANDING PAGE HOME COMPONENTS');
console.log('================================================================\n');

const homeDir = path.join(__dirname, 'src/components/home');
const indexFile = path.join(__dirname, 'src/pages/Index.tsx');

let total = 0;
let passed = 0;

function assert(description, condition) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✅ [PASS] ${description}`);
  } else {
    console.error(`  ❌ [FAIL] ${description}`);
  }
}

// 1. Check RecipeDishMatcher file & export
const recipePath = path.join(homeDir, 'RecipeDishMatcher.tsx');
const recipeExists = fs.existsSync(recipePath);
const recipeContent = recipeExists ? fs.readFileSync(recipePath, 'utf8') : '';
assert('RecipeDishMatcher.tsx exists in src/components/home', recipeExists);
assert('RecipeDishMatcher exports RecipeDishMatcher component', recipeContent.includes('export const RecipeDishMatcher'));
assert('RecipeDishMatcher includes Cart Store integration (useCartStore)', recipeContent.includes('useCartStore'));

// 2. Check SpiceHeatMeterSection file & export
const heatPath = path.join(homeDir, 'SpiceHeatMeterSection.tsx');
const heatExists = fs.existsSync(heatPath);
const heatContent = heatExists ? fs.readFileSync(heatPath, 'utf8') : '';
assert('SpiceHeatMeterSection.tsx exists in src/components/home', heatExists);
assert('SpiceHeatMeterSection exports SpiceHeatMeterSection component', heatContent.includes('export const SpiceHeatMeterSection'));
assert('SpiceHeatMeterSection includes Heat Level Filter state', heatContent.includes('selectedHeat'));

// 3. Check Index.tsx imports and rendering
const indexContent = fs.readFileSync(indexFile, 'utf8');
assert('Index.tsx imports RecipeDishMatcher', indexContent.includes("import { RecipeDishMatcher } from '@/components/home/RecipeDishMatcher'"));
assert('Index.tsx imports SpiceHeatMeterSection', indexContent.includes("import { SpiceHeatMeterSection } from '@/components/home/SpiceHeatMeterSection'"));
assert('Index.tsx renders <SpiceHeatMeterSection />', indexContent.includes('<SpiceHeatMeterSection />'));
assert('Index.tsx renders <RecipeDishMatcher />', indexContent.includes('<RecipeDishMatcher />'));

// 4. Verify all files in src/components/home
const files = fs.readdirSync(homeDir);
console.log(`\n  ℹ️  Found ${files.length} home components in src/components/home:`);
files.forEach(f => console.log(`     • ${f}`));

console.log('\n================================================================');
console.log(` VERIFICATION SUMMARY: Passed ${passed} / ${total}`);
console.log('================================================================\n');

if (passed < total) process.exit(1);
