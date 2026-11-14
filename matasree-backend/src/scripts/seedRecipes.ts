import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Recipe, { IRecipe } from '../models/Recipe';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/matasree';
    console.log(`Connecting to MongoDB for recipe seeding: ${uri}`);
    await mongoose.connect(uri);
    console.log('MongoDB Connected successfully!');
  } catch (error: any) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export const recipesData: Partial<IRecipe>[] = [
  // ==========================================
  // NORTH INDIAN RECIPES (40 Recipes)
  // ==========================================
  {
    title: 'Royal Shahi Paneer',
    description: 'A rich and luxurious Mughlai curry featuring soft cottage cheese cubes simmered in a velvety cashew-tomato gravy infused with aromatic royal spices.',
    ingredients: ['250g Paneer (Cottage Cheese), cubed', '2 tbsp Matasree Royal Shahi Garam Masala', '1 tsp Matasree Super Lal Tadka Mirch Powder', '1/2 tsp Matasree Pure Hing', '1/2 cup Cashew Paste', '1 cup Fresh Tomato Puree', '2 tbsp Ghee', '1/2 cup Fresh Cream', 'Salt to taste'],
    steps: ['Heat ghee in a pan and add a pinch of Matasree Pure Hing.', 'Add fresh tomato puree and cook until ghee separates.', 'Stir in cashew paste, Matasree Royal Shahi Garam Masala, and red chilli powder.', 'Add 1/2 cup water, bring to a simmer, and stir in paneer cubes.', 'Finish with fresh cream and simmer for 3 minutes before serving hot with naan.'],
    productTags: ['garam masala', 'shahi', 'hing', 'chilli'],
    region: 'North Indian',
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Artisanal Dal Makhani',
    description: 'Slow-cooked whole black lentils and kidney beans simmered overnight with butter, cream, and hand-ground Himalayan spices.',
    ingredients: ['1 cup Whole Black Urad Dal (soaked overnight)', '1/4 cup Rajma (Kidney Beans)', '2 tbsp Matasree Kitchen King All-Purpose Masala', '1 tsp Matasree Pure Hing', '1 tbsp Matasree Kasoori Methi', '3 tbsp White Butter', '1/2 cup Cream', '1 cup Tomato Puree'],
    steps: ['Pressure cook black dal and rajma with salt and water for 6-7 whistles until soft.', 'Mash slightly with a ladle to release starches.', 'In a deep pan, melt butter and add Matasree Pure Hing and tomato puree.', 'Add Matasree Kitchen King Masala and cook till fragrant.', 'Pour in cooked dal, simmer on low heat for 45 minutes, crushed Matasree Kasoori Methi and cream.'],
    productTags: ['kitchen king', 'kasoori methi', 'hing'],
    region: 'North Indian',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Classic Punjabi Chana Masala',
    description: 'Tangy and spicy chickpea curry prepared with tea-steeped chickpeas and aromatic ground spices.',
    ingredients: ['2 cups Kabuli Chana (soaked overnight)', '2 tbsp Matasree Chaat Masala Special', '1 tbsp Matasree Royal Shahi Garam Masala', '1 tsp Matasree Super Lal Tadka Mirch Powder', '1 tsp Amchur (Dry Mango Powder)', '2 Black Tea Bags', '2 Finely chopped Onions', '1 cup Tomato Puree'],
    steps: ['Boil chickpeas with tea bags and salt until tender.', 'Heat oil, add chopped onions and sauté till dark golden brown.', 'Add tomato puree, Matasree Super Lal Tadka Mirch Powder, and Matasree Chaat Masala Special.', 'Add boiled chickpeas with broth, stir in Matasree Royal Shahi Garam Masala.', 'Simmer until gravy thickens and garnish with ginger juliennes.'],
    productTags: ['chaat', 'garam masala', 'chilli'],
    region: 'North Indian',
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Punjabi Rajma Masala',
    description: 'Comforting red kidney bean curry slow-cooked in a rich spiced onion-tomato gravy, perfect with steamed basmati rice.',
    ingredients: ['1.5 cups Kashmiri Rajma', '1.5 tbsp Matasree Kitchen King All-Purpose Masala', '1 tsp Matasree Super Lal Tadka Mirch Powder', '1/2 tsp Matasree Pure Hing', '2 chopped Onions', '3 Pureed Tomatoes', '1 tbsp Ginger-Garlic Paste', '2 tbsp Ghee'],
    steps: ['Pressure cook soaked rajma until melt-in-mouth tender.', 'Heat ghee, add Matasree Pure Hing and sauté ginger-garlic paste with onions.', 'Add tomato puree and cook until oil releases.', 'Mix in Matasree Kitchen King All-Purpose Masala and red chilli powder.', 'Combine with cooked rajma and simmer for 20 minutes to absorb flavors.'],
    productTags: ['kitchen king', 'hing', 'chilli'],
    region: 'North Indian',
    image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Kadai Paneer Special',
    description: 'Cottage cheese and colorful bell peppers tossed in a coarsely ground fragrant roasted coriander-chilli spice mix.',
    ingredients: ['300g Paneer cubes', '1 Green Bell Pepper, cubed', '1 Red Bell Pepper, cubed', '1.5 tbsp Matasree Sampuran Masala', '1 tsp Matasree Kasoori Methi', '1 tsp Matasree Super Lal Tadka Mirch Powder', '2 tbsp Ghee', '1 cup Tomato Puree'],
    steps: ['Dry roast coarsely ground spices or use Matasree Sampuran Masala for authentic taste.', 'Sauté cubed bell peppers and paneer in ghee for 2 minutes and remove.', 'Add tomato puree to remaining ghee and cook with Matasree Super Lal Tadka Mirch Powder.', 'Stir in sautéed veggies, paneer, and Matasree Sampuran Masala.', 'Crush Matasree Kasoori Methi over top and serve sizzling.'],
    productTags: ['sampuran', 'kasoori methi', 'chilli'],
    region: 'North Indian',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Restaurant Style Malai Kofta',
    description: 'Melt-in-your-mouth fried cottage cheese and potato dumplings served over a rich cream and cashew gravy.',
    ingredients: ['200g Paneer, grated', '2 Boiled Potatoes, mashed', '2 tbsp Matasree Royal Shahi Garam Masala', '1/2 cup Cashew Paste', '1/2 cup Milk Cream', '2 tbsp Cornflour', 'Oil for frying', 'Salt & Sugar to taste'],
    steps: ['Mix paneer, potato, cornflour, salt, and a pinch of Matasree Royal Shahi Garam Masala into dough balls.', 'Deep fry koftas till golden brown.', 'Prepare a silky gravy with tomato, cashew paste, cream, and Matasree Royal Shahi Garam Masala.', 'Place fried koftas in serving dish and pour warm gravy right before serving.'],
    productTags: ['garam masala', 'shahi'],
    region: 'North Indian',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Kashmiri Dum Aloo',
    description: 'Golden baby potatoes pricked and simmered in a fennel and dry ginger infused yoghurt gravy with deep red chilli color.',
    ingredients: ['500g Baby Potatoes (boiled & peeled)', '2 tbsp Matasree Super Lal Tadka Mirch Powder', '1 tbsp Fennel Powder', '1 tsp Dry Ginger Powder (Sonth)', '1 cup Thick Curd (whisked)', '1/2 tsp Matasree Pure Hing', 'Mustard Oil for deep frying'],
    steps: ['Prick baby potatoes with fork and deep fry in mustard oil till crisp.', 'Whisk curd with Matasree Super Lal Tadka Mirch Powder, fennel, sonth, and salt.', 'Heat 2 tbsp oil, add Matasree Pure Hing, then pour whisked yoghurt mixture while continuously stirring.', 'Add fried potatoes, cover pan with foil/dough seal and cook on low heat (dum) for 20 mins.'],
    productTags: ['chilli', 'hing'],
    region: 'North Indian',
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Delhi Style Butter Chicken',
    description: 'Iconic Delhi style tender chicken tikka simmered in a velvet tomato butter sauce spiked with fenugreek leaves.',
    ingredients: ['600g Chicken thighs, marinated & roasted', '2 tbsp Matasree Meat Masala Special', '1 tbsp Matasree Kasoori Methi', '1 tsp Matasree Super Lal Tadka Mirch Powder', '100g Butter', '1.5 cups Tomato Puree', '1/2 cup Heavy Cream'],
    steps: ['Melt half the butter, add tomato puree and Matasree Super Lal Tadka Mirch Powder.', 'Add Matasree Meat Masala Special and let gravy cook down.', 'Stir in cream, remaining butter, and roasted chicken tikka.', 'Simmer for 10 mins and finish with crushed Matasree Kasoori Methi.'],
    productTags: ['meat masala', 'kasoori methi', 'chilli'],
    region: 'North Indian',
    image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Royal Mutton Rogan Josh',
    description: 'Aromatic Kashmiri mutton curry cooked with ratanjot and traditional Dehradun spices.',
    ingredients: ['750g Mutton pieces', '2 tbsp Matasree Meat Masala Special', '1 tsp Matasree Pure Hing', '1 cup Curd', '1 tbsp Kashmiri Red Chilli Powder', '1 tsp Ginger Powder', ' Mustard oil'],
    steps: ['Sear mutton in mustard oil with Matasree Pure Hing.', 'Add beaten curd along with Kashmiri chilli and ginger powder.', 'Add Matasree Meat Masala Special and slow cook covered until meat is tender.', 'Garnish with fresh coriander.'],
    productTags: ['meat masala', 'hing'],
    region: 'North Indian',
    image: 'https://images.unsplash.com/photo-1545247181-516773cae754?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Punjabi Bhindi Masala',
    description: 'Crispy fried okra tossed with crunchy onions, tomatoes, and dry mango spice powder.',
    ingredients: ['300g Bhindi (Okra), washed & sliced', '1.5 tbsp Matasree Chaat Masala Special', '1 tsp Matasree Super Lal Tadka Mirch Powder', '1/2 tsp Matasree Pure Hing', '1 Onion sliced', '1 Tomato chopped', '3 tbsp Oil'],
    steps: ['Sauté sliced bhindi in oil until non-sticky and slightly crisp, then remove.', 'Add Matasree Pure Hing and sliced onions to the pan, cook till translucent.', 'Add tomato and Matasree Super Lal Tadka Mirch Powder.', 'Return bhindi, sprinkle Matasree Chaat Masala Special, and stir fry for 5 minutes.'],
    productTags: ['chaat', 'chilli', 'hing'],
    region: 'North Indian',
    image: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Aloo Gobi Matar',
    description: 'Classic dry potato, cauliflower, and green pea stir-fry tempered with cumin and turmeric.',
    ingredients: ['1 medium Cauliflower (cut into florets)', '2 Potatoes (cubed)', '1/2 cup Green Peas', '1 tbsp Matasree Kitchen King All-Purpose Masala', '1/2 tsp Matasree Pure Hing', '1 tsp Turmeric', '2 tbsp Mustard Oil'],
    steps: ['Heat mustard oil and crackle cumin seeds with Matasree Pure Hing.', 'Add potatoes and cauliflower florets; cover and cook for 10 minutes on low.', 'Add green peas, turmeric, and Matasree Kitchen King All-Purpose Masala.', 'Cook till vegetables are tender and golden crisp.'],
    productTags: ['kitchen king', 'hing'],
    region: 'North Indian',
    image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Dhaba Style Palak Paneer',
    description: 'Paneer cubes enveloped in a smooth garlic and spinach puree tempered with whole spices.',
    ingredients: ['250g Paneer cubes', '4 cups Fresh Spinach (blanched & pureed)', '1 tbsp Matasree Kitchen King All-Purpose Masala', '1 tsp Matasree Kasoori Methi', '6 Garlic cloves chopped', '2 tbsp Butter'],
    steps: ['Blanch spinach in hot water and blend to a bright green smooth puree.', 'Sauté garlic in butter until fragrant and lightly brown.', 'Add spinach puree, salt, and Matasree Kitchen King All-Purpose Masala.', 'Stir in paneer cubes and finish with crushed Matasree Kasoori Methi.'],
    productTags: ['kitchen king', 'kasoori methi'],
    region: 'North Indian',
    image: 'https://images.unsplash.com/photo-1613292443284-8d10ef9383fe?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Amritsari Chole Gravy',
    description: 'Dark, spicy Amritsari chickpea curry flavored with dried pomegranate seeds and spiced ghee tadka.',
    ingredients: ['2 cups Chickpeas (boiled with tea bag)', '2 tbsp Matasree Chaat Masala Special', '1 tbsp Matasree Sampuran Masala', '1 tsp Anardana (Pomegranate powder)', '2 tbsp Ghee', '1 Ginger julienne'],
    steps: ['Mash a portion of boiled chickpeas to thicken gravy.', 'Heat ghee, add Matasree Sampuran Masala and anardana powder.', 'Add chickpeas, Matasree Chaat Masala Special, and cook till rich and dark.', 'Top with fried green chillies and ginger juliennes.'],
    productTags: ['chaat', 'sampuran'],
    region: 'North Indian',
    image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Matar Paneer Deluxe',
    description: 'Home style green peas and paneer curry in a spiced onion-tomato base.',
    ingredients: ['200g Paneer', '1 cup Sweet Peas', '1 tbsp Matasree Royal Shahi Garam Masala', '1 tsp Matasree Super Lal Tadka Mirch Powder', '1 Onion chopped', '2 Tomato puree'],
    steps: ['Sauté onion paste until golden brown.', 'Add tomato puree, Matasree Super Lal Tadka Mirch Powder, and salt.', 'Add green peas and water; simmer until peas are soft.', 'Add paneer cubes and Matasree Royal Shahi Garam Masala; cook for 5 minutes.'],
    productTags: ['garam masala', 'chilli'],
    region: 'North Indian',
    image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Shahi Chicken Korma',
    description: 'Decadent Mughlai chicken gravy cooked with almond paste, saffron, and fragrant spices.',
    ingredients: ['500g Chicken', '2 tbsp Matasree Meat Masala Special', '1/4 cup Almond paste', '1/2 cup Yoghurt', '1/2 tsp Matasree Pure Hing', '2 tbsp Ghee'],
    steps: ['Marinate chicken in yoghurt and Matasree Meat Masala Special for 30 mins.', 'Heat ghee, add Matasree Pure Hing, and sauté marinated chicken.', 'Pour almond paste and 1/2 cup warm water.', 'Cover and cook on low heat until chicken is tender and gravy is velvety.'],
    productTags: ['meat masala', 'hing'],
    region: 'North Indian',
    image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Veg Kolhapuri Spiced Gravy',
    description: 'Fiery Maharashtrian/North Indian style spicy mixed vegetable curry laden with toasted coconut.',
    ingredients: ['2 cups Mixed Veggies (Carrots, beans, peas, potatoes)', '2 tbsp Matasree Sampuran Masala', '1 tbsp Matasree Super Lal Tadka Mirch Powder', '2 tbsp Desiccated Coconut', '2 tbsp Oil'],
    steps: ['Boil mixed vegetables until half done.', 'Roast coconut until brown and grind to paste.', 'Heat oil, cook tomato onion paste with Matasree Super Lal Tadka Mirch Powder and Matasree Sampuran Masala.', 'Add coconut paste and veggies; simmer for 10 minutes.'],
    productTags: ['sampuran', 'chilli'],
    region: 'North Indian',
    image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Creamy Mushroom Masala',
    description: 'Earthy button mushrooms cooked in a spiced onion, tomato, and cashew gravy.',
    ingredients: ['250g Button Mushrooms, sliced', '1 tbsp Matasree Kitchen King All-Purpose Masala', '1 tsp Matasree Kasoori Methi', '2 tbsp Cashew paste', '1 Onion chopped', '2 tbsp Butter'],
    steps: ['Sauté sliced mushrooms in butter till golden, set aside.', 'Cook onion-tomato paste with Matasree Kitchen King All-Purpose Masala.', 'Add cashew paste and 1/2 cup water to form smooth gravy.', 'Stir in mushrooms and finish with Matasree Kasoori Methi.'],
    productTags: ['kitchen king', 'kasoori methi'],
    region: 'North Indian',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Navratan Korma Royal',
    description: 'Sweet and mild imperial curry prepared with 9 gems of vegetables, fruits, and nuts in cream.',
    ingredients: ['2 cups Mixed Vegetables & Paneer', '1/4 cup Cashews & Raisins', '1.5 tbsp Matasree Royal Shahi Garam Masala', '1/2 cup Milk Cream', '1 tbsp Ghee'],
    steps: ['Sauté nuts and vegetables in ghee.', 'Prepare gravy with onion paste, milk cream, and Matasree Royal Shahi Garam Masala.', 'Simmer vegetables in cream gravy on low heat.', 'Garnish with pomegranate seeds and silver leaf.'],
    productTags: ['garam masala', 'shahi'],
    region: 'North Indian',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Pindi Chole Special',
    description: 'Dry roasted rustic chickpea preparation cooked without onion and garlic.',
    ingredients: ['2 cups Boiled Chickpeas', '2 tbsp Matasree Chaat Masala Special', '1 tbsp Matasree Sampuran Masala', '1 tsp Amchur', '2 tbsp Ghee', '2 Green Chillies slit'],
    steps: ['Coat boiled chickpeas with Matasree Chaat Masala Special, anardana, and amchur.', 'Heat ghee in pan and add slit green chillies and Matasree Sampuran Masala.', 'Toss chickpeas on high flame until spices adhere into a dark crust.', 'Serve hot with lemon wedges.'],
    productTags: ['chaat', 'sampuran'],
    region: 'North Indian',
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Sarson Ka Saag Tadka',
    description: 'Authentic mustard greens dish tempered with white butter, garlic, and wild mustard seeds.',
    ingredients: ['500g Mustard greens (Sarson)', '200g Spinach (Palak)', '2 tbsp Maize flour (Makki ata)', '1 tsp Matasree Pure Hing', '1 tbsp Matasree Sampuran Masala', '3 tbsp White Butter'],
    steps: ['Boil greens with garlic and green chillies, then blend coarsely.', 'Stir in maize flour and simmer for 30 minutes.', 'Heat white butter, add Matasree Pure Hing and Matasree Sampuran Masala.', 'Pour hot tadka over saag and serve with Makki ki Roti.'],
    productTags: ['hing', 'sampuran'],
    region: 'North Indian',
    image: 'https://images.unsplash.com/photo-1613292443284-8d10ef9383fe?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Smoky Baingan Bharta',
    description: 'Charcoal roasted eggplant mashed and sautéed with green chillies, ginger, and raw mustard oil.',
    ingredients: ['1 Large Eggplant (roasted & peeled)', '1 tbsp Matasree Kitchen King All-Purpose Masala', '1 tsp Matasree Super Lal Tadka Mirch Powder', '1/2 tsp Matasree Pure Hing', '1 Onion chopped', '2 tbsp Mustard oil'],
    steps: ['Roast eggplant over direct flame till skin turns charred. Peel and mash flesh.', 'Heat mustard oil, add Matasree Pure Hing and onions.', 'Add Matasree Super Lal Tadka Mirch Powder and Matasree Kitchen King Masala.', 'Stir in mashed eggplant and cook for 10 minutes.'],
    productTags: ['kitchen king', 'chilli', 'hing'],
    region: 'North Indian',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Paneer Tikka Masala',
    description: 'Char-broiled spiced paneer cubes simmered in a smoky spiced gravy.',
    ingredients: ['250g Paneer tikka pieces', '1.5 tbsp Matasree Royal Shahi Garam Masala', '1 tsp Matasree Kasoori Methi', '1 tsp Matasree Super Lal Tadka Mirch Powder', '1 cup Tomato Puree', '2 tbsp Cream'],
    steps: ['Prepare thick onion-tomato gravy with Matasree Super Lal Tadka Mirch Powder.', 'Add grilled paneer tikka pieces to gravy.', 'Sprinkle Matasree Royal Shahi Garam Masala and Matasree Kasoori Methi.', 'Finish with cream and serve with butter naan.'],
    productTags: ['garam masala', 'kasoori methi', 'chilli'],
    region: 'North Indian',
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Chicken Tikka Gravy',
    description: 'Marinated tandoori chicken tikka chunks cooked in a spicy onion gravy.',
    ingredients: ['500g Chicken Tikka', '2 tbsp Matasree Meat Masala Special', '1 tsp Matasree Super Lal Tadka Mirch Powder', '1 cup Chopped Tomatoes', '2 tbsp Oil'],
    steps: ['Sauté onions and tomatoes with Matasree Super Lal Tadka Mirch Powder.', 'Add Matasree Meat Masala Special and stir cook until oil separates.', 'Add cooked chicken tikka with gravy and simmer for 8 minutes.', 'Garnish with cilantro.'],
    productTags: ['meat masala', 'chilli'],
    region: 'North Indian',
    image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Dhaba Egg Curry Masala',
    description: 'Golden fried hard-boiled eggs cooked in a zesty, rustic dhaba-style gravy.',
    ingredients: ['6 Hard boiled eggs (pricked & fried)', '1.5 tbsp Matasree Kitchen King All-Purpose Masala', '1 tsp Matasree Super Lal Tadka Mirch Powder', '1/2 tsp Matasree Pure Hing', '2 Onions finely chopped', '2 tbsp Oil'],
    steps: ['Fry boiled eggs in oil till skin is blistering golden.', 'In same oil, add Matasree Pure Hing and onions; cook till dark golden.', 'Add tomato paste, Matasree Super Lal Tadka Mirch Powder, and Matasree Kitchen King Masala.', 'Add 1 cup water and fried eggs; simmer for 10 minutes.'],
    productTags: ['kitchen king', 'chilli', 'hing'],
    region: 'North Indian',
    image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Methi Malai Matar',
    description: 'Creamy green peas curry infused with fragrant fresh fenugreek leaves.',
    ingredients: ['1 cup Fresh Fenugreek leaves (chopped)', '1 cup Green Peas', '1 tbsp Matasree Kitchen King All-Purpose Masala', '1/2 cup Fresh Cream', '1/4 cup Cashew paste', '1 tbsp Ghee'],
    steps: ['Sauté fenugreek leaves in ghee for 2 mins.', 'Make cashew-cream gravy with salt and Matasree Kitchen King Masala.', 'Add boiled green peas and sautéed fenugreek leaves.', 'Simmer gently on low flame for 5 minutes.'],
    productTags: ['kitchen king'],
    region: 'North Indian',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Lauki Chana Dal Tadka',
    description: 'Nutritious bottle gourd and Bengal gram lentil curry tempered with hing and ghee.',
    ingredients: ['1 cup Chana Dal (soaked)', '200g Lauki (Bottle Gourd, cubed)', '1 tsp Matasree Pure Hing', '1 tbsp Matasree Kitchen King All-Purpose Masala', '1 tsp Cumin Seeds', '2 tbsp Ghee'],
    steps: ['Pressure cook chana dal and lauki with turmeric and salt.', 'Heat ghee, add cumin seeds and Matasree Pure Hing.', 'Stir in Matasree Kitchen King Masala and pour into cooked dal.', 'Simmer for 5 minutes and serve with chapatis.'],
    productTags: ['hing', 'kitchen king'],
    region: 'North Indian',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Aloo Baingan Masala',
    description: 'Homestyle spiced potato and eggplant stir fry seasoned with digestive asafoetida.',
    ingredients: ['2 Potatoes (cubed)', '2 Eggplants (cubed)', '1/2 tsp Matasree Pure Hing', '1 tbsp Matasree Kitchen King All-Purpose Masala', '1 tsp Matasree Super Lal Tadka Mirch Powder', '2 tbsp Oil'],
    steps: ['Heat oil, add Matasree Pure Hing.', 'Add potatoes and cook for 5 mins.', 'Add eggplant, Matasree Super Lal Tadka Mirch Powder, and Matasree Kitchen King Masala.', 'Cover and cook till vegetables are soft.'],
    productTags: ['hing', 'kitchen king', 'chilli'],
    region: 'North Indian',
    image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Mughlai Chicken Korma',
    description: 'Rich royal chicken gravy seasoned with cardamom, mace, and fried onion paste.',
    ingredients: ['500g Chicken', '2 tbsp Matasree Royal Shahi Garam Masala', '1/2 cup Fried Onion paste (Birista)', '1/2 cup Curd', '2 tbsp Ghee'],
    steps: ['Marinate chicken with curd and Matasree Royal Shahi Garam Masala.', 'Heat ghee, add fried onion paste and marinated chicken.', 'Cook on low flame till gravy turns thick and aromatic.', 'Garnish with almonds.'],
    productTags: ['garam masala', 'shahi'],
    region: 'North Indian',
    image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Gobhi Musallam',
    description: 'Whole roasted cauliflower head coated in a thick royal spiced tomato gravy.',
    ingredients: ['1 Whole Cauliflower head (blanched)', '2 tbsp Matasree Royal Shahi Garam Masala', '1 tsp Matasree Super Lal Tadka Mirch Powder', '1 cup Tomato puree', '2 tbsp Ghee'],
    steps: ['Blanch whole cauliflower in salted water.', 'Prepare thick gravy with ghee, tomato puree, Matasree Super Lal Tadka Mirch Powder, and Matasree Royal Shahi Garam Masala.', 'Coat cauliflower with gravy and bake/roast for 20 minutes.'],
    productTags: ['garam masala', 'chilli'],
    region: 'North Indian',
    image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Paneer Do Pyaza',
    description: 'Paneer cooked with double the onions—both caramelized paste and crunchy petals.',
    ingredients: ['250g Paneer', '2 Onions (1 paste, 1 petals)', '1 tbsp Matasree Kitchen King All-Purpose Masala', '1 tsp Matasree Kasoori Methi', '2 tbsp Ghee'],
    steps: ['Sauté onion paste till brown, add spices and tomato.', 'Add onion petals and paneer cubes.', 'Toss in Matasree Kitchen King Masala and Matasree Kasoori Methi.', 'Serve hot with parathas.'],
    productTags: ['kitchen king', 'kasoori methi'],
    region: 'North Indian',
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Dhaba Style Chicken Curry',
    description: 'Rustic roadside style chicken curry spiced with coarseness and fresh ginger.',
    ingredients: ['600g Chicken', '2 tbsp Matasree Meat Masala Special', '1 tbsp Matasree Super Lal Tadka Mirch Powder', '2 Onions chopped', '2 tbsp Mustard oil'],
    steps: ['Sauté onions in mustard oil till dark brown.', 'Add chicken and sear on high heat.', 'Add Matasree Super Lal Tadka Mirch Powder and Matasree Meat Masala Special.', 'Add water and cook till meat falls off the bone.'],
    productTags: ['meat masala', 'chilli'],
    region: 'North Indian',
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Chatpata Jeera Aloo',
    description: 'Crispy cumin-seasoned potatoes spiked with tangy dry mango powder and green chillies.',
    ingredients: ['4 Boiled potatoes (cubed)', '1 tbsp Cumin seeds', '1.5 tbsp Matasree Chaat Masala Special', '1/2 tsp Matasree Pure Hing', '2 tbsp Ghee'],
    steps: ['Heat ghee, add cumin seeds and Matasree Pure Hing.', 'Add boiled potato cubes and fry till golden brown crust forms.', 'Sprinkle Matasree Chaat Masala Special and toss well.'],
    productTags: ['chaat', 'hing'],
    region: 'North Indian',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Corn Palak Creamy Curry',
    description: 'Sweet corn kernels cooked in a garlic-scented spinach gravy.',
    ingredients: ['1 cup Sweet Corn kernels', '3 cups Spinach puree', '1 tbsp Matasree Kitchen King All-Purpose Masala', '1 tsp Matasree Kasoori Methi', '2 tbsp Butter'],
    steps: ['Boil sweet corn kernels.', 'Sauté spinach puree with butter, garlic, and Matasree Kitchen King Masala.', 'Stir in sweet corn and Matasree Kasoori Methi.', 'Serve hot with garlic naan.'],
    productTags: ['kitchen king', 'kasoori methi'],
    region: 'North Indian',
    image: 'https://images.unsplash.com/photo-1613292443284-8d10ef9383fe?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Veg Jalfrezi',
    description: 'Stir-fried batons of vegetables coated in a tangy, spicy tomato sauce.',
    ingredients: ['2 cups Mixed Veggie strips (Carrots, capsicum, paneer)', '1 tbsp Matasree Kitchen King All-Purpose Masala', '1 tsp Matasree Super Lal Tadka Mirch Powder', '1 tbsp Tomato ketchup', '2 tbsp Oil'],
    steps: ['High-flame stir fry vegetable strips.', 'Add tomato paste, ketchup, Matasree Super Lal Tadka Mirch Powder, and Matasree Kitchen King Masala.', 'Toss until veggies are coated yet crunchy.'],
    productTags: ['kitchen king', 'chilli'],
    region: 'North Indian',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Stuffed Paneer Pasanda',
    description: 'Paneer sandwiches stuffed with nuts and dry fruits simmered in a golden gravy.',
    ingredients: ['300g Paneer slabs', '2 tbsp Chopped nuts & raisins', '1.5 tbsp Matasree Royal Shahi Garam Masala', '1/2 cup Cashew cream gravy', 'Ghee for shallow frying'],
    steps: ['Stuff paneer slabs with nuts, coat in cornflour, and shallow fry.', 'Prepare cashew gravy with Matasree Royal Shahi Garam Masala.', 'Place paneer sandwiches in serving dish and pour gravy.'],
    productTags: ['garam masala', 'shahi'],
    region: 'North Indian',
    image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Handi Chicken Curry',
    description: 'Clay pot cooked chicken with whole spices, tomatoes, and fresh coriander.',
    ingredients: ['600g Chicken', '2 tbsp Matasree Meat Masala Special', '1/2 tsp Matasree Pure Hing', '1 cup Chopped tomatoes', '2 tbsp Ghee'],
    steps: ['In a clay pot, heat ghee and add Matasree Pure Hing.', 'Add chicken, tomatoes, and Matasree Meat Masala Special.', 'Seal pot and cook on low heat for 30 minutes.'],
    productTags: ['meat masala', 'hing'],
    region: 'North Indian',
    image: 'https://images.unsplash.com/photo-1545247181-516773cae754?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Dhaba Dal Tadka',
    description: 'Yellow arhar lentils tempered with ghee, cumin, garlic, and Kashmiri red chilli.',
    ingredients: ['1 cup Toor/Arhar Dal', '1 tsp Matasree Pure Hing', '1 tsp Matasree Super Lal Tadka Mirch Powder', '1 tbsp Ghee', '4 Garlic cloves'],
    steps: ['Pressure cook yellow dal with salt and turmeric.', 'In a small tadka pan, heat ghee, add Matasree Pure Hing, sliced garlic, and red chilli powder.', 'Pour sizzing tadka over hot dal.'],
    productTags: ['hing', 'chilli'],
    region: 'North Indian',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Punjabi Kadhi Pakora',
    description: 'Crispy onion-gram flour fritters immersed in a tangy spiced yogurt-besan gravy.',
    ingredients: ['1 cup Besan (Gram flour)', '1.5 cups Sour curd', '1 tsp Matasree Pure Hing', '1 tbsp Matasree Sampuran Masala', '1 tsp Methi seeds', 'Oil for frying'],
    steps: ['Make pakoras with besan, onion, salt, and deep fry.', 'Whisk curd and besan with water; cook till thick.', 'Add Matasree Pure Hing, methi seeds, and Matasree Sampuran Masala into gravy.', 'Drop pakoras into kadhi and simmer.'],
    productTags: ['hing', 'sampuran'],
    region: 'North Indian',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Soya Chaap Masala',
    description: 'Succulent soya protein chops marinated and cooked in a rich spiced gravy.',
    ingredients: ['4 Soya Chaap sticks (boiled & fried)', '1.5 tbsp Matasree Meat Masala Special', '1 tsp Matasree Kasoori Methi', '1 cup Onion-tomato gravy', '2 tbsp Butter'],
    steps: ['Cut fried soya chaap into pieces.', 'Cook onion tomato gravy with Matasree Meat Masala Special.', 'Stir in soya chaap pieces and simmer.', 'Finish with Matasree Kasoori Methi.'],
    productTags: ['meat masala', 'kasoori methi'],
    region: 'North Indian',
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Mushroom Matar Masala',
    description: 'Tender mushrooms and sweet green peas simmered in a spiced tomato onion curry.',
    ingredients: ['200g Mushrooms', '1/2 cup Green Peas', '1 tbsp Matasree Kitchen King All-Purpose Masala', '1 tsp Matasree Super Lal Tadka Mirch Powder', '2 tbsp Oil'],
    steps: ['Sauté mushrooms and green peas.', 'Prepare tomato gravy with Matasree Super Lal Tadka Mirch Powder and Matasree Kitchen King Masala.', 'Combine mushrooms, peas, and gravy.', 'Simmer for 8 minutes.'],
    productTags: ['kitchen king', 'chilli'],
    region: 'North Indian',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800'
  },

  // ==========================================
  // SOUTH INDIAN RECIPES (35 Recipes)
  // ==========================================
  {
    title: 'Chettinad Chicken Curry',
    description: 'A fiery and aromatic Tamil Nadu specialty made with freshly roasted black pepper, star anise, and curry leaves.',
    ingredients: ['600g Chicken pieces', '2 tbsp Matasree Sampuran Masala', '1 tbsp Matasree Super Lal Tadka Mirch Powder', '1/2 tsp Matasree Pure Hing', '1 cup Shallots (Small onions)', '10 Curry leaves', '2 tbsp Sesame oil'],
    steps: ['Heat sesame oil, crackle mustard seeds, Matasree Pure Hing, and curry leaves.', 'Add shallots and sauté till golden.', 'Add chicken pieces and sear.', 'Stir in Matasree Super Lal Tadka Mirch Powder and Matasree Sampuran Masala.', 'Add 1 cup water, cover and cook until tender.'],
    productTags: ['sampuran', 'chilli', 'hing'],
    region: 'South Indian',
    image: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Traditional Hotel Sambar',
    description: 'Aromatic lentil and vegetable stew brewed with tamarind pulp, roasted spices, and fresh curry leaf temperings.',
    ingredients: ['1 cup Toor Dal (boiled & mashed)', '1 cup Mixed Veggies (Drumstick, pumpkin, shallots)', '2 tbsp Matasree Sampuran Masala', '1 tsp Matasree Pure Hing', '2 tbsp Tamarind extract', '2 tbsp Gingelly oil'],
    steps: ['Boil vegetables in tamarind water with salt until tender.', 'Add boiled toor dal and Matasree Sampuran Masala.', 'Temper mustard seeds, dried red chillies, and Matasree Pure Hing in oil.', 'Pour hot temperings over sambar and boil for 5 minutes.'],
    productTags: ['sampuran', 'hing'],
    region: 'South Indian',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Pepper Garlic Rasam',
    description: 'Tangy and medicinal south Indian soup seasoned with black pepper, garlic, cumin, and hing.',
    ingredients: ['2 Tomatoes (mashed)', '1 tbsp Tamarind juice', '1 tsp Crushed Black Pepper', '1 tsp Cumin seeds', '6 Garlic cloves crushed', '1/2 tsp Matasree Pure Hing', '1 tbsp Ghee'],
    steps: ['Boil tomato puree and tamarind juice with salt and turmeric.', 'Crush black pepper, cumin, and garlic.', 'In ghee, add mustard seeds, curry leaves, and Matasree Pure Hing.', 'Stir in crushed spices and tomato broth; bring to a single froth.'],
    productTags: ['hing'],
    region: 'South Indian',
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Hyderabadi Dum Chicken Gravy',
    description: 'Slow-cooked rich Hyderabadi style chicken gravy made with fried onions, curd, and mint.',
    ingredients: ['700g Chicken', '2 tbsp Matasree Meat Masala Special', '1 tsp Matasree Royal Shahi Garam Masala', '1 cup Fried Onions', '1/2 cup Whisked Curd', 'Mint leaves'],
    steps: ['Marinate chicken with curd, fried onions, and Matasree Meat Masala Special.', 'Seal pan with dough and cook on dum (slow flame) for 35 mins.', 'Unseal and finish with Matasree Royal Shahi Garam Masala.'],
    productTags: ['meat masala', 'garam masala'],
    region: 'South Indian',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Kerala Avial',
    description: 'Traditional mixed vegetable stew cooked in ground coconut, green chillies, and raw coconut oil.',
    ingredients: ['2 cups Mixed Veggies (Raw banana, drumstick, carrot, beans)', '1 cup Ground coconut paste', '1/2 cup Curd', '1/2 tsp Matasree Pure Hing', '2 tbsp Coconut oil', 'Curry leaves'],
    steps: ['Steam cut vegetables with salt and turmeric.', 'Add coarse coconut-green chilli paste and cook for 5 mins.', 'Stir in curd and remove from heat.', 'Drizzle raw coconut oil, curry leaves, and Matasree Pure Hing over top.'],
    productTags: ['hing'],
    region: 'South Indian',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Andhra Spicy Chicken Curry',
    description: 'Fiery Andhra style chicken curry with roasted spices and poppy seeds.',
    ingredients: ['600g Chicken', '2 tbsp Matasree Super Lal Tadka Mirch Powder', '1 tbsp Matasree Sampuran Masala', '1 tbsp Poppy seed paste', '2 tbsp Oil'],
    steps: ['Heat oil and sauté onions till golden.', 'Add chicken and fry for 5 mins.', 'Add Matasree Super Lal Tadka Mirch Powder, Matasree Sampuran Masala, and poppy seed paste.', 'Cook covered until tender.'],
    productTags: ['chilli', 'sampuran'],
    region: 'South Indian',
    image: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Coorg Spicy Mushroom Masala',
    description: 'Tangy and peppery mushroom curry styled after Coorg black vinegar and roasted spices.',
    ingredients: ['300g Mushrooms', '1 tbsp Matasree Meat Masala Special', '1 tsp Black Pepper powder', '1 tbsp Tamarind/Kachampuli extract', '2 tbsp Oil'],
    steps: ['Sauté mushrooms until golden.', 'Add Matasree Meat Masala Special and black pepper powder.', 'Stir in tamarind extract and 1/2 cup water.', 'Simmer until thick.'],
    productTags: ['meat masala'],
    region: 'South Indian',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Kerala Fish Curry (Meen Curry)',
    description: 'Red coconut tamarind fish curry cooked in an earthen pot with Kudampuli (Garcinia).',
    ingredients: ['500g Fish steaks', '2 tbsp Matasree Super Lal Tadka Mirch Powder', '1/2 tsp Matasree Pure Hing', '3 Kudampuli (soaked)', '1/2 cup Coconut milk', 'Coconut oil'],
    steps: ['In a clay pot, boil kudampuli water with Matasree Super Lal Tadka Mirch Powder and turmeric.', 'Add fish steaks gently.', 'Pour coconut milk and temper with curry leaves and Matasree Pure Hing in coconut oil.'],
    productTags: ['chilli', 'hing'],
    region: 'South Indian',
    image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Andhra Gutti Vankaya Kura',
    description: 'Small eggplants stuffed with a spicy peanut, sesame, and spice powder cooked in tamarind gravy.',
    ingredients: ['8 Small Brinjals (slit 4 ways)', '2 tbsp Peanut & sesame powder', '1 tbsp Matasree Sampuran Masala', '1/2 tsp Matasree Pure Hing', ' Tamarind pulp'],
    steps: ['Stuff brinjals with peanut-spice mix and Matasree Sampuran Masala.', 'Shallow fry brinjals in oil.', 'Add tamarind pulp and remaining spice paste.', 'Simmer till brinjals are tender.'],
    productTags: ['sampuran', 'hing'],
    region: 'South Indian',
    image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Tangy Kara Kuzhambu',
    description: 'South Indian fiery and sour tamarind curry featuring garlic cloves and small shallots.',
    ingredients: ['15 Garlic cloves', '15 Small Shallots', '2 tbsp Matasree Sampuran Masala', '1/2 tsp Matasree Pure Hing', ' Tamarind juice', 'Sesame oil'],
    steps: ['Sauté garlic and shallots in sesame oil.', 'Pour thick tamarind juice, salt, and Matasree Sampuran Masala.', 'Add Matasree Pure Hing and simmer till oil floats.'],
    productTags: ['sampuran', 'hing'],
    region: 'South Indian',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Mangalorean Chicken Sukka',
    description: 'Dry roasted chicken dish cooked with fresh grated coconut and coastal roasted spices.',
    ingredients: ['600g Chicken', '1 cup Grated coconut', '2 tbsp Matasree Meat Masala Special', '1 tbsp Matasree Super Lal Tadka Mirch Powder', 'Coconut oil'],
    steps: ['Roast grated coconut till brown.', 'Cook chicken with onion, ginger, garlic, and Matasree Super Lal Tadka Mirch Powder.', 'Stir in Matasree Meat Masala Special and roasted coconut.', 'Cook till dry.'],
    productTags: ['meat masala', 'chilli'],
    region: 'South Indian',
    image: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Veg Poriyal Seasoned Gravy',
    description: 'Dry vegetable stir fry tempered with mustard seeds, urad dal, and coconut.',
    ingredients: ['2 cups Chopped Beans & Carrots', '1/2 tsp Matasree Pure Hing', '2 tbsp Grated coconut', '1 tsp Urad dal', '1 tbsp Coconut oil'],
    steps: ['Temper mustard seeds, urad dal, and Matasree Pure Hing in oil.', 'Add chopped vegetables and splash water; cover and cook.', 'Garnish with grated coconut.'],
    productTags: ['hing'],
    region: 'South Indian',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Lemon Rice Spice Gravy',
    description: 'Zesty lemon tempered seasoning mix cooked with peanuts and turmeric.',
    ingredients: ['3 cups Cooked Rice', '1/4 cup Lemon juice', '1/4 cup Roasted Peanuts', '1/2 tsp Matasree Pure Hing', '1 tsp Turmeric', '2 tbsp Oil'],
    steps: ['Temper mustard, peanuts, curry leaves, and Matasree Pure Hing in oil.', 'Add turmeric and turn off heat.', 'Stir in lemon juice and combine with cooked rice.'],
    productTags: ['hing'],
    region: 'South Indian',
    image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Bisi Bele Bath Masala Curry',
    description: 'Karnataka special spicy rice, lentil, and vegetable mash topped with ghee tadka.',
    ingredients: ['1 cup Rice & Toor Dal (boiled together)', '1 cup Mixed Vegetables', '2 tbsp Matasree Sampuran Masala', '1/2 tsp Matasree Pure Hing', ' Tamarind pulp', '2 tbsp Ghee'],
    steps: ['Boil rice, dal, and vegetables together.', 'Add tamarind pulp, salt, and Matasree Sampuran Masala.', 'Temper cashew nuts and Matasree Pure Hing in ghee and mix in.'],
    productTags: ['sampuran', 'hing'],
    region: 'South Indian',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Mysore Veg Saagoo',
    description: 'Mildly spiced coconut vegetable curry served with South Indian set dosa and poori.',
    ingredients: ['2 cups Mixed Veggies', '1/2 cup Ground coconut & roasted gram paste', '1 tbsp Matasree Kitchen King All-Purpose Masala', '1/2 tsp Matasree Pure Hing', 'Oil'],
    steps: ['Boil vegetables.', 'Sauté spice paste with Matasree Pure Hing and Matasree Kitchen King Masala.', 'Add coconut paste and boiled vegetables; simmer for 5 mins.'],
    productTags: ['kitchen king', 'hing'],
    region: 'South Indian',
    image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Mangalorean Fish Curry',
    description: 'Coastal fish curry infused with dried red chillies, coconut, and tamarind.',
    ingredients: ['500g Fish fillets', '2 tbsp Matasree Super Lal Tadka Mirch Powder', '1 cup Ground coconut milk', ' Tamarind paste', 'Coconut oil'],
    steps: ['Blend coconut with Matasree Super Lal Tadka Mirch Powder and coriander.', 'Boil spice paste with tamarind pulp.', 'Add fish fillets and simmer for 6 minutes.'],
    productTags: ['chilli'],
    region: 'South Indian',
    image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Kerala Erissery (Pumpkin & Lentil)',
    description: 'Sweet yellow pumpkin and cowpeas stewed with toasted coconut.',
    ingredients: ['2 cups Yellow Pumpkin (cubed)', '1/2 cup Cowpeas/Vanpayar', '1 cup Toasted ground coconut', '1/2 tsp Matasree Pure Hing', 'Coconut oil'],
    steps: ['Boil pumpkin and cowpeas together.', 'Mash coarse and add coconut paste.', 'Top with coconut fried golden brown with Matasree Pure Hing.'],
    productTags: ['hing'],
    region: 'South Indian',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Creamy Meen Moilee',
    description: 'Mildly spiced fish stew cooked in coconut milk with green chillies and ginger.',
    ingredients: ['4 Fish steaks', '1.5 cups Coconut milk', '1 tbsp Ginger juliennes', '4 Green chillies', '1/2 tsp Matasree Pure Hing', 'Coconut oil'],
    steps: ['Lightly pan fry fish steaks.', 'Sauté ginger, green chillies, and Matasree Pure Hing in oil.', 'Add thin coconut milk and simmer fish. Finish with thick coconut milk.'],
    productTags: ['hing'],
    region: 'South Indian',
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Kuttanad Pepper Fry Gravy',
    description: 'Spicy Kerala backwater style mushroom/chicken pepper roast.',
    ingredients: ['400g Chicken or Mushroom', '2 tbsp Crushed Black Pepper', '1 tbsp Matasree Meat Masala Special', '1/2 tsp Matasree Pure Hing', 'Coconut oil'],
    steps: ['Sear chicken/mushroom in coconut oil with curry leaves.', 'Add Matasree Meat Masala Special and Matasree Pure Hing.', 'Toss in abundant crushed black pepper and roast till dark.'],
    productTags: ['meat masala', 'hing'],
    region: 'South Indian',
    image: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Kerala Egg Roast',
    description: 'Hard boiled eggs tossed in caramelized onion and tomato masala.',
    ingredients: ['4 Boiled eggs', '3 Sliced Onions', '1 tbsp Matasree Super Lal Tadka Mirch Powder', '1 tbsp Matasree Meat Masala Special', 'Coconut oil'],
    steps: ['Caramelize onions slowly in coconut oil.', 'Add Matasree Super Lal Tadka Mirch Powder and Matasree Meat Masala Special.', 'Add boiled eggs and coat thoroughly.'],
    productTags: ['chilli', 'meat masala'],
    region: 'South Indian',
    image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Chettinad Mushroom Masala',
    description: 'Button mushrooms cooked in a sharp roasted peppercorn spice paste.',
    ingredients: ['250g Mushrooms', '1.5 tbsp Matasree Sampuran Masala', '1 tsp Black pepper', '1 Onion chopped', 'Oil'],
    steps: ['Sauté onions till golden.', 'Add mushrooms, Matasree Sampuran Masala, and ground black pepper.', 'Cook until gravy clings to mushrooms.'],
    productTags: ['sampuran'],
    region: 'South Indian',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Malabar Chicken Parotta Gravy',
    description: 'Thick onion tomato coconut chicken curry tailor made for Malabar parotta.',
    ingredients: ['600g Chicken', '2 tbsp Matasree Meat Masala Special', '1/2 cup Coconut milk', '2 Onions chopped', 'Coconut oil'],
    steps: ['Sauté onions and curry leaves in coconut oil.', 'Add chicken and Matasree Meat Masala Special.', 'Simmer with water, then stir in coconut milk.'],
    productTags: ['meat masala'],
    region: 'South Indian',
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'South Indian Pepper Chicken',
    description: 'Dry, spicy chicken fry heavily spiced with black pepper and fennel.',
    ingredients: ['500g Chicken', '1.5 tbsp Crushed Black Pepper', '1 tbsp Matasree Meat Masala Special', '1 tsp Fennel seeds', 'Oil'],
    steps: ['Heat oil, add fennel seeds and curry leaves.', 'Add chicken, Matasree Meat Masala Special, and salt.', 'Roast with crushed black pepper on medium heat.'],
    productTags: ['meat masala'],
    region: 'South Indian',
    image: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Kala Chana Malabar Curry',
    description: 'Black chickpeas cooked in a roasted coconut spice paste.',
    ingredients: ['1.5 cups Kala Chana (boiled)', '1 cup Roasted coconut paste', '1 tbsp Matasree Sampuran Masala', '1/2 tsp Matasree Pure Hing', 'Coconut oil'],
    steps: ['Pressure cook black chickpeas.', 'Roast coconut with spices and grind to paste.', 'Combine cooked chickpeas, coconut paste, Matasree Sampuran Masala, and Matasree Pure Hing.'],
    productTags: ['sampuran', 'hing'],
    region: 'South Indian',
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Andhra Tomato Pappu',
    description: 'Comforting lentil dal made with ripe tomatoes and spicy green chilli tempering.',
    ingredients: ['1 cup Toor Dal', '3 Tomatoes chopped', '1 tsp Matasree Pure Hing', '1 tsp Turmeric', '2 tbsp Ghee'],
    steps: ['Pressure cook dal and tomatoes together.', 'Heat ghee, add mustard, green chillies, and Matasree Pure Hing.', 'Pour tempering into cooked dal.'],
    productTags: ['hing'],
    region: 'South Indian',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Bendakaya Pulusu (Okra Tamarind Curry)',
    description: 'Crispy fried okra simmered in a tangy sweet tamarind sauce.',
    ingredients: ['250g Okra (Bhindi cut into long pieces)', '1/2 cup Tamarind extract', '1 tbsp Matasree Sampuran Masala', '1/2 tsp Matasree Pure Hing', '2 tbsp Oil'],
    steps: ['Shallow fry okra till crisp.', 'Boil tamarind juice with salt, jaggery, and Matasree Sampuran Masala.', 'Add fried okra and temper with Matasree Pure Hing.'],
    productTags: ['sampuran', 'hing'],
    region: 'South Indian',
    image: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Chicken 65 Gravy Style',
    description: 'Crispy fried marinated spicy chicken re-tossed in a zesty red yogurt gravy.',
    ingredients: ['400g Chicken pieces', '1.5 tbsp Matasree Super Lal Tadka Mirch Powder', '1/2 cup Curd', 'Curry leaves', 'Oil for frying'],
    steps: ['Marinate chicken in spices and deep fry.', 'In a wok, heat oil, add garlic, curry leaves, and curd whisked with Matasree Super Lal Tadka Mirch Powder.', 'Toss fried chicken until coated.'],
    productTags: ['chilli'],
    region: 'South Indian',
    image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Udupi Hotel Sambar',
    description: 'Mildly sweet lentil soup flavored with fresh coconut and jaggery.',
    ingredients: ['1 cup Toor dal', '1/2 cup Coconut paste', '1 tbsp Jaggery', '2 tbsp Matasree Sampuran Masala', '1/2 tsp Matasree Pure Hing', 'Ghee'],
    steps: ['Boil dal with vegetables.', 'Stir in coconut paste, jaggery, and Matasree Sampuran Masala.', 'Temper in ghee with mustard and Matasree Pure Hing.'],
    productTags: ['sampuran', 'hing'],
    region: 'South Indian',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Varutharacha Veg Curry',
    description: 'Mixed vegetables cooked in a dark roasted spiced coconut paste.',
    ingredients: ['2 cups Mixed Vegetables', '1 cup Grated coconut (roasted black)', '1 tbsp Matasree Sampuran Masala', 'Coconut oil'],
    steps: ['Roast coconut with spices till dark brown, grind to paste.', 'Boil vegetables.', 'Combine vegetables with roasted paste and Matasree Sampuran Masala.'],
    productTags: ['sampuran'],
    region: 'South Indian',
    image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Ven Pongal Ghee Tadka Gravy',
    description: 'Creamy rice and moong dal porridge topped with cashew ghee tempering.',
    ingredients: ['1/2 cup Rice', '1/2 cup Yellow Moong Dal', '1 tsp Black pepper', '1 tsp Ginger chopped', '1/2 tsp Matasree Pure Hing', '3 tbsp Ghee'],
    steps: ['Pressure cook rice and moong dal together till soft.', 'Heat ghee, add cashews, pepper, ginger, and Matasree Pure Hing.', 'Pour hot ghee mix over pongal.'],
    productTags: ['hing'],
    region: 'South Indian',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Andhra Royyala Kura (Prawn Masala)',
    description: 'Spicy coastal prawn curry prepared with green chillies, ginger, and tomatoes.',
    ingredients: ['400g Prawns (cleaned)', '1.5 tbsp Matasree Super Lal Tadka Mirch Powder', '1 tbsp Matasree Sampuran Masala', '2 Onions chopped', 'Oil'],
    steps: ['Sauté onions and green chillies.', 'Add prawns and sauté for 2 mins.', 'Stir in Matasree Super Lal Tadka Mirch Powder and Matasree Sampuran Masala.', 'Cook for 5 mins till gravy thickens.'],
    productTags: ['chilli', 'sampuran'],
    region: 'South Indian',
    image: 'https://images.unsplash.com/photo-1559742811-822863c46f83?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Madurai Mutton Chukka Gravy',
    description: 'Spicy dry mutton dish cooked with small onions and crushed peppercorns.',
    ingredients: ['500g Mutton', '2 tbsp Matasree Meat Masala Special', '1 tbsp Black pepper', '1 cup Shallots', '2 tbsp Gingelly oil'],
    steps: ['Pressure cook mutton with turmeric.', 'Sauté shallots in gingelly oil.', 'Add cooked mutton, Matasree Meat Masala Special, and black pepper.', 'Fry till semi-dry.'],
    productTags: ['meat masala'],
    region: 'South Indian',
    image: 'https://images.unsplash.com/photo-1545247181-516773cae754?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Kerala Veg Stew',
    description: 'Mildly spiced aromatic coconut milk stew with potatoes, carrots, and whole spices.',
    ingredients: ['2 cups Vegetables (Potato, carrot, beans)', '1.5 cups Coconut milk', '1/2 tsp Matasree Pure Hing', 'Whole green chillies', 'Coconut oil'],
    steps: ['Boil vegetables with green chillies and ginger.', 'Add thin coconut milk and simmer.', 'Finish with thick coconut milk, raw coconut oil, and Matasree Pure Hing.'],
    productTags: ['hing'],
    region: 'South Indian',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Coconut Spicy Veg Curry',
    description: 'Flavorful mixed vegetable curry cooked in coastal spiced coconut paste.',
    ingredients: ['2 cups Vegetables', '1/2 cup Coconut paste', '1 tbsp Matasree Kitchen King All-Purpose Masala', 'Oil'],
    steps: ['Sauté vegetables in oil.', 'Add coconut paste, salt, and Matasree Kitchen King Masala.', 'Simmer with 1 cup water till veggies are cooked.'],
    productTags: ['kitchen king'],
    region: 'South Indian',
    image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Cabbage Chana Kootu',
    description: 'Shredded cabbage and Bengal gram lentils cooked with coconut seasoning.',
    ingredients: ['2 cups Shredded Cabbage', '1/2 cup Chana dal (boiled)', '1/2 tsp Matasree Pure Hing', '2 tbsp Coconut paste', 'Coconut oil'],
    steps: ['Cook cabbage and boiled chana dal together.', 'Stir in ground coconut paste.', 'Temper mustard seeds and Matasree Pure Hing in coconut oil.'],
    productTags: ['hing'],
    region: 'South Indian',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=800'
  },

  // ==========================================
  // BENGALI RECIPES (25 Recipes)
  // ==========================================
  {
    title: 'Kolkata Macher Jhol',
    description: 'Comforting light fish curry cooked with carp, potatoes, raw papaya, and nigella seed tempering.',
    ingredients: ['4 Rohu/Katla Fish steaks', '2 Potatoes (quartered)', '1 tsp Nigella seeds (Kalonji)', '1 tbsp Matasree Sampuran Masala', '1 tsp Matasree Super Lal Tadka Mirch Powder', '3 tbsp Mustard oil'],
    steps: ['Coat fish steaks with turmeric & salt; fry in mustard oil till golden.', 'In remaining oil, add kalonji and slit green chillies.', 'Add potato wedges, Matasree Super Lal Tadka Mirch Powder, and Matasree Sampuran Masala with water.', 'Add fried fish and simmer till potatoes are soft.'],
    productTags: ['sampuran', 'chilli', 'kalonji', 'mustard oil'],
    region: 'Bengali',
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Shorshe Ilish (Mustard Fish)',
    description: 'Classic Bengali Hilsa or Rohu fish cooked in a pungent yellow & black mustard seed paste.',
    ingredients: ['4 Fish steaks', '3 tbsp Mustard paste (Yellow & Black mustard ground)', '1/2 tsp Matasree Pure Hing', '1 tsp Turmeric', '4 Green chillies', '3 tbsp Raw Mustard oil'],
    steps: ['Marinate fish with mustard paste, turmeric, salt, and raw mustard oil.', 'Heat mustard oil, add Matasree Pure Hing and green chillies.', 'Add fish with marinade and splash of water; cover and cook gently for 8 minutes.', 'Drizzle raw mustard oil before serving.'],
    productTags: ['hing', 'mustard oil'],
    region: 'Bengali',
    image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Bengali Kosha Mangsho',
    description: 'Rich, dark, and velvety slow-cooked mutton curry with caramelized onions and whole spices.',
    ingredients: ['750g Mutton', '2 tbsp Matasree Meat Masala Special', '1 tsp Matasree Super Lal Tadka Mirch Powder', '1/2 cup Curd', '3 sliced Onions', '4 tbsp Mustard oil'],
    steps: ['Marinate mutton in curd, mustard oil, and Matasree Super Lal Tadka Mirch Powder.', 'Sauté onions slowly until deep golden brown.', 'Add marinated mutton and Matasree Meat Masala Special; slow fry (kosha) for 40 mins.', 'Add minimal water and cook until gravy is dark and thick.'],
    productTags: ['meat masala', 'chilli', 'mustard oil'],
    region: 'Bengali',
    image: 'https://images.unsplash.com/photo-1545247181-516773cae754?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Aloo Posto',
    description: 'Iconic Bengali comfort dish of potato cubes cooked in a thick poppy seed paste.',
    ingredients: ['4 Potatoes (cubed)', '4 tbsp Poppy seed paste (Posto)', '1/2 tsp Nigella seeds (Kalonji)', '2 Green chillies', '3 tbsp Mustard oil'],
    steps: ['Heat mustard oil and crackle kalonji and green chillies.', 'Add potato cubes and sauté till lightly golden.', 'Add poppy seed paste, salt, and water.', 'Cover and cook until potatoes are tender and gravy coats them.'],
    productTags: ['kalonji', 'mustard oil'],
    region: 'Bengali',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Traditional Cholar Dal',
    description: 'Festive Bengal gram lentil dal flavored with coconut bits, ginger, and ghee tadka.',
    ingredients: ['1 cup Chana Dal (boiled)', '1/4 cup Fried Coconut chips', '1 tbsp Matasree Royal Shahi Garam Masala', '1/2 tsp Matasree Pure Hing', '1 tsp Cumin seeds', '2 tbsp Ghee'],
    steps: ['Boil chana dal with turmeric and salt.', 'Heat ghee, add cumin seeds, bay leaf, and Matasree Pure Hing.', 'Add ginger paste, fried coconut chips, and Matasree Royal Shahi Garam Masala.', 'Pour into dal and simmer with a spoonful of sugar.'],
    productTags: ['garam masala', 'hing'],
    region: 'Bengali',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Chingri Malaikari',
    description: 'Prawns simmered in a creamy coconut milk gravy infused with whole sweet spices.',
    ingredients: ['400g Jumbo Prawns', '1 cup Coconut milk', '1 tbsp Matasree Royal Shahi Garam Masala', '1 tsp Matasree Super Lal Tadka Mirch Powder', '2 tbsp Ghee & Mustard oil'],
    steps: ['Lightly fry prawns with salt and turmeric.', 'In oil/ghee mix, sauté whole cardamom, cinnamon, and onion paste.', 'Add Matasree Super Lal Tadka Mirch Powder and Matasree Royal Shahi Garam Masala.', 'Stir in coconut milk and prawns; simmer for 5 minutes.'],
    productTags: ['garam masala', 'chilli'],
    region: 'Bengali',
    image: 'https://images.unsplash.com/photo-1559742811-822863c46f83?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Dhokar Dalna',
    description: 'Spiced lentil cakes fried and simmered in a fragrant potato gravy.',
    ingredients: ['1 cup Chana dal paste (spiced & steamed into cakes)', '2 Potatoes cubed', '1 tbsp Matasree Sampuran Masala', '1/2 tsp Matasree Pure Hing', '3 tbsp Mustard oil'],
    steps: ['Cut steamed dal slab into diamond cakes and shallow fry.', 'Sauté potato cubes in mustard oil.', 'Add tomato paste, Matasree Pure Hing, and Matasree Sampuran Masala.', 'Add water and fried dhoka cakes; simmer briefly.'],
    productTags: ['sampuran', 'hing'],
    region: 'Bengali',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Classic Bengali Shukto',
    description: 'Traditional multi-vegetable stew with bitter gourd, sweet potato, and radhuni paste.',
    ingredients: ['2 cups Mixed Veggies (Bittergourd, raw banana, sweet potato, drumstick)', '1/2 cup Milk', '1 tsp Mustard & radhuni paste', '1/2 tsp Matasree Pure Hing', '2 tbsp Ghee'],
    steps: ['Fry bitter gourd separately.', 'Sauté rest of vegetables in ghee with Matasree Pure Hing.', 'Add mustard paste, ginger, and milk.', 'Simmer until vegetables are cooked, finish with ghee.'],
    productTags: ['hing'],
    region: 'Bengali',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Baingan Bhaja Masala',
    description: 'Thick eggplant rounds marinated in rice flour and spice rub fried in mustard oil.',
    ingredients: ['1 Large Eggplant (sliced into 1/2 inch rounds)', '1 tbsp Matasree Chaat Masala Special', '1 tsp Matasree Super Lal Tadka Mirch Powder', '1 tsp Turmeric', 'Mustard oil for frying'],
    steps: ['Marinate eggplant rounds with turmeric, Matasree Super Lal Tadka Mirch Powder, salt, and rice flour.', 'Shallow fry in mustard oil on medium flame till crisp outside and soft inside.', 'Sprinkle Matasree Chaat Masala Special.'],
    productTags: ['chaat', 'chilli', 'mustard oil'],
    region: 'Bengali',
    image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Mochar Ghonto',
    description: 'Banana flower stew cooked with grated coconut, potato, and ghee.',
    ingredients: ['2 cups Banana flower (cleaned, chopped & boiled)', '1/2 cup Grated coconut', '1 Potato cubed', '1 tbsp Matasree Royal Shahi Garam Masala', '1/2 tsp Matasree Pure Hing', 'Ghee'],
    steps: ['Fry potato cubes in mustard oil.', 'Add Matasree Pure Hing, banana flower, and grated coconut.', 'Add Matasree Royal Shahi Garam Masala and cook till dry.', 'Finish with ghee.'],
    productTags: ['garam masala', 'hing'],
    region: 'Bengali',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Lau Ghonto',
    description: 'Delicate bottle gourd stir fry cooked with bori (sun-dried lentil dumplings) and milk.',
    ingredients: ['3 cups Bottle gourd (finely shredded)', '10 Bori (lentil dumplings fried)', '1/2 tsp Matasree Pure Hing', '1 tsp Cumin seeds', 'Ghee'],
    steps: ['Temper cumin seeds and Matasree Pure Hing in ghee.', 'Add shredded bottle gourd and cover; cook in its own juice.', 'Add fried bori crushed and simmer until tender.'],
    productTags: ['hing'],
    region: 'Bengali',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Potoler Dorma',
    description: 'Stuffed pointed gourds filled with spiced cottage cheese or fish, fried and simmered in gravy.',
    ingredients: ['6 Pointed Gourds (Parwal scraped & hollowed)', '1 cup Stuffed Paneer/Fish mixture', '1 tbsp Matasree Sampuran Masala', '1 cup Tomato gravy', 'Mustard oil'],
    steps: ['Stuff gourds with paneer mixture and shallow fry.', 'Cook tomato onion gravy with Matasree Sampuran Masala.', 'Add stuffed parwal and simmer gently.'],
    productTags: ['sampuran'],
    region: 'Bengali',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Katla Kalia',
    description: 'Rich and festive fish curry cooked with raisins, yoghurt, and whole spices.',
    ingredients: ['4 Katla Fish steaks', '1/2 cup Yoghurt', '1 tbsp Matasree Royal Shahi Garam Masala', '1 tsp Matasree Super Lal Tadka Mirch Powder', 'Mustard oil & Ghee'],
    steps: ['Fry fish steaks in mustard oil.', 'Sauté onion paste, ginger-garlic paste, and whisked curd.', 'Stir in Matasree Super Lal Tadka Mirch Powder and Matasree Royal Shahi Garam Masala.', 'Simmer fish in gravy until tender.'],
    productTags: ['garam masala', 'chilli'],
    region: 'Bengali',
    image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Bengali Chicken Curry (Murgir Jhol)',
    description: 'Light Sunday chicken curry cooked with large potato halves and ginger-garlic.',
    ingredients: ['600g Chicken', '2 Potatoes halved', '1.5 tbsp Matasree Meat Masala Special', '1 tsp Matasree Super Lal Tadka Mirch Powder', 'Mustard oil'],
    steps: ['Fry potato halves in mustard oil.', 'Sauté onion paste, add chicken and Matasree Meat Masala Special.', 'Add Matasree Super Lal Tadka Mirch Powder and water; boil till potatoes and chicken are cooked.'],
    productTags: ['meat masala', 'chilli'],
    region: 'Bengali',
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Chanar Dalna',
    description: 'Homemade fresh cottage cheese balls fried and cooked with potato in cumin gravy.',
    ingredients: ['200g Fresh Chhana (Cottage Cheese)', '2 Potatoes cubed', '1 tbsp Matasree Royal Shahi Garam Masala', '1/2 tsp Matasree Pure Hing', 'Ghee'],
    steps: ['Knead chhana with cumin and flour; shape into balls and fry.', 'Sauté potato cubes in ghee with Matasree Pure Hing.', 'Add tomato paste and Matasree Royal Shahi Garam Masala with water.', 'Add chhana balls and simmer.'],
    productTags: ['garam masala', 'hing'],
    region: 'Bengali',
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Pabda Macher Jhal',
    description: 'Delicate Pabda fish cooked in a spicy mustard and cumin seed paste gravy.',
    ingredients: ['4 Pabda Fish', '2 tbsp Mustard paste', '1 tsp Nigella seeds (Kalonji)', '1/2 tsp Matasree Pure Hing', 'Mustard oil'],
    steps: ['Lightly fry Pabda fish.', 'Temper kalonji and Matasree Pure Hing in mustard oil.', 'Add mustard paste and water.', 'Simmer fish for 4 minutes.'],
    productTags: ['hing', 'kalonji'],
    region: 'Bengali',
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Kumror Chhanchra',
    description: 'Mixed vegetable and pumpkin medley cooked with spices and bori.',
    ingredients: ['2 cups Pumpkin, eggplant, & radish cubed', '1/2 cup Fried Bori', '1 tbsp Matasree Sampuran Masala', 'Mustard oil'],
    steps: ['Sauté vegetables in mustard oil.', 'Add Matasree Sampuran Masala and crushed bori.', 'Cover and cook till vegetables are tender.'],
    productTags: ['sampuran'],
    region: 'Bengali',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Niramish Aloo Dum',
    description: 'No onion no garlic Bengali baby potato curry cooked in cumin ginger gravy.',
    ingredients: ['500g Baby potatoes', '1 tbsp Matasree Sampuran Masala', '1/2 tsp Matasree Pure Hing', '1 tsp Ginger paste', 'Ghee'],
    steps: ['Boil and fry baby potatoes in mustard oil.', 'Heat ghee, add Matasree Pure Hing, ginger, and tomato paste.', 'Stir in Matasree Sampuran Masala and simmer potatoes.'],
    productTags: ['sampuran', 'hing'],
    region: 'Bengali',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Dim Kosha',
    description: 'Hard boiled eggs coated in a spicy caramelized Bengali onion gravy.',
    ingredients: ['4 Boiled eggs', '2 Onions sliced', '1 tbsp Matasree Super Lal Tadka Mirch Powder', '1 tbsp Matasree Meat Masala Special', 'Mustard oil'],
    steps: ['Fry eggs in mustard oil.', 'Caramelize onions till dark.', 'Add Matasree Super Lal Tadka Mirch Powder and Matasree Meat Masala Special.', 'Coat eggs and serve.'],
    productTags: ['chilli', 'meat masala'],
    region: 'Bengali',
    image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Enchorer Dalna',
    description: 'Raw jackfruit curry cooked to resemble the texture of meat curry.',
    ingredients: ['300g Raw Jackfruit (boiled)', '2 Potatoes cubed', '1.5 tbsp Matasree Meat Masala Special', '1/2 tsp Matasree Pure Hing', 'Mustard oil'],
    steps: ['Shallow fry boiled jackfruit and potatoes.', 'Prepare thick onion tomato paste with Matasree Pure Hing.', 'Add Matasree Meat Masala Special and simmer jackfruit till tender.'],
    productTags: ['meat masala', 'hing'],
    region: 'Bengali',
    image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Rui Macher Kalia',
    description: 'Grand Bengali carp fish curry made with yogurt and fried onion paste.',
    ingredients: ['4 Rui Fish steaks', '1/4 cup Fried onion paste', '1 tbsp Matasree Royal Shahi Garam Masala', '1 tsp Matasree Super Lal Tadka Mirch Powder', 'Mustard oil'],
    steps: ['Deep fry fish steaks.', 'Cook tomato and fried onion paste with Matasree Super Lal Tadka Mirch Powder.', 'Stir in Matasree Royal Shahi Garam Masala and simmer fish.'],
    productTags: ['garam masala', 'chilli'],
    region: 'Bengali',
    image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Kanchkolar Kofta',
    description: 'Raw banana dumplings fried and simmered in a spiced tomato cumin gravy.',
    ingredients: ['2 Raw Bananas (boiled & mashed)', '1 Potato boiled', '1 tbsp Matasree Sampuran Masala', '1/2 tsp Matasree Pure Hing', 'Mustard oil'],
    steps: ['Make dumplings of mashed raw banana, potato, and spices; fry.', 'Cook tomato gravy with Matasree Pure Hing and Matasree Sampuran Masala.', 'Drop dumplings into gravy before serving.'],
    productTags: ['sampuran', 'hing'],
    region: 'Bengali',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Tel Koi',
    description: 'Climbing perch fish cooked in oil infused with nigella seeds and red chilli.',
    ingredients: ['4 Koi Fish', '1 tbsp Matasree Super Lal Tadka Mirch Powder', '1 tsp Nigella seeds (Kalonji)', '4 tbsp Mustard oil'],
    steps: ['Marinate fish with red chilli and salt.', 'Temper kalonji in hot mustard oil.', 'Cook fish in spice-infused oil.'],
    productTags: ['chilli', 'kalonji'],
    region: 'Bengali',
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Bhetki Paturi Masala',
    description: 'Bhetki fish fillet marinated in mustard and coconut, wrapped in banana leaf and steamed.',
    ingredients: ['4 Bhetki fillets', '3 tbsp Mustard & coconut paste', '1/2 tsp Matasree Pure Hing', 'Banana leaves', 'Mustard oil'],
    steps: ['Coat fillets with mustard paste, Matasree Pure Hing, and raw mustard oil.', 'Wrap each in banana leaf.', 'Pan steam on slow flame for 12 minutes.'],
    productTags: ['hing'],
    region: 'Bengali',
    image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Bengali Lau Chingri',
    description: 'Sweet tender bottle gourd cooked with tiny prawns and ghee.',
    ingredients: ['3 cups Bottle gourd finely chopped', '150g Small Prawns', '1/2 tsp Matasree Pure Hing', '1 tsp Cumin seeds', 'Ghee'],
    steps: ['Fry small prawns lightly.', 'Temper cumin and Matasree Pure Hing in ghee; add bottle gourd.', 'Stir in prawns and cook until tender.'],
    productTags: ['hing'],
    region: 'Bengali',
    image: 'https://images.unsplash.com/photo-1559742811-822863c46f83?auto=format&fit=crop&q=80&w=800'
  },

  // ==========================================
  // RAJASTHANI RECIPES (25 Recipes)
  // ==========================================
  {
    title: 'Dal Baati Churma Panchmel Dal',
    description: 'Heritage Rajasthani meal of baked wheat balls served with rich five-lentil dal infused with ghee and hing.',
    ingredients: ['1 cup Mixed Panchmel Dal (Toor, Chana, Moong, Uraddal, Masoor)', '1 tsp Matasree Pure Hing', '1.5 tbsp Matasree Sampuran Masala', '1 tsp Matasree Super Lal Tadka Mirch Powder', '1/2 cup Pure Desi Ghee'],
    steps: ['Pressure cook mixed 5 lentils until soft.', 'Heat ghee, add Matasree Pure Hing, cumin seeds, and tomato paste.', 'Add Matasree Super Lal Tadka Mirch Powder and Matasree Sampuran Masala.', 'Pour over lentils and serve with crushed baked baatis soaked in ghee.'],
    productTags: ['hing', 'sampuran', 'chilli'],
    region: 'Rajasthani',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Rajasthani Gatte Ki Sabzi',
    description: 'Gram flour cylindrical dumplings boiled and cooked in a spiced yoghurt curry.',
    ingredients: ['1 cup Besan (Gram flour)', '1 cup Whisked Curd', '1.5 tbsp Matasree Sampuran Masala', '1 tsp Matasree Super Lal Tadka Mirch Powder', '1/2 tsp Matasree Pure Hing', '2 tbsp Ghee'],
    steps: ['Knead besan into firm dough with spices and ghee; roll into logs, boil, and slice into gatte.', 'Whisk curd with Matasree Super Lal Tadka Mirch Powder and Matasree Sampuran Masala.', 'Heat ghee, add Matasree Pure Hing, and stir in whisked curd quickly.', 'Add cooked gatte and simmer for 10 minutes.'],
    productTags: ['sampuran', 'chilli', 'hing'],
    region: 'Rajasthani',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Royal Laal Maas',
    description: 'Fiery Rajasthani mutton dish prepared with fiery red Mathania chillies, garlic, and ghee.',
    ingredients: ['750g Mutton', '3 tbsp Matasree Super Lal Tadka Mirch Powder', '2 tbsp Matasree Meat Masala Special', '1/2 tsp Matasree Pure Hing', '1/2 cup Mustard oil/Ghee', '10 Garlic cloves'],
    steps: ['Make a smooth red paste of Matasree Super Lal Tadka Mirch Powder and garlic.', 'Sear mutton in ghee with Matasree Pure Hing.', 'Add chilli-garlic paste and cook till oil separates.', 'Add Matasree Meat Masala Special and simmer on low heat until meat turns melt-in-mouth tender.'],
    productTags: ['chilli', 'meat masala', 'hing'],
    region: 'Rajasthani',
    image: 'https://images.unsplash.com/photo-1545247181-516773cae754?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Ker Sangri Heritage Curry',
    description: 'Traditional desert berry (Ker) and dried bean (Sangri) preparation cooked with spices and dry mango powder.',
    ingredients: ['1/2 cup Ker (Desert berries)', '1.5 cups Sangri (Desert beans)', '1.5 tbsp Matasree Chaat Masala Special', '1 tsp Matasree Super Lal Tadka Mirch Powder', '1/2 tsp Matasree Pure Hing', '3 tbsp Mustard oil'],
    steps: ['Soak ker and sangri overnight and boil until tender.', 'Heat mustard oil, add Matasree Pure Hing and red chillies.', 'Add boiled ker sangri, Matasree Super Lal Tadka Mirch Powder, and Matasree Chaat Masala Special.', 'Stir fry until completely dry and flavorful.'],
    productTags: ['chaat', 'chilli', 'hing'],
    region: 'Rajasthani',
    image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Marwari Papad Ki Sabzi',
    description: 'Quick Marwari curry made with roasted papads simmered in a spiced curd base.',
    ingredients: ['4 Moong Dal Papads (roasted & broken)', '1 cup Curd', '1 tbsp Matasree Sampuran Masala', '1/2 tsp Matasree Pure Hing', '1 tsp Matasree Super Lal Tadka Mirch Powder', '1 tbsp Ghee'],
    steps: ['Whisk curd with Matasree Super Lal Tadka Mirch Powder, Matasree Sampuran Masala, and salt.', 'Heat ghee, add Matasree Pure Hing and cumin seeds.', 'Pour curd mixture and bring to boil.', 'Drop in roasted papad pieces right before serving.'],
    productTags: ['sampuran', 'hing', 'chilli'],
    region: 'Rajasthani',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Rajasthani Kadhi Spiced with Hing',
    description: 'Thin, spicy gram flour yoghurt curry heavily tempered with hing, mustard seeds, and whole chillies.',
    ingredients: ['1 cup Curd', '2 tbsp Besan', '1 tsp Matasree Pure Hing', '1 tbsp Matasree Sampuran Masala', '2 dried Red chillies', '2 tbsp Ghee'],
    steps: ['Whisk curd, besan, salt, and water.', 'Cook on medium flame while stirring continuously.', 'Heat ghee, add Matasree Pure Hing, dried red chillies, and Matasree Sampuran Masala.', 'Pour hot sizzing tempering into kadhi.'],
    productTags: ['hing', 'sampuran'],
    region: 'Rajasthani',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Sev Tamatar Ki Sabzi',
    description: 'Popular Rajasthani dhaba curry of tomatoes cooked with spices and topped with crispy chickpea sev.',
    ingredients: ['3 Tomatoes chopped', '1 cup Thick Ratlami/Indori Sev', '1 tbsp Matasree Kitchen King All-Purpose Masala', '1 tsp Matasree Super Lal Tadka Mirch Powder', '1/2 tsp Matasree Pure Hing', '2 tbsp Ghee'],
    steps: ['Heat ghee, add Matasree Pure Hing and sauté chopped tomatoes till mushy.', 'Add Matasree Super Lal Tadka Mirch Powder and Matasree Kitchen King Masala with 1 cup water.', 'Bring to boil and stir in crispy sev just before serving.'],
    productTags: ['kitchen king', 'chilli', 'hing'],
    region: 'Rajasthani',
    image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Govind Gatte Shahi Curry',
    description: 'Royal Rajasthani gatte stuffed with khoya and nuts cooked in a rich saffron yogurt sauce.',
    ingredients: ['1 cup Besan dough', '2 tbsp Mawa/Khoya & nuts for stuffing', '1.5 tbsp Matasree Royal Shahi Garam Masala', '1 cup Curd', 'Ghee'],
    steps: ['Make besan balls stuffed with mawa and nuts; boil and fry.', 'Prepare curd gravy with Matasree Royal Shahi Garam Masala and ghee.', 'Simmer stuffed gatte in gravy.'],
    productTags: ['garam masala', 'shahi'],
    region: 'Rajasthani',
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Pitod Ki Sabzi',
    description: 'Gram flour cooked into thick cakes, fried, and served in a tangy curd gravy.',
    ingredients: ['1 cup Besan paste (cooked thick & sliced into diamonds)', '1 cup Curd', '1 tbsp Matasree Sampuran Masala', '1/2 tsp Matasree Pure Hing', 'Ghee'],
    steps: ['Cook besan with spices into thick paste, spread on tray and cut diamonds (pitod).', 'Heat ghee, add Matasree Pure Hing, curd, and Matasree Sampuran Masala.', 'Add pitod pieces and cook gently.'],
    productTags: ['sampuran', 'hing'],
    region: 'Rajasthani',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Rajasthani Stuffed Mirchi Vada Gravy',
    description: 'Spicy large green chillies stuffed with potatoes, deep fried, and simmered in tomato gravy.',
    ingredients: ['4 Large Bhavnagri chillies (stuffed with spiced potatoes)', '1 cup Gram flour batter', '1 tbsp Matasree Chaat Masala Special', '1 cup Tomato gravy', 'Oil'],
    steps: ['Stuff chillies with potato mash, dip in besan batter and deep fry.', 'Prepare tomato gravy with Matasree Chaat Masala Special.', 'Slice vadas and place in gravy.'],
    productTags: ['chaat'],
    region: 'Rajasthani',
    image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Bajra Roti Tadka Gravy',
    description: 'Rustic pearl millet flatbread pieces simmered in spicy yogurt tempering.',
    ingredients: ['2 Bajra Rotis (broken into bites)', '1 cup Whisked curd', '1 tsp Matasree Pure Hing', '1 tbsp Matasree Sampuran Masala', '2 tbsp Ghee'],
    steps: ['Whisk curd with Matasree Sampuran Masala and salt.', 'Heat ghee, add Matasree Pure Hing and mustard seeds.', 'Pour curd mixture and add bajra roti pieces.'],
    productTags: ['hing', 'sampuran'],
    region: 'Rajasthani',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Marwari Rabodi Ki Sabzi',
    description: 'Traditional dried cornmeal papad slices cooked in a spiced buttermilk curry.',
    ingredients: ['1 cup Dried Rabodi (corn buttermilk chips)', '1.5 cups Buttermilk', '1 tbsp Matasree Sampuran Masala', '1/2 tsp Matasree Pure Hing', '1 tbsp Ghee'],
    steps: ['Boil rabodi pieces until soft.', 'Heat ghee, add Matasree Pure Hing and red chilli.', 'Add buttermilk, Matasree Sampuran Masala, and cooked rabodi.'],
    productTags: ['sampuran', 'hing'],
    region: 'Rajasthani',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Methi Mangodi Ki Sabzi',
    description: 'Sun-dried moong dal nuggets cooked with dry fenugreek and potatoes.',
    ingredients: ['1/2 cup Moong Dal Mangodi (fried)', '1 Potato cubed', '1 tbsp Matasree Kasoori Methi', '1 tbsp Matasree Kitchen King All-Purpose Masala', '2 tbsp Ghee'],
    steps: ['Crush and fry mangodi in ghee.', 'Sauté potato cubes with Matasree Kitchen King Masala.', 'Add water, cooked mangodi, and crushed Matasree Kasoori Methi.'],
    productTags: ['kasoori methi', 'kitchen king'],
    region: 'Rajasthani',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Rajasthani Chicken Banjara',
    description: 'Rustic nomadic style chicken curry cooked with coarse black pepper and garlic.',
    ingredients: ['600g Chicken', '2 tbsp Matasree Meat Masala Special', '1 tbsp Matasree Super Lal Tadka Mirch Powder', '10 Garlic cloves crushed', 'Mustard oil'],
    steps: ['Sauté garlic and onions in mustard oil till dark.', 'Add chicken and roast with Matasree Super Lal Tadka Mirch Powder.', 'Add Matasree Meat Masala Special and cook till thick.'],
    productTags: ['meat masala', 'chilli'],
    region: 'Rajasthani',
    image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Marwari Malai Pyaz Sabzi',
    description: 'Small whole onions cooked in a rich cream and yogurt sauce.',
    ingredients: ['12 Small Shallots/Onions', '1/2 cup Fresh cream', '1/2 cup Curd', '1 tbsp Matasree Royal Shahi Garam Masala', '1/2 tsp Matasree Pure Hing', '2 tbsp Ghee'],
    steps: ['Sauté whole peeled onions in ghee until light golden.', 'Whisk curd, cream, Matasree Pure Hing, and Matasree Royal Shahi Garam Masala.', 'Pour over onions and simmer gently.'],
    productTags: ['garam masala', 'shahi', 'hing'],
    region: 'Rajasthani',
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Jodhpuri Kabooli Veg Masala',
    description: 'Royal Jodhpuri layered rice dish with fried potatoes, bread croutons, nuts, and curd.',
    ingredients: ['2 cups Rice (boiled)', '1 cup Fried Potato & Croutons', '1/2 cup Curd', '1.5 tbsp Matasree Royal Shahi Garam Masala', '2 tbsp Ghee'],
    steps: ['Whisk curd with spices and Matasree Royal Shahi Garam Masala.', 'Layer cooked rice, fried potatoes, bread croutons, and curd gravy.', 'Simmer on low heat (dum) for 15 mins.'],
    productTags: ['garam masala', 'shahi'],
    region: 'Rajasthani',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Guwar Phali Aloo Masala',
    description: 'Cluster beans and potato stir fry tempered with carom seeds and hing.',
    ingredients: ['250g Guwar Phali (Cluster beans chopped)', '1 Potato cubed', '1/2 tsp Carom seeds (Ajwain)', '1/2 tsp Matasree Pure Hing', '1 tbsp Matasree Kitchen King All-Purpose Masala', 'Oil'],
    steps: ['Temper ajwain and Matasree Pure Hing in hot oil.', 'Add cluster beans, potato, salt, and Matasree Kitchen King Masala.', 'Cover and cook till tender.'],
    productTags: ['hing', 'kitchen king'],
    region: 'Rajasthani',
    image: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Marwari Badi Kadi',
    description: 'Moong dal nuggets cooked in a rich sour yoghurt Kadhi.',
    ingredients: ['1/2 cup Moong Dal Badi (fried)', '1 cup Curd', '2 tbsp Besan', '1/2 tsp Matasree Pure Hing', '1 tbsp Matasree Sampuran Masala', 'Ghee'],
    steps: ['Boil badi in water till soft.', 'Prepare Kadhi with curd, besan, Matasree Pure Hing, and Matasree Sampuran Masala.', 'Add cooked badi and simmer.'],
    productTags: ['hing', 'sampuran'],
    region: 'Rajasthani',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Rajasthani Aloo Pyaaz Curry',
    description: 'Crispy fried small potatoes and onions simmered in spicy curd gravy.',
    ingredients: ['8 Baby potatoes (fried)', '8 Small onions (fried)', '1 cup Curd', '1 tbsp Matasree Super Lal Tadka Mirch Powder', '1 tbsp Matasree Sampuran Masala', 'Ghee'],
    steps: ['Deep fry baby potatoes and small onions.', 'Make thick spicy curd gravy with Matasree Super Lal Tadka Mirch Powder and Matasree Sampuran Masala.', 'Simmer fried veggies in gravy.'],
    productTags: ['chilli', 'sampuran'],
    region: 'Rajasthani',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Dana Methi Ki Sabzi',
    description: 'Bitter sweet fenugreek seeds cooked with raisins and dry mango powder.',
    ingredients: ['1/2 cup Fenugreek seeds (Dana methi soaked & boiled)', '2 tbsp Raisins', '1 tbsp Amchur', '1 tbsp Matasree Chaat Masala Special', '1/2 tsp Matasree Pure Hing', '2 tbsp Mustard oil'],
    steps: ['Boil dana methi to reduce bitterness.', 'Heat oil, add Matasree Pure Hing and raisins.', 'Add cooked dana methi, amchur, and Matasree Chaat Masala Special; toss dry.'],
    productTags: ['chaat', 'hing'],
    region: 'Rajasthani',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Kacchi Haldi Ki Sabzi',
    description: 'Winter specialty made with grated raw fresh turmeric slow cooked in abundant ghee.',
    ingredients: ['250g Raw Turmeric (grated)', '1 cup Curd', '1/2 tsp Matasree Pure Hing', '1 tbsp Matasree Sampuran Masala', '1/2 cup Ghee'],
    steps: ['Sauté grated fresh turmeric in ghee for 20 mins until aroma changes.', 'Add whisked curd, Matasree Pure Hing, and Matasree Sampuran Masala.', 'Simmer until ghee floats on top.'],
    productTags: ['hing', 'sampuran'],
    region: 'Rajasthani',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Junglee Maas Spiced Gravy',
    description: 'Minimalist royal hunting style mutton dish cooked with ghee, chillies, and salt.',
    ingredients: ['600g Mutton', '2 tbsp Matasree Super Lal Tadka Mirch Powder', '1/2 cup Pure Ghee', '1 tsp Garlic paste', 'Salt'],
    steps: ['Heat generous ghee in pan.', 'Add garlic paste and mutton; sear on high flame.', 'Add Matasree Super Lal Tadka Mirch Powder and slow cook in ghee till tender.'],
    productTags: ['chilli'],
    region: 'Rajasthani',
    image: 'https://images.unsplash.com/photo-1545247181-516773cae754?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Rajasthani Shahi Rajwadi Paneer',
    description: 'Cottage cheese cooked in a rich curd and cashew gravy with Rajasthani whole red chillies.',
    ingredients: ['250g Paneer cubes', '1/2 cup Curd', '2 tbsp Cashew paste', '1 tbsp Matasree Royal Shahi Garam Masala', '2 tbsp Ghee'],
    steps: ['Sauté red chillies and cashew paste in ghee.', 'Add curd, Matasree Royal Shahi Garam Masala, and paneer cubes.', 'Simmer till rich and smooth.'],
    productTags: ['garam masala', 'shahi'],
    region: 'Rajasthani',
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Jaipuri Veg Mawa Curry',
    description: 'Mixed vegetable curry prepared with rich khoya milk solids and subtle spices.',
    ingredients: ['2 cups Vegetables', '50g Mawa/Khoya', '1 tbsp Matasree Kitchen King All-Purpose Masala', '1/2 cup Tomato puree', '2 tbsp Ghee'],
    steps: ['Sauté vegetables in ghee.', 'Add tomato puree, crumbling mawa, and Matasree Kitchen King Masala.', 'Simmer till thick and creamy.'],
    productTags: ['kitchen king'],
    region: 'Rajasthani',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Mathania Mirch Chicken Curry',
    description: 'Spicy chicken curry prepared with authentic Mathania chili rub and ghee.',
    ingredients: ['600g Chicken', '2 tbsp Matasree Super Lal Tadka Mirch Powder', '1 tbsp Matasree Meat Masala Special', '2 Onions sliced', 'Ghee'],
    steps: ['Sauté onions in ghee.', 'Add chicken and roast with Matasree Super Lal Tadka Mirch Powder.', 'Add Matasree Meat Masala Special and simmer.'],
    productTags: ['chilli', 'meat masala'],
    region: 'Rajasthani',
    image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&q=80&w=800'
  },

  // ==========================================
  // OTHER REGIONAL RECIPES (25 Recipes)
  // ==========================================
  {
    title: 'Goan Fish Curry',
    description: 'Coastal Goan fish curry infused with coconut milk, dried Kashmiri chilli paste, and kokum souring agent.',
    ingredients: ['500g Kingfish/Pomfret fillets', '1 cup Fresh Coconut milk', '2 tbsp Matasree Super Lal Tadka Mirch Powder', '4 Kokum petals', '1/2 tsp Matasree Pure Hing', '2 tbsp Coconut oil'],
    steps: ['Grind coconut, Matasree Super Lal Tadka Mirch Powder, and garlic to smooth paste.', 'Boil spice paste with water and kokum petals.', 'Add fish fillets gently with Matasree Pure Hing tempering.', 'Simmer for 6 minutes and pour coconut milk.'],
    productTags: ['chilli', 'hing'],
    region: 'Other',
    image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Maharashtrian Misal Pav Gravy',
    description: 'Fiery sprouted moth bean curry (Kat/Rassa) served with crunchy farsan and soft pav bread.',
    ingredients: ['2 cups Sprouted Matki (Moth beans boiled)', '2 tbsp Matasree Sampuran Masala', '1 tbsp Matasree Super Lal Tadka Mirch Powder', '1/2 tsp Matasree Pure Hing', '1/2 cup Coconut paste', '3 tbsp Oil'],
    steps: ['Sauté onion-coconut paste in oil till dark red.', 'Add Matasree Super Lal Tadka Mirch Powder, Matasree Pure Hing, and Matasree Sampuran Masala.', 'Add boiled sprouts and plenty of water to form a thin fiery gravy (Rassa).', 'Serve piping hot topped with farsan and lemon.'],
    productTags: ['sampuran', 'chilli', 'hing'],
    region: 'Other',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Mumbai Street Style Pav Bhaji',
    description: 'Butter-laden mashed vegetable curry served with toasted buttery pav bread and lemon wedges.',
    ingredients: ['3 cups Mashed Vegetables (Potatoes, cauliflower, peas, capsicum)', '2 tbsp Matasree Chaat Masala Special', '1 tbsp Matasree Kitchen King All-Purpose Masala', '1 tbsp Matasree Super Lal Tadka Mirch Powder', '100g Butter'],
    steps: ['Melt butter on tawa, sauté chopped onions and capsicum.', 'Add tomato puree, Matasree Super Lal Tadka Mirch Powder, and Matasree Kitchen King Masala.', 'Mix boiled mashed vegetables and mash continuously with tawa masher.', 'Finish with Matasree Chaat Masala Special and a generous slab of butter.'],
    productTags: ['chaat', 'kitchen king', 'chilli'],
    region: 'Other',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Malvani Chicken Curry',
    description: 'Coastal Konkan chicken dish prepared with roasted coconut and dry Malvani spice mix.',
    ingredients: ['600g Chicken', '2 tbsp Matasree Meat Masala Special', '1 tbsp Matasree Super Lal Tadka Mirch Powder', '1 cup Roasted grated coconut paste', '2 tbsp Oil'],
    steps: ['Roast coconut and onions till dark brown, blend into paste.', 'Heat oil, add ginger-garlic paste and chicken.', 'Add Matasree Super Lal Tadka Mirch Powder, Matasree Meat Masala Special, and coconut paste.', 'Simmer with water until chicken is soft.'],
    productTags: ['meat masala', 'chilli'],
    region: 'Other',
    image: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Parsi Patra Ni Machhi / Veg Curry',
    description: 'Parsi steamed delicacy of spiced green chutney coated fish or cottage cheese wrapped in banana leaf.',
    ingredients: ['4 Fish steaks or Paneer slabs', '1 cup Mint & Coriander green chutney paste', '1 tbsp Matasree Chaat Masala Special', '1/2 tsp Matasree Pure Hing', 'Banana leaves'],
    steps: ['Season green chutney with lemon juice, salt, and Matasree Chaat Masala Special.', 'Coat fish/paneer with chutney and Matasree Pure Hing.', 'Wrap in banana leaves and steam for 12 minutes.'],
    productTags: ['chaat', 'hing'],
    region: 'Other',
    image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Kashmiri Yakhni Gravy',
    description: 'Delicate curd-based Kashmiri gravy cooked with fennel seeds, ginger powder, and mutton or lotus stem.',
    ingredients: ['500g Mutton or Lotus Stem (Nadru)', '1.5 cups Thick Curd', '1 tbsp Fennel powder', '1 tsp Ginger powder', '1/2 tsp Matasree Pure Hing', '2 tbsp Ghee'],
    steps: ['Boil mutton/nadru with whole aromatic spices.', 'Whisk curd thoroughly; cook in ghee with Matasree Pure Hing, stirring continuously so it doesn’t curdle.', 'Add fennel, ginger powder, and mutton broth; simmer till velvety.'],
    productTags: ['hing'],
    region: 'Other',
    image: 'https://images.unsplash.com/photo-1545247181-516773cae754?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Himachali Chana Madra',
    description: 'Pahari yogurt-based chickpea curry slow-cooked with ghee, black cardamom, and raisins.',
    ingredients: ['2 cups Boiled White Chickpeas', '1.5 cups Curd', '1 tbsp Matasree Royal Shahi Garam Masala', '1/2 tsp Matasree Pure Hing', '2 tbsp Raisins', '3 tbsp Ghee'],
    steps: ['Heat ghee, add whole spices, raisins, and Matasree Pure Hing.', 'Add whisked curd and cook until ghee separates.', 'Stir in boiled chickpeas and Matasree Royal Shahi Garam Masala; simmer for 15 minutes.'],
    productTags: ['garam masala', 'shahi', 'hing'],
    region: 'Other',
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Assamese Masor Tenga',
    description: 'Refreshing light sour fish curry made with green tomatoes, elephant apple, or lemon juice.',
    ingredients: ['4 Fish steaks', '2 Tomatoes chopped', '1 tsp Fenugreek seeds', '1/2 tsp Matasree Pure Hing', '2 tbsp Mustard oil', 'Lemon juice'],
    steps: ['Lightly fry fish steaks in mustard oil.', 'Temper fenugreek seeds and Matasree Pure Hing in oil.', 'Add chopped tomatoes and turmeric; cook till soft.', 'Add water, fish, and finish with lemon juice.'],
    productTags: ['hing'],
    region: 'Other',
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Naga Spicy Chili Chicken',
    description: 'Fiery Northeast style dry chicken stir fry made with smoked ghost pepper rub and bamboo shoots.',
    ingredients: ['500g Chicken', '1 tbsp Matasree Super Lal Tadka Mirch Powder', '1 tbsp Fermented bamboo shoot paste', '1 tbsp Garlic minced', '1 tbsp Mustard oil'],
    steps: ['Heat mustard oil, sauté minced garlic.', 'Add chicken and sear on high flame.', 'Add fermented bamboo shoot paste and Matasree Super Lal Tadka Mirch Powder.', 'Stir fry until cooked dry.'],
    productTags: ['chilli'],
    region: 'Other',
    image: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Manipuri Eromba Gravy',
    description: 'Traditional Manipuri stew of boiled vegetables and mashed king chillies.',
    ingredients: ['2 cups Boiled Vegetables (Potato, beans, bamboo shoots)', '1 tbsp Matasree Super Lal Tadka Mirch Powder', '1/2 tsp Matasree Pure Hing', 'Fresh coriander'],
    steps: ['Mash boiled vegetables coarsely.', 'Mix in Matasree Super Lal Tadka Mirch Powder, salt, and Matasree Pure Hing.', 'Garnish generously with fresh coriander and serve lukewarm.'],
    productTags: ['chilli', 'hing'],
    region: 'Other',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Sindhi Seyal Mani / Bhaji',
    description: 'Comforting Sindhi dish of chapati strips simmered in a spiced tomato, coriander, and garlic gravy.',
    ingredients: ['4 Leftover Chapatis (shredded)', '2 Tomatoes pureed', '1 tbsp Matasree Kitchen King All-Purpose Masala', '1/2 tsp Matasree Pure Hing', '2 tbsp Oil'],
    steps: ['Heat oil, sauté garlic and tomato puree.', 'Add Matasree Pure Hing and Matasree Kitchen King All-Purpose Masala with 1 cup water.', 'Add chapati strips and cook till soft and gravy is absorbed.'],
    productTags: ['kitchen king', 'hing'],
    region: 'Other',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Gujarati Sev Khaman Mustard Tadka',
    description: 'Steamed gram flour cake tempered with mustard seeds, sesame, and green chillies.',
    ingredients: ['1 Besan Dhokla/Khaman cake (steamed & cubed)', '1 tsp Mustard seeds', '1/2 tsp Matasree Pure Hing', '1 tbsp Sesame seeds', '2 tbsp Oil', 'Curry leaves'],
    steps: ['Temper mustard, sesame, curry leaves, and Matasree Pure Hing in oil.', 'Add 1/4 cup sweetened water to temper.', 'Pour over khaman cubes and top with fresh coconut.'],
    productTags: ['hing'],
    region: 'Other',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Traditional Gujarati Undhiyu',
    description: 'Mixed winter vegetable specialty cooked in an earthen pot with fried fenugreek dumplings (muthiya).',
    ingredients: ['3 cups Winter Veggies (Surti papdi, purple yam, sweet potato, brinjal)', '1 cup Muthiya (fried fenugreek dumplings)', '1 tbsp Matasree Sampuran Masala', '1/2 tsp Matasree Pure Hing', '3 tbsp Oil'],
    steps: ['Stuff veggies with coconut-coriander spice mix.', 'Heat oil, add Matasree Pure Hing and Surti papdi.', 'Layer vegetables and muthiya; cover and steam cook till tender with Matasree Sampuran Masala.'],
    productTags: ['sampuran', 'hing'],
    region: 'Other',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Goan Pork / Veg Vindaloo',
    description: 'Tangy and fiery Goan curry cooked with palm vinegar, garlic, and red chillies.',
    ingredients: ['600g Meat or Mushroom/Potatoes', '2 tbsp Matasree Super Lal Tadka Mirch Powder', '1 tbsp Matasree Meat Masala Special', '3 tbsp Vinegar', '10 Garlic cloves'],
    steps: ['Marinate in vinegar, garlic, and Matasree Super Lal Tadka Mirch Powder.', 'Sauté onions, add marinated meat/veggies and Matasree Meat Masala Special.', 'Simmer till thick and tangy.'],
    productTags: ['chilli', 'meat masala'],
    region: 'Other',
    image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Maharashtrian Pitla',
    description: 'Quick rustic gram flour porridge tempered with green chillies, garlic, and hing.',
    ingredients: ['1 cup Besan', '1 tsp Matasree Pure Hing', '1 tbsp Matasree Sampuran Masala', '4 Garlic cloves crushed', '2 tbsp Oil'],
    steps: ['Temper garlic, green chillies, and Matasree Pure Hing in oil.', 'Whisk besan with water, salt, and Matasree Sampuran Masala.', 'Pour into pan and stir continuously till thick paste forms.'],
    productTags: ['hing', 'sampuran'],
    region: 'Other',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Konkani Sol Kadi Spiced Curry',
    description: 'Digestive pink coconut drink prepared with kokum extract, garlic, and hing.',
    ingredients: ['1.5 cups Coconut milk', '1/2 cup Kokum extract (Sol)', '1/2 tsp Matasree Pure Hing', '1 Garlic clove crushed', 'Coriander'],
    steps: ['Mix coconut milk and kokum extract till pink.', 'Crush garlic, green chilli, salt, and Matasree Pure Hing.', 'Stir into sol kadi and serve chilled.'],
    productTags: ['hing'],
    region: 'Other',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Malvani Fish Fry Curry',
    description: 'Crispy rava-crusted fried fish served alongside spiced coastal curry.',
    ingredients: ['4 Fish steaks', '1 tbsp Matasree Super Lal Tadka Mirch Powder', '1 tbsp Matasree Sampuran Masala', 'Semolina (Rava) for coating', 'Oil'],
    steps: ['Marinate fish in Matasree Super Lal Tadka Mirch Powder and Matasree Sampuran Masala.', 'Coat with semolina and shallow fry till golden crisp.'],
    productTags: ['chilli', 'sampuran'],
    region: 'Other',
    image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Parsi Dhansak Curry',
    description: 'Flavorful lentil and mixed vegetable stew slow cooked with sweet spices.',
    ingredients: ['1 cup Mixed Lentils & Vegetables (Pumpkin, brinjal)', '1 tbsp Matasree Meat Masala Special', '1 tbsp Matasree Royal Shahi Garam Masala', 'Ghee'],
    steps: ['Boil lentils and vegetables together, then mash.', 'Sauté onion tomato paste with Matasree Meat Masala Special and Matasree Royal Shahi Garam Masala.', 'Combine with mashed lentils and simmer.'],
    productTags: ['meat masala', 'garam masala'],
    region: 'Other',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Bohri Spiced Chicken Roast Gravy',
    description: 'Bohra style roasted chicken marinated in spiced yoghurt and fried onions.',
    ingredients: ['600g Chicken', '2 tbsp Matasree Meat Masala Special', '1/2 cup Curd', '1/2 cup Birista (Fried onions)', 'Ghee'],
    steps: ['Marinate chicken with curd, birista, and Matasree Meat Masala Special.', 'Roast in ghee till chicken is tender and coated in thick dark gravy.'],
    productTags: ['meat masala'],
    region: 'Other',
    image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Meghalayan Jadoh Spiced Gravy',
    description: 'Rice and meat/mushroom dish cooked with black sesame paste and local spices.',
    ingredients: ['1.5 cups Rice', '300g Meat or Mushroom', '2 tbsp Black sesame paste', '1 tbsp Matasree Sampuran Masala', 'Mustard oil'],
    steps: ['Sauté ginger, garlic, and black sesame paste in mustard oil.', 'Add meat/mushroom and Matasree Sampuran Masala.', 'Stir in rice and water; cover and cook.'],
    productTags: ['sampuran'],
    region: 'Other',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Tripuran Muya Awandru',
    description: 'Bamboo shoot and rice flour stew cooked with green chillies and local herbs.',
    ingredients: ['1 cup Bamboo shoot slices', '2 tbsp Rice flour paste', '1 tsp Matasree Super Lal Tadka Mirch Powder', '1/2 tsp Matasree Pure Hing'],
    steps: ['Boil bamboo shoots with water and salt.', 'Add Matasree Super Lal Tadka Mirch Powder and Matasree Pure Hing.', 'Stir in rice flour paste to thicken stew.'],
    productTags: ['chilli', 'hing'],
    region: 'Other',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Odia Dalma',
    description: 'Traditional Odia lentil stew cooked with raw papaya, pumpkin, brinjal, and roasted cumin powder.',
    ingredients: ['1 cup Toor Dal', '2 cups Vegetables (Raw papaya, pumpkin, potato, brinjal)', '1 tbsp Matasree Sampuran Masala', '1/2 tsp Matasree Pure Hing', '2 tbsp Ghee'],
    steps: ['Pressure cook dal and vegetables with turmeric and salt.', 'Heat ghee, add mustard seeds, dried chillies, and Matasree Pure Hing.', 'Pour into dal and sprinkle roasted cumin and Matasree Sampuran Masala.'],
    productTags: ['sampuran', 'hing'],
    region: 'Other',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Odia Besara (Mustard Paste Veg)',
    description: 'Mixed vegetables or fish cooked in a light mustard paste gravy tempered with panch phoron.',
    ingredients: ['2 cups Vegetables or Fish', '2 tbsp Mustard paste', '1 tsp Panch phoron', '1/2 tsp Matasree Pure Hing', 'Mustard oil'],
    steps: ['Temper panch phoron and Matasree Pure Hing in mustard oil.', 'Add vegetables/fish and sauté lightly.', 'Add mustard paste diluted with water and boil gently.'],
    productTags: ['hing'],
    region: 'Other',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Bihari Litti Chokha Baingan Gravy',
    description: 'Rustic roasted eggplant mash spiced with sattu (roasted gram flour), mustard oil, hing, and chillies.',
    ingredients: ['1 Large Eggplant (roasted)', '2 Boiled potatoes', '2 tbsp Mustard oil', '1 tbsp Matasree Chaat Masala Special', '1/2 tsp Matasree Pure Hing'],
    steps: ['Mash roasted eggplant and boiled potatoes.', 'Mix in raw mustard oil, chopped green chillies, garlic, and Matasree Pure Hing.', 'Finish with Matasree Chaat Masala Special.'],
    productTags: ['chaat', 'hing'],
    region: 'Other',
    image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Jharkhand Pittha Spicy Lentil Curry',
    description: 'Steamed rice flour dumplings stuffed with spiced chana dal simmered in tomato gravy.',
    ingredients: ['1 cup Rice flour dough', '1 cup Spiced Chana Dal paste', '1 tbsp Matasree Sampuran Masala', '1/2 tsp Matasree Pure Hing', 'Oil'],
    steps: ['Stuff rice dough with dal paste and steam.', 'Prepare tomato gravy with Matasree Pure Hing and Matasree Sampuran Masala.', 'Drop steamed pittha into curry.'],
    productTags: ['sampuran', 'hing'],
    region: 'Other',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=800'
  }
];

export const seedRecipes = async () => {
  try {
    await connectDB();

    console.log('Clearing existing recipes database collection...');
    await Recipe.deleteMany({});
    console.log('Existing recipes cleared successfully.');

    console.log(`Inserting ${recipesData.length} diverse Indian recipes with real dish photos...`);
    const inserted = await Recipe.insertMany(recipesData);
    console.log(`Successfully seeded ${inserted.length} recipes into MongoDB database!`);

    process.exit(0);
  } catch (error: any) {
    console.error('Error seeding recipes:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  seedRecipes();
}
