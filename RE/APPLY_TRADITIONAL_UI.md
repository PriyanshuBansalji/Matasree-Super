# 🎨 How to Apply Traditional UI Elements to Your Pages

## Quick Implementation Guide

### Step 1: Import Traditional Components
At the top of your component file, add:
```tsx
import { 
  TraditionalDivider, 
  OrnateTopBorder, 
  MandalaShape,
  TraditionalCard,
  TraditionalButton,
  TraditionalBadge
} from '@/components/TraditionalElements';
```

---

## 📑 Page-by-Page Implementation Examples

### **Home Page / Hero Section**
```tsx
<section className="relative py-28 overflow-hidden">
  <OrnateTopBorder className="mb-8" />
  
  <div className="container mx-auto">
    <div className="text-center mb-12">
      <TraditionalBadge>
        🌟 Welcome to Matasree
      </TraditionalBadge>
      
      <h1 className="heading-ornate mt-6">
        Authentic Indian Spices
      </h1>
      
      <TraditionalDivider className="my-8" />
      
      <MandalaShape size="lg" className="text-primary mx-auto mb-8" />
    </div>
  </div>
</section>
```

### **Products Page**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
  {products.map((product) => (
    <TraditionalCard key={product.id} highlight={selectedId === product.id}>
      <img src={product.image} alt={product.name} />
      <div className="p-6">
        <h3 className="font-serif text-lg font-bold">{product.name}</h3>
        <TraditionalDivider className="my-3" />
        <p className="text-muted-foreground mb-4">{product.description}</p>
        <TraditionalButton variant="primary" className="w-full">
          Add to Cart
        </TraditionalButton>
      </div>
    </TraditionalCard>
  ))}
</div>
```

### **About Page - Team Section**
```tsx
<section className="py-20">
  <OrnateTopBorder />
  
  <div className="text-center mb-16">
    <h2 className="heading-ornate">Meet Our Team</h2>
    <TraditionalDivider className="my-6" />
    <p className="subheading-traditional text-primary">
      Visionary Leaders
    </p>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
    {teamMembers.map((member) => (
      <TraditionalCard key={member.id} highlight={true}>
        <div className="relative h-64">
          <img src={member.image} alt={member.name} />
          <MandalaShape 
            size="sm" 
            className="absolute bottom-4 right-4 text-white" 
          />
        </div>
        <div className="p-6">
          <h3 className="font-serif font-bold">{member.name}</h3>
          <p className="text-primary text-sm">{member.role}</p>
          <TraditionalDivider className="my-4" />
          <p className="text-xs text-muted-foreground">{member.bio}</p>
        </div>
      </TraditionalCard>
    ))}
  </div>
</section>
```

### **Categories Page**
```tsx
<div className="mb-12">
  <OrnateTopBorder className="mb-8" />
  <h2 className="heading-ornate text-center">Our Spice Collections</h2>
  <TraditionalDivider className="my-8" />
</div>

<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
  {categories.map((cat) => (
    <TraditionalCard 
      key={cat.id} 
      className="text-center cursor-pointer hover:scale-105"
    >
      <div className="p-8">
        <MandalaShape 
          size="md" 
          className="text-primary mx-auto mb-4" 
        />
        <h3 className="font-serif font-bold text-sm">{cat.name}</h3>
      </div>
    </TraditionalCard>
  ))}
</div>
```

### **Contact Page**
```tsx
<section className="py-16">
  <OrnateTopBorder className="mb-12" />
  
  <div className="max-w-4xl mx-auto">
    <h2 className="heading-ornate text-center mb-6">Get in Touch</h2>
    <TraditionalDivider className="mb-12" />
    
    <div className="grid md:grid-cols-2 gap-12">
      <TraditionalCard highlight={true}>
        <div className="p-8">
          <MandalaShape size="md" className="text-primary mx-auto mb-6" />
          <h3 className="font-serif text-xl font-bold text-center mb-6">
            Contact Information
          </h3>
          <TraditionalDivider />
          {/* Contact info */}
        </div>
      </TraditionalCard>
      
      <TraditionalCard>
        <form className="p-8">
          {/* Form fields */}
          <TraditionalButton variant="primary" className="w-full">
            Send Message
          </TraditionalButton>
        </form>
      </TraditionalCard>
    </div>
  </div>
