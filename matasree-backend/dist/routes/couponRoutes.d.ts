declare const router: import("express-serve-static-core").Router;
/**
 * Generate a unique, unambiguous coupon code
 * Removes confusing characters: 0/O, 1/I/L, 5/S, 2/Z
 */
declare function generateUniqueCode(prefix?: string): string;
export { generateUniqueCode };
export default router;
//# sourceMappingURL=couponRoutes.d.ts.map