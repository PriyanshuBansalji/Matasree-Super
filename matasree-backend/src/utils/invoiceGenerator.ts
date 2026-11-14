/**
 * Professional Invoice Generator Utility
 * Generates GST compliant HTML invoices for customer orders.
 */
import { escapeHtml } from './email';

export interface InvoiceOrderData {
  orderNumber: string;
  invoiceNumber: string;
  invoiceDate: Date;
  items: Array<{
    name: string;
    variant?: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  shippingCharge: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
}

export const generateInvoiceHtml = (data: InvoiceOrderData): string => {
  const safeOrderNum = escapeHtml(data.orderNumber);
  const safeInvNum = escapeHtml(data.invoiceNumber);
  const invDateStr = new Date(data.invoiceDate).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const addr = data.shippingAddress;
  const safeName = escapeHtml(addr.fullName);
  const safeAddrLine1 = escapeHtml(addr.addressLine1);
  const safeAddrLine2 = escapeHtml(addr.addressLine2 || '');
  const safeCity = escapeHtml(addr.city);
  const safeState = escapeHtml(addr.state);
  const safePin = escapeHtml(addr.pincode);
  const safePhone = escapeHtml(addr.phone);

  const itemRows = data.items
    .map(
      (item, idx) => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:center;">${idx + 1}</td>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;">
          <strong>${escapeHtml(item.name)}</strong>
          ${item.variant ? `<br><small style="color:#6b7280;">Variant: ${escapeHtml(item.variant)}</small>` : ''}
        </td>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:right;">₹${item.price.toFixed(2)}</td>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:bold;">₹${(item.price * item.quantity).toFixed(2)}</td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice - ${safeInvNum} | Matasree Super</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; color: #111827; background-color: #ffffff; }
    .invoice-card { max-width: 800px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; padding: 30px; }
    .header-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    .company-title { font-size: 26px; font-weight: 800; color: #ff8c00; margin: 0; }
    .company-sub { font-size: 13px; color: #6b7280; margin-top: 4px; }
    .invoice-title { font-size: 24px; font-weight: 800; text-align: right; color: #111827; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
    .inv-details { font-size: 13px; color: #4b5563; text-align: right; margin-top: 6px; }
    .address-section { display: flex; justify-content: space-between; margin-bottom: 30px; gap: 20px; }
    .box { width: 48%; background: #f9fafb; border: 1px solid #f3f4f6; padding: 15px; border-radius: 6px; font-size: 13px; line-height: 1.6; }
    .box h4 { margin: 0 0 8px 0; color: #ff8c00; font-size: 14px; text-transform: uppercase; }
    table.items-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 14px; }
    table.items-table th { background: #fff8f0; color: #ff8c00; padding: 10px; border-bottom: 2px solid #ff8c00; text-align: left; }
    .totals-table { width: 300px; margin-left: auto; border-collapse: collapse; font-size: 14px; }
    .totals-table td { padding: 6px 10px; }
    .grand-total { font-size: 18px; font-weight: 800; color: #ff8c00; border-top: 2px solid #ff8c00; border-bottom: 2px solid #ff8c00; }
    .footer-note { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; }
    @media print {
      body { padding: 0; }
      .invoice-card { border: none; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <table class="header-table">
      <tr>
        <td style="vertical-align:top;">
          <div class="company-title">🌶️ Matasree Super</div>
          <div class="company-sub">Premium Spices &amp; Authentic Masalas</div>
          <div class="company-sub">Clement Town, Dehradun, Uttarakhand - 248002</div>
          <div class="company-sub">GSTIN: 05AAAAA0000A1Z5 | Support: admin@matasreesuper.com</div>
        </td>
        <td style="vertical-align:top;">
          <div class="invoice-title">Tax Invoice</div>
          <div class="inv-details"><strong>Invoice No:</strong> ${safeInvNum}</div>
          <div class="inv-details"><strong>Invoice Date:</strong> ${invDateStr}</div>
          <div class="inv-details"><strong>Order No:</strong> ${safeOrderNum}</div>
        </td>
      </tr>
    </table>

    <table style="width:100%;margin-bottom:25px;font-size:13px;">
      <tr>
        <td style="width:50%;vertical-align:top;padding-right:10px;">
          <div class="box" style="width:100%;">
            <h4>Billed &amp; Shipped To:</h4>
            <strong>${safeName}</strong><br>
            ${safeAddrLine1}${safeAddrLine2 ? `, ${safeAddrLine2}` : ''}<br>
            ${safeCity}, ${safeState} - ${safePin}<br>
            📞 ${safePhone}
          </div>
        </td>
        <td style="width:50%;vertical-align:top;padding-left:10px;">
          <div class="box" style="width:100%;">
            <h4>Payment Information:</h4>
            <strong>Payment Method:</strong> ${escapeHtml(data.paymentMethod.toUpperCase())}<br>
            <strong>Payment Status:</strong> ${escapeHtml(data.paymentStatus.toUpperCase())}<br>
            <strong>Currency:</strong> INR (₹)
          </div>
        </td>
      </tr>
    </table>

    <table class="items-table">
      <thead>
        <tr>
          <th style="text-align:center;width:40px;">#</th>
          <th>Item &amp; Description</th>
          <th style="text-align:center;width:60px;">Qty</th>
          <th style="text-align:right;width:100px;">Price</th>
          <th style="text-align:right;width:110px;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>

    <table class="totals-table">
      <tr>
        <td>Subtotal:</td>
        <td style="text-align:right;">₹${data.subtotal.toFixed(2)}</td>
      </tr>
      ${data.discountAmount > 0 ? `<tr><td style="color:#22c55e;">Discount:</td><td style="text-align:right;color:#22c55e;">-₹${data.discountAmount.toFixed(2)}</td></tr>` : ''}
      <tr>
        <td>Shipping Charges:</td>
        <td style="text-align:right;">${data.shippingCharge === 0 ? 'FREE' : `₹${data.shippingCharge.toFixed(2)}`}</td>
      </tr>
      <tr class="grand-total">
        <td>Grand Total:</td>
        <td style="text-align:right;">₹${data.totalAmount.toFixed(2)}</td>
      </tr>
    </table>

    <div class="footer-note">
      <p style="margin:0 0 4px 0;">This is a computer-generated tax invoice. No signature required.</p>
      <p style="margin:0;">Thank you for shopping with Matasree Super! Genuine products &amp; 100% stone ground spices.</p>
    </div>
  </div>
</body>
</html>`;
};