</section>
```

### **Product Detail Page**
```tsx
<div className="grid md:grid-cols-2 gap-12">
  <div className="relative">
    <OrnateTopBorder className="mb-8" />
    <img src={product.image} alt={product.name} />
    <MandalaShape 
      size="lg" 
      className="absolute bottom-4 right-4 text-primary opacity-50"
    />
  </div>
  
  <div>
    <TraditionalBadge className="mb-4">
      {product.category}
    </TraditionalBadge>
    
    <h1 className="heading-ornate">{product.name}</h1>
    <TraditionalDivider className="my-6" />
    
    <p className="text-muted-foreground mb-8">{product.description}</p>
    
    <TraditionalCard className="p-6 mb-8">
      <p className="text-2xl font-bold text-primary mb-4">
        ₹{product.price}
      </p>
      <TraditionalButton 
        variant="primary" 
        className="w-full"
        onClick={handleAddToCart}
      >
        Add to Cart
      </TraditionalButton>
    </TraditionalCard>
  </div>
</div>
```

---

## 🎨 CSS Classes Reference

### Typography Classes
```css
.heading-ornate              /* Large ornate headings */
.subheading-traditional      /* Uppercase section headings */
.text-shadow-traditional     /* Decorative text shadow */
```

### Card & Container Classes
```css
.card-ornate                 /* Ornate card styling */
.divider-ornate              /* Decorative divider line */
.border-ornate               /* Ornate borders */
```

### Animation Classes
```css
.animate-sway                /* Gentle swaying */
.animate-glow                /* Warm glow effect */
.animate-rotate-slow         /* Slow rotation */
.animate-spin-gentle         /* 3D spin effect */
```

### Pattern Classes
```css
.spice-pattern               /* Spice background pattern */
.mandala-pattern             /* Mandala circular pattern */
```

---

## 🎯 Color Usage Examples

### Applying Saffron Color
```tsx
<div className="bg-primary text-primary-foreground">
  Content with saffron background
</div>

<div className="border-2 border-primary">
  Saffron border
</div>

<div className="text-primary">
  Saffron text
</div>
```

### Applying Accent Color (Chili Red)
```tsx
<div className="bg-accent text-accent-foreground">
  Content with accent background
</div>

<div className="bg-accent/10 text-accent">
  Accent highlight
</div>
```

### Applying Gradients
```tsx
<div className="bg-gradient-spice text-white">
  Gradient spice background
</div>

<div className="bg-gradient-warm">
  Warm gradient background
</div>

<div className="text-gradient-spice">
  Gradient text
</div>
```

---

## 📱 Responsive Classes

All traditional components are responsive:

```tsx
{/* Responsive grid */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

{/* Responsive padding */}
<div className="p-4 md:p-8 lg:p-12">

{/* Responsive text */}
<h1 className="text-2xl md:text-4xl lg:text-6xl">

{/* Responsive spacing */}
<div className="mb-4 md:mb-8 lg:mb-12">
```

---

## ✨ Pro Tips

1. **Always use `MandalaShape`** in section headers for traditional touch
2. **Use `TraditionalDivider`** between major sections
3. **Apply `TraditionalCard`** for important content blocks
4. **Use `highlight={true}`** on featured cards
5. **Combine `OrnateTopBorder`** with section titles
6. **Use animations sparingly** for performance

---

## 🔄 Consistency Guidelines

- Always use **Playfair Display** for headings
- Always use **Poppins** for body text
- Always use **primary (saffron)** for brand elements
- Always use **accent (chili)** for CTAs and highlights
- Always use **TraditionalCard** for content boxes
- Always use **TraditionalDivider** between sections

---

**Your UI will look authentically Indian and traditional! 🇮🇳✨**
