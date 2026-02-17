import mongoose from 'mongoose';
export interface ICategory {
    _id: mongoose.Types.ObjectId;
    name: string;
    slug: string;
    description?: string;
    image?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<ICategory, {}, {}, {}, mongoose.Document<unknown, {}, ICategory, {}, {}> & ICategory & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Category.d.ts.map