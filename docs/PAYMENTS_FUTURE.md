# AURA Production Payment Gateway Integration Blueprint

> **Status**: Future Roadmap & Commercial Implementation Guide  
> **Current Supported Methods**: `Cash on Counter / Delivery` & `Pay at Table` (Waiter POS)  
> **Mandate**: Zero mock or simulated financial transactions. No raw card PAN/CVV may ever be transmitted to or processed by the application server.

---

## 1. Architectural Strategy

To integrate digital payments in a commercial production deployment:
1. **PCI-DSS Compliance via Client SDK**:
   All card data collection must occur inside certified third-party iframes or native mobile SDKs (e.g. Stripe Elements, JazzCash Mobile SDK, PayFast Checkout).
   The application server never sees, transmits, logs, or stores primary account numbers (PAN) or security codes (CVV).
2. **Webhook-Driven Asynchronous Settlement**:
   Payment status transitions (`Unpaid` ➔ `Paid`) must be triggered solely by cryptographically verified server-to-server webhooks from the payment gateway using webhook secret signatures.
3. **Idempotent Transaction Handling**:
   Every gateway order ID and idempotency key is recorded to guarantee no duplicate charges occur during mobile network retries.

---

## 2. Recommended Gateways for Pakistan & International Operations

### Option A: PayFast / Safepay (Pakistan Multi-Rail)
- **Coverage**: Visa, Mastercard, PayPak, UnionPay, JazzCash, EasyPaisa, Bank Accounts.
- **Workflow**:
  1. Client sends `POST /api/payments/checkout-session` to backend.
  2. Backend requests a checkout token from Safepay/PayFast API using merchant secret keys.
  3. Client opens secure checkout webview or native sheet.
  4. Webhook (`POST /api/payments/webhook`) validates HMAC signature and updates order `paymentStatus: 'Paid'`.

### Option B: JazzCash Direct Merchant API (HTTP Push / MPIN)
- **Coverage**: 11-digit JazzCash mobile accounts.
- **Workflow**:
  1. Backend signs request with Merchant ID and Integrity Salt.
  2. Gateway sends an automatic USSD prompt to customer's physical mobile handset.
  3. Customer inputs their private 4-digit MPIN on their phone dialer.
  4. JazzCash IPN (Instant Payment Notification) posts confirmation to AURA backend.

### Option C: Stripe (International Cards & Apple Pay / Google Pay)
- **Coverage**: Global Visa, Mastercard, American Express, Apple Pay, Google Pay.
- **Integration**: `@stripe/stripe-react-native` with PaymentSheet.
- **Backend**: `stripe.paymentIntents.create({ amount, currency: 'pkr' })`.

---

## 3. Required Environment Configuration Template

When business accounts are established, configure the following environment keys:

```bash
# Payment Provider Mode
PAYMENT_GATEWAY_PROVIDER=payfast # or 'stripe' | 'safepay'
PAYMENT_GATEWAY_ENV=sandbox      # or 'production'

# Provider Credentials (Sanitized Placeholders)
PAYMENT_MERCHANT_ID=your_merchant_id_here
PAYMENT_MERCHANT_KEY=your_secure_merchant_key_here
PAYMENT_WEBHOOK_SECRET=whsec_your_webhook_signature_secret_here
```

---

## 4. Current Safe Fallback

Until merchant gateway contracts are signed:
- **Dine-In Orders**: Guests select **Pay at Table** and settle directly with waitstaff via table cash or handheld POS terminal.
- **Takeaway / Pickup**: Guests select **Cash on Counter** and settle at the register.
- Zero fake OTPs, zero simulated card fields, zero compliance risk.

