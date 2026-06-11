/**
 * SeasonalBanner Model
 * Admin-managed promotional banners with an active date range.
 * Frontend filters client-side by current date within activeFrom–activeTo.
 */
import mongoose from 'mongoose';
export interface ISeasonalBanner {
    _id: mongoose.Types.ObjectId;
    image: string;
    title: string;
    subtitle?: string;
    ctaLink: string;
    ctaText: string;
    activeFrom: Date;
    activeTo: Date;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<ISeasonalBanner, {}, {}, {}, mongoose.Document<unknown, {}, ISeasonalBanner, {}, {}> & ISeasonalBanner & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=SeasonalBanner.d.ts.map