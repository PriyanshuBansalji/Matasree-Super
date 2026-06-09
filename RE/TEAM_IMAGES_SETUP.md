# 📸 Team Member Images - Setup Guide

## Current Status
✅ Team member display components are ready with placeholder images from Unsplash
✅ Traditional theme layout is implemented
✅ All contact information is integrated

---

## 🖼️ How to Add Real Team Member Photos

### Option 1: Upload Images Locally

1. **Create Image Folder:**
   - Navigate to: `/matasree-superstore-main/public/images/team/`
   - Create the directory if it doesn't exist

2. **Add Images:**
   - Place team member photos in this folder
   - Recommended formats: `.jpg`, `.png`
   - Recommended size: 500x500px minimum (square)
   - Optimized size: 300x300px (for web)

3. **Update Image Paths in Code:**
   - Open: `/src/data/companyData.ts`
   - Replace the image URLs in the `teamMembers` array:

   ```typescript
   // Replace this:
   image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop',
   
   // With this (for local images):
   image: '/images/team/sanjay-bansal.jpg',
   ```

---

### Option 2: Use Cloud Image Storage

1. **Upload to Cloudinary, AWS S3, or Similar:**
   - Upload team photos to cloud storage
   - Get the public image URL

2. **Update Image URLs in Code:**
   - Open: `/src/data/companyData.ts`
   - Replace placeholder URLs with actual URLs

   ```typescript
   image: 'https://your-cloud-storage.com/images/sanjay-bansal.jpg',
   ```

---

### Option 3: Use Image URLs from Team (Recommended)

1. **Get Images from Team Members:**
   - Request professional headshots from each team member
   - Ask for image files or image URLs they have

2. **Update Image URLs:**
   - Open: `/src/data/companyData.ts`
   - Update the image URL for each team member

---

## 📝 Team Member Image Template

For each team member, update the `companyData.ts` file:

```typescript
{
  id: 1,
  name: 'MR. Sanjay Bansal',
  role: 'CEO & Chair Person',
  position: 'Executive',
  image: '/images/team/sanjay-bansal.jpg',  // ← UPDATE THIS
  email: 'sanjay@matasreesuper.com',
  instagram: '@sanjay.bansal',
  phone: '7505675163',
  bio: 'Visionary leader with decades of experience in spice industry'
}
```

---

## 🎯 Image Requirements

| Requirement | Specification |
|-------------|---------------|
| **Format** | JPG, PNG, WebP |
| **Aspect Ratio** | 1:1 (Square) |
| **Minimum Size** | 300x300px |
| **Recommended Size** | 500x500px |
| **File Size** | Under 200KB (for web) |
| **Background** | Professional/neutral |

---

## 📍 Current Placeholder Images

### Team Members (with placeholder URLs):
1. **MR. Sanjay Bansal** - Business man portrait
2. **MRS. Neha Bansal** - Professional woman portrait
3. **MR. Priyanshu Bansal** - Man portrait
4. **MS. Ishika Bansal** - Woman portrait

---

## ✏️ To Update Images:

**File Location:** `/matasree-superstore-main/src/data/companyData.ts`

**Find this section:**
```typescript
const teamMembers = [
  {
    id: 1,
    name: 'MR. Sanjay Bansal',
    role: 'CEO & Chair Person',
    image: 'https://images.unsplash.com/...',  // ← REPLACE THIS
    // ... other properties
  },
  // More team members...
];
```

**Replace with your image URLs:**
```typescript
image: '/images/team/sanjay-bansal.jpg',  // Local path
// OR
image: 'https://your-domain.com/sanjay-bansal.jpg',  // Cloud URL
```

---

## 🚀 Steps to Deploy with Real Images

1. ✅ Decide on image storage (local or cloud)
2. ✅ Prepare images (square, optimized)
3. ✅ Upload images to storage location
4. ✅ Get image URLs or paths
5. ✅ Update `/src/data/companyData.ts` with new URLs
6. ✅ Test in development (npm run dev)
7. ✅ Build for production (npm run build)
8. ✅ Deploy to server

---

## 💡 Pro Tips

✓ Use optimized images for faster loading  
✓ Maintain consistent image style for all team members  
✓ Use professional headshots  
✓ Ensure images display well on mobile devices  
✓ Keep file names simple (e.g., `sanjay-bansal.jpg`)  
✓ Use CDN for cloud images (faster delivery)  

---

## 🎨 Image Display Features

Your images will be displayed with:
- ✅ Responsive sizing (scales with device)
- ✅ Smooth hover zoom effect
- ✅ Professional gradient overlay on hover
- ✅ Shadow effects for depth
- ✅ Rounded corners styling
- ✅ Smooth transitions

---

**Ready to add team photos? Follow the steps above and your team will be displayed professionally! 📸**
