/**
 * Cart Abandonment Job
 *
 * Runs every 30 minutes to detect abandoned carts and send reminder emails.
 *
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5
 */
import cron from 'node-cron';
import mongoose from 'mongoose';
import Cart from '../models/Cart';
import Order from '../models/Order';
import User from '../models/User';
import AdminConfig from '../models/AdminConfig';
import { sendEmail } from '../utils/email';

// ---------------------------------------------------------------
// Types
// ---------------------------------------------------------------

interface AbandonmentConfig {
  abandonWindowHours: number;
  abandonmentCouponCode: string | null;
}

// ---------------------------------------------------------------
// Config helpers
// ---------------------------------------------------------------

/**
 * Read abandonment settings from AdminConfig collection.
 * Falls back to safe defaults when keys are absent.
 */
const getAbandonmentConfig = async (): Promise<AbandonmentConfig> => {
  const [windowDoc, couponDoc] = await Promise.all([
    AdminConfig.findOne({ key: 'abandonmentWindowHours' }),
    AdminConfig.findOne({ key: 'abandonmentCouponCode' }),
  ]);

  return {
    abandonWindowHours:
      windowDoc && typeof windowDoc.value === 'number' ? windowDoc.value : 2,
    abandonmentCouponCode:
      couponDoc && typeof couponDoc.value === 'string' && couponDoc.value.trim()
        ? couponDoc.value.trim()
        : null,
  };
};

// ---------------------------------------------------------------
// Email builder
// ---------------------------------------------------------------

