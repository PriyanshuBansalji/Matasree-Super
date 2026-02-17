import type { Product, Category } from '@/types';
import productChilli from '@/assets/product-chilli.jpg';
import productTurmeric from '@/assets/product-turmeric.jpg';
import productGaramMasala from '@/assets/product-garam-masala.jpg';
import productCoriander from '@/assets/product-coriander.jpg';
import chilliCategory from '@/assets/chilli-category.jpg';
import turmericCategory from '@/assets/turmeric-category.jpg';
import corianderCategory from '@/assets/coriander-category.jpg';
import garamMasalaCategory from '@/assets/garam-masala-category.jpg';
import comboCategory from '@/assets/combo-category.jpg';

export const categories: Category[] = [
  {
    id: '1',
    name: 'Red Chilli',
    slug: 'mirch',
    image: chilliCategory,
    productCount: 8,
  },
  {
    id: '2',
    name: 'Turmeric',
    slug: 'haldi',
    image: turmericCategory,
    productCount: 5,
  },
  {
    id: '3',
    name: 'Coriander',
    slug: 'dhaniya',
    image: corianderCategory,
    productCount: 6,
  },
  {
    id: '4',
    name: 'Garam Masala',
    slug: 'garam-masala',
    image: garamMasalaCategory,
    productCount: 4,
  },
  {
    id: '5',
    name: 'Combo Packs',
    slug: 'combo-packs',
    image: comboCategory,
    productCount: 3,
  },
  {
    id: '6',
    name: 'Special Blends',
    slug: 'special-blends',
    image: garamMasalaCategory,
    productCount: 7,
  },
];

export const products: Product[] = [
  {
    id: '1',
    name: 'Premium Kashmiri Mirch',
    description: 'Vibrant red color, mild heat, perfect for curries and tandoori dishes. Sourced directly from Kashmir valley.',
    price: 299,
    originalPrice: 399,
    image: productChilli,
    category: 'mirch',
    rating: 4.8,
    reviews: 234,
    inStock: true,
    weight: '200g',
    isBestseller: true,
  },
  {
    id: '2',
    name: 'Lakadong Turmeric Powder',
    description: 'High curcumin content turmeric from Meghalaya. Known for its exceptional medicinal properties and deep golden color.',
    price: 349,
    originalPrice: 449,
    image: productTurmeric,
    category: 'haldi',
    rating: 4.9,
    reviews: 189,
    inStock: true,
    weight: '250g',
    isNew: true,
  },
  {
    id: '3',
    name: 'Rajasthani Dhaniya',
    description: 'Aromatic coriander powder with citrusy notes. Essential for authentic Indian cooking.',
    price: 179,
    image: productCoriander,
    category: 'dhaniya',
    rating: 4.7,
    reviews: 156,
    inStock: true,
    weight: '200g',
  },
  {
    id: '4',
    name: 'Royal Garam Masala',
    description: 'Handcrafted blend of 13 premium spices. The secret to restaurant-quality dishes at home.',
    price: 399,
    originalPrice: 499,
    image: productGaramMasala,
    category: 'garam-masala',
    rating: 4.9,
    reviews: 312,
    inStock: true,
    weight: '150g',
    isBestseller: true,
  },
  {
    id: '5',
    name: 'Guntur Red Chilli',
    description: 'Hot and fiery chilli powder from Andhra Pradesh. For those who love authentic spice.',
    price: 249,
    image: productChilli,
    category: 'mirch',
    rating: 4.6,
    reviews: 98,
    inStock: true,
    weight: '200g',
  },
  {
    id: '6',
    name: 'Salem Turmeric',
    description: 'Traditional Tamil Nadu turmeric with balanced flavor and beautiful color.',
    price: 279,
    image: productTurmeric,
    category: 'haldi',
    rating: 4.5,
    reviews: 87,
    inStock: true,
    weight: '250g',
  },
  {
    id: '7',
    name: 'Kitchen Essentials Combo',
    description: 'Complete set of 5 essential masalas for everyday cooking. Perfect for new homes.',
    price: 999,
    originalPrice: 1299,
    image: comboCategory,
    category: 'combo-packs',
    rating: 4.8,
    reviews: 445,
    inStock: true,
    weight: '5 x 100g',
    isBestseller: true,
  },
  {
    id: '8',
    name: 'Biryani Masala',
    description: 'Authentic blend for the perfect biryani. Aromatic and flavorful.',
    price: 329,
    image: productGaramMasala,
    category: 'special-blends',
    rating: 4.7,
    reviews: 267,
    inStock: true,
    weight: '100g',
    isNew: true,
  },
  {
    id: '9',
    name: 'Pav Bhaji Masala',
    description: 'Mumbai street food special. Makes delicious pav bhaji every time.',
    price: 199,
    image: productGaramMasala,
    category: 'special-blends',
    rating: 4.6,
    reviews: 178,
    inStock: true,
    weight: '100g',
  },
  {
    id: '10',
    name: 'Chat Masala',
    description: 'Tangy and spicy blend for chaats, fruits, and snacks.',
    price: 149,
    image: productGaramMasala,
    category: 'special-blends',
    rating: 4.5,
    reviews: 234,
    inStock: true,
    weight: '100g',
  },
  {
    id: '11',
    name: 'Premium Cumin Seeds',
    description: 'Whole cumin seeds with intense aroma. Essential for tempering.',
    price: 229,
    image: productCoriander,
    category: 'special-blends',
    rating: 4.7,
    reviews: 145,
    inStock: true,
    weight: '200g',
  },
  {
    id: '12',
    name: 'Festive Gift Box',
    description: 'Beautifully packaged gift set with 8 premium masalas. Perfect for Diwali.',
    price: 1499,
    originalPrice: 1999,
    image: comboCategory,
    category: 'combo-packs',
    rating: 4.9,
    reviews: 89,
    inStock: true,
    weight: '8 x 50g',
    isNew: true,
  },
];

export const getProductsByCategory = (slug: string): Product[] => {
  return products.filter((product) => product.category === slug);
};

export const getProductById = (id: string): Product | undefined => {
  return products.find((product) => product.id === id);
};

export const getBestsellers = (): Product[] => {
  return products.filter((product) => product.isBestseller);
};

export const getNewArrivals = (): Product[] => {
  return products.filter((product) => product.isNew);
};
