/**
 * Recipe Model
 * Stores Indian recipes that can be linked to spice products via productTags.
 * Supports filtering by regional cuisine and product association.
 */
import mongoose from 'mongoose';
export type RecipeRegion = 'North Indian' | 'South Indian' | 'Bengali' | 'Rajasthani' | 'Other';
export interface IRecipe {
    _id: mongoose.Types.ObjectId;
    title: string;
    description: string;
    ingredients: string[];
    steps: string[];
    productTags: string[];
    region: RecipeRegion;
    image?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IRecipe, {}, {}, {}, mongoose.Document<unknown, {}, IRecipe, {}, {}> & IRecipe & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Recipe.d.ts.map