const buildAbandonmentEmailHtml = (params: {
  userName: string;
  items: Array<{ name: string; quantity: number; price: number; image?: string }>;
  cartUrl: string;
  couponCode: string | null;
}): string => {
  const { userName, items, cartUrl, couponCode } = params;

  const itemRows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;">
          ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width:48px;height:48px;object-fit:cover;border-radius:4px;vertical-align:middle;margin-right:8px;">` : ''}
          ${item.name}
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:center;">${item.quantity}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:right;">₹${(item.price * item.quantity).toFixed(2)}</td>
      </tr>`
    )
    .join('');

  const couponBlock = couponCode
    ? `
      <div style="background:#fff8f0;border:2px dashed #ff8c00;border-radius:8px;padding:16px 20px;margin:20px 0;text-align:center;">
        <p style="margin:0 0 8px 0;color:#666;font-size:13px;">🎁 USE THIS COUPON AT CHECKOUT</p>
        <p style="margin:0;font-size:22px;font-weight:bold;color:#ff8c00;letter-spacing:3px;">${couponCode}</p>
      </div>`
    : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #ff8c00, #e65c00); padding: 30px 40px; text-align: center; }
        .logo { font-size: 28px; font-weight: bold; color: #fff; }
        .tagline { color: rgba(255,255,255,0.85); font-size: 13px; margin-top: 4px; }
        .body { padding: 30px 40px; }
        table { width: 100%; border-collapse: collapse; font-size: 14px; }
        thead tr { background-color: #fff8f0; }
        thead th { padding: 10px 12px; text-align: left; color: #ff8c00; font-weight: bold; border-bottom: 2px solid #ff8c00; }
        thead th:nth-child(2) { text-align: center; }
        thead th:nth-child(3) { text-align: right; }
        .cta-btn { display: inline-block; background: #ff8c00; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: bold; margin: 24px 0; }
        .footer { background-color: #f5f5f5; text-align: center; padding: 20px; color: #999; font-size: 12px; border-top: 1px solid #eee; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🌶️ Matasree</div>
          <div class="tagline">Premium Spices &amp; Masalas</div>
        </div>
        <div class="body">
          <h2 style="color:#333;margin-top:0;">Hey ${userName}, you left something behind! 🛒</h2>
          <p style="color:#555;font-size:14px;">Your cart is waiting for you. Don't miss out on these delicious spices:</p>

          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
          </table>

          ${couponBlock}

          <div style="text-align:center;">
            <a href="${cartUrl}" class="cta-btn">Complete Your Order →</a>
          </div>

          <p style="color:#999;font-size:12px;text-align:center;">
            If you no longer wish to receive these reminders, you can ignore this email.
          </p>
        </div>
        <div class="footer">
          <p>© 2026 Matasree. All rights reserved.</p>
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// ---------------------------------------------------------------
// Core job logic
// ---------------------------------------------------------------

export const runCartAbandonmentJob = async (): Promise<void> => {
  console.log('🕐 [CartAbandonmentJob] Starting run…');

  try {
    // 1. Read config at runtime (Req 14.5)
    const { abandonWindowHours, abandonmentCouponCode } = await getAbandonmentConfig();
    const abandonWindow = abandonWindowHours * 60 * 60 * 1000;
    const cutoffTime = new Date(Date.now() - abandonWindow);

    console.log(
      `🕐 [CartAbandonmentJob] abandonWindowHours=${abandonWindowHours}, cutoff=${cutoffTime.toISOString()}`
    );

    // 2. Find abandoned carts (Req 14.1, 14.2)
    const abandonedCarts = await Cart.find({
      updatedAt: { $lt: cutoffTime },
      abandonmentEmailSentAt: null,
      'items.0': { $exists: true },
    }).populate<{
      items: Array<{
        productId: {
          _id: mongoose.Types.ObjectId;
          name: string;
          price: number;
          images?: string[];
        };
        quantity: number;
        price: number;
      }>;
    }>('items.productId', 'name price images');

    console.log(`🕐 [CartAbandonmentJob] Found ${abandonedCarts.length} abandoned cart(s)`);

    for (const cart of abandonedCarts) {
      try {
        // 3. Skip if an order was placed after the cart was last updated (Req 14.4)
        const subsequentOrder = await Order.findOne({
          userId: cart.userId,
          createdAt: { $gt: cart.updatedAt },
        });

        if (subsequentOrder) {
          console.log(
            `⏭️  [CartAbandonmentJob] Skipping cart ${cart._id} — order found after cart update`
          );
          // Mark as sent so we don't re-process it endlessly
          cart.abandonmentEmailSentAt = new Date();
          await cart.save();
          continue;
        }

        // 4. Look up the user's email
        const user = await User.findById(cart.userId).select('name email');
        if (!user || !user.email) {
          console.warn(
            `⚠️  [CartAbandonmentJob] No user/email for cart ${cart._id}, skipping`
          );
          continue;
        }

        // 5. Build email content (Req 14.2, 14.3)
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
        const cartUrl = `${frontendUrl}/cart`;

        const emailItems = cart.items
          .filter((item) => item.productId) // guard against stale refs
          .map((item) => {
            const product = item.productId as any;
            return {
              name: product?.name ?? 'Product',
              quantity: item.quantity,
              price: item.price,
              image: product?.images?.[0] ?? undefined,
            };
          });

        if (emailItems.length === 0) {
          console.warn(
            `⚠️  [CartAbandonmentJob] Cart ${cart._id} has no resolvable items, skipping`
          );
          continue;
        }

        const html = buildAbandonmentEmailHtml({
          userName: user.name,
          items: emailItems,
          cartUrl,
          couponCode: abandonmentCouponCode,
        });

        // 6. Send abandonment email (Req 14.2)
        const sent = await sendEmail({
          email: user.email,
          subject: '🛒 You left something in your cart — Matasree',
          html,
        });

        if (sent) {
          // 7. Mark abandonment email as sent (Req 14.3)
          cart.abandonmentEmailSentAt = new Date();
          await cart.save();
          console.log(
            `✅ [CartAbandonmentJob] Abandonment email sent for cart ${cart._id} → ${user.email}`
          );
        } else {
          console.error(
            `❌ [CartAbandonmentJob] Failed to send email for cart ${cart._id}`
          );
        }
      } catch (cartError: any) {
        console.error(
          `❌ [CartAbandonmentJob] Error processing cart ${cart._id}:`,
          cartError.message
        );
        // Continue with the next cart rather than aborting the entire job
      }
    }

    console.log('✅ [CartAbandonmentJob] Run complete');
  } catch (err: any) {
    console.error('❌ [CartAbandonmentJob] Fatal error during run:', err.message);
  }
};

// ---------------------------------------------------------------
// Scheduler
// ---------------------------------------------------------------

/**
 * Initialize the cart abandonment cron job.
 * Schedules `runCartAbandonmentJob` every 30 minutes.
 * Call this once after the database connection is established.
 */
export const initCartAbandonmentJob = (): void => {
  // Every 30 minutes: "*/30 * * * *"
  cron.schedule('*/30 * * * *', () => {
    runCartAbandonmentJob().catch((err) =>
      console.error('❌ [CartAbandonmentJob] Unhandled error:', err)
    );
  });

  console.log('✅ [CartAbandonmentJob] Scheduled (every 30 minutes)');
};
