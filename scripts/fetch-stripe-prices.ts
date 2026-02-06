/**
 * Fetch Stripe Products & Prices
 *
 * This script fetches all active products and prices from Stripe
 * and generates a typed config file for use in the app.
 *
 * Run with: npx tsx scripts/fetch-stripe-prices.ts
 */

import Stripe from 'stripe';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from app/.env.local
const envPath = path.resolve(__dirname, '../app/.env.local');
dotenv.config({ path: envPath });

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY not found in environment');
  console.error(`   Checked: ${envPath}`);
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

// Expected products mapping (name -> config key)
const SUBSCRIPTION_MAPPING: Record<string, { key: string; sessionsPerWeek: number; description: string }> = {
  'M3 Starter': { key: 'starter', sessionsPerWeek: 1, description: 'Perfect for getting started — 1 session per week' },
  'M3 Foundation': { key: 'foundation', sessionsPerWeek: 2, description: 'Build your foundation — 2 sessions per week' },
  'M3 Competitor': { key: 'competitor', sessionsPerWeek: 3, description: 'Compete at the next level — 3 sessions per week' },
  'M3 Elite': { key: 'elite', sessionsPerWeek: -1, description: 'Unlimited sessions for serious athletes' },
};

const ONE_TIME_MAPPING: Record<string, { key: string; sessions: number; description: string }> = {
  'Drop-in Session': { key: 'dropIn', sessions: 1, description: '1-hour training session' },
  '5-Pack x 1hr': { key: 'fivePack', sessions: 5, description: '5 training sessions — save $140' },
  '10-Pack x 1hr': { key: 'tenPack', sessions: 10, description: '10 training sessions — best value' },
  // Alternative names that might be in Stripe
  'Drop-in': { key: 'dropIn', sessions: 1, description: '1-hour training session' },
  '5-Pack': { key: 'fivePack', sessions: 5, description: '5 training sessions — save $140' },
  '10-Pack': { key: 'tenPack', sessions: 10, description: '10 training sessions — best value' },
  '5 Session Pack': { key: 'fivePack', sessions: 5, description: '5 training sessions — save $140' },
  '10 Session Pack': { key: 'tenPack', sessions: 10, description: '10 training sessions — best value' },
  '5-Pack x1hr': { key: 'fivePack', sessions: 5, description: '5 training sessions — save $140' },
  '10-Pack x1hr': { key: 'tenPack', sessions: 10, description: '10 training sessions — best value' },
};

interface ProductConfig {
  productId: string;
  priceId: string;
  name: string;
  price: number;
  description: string;
}

interface SubscriptionConfig extends ProductConfig {
  interval: 'month' | 'year';
  sessionsPerWeek: number;
}

interface OneTimeConfig extends ProductConfig {
  sessions: number;
}

async function fetchStripeData() {
  console.log('🔄 Fetching products from Stripe...\n');

  // Fetch all active products with their default prices
  const products = await stripe.products.list({
    active: true,
    expand: ['data.default_price'],
    limit: 100,
  });

  // Fetch all active prices
  const prices = await stripe.prices.list({
    active: true,
    limit: 100,
  });

  console.log(`📦 Found ${products.data.length} active products`);
  console.log(`💰 Found ${prices.data.length} active prices\n`);

  // Build price lookup by product ID
  const pricesByProduct: Record<string, Stripe.Price[]> = {};
  for (const price of prices.data) {
    const productId = typeof price.product === 'string' ? price.product : price.product.id;
    if (!pricesByProduct[productId]) {
      pricesByProduct[productId] = [];
    }
    pricesByProduct[productId].push(price);
  }

  const subscriptions: Record<string, SubscriptionConfig> = {};
  const oneTime: Record<string, OneTimeConfig> = {};
  const unmapped: Array<{ name: string; id: string; prices: string[] }> = [];

  for (const product of products.data) {
    const productPrices = pricesByProduct[product.id] || [];
    const productName = product.name;

    // Check if it's a subscription product
    const subMapping = SUBSCRIPTION_MAPPING[productName];
    if (subMapping) {
      // Find the recurring price
      const recurringPrice = productPrices.find(p => p.recurring?.interval === 'month');
      if (recurringPrice) {
        subscriptions[subMapping.key] = {
          productId: product.id,
          priceId: recurringPrice.id,
          name: productName,
          price: recurringPrice.unit_amount || 0,
          interval: 'month',
          sessionsPerWeek: subMapping.sessionsPerWeek,
          description: subMapping.description,
        };
        console.log(`✅ Mapped subscription: ${productName} → ${subMapping.key}`);
      } else {
        console.log(`⚠️  No monthly price found for: ${productName}`);
      }
      continue;
    }

    // Check if it's a one-time product
    const oneTimeMapping = ONE_TIME_MAPPING[productName];
    if (oneTimeMapping) {
      // Find the one-time price (prefer one_time, fall back to any price)
      let price = productPrices.find(p => p.type === 'one_time');
      if (!price && productPrices.length > 0) {
        // Fallback: use any price if no one-time price exists
        price = productPrices[0];
        console.log(`⚠️  ${productName}: No one-time price, using ${price.type} price as fallback`);
      }
      if (price) {
        oneTime[oneTimeMapping.key] = {
          productId: product.id,
          priceId: price.id,
          name: productName,
          price: price.unit_amount || 0,
          sessions: oneTimeMapping.sessions,
          description: oneTimeMapping.description,
        };
        console.log(`✅ Mapped one-time: ${productName} → ${oneTimeMapping.key}`);
      } else {
        console.log(`⚠️  No price found for: ${productName}`);
      }
      continue;
    }

    // Unmapped product
    unmapped.push({
      name: productName,
      id: product.id,
      prices: productPrices.map(p => `${p.id} (${p.type}, ${p.unit_amount ? p.unit_amount / 100 : 0})`),
    });
  }

  if (unmapped.length > 0) {
    console.log('\n⚠️  Unmapped products (not in expected mapping):');
    for (const p of unmapped) {
      console.log(`   - ${p.name} (${p.id})`);
      console.log(`     Prices: ${p.prices.join(', ') || 'none'}`);
    }
  }

  return { subscriptions, oneTime };
}

function generateConfigFile(subscriptions: Record<string, SubscriptionConfig>, oneTime: Record<string, OneTimeConfig>) {
  const content = `/**
 * Stripe Products Configuration
 *
 * Auto-generated by scripts/fetch-stripe-prices.ts
 * Generated: ${new Date().toISOString()}
 *
 * DO NOT EDIT MANUALLY - Run the script to regenerate
 */

export const STRIPE_PRODUCTS = {
  subscriptions: {
${Object.entries(subscriptions)
  .map(([key, config]) => `    ${key}: {
      productId: '${config.productId}',
      priceId: '${config.priceId}',
      name: '${config.name}',
      price: ${config.price}, // cents ($${(config.price / 100).toFixed(2)})
      interval: '${config.interval}',
      sessionsPerWeek: ${config.sessionsPerWeek},
      description: '${config.description}',
    }`)
  .join(',\n')}
  },
  oneTime: {
${Object.entries(oneTime)
  .map(([key, config]) => `    ${key}: {
      productId: '${config.productId}',
      priceId: '${config.priceId}',
      name: '${config.name}',
      price: ${config.price}, // cents ($${(config.price / 100).toFixed(2)})
      sessions: ${config.sessions},
      description: '${config.description}',
    }`)
  .join(',\n')}
  },
} as const;

export type SubscriptionTier = keyof typeof STRIPE_PRODUCTS.subscriptions;
export type OneTimePurchase = keyof typeof STRIPE_PRODUCTS.oneTime;

// Helper to get all subscription tiers as array
export const SUBSCRIPTION_TIERS = Object.keys(STRIPE_PRODUCTS.subscriptions) as SubscriptionTier[];

// Helper to get all one-time purchases as array
export const ONE_TIME_PURCHASES = Object.keys(STRIPE_PRODUCTS.oneTime) as OneTimePurchase[];

// Price lookup helpers
export function getSubscriptionPrice(tier: SubscriptionTier) {
  return STRIPE_PRODUCTS.subscriptions[tier];
}

export function getOneTimePrice(purchase: OneTimePurchase) {
  return STRIPE_PRODUCTS.oneTime[purchase];
}

// Get price ID by product type and key
export function getPriceId(type: 'subscription' | 'oneTime', key: string): string | null {
  if (type === 'subscription' && key in STRIPE_PRODUCTS.subscriptions) {
    return STRIPE_PRODUCTS.subscriptions[key as SubscriptionTier].priceId;
  }
  if (type === 'oneTime' && key in STRIPE_PRODUCTS.oneTime) {
    return STRIPE_PRODUCTS.oneTime[key as OneTimePurchase].priceId;
  }
  return null;
}
`;

  return content;
}

function generateEnvSnippet(subscriptions: Record<string, SubscriptionConfig>, oneTime: Record<string, OneTimeConfig>) {
  const lines = [
    '# =============================================',
    '# Stripe Price IDs (Auto-generated reference)',
    `# Generated: ${new Date().toISOString()}`,
    '# =============================================',
    '',
    '# Subscription Prices (monthly)',
  ];

  for (const [key, config] of Object.entries(subscriptions)) {
    lines.push(`STRIPE_PRICE_${key.toUpperCase()}=${config.priceId}`);
  }

  lines.push('', '# One-Time Prices');

  for (const [key, config] of Object.entries(oneTime)) {
    lines.push(`STRIPE_PRICE_${key.toUpperCase()}=${config.priceId}`);
  }

  return lines.join('\n');
}

async function main() {
  try {
    const { subscriptions, oneTime } = await fetchStripeData();

    // Check if we got all expected products
    const expectedSubs = ['starter', 'foundation', 'competitor', 'elite'];
    const expectedOneTime = ['dropIn', 'fivePack', 'tenPack'];

    const missingSubs = expectedSubs.filter(k => !subscriptions[k]);
    const missingOneTime = expectedOneTime.filter(k => !oneTime[k]);

    if (missingSubs.length > 0) {
      console.log(`\n⚠️  Missing subscription products: ${missingSubs.join(', ')}`);
    }
    if (missingOneTime.length > 0) {
      console.log(`\n⚠️  Missing one-time products: ${missingOneTime.join(', ')}`);
    }

    // Generate config file
    const configContent = generateConfigFile(subscriptions, oneTime);
    const configPath = path.resolve(__dirname, '../app/src/lib/stripe/products.ts');

    // Ensure directory exists
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    fs.writeFileSync(configPath, configContent, 'utf-8');
    console.log(`\n✅ Config file written to: ${configPath}`);

    // Generate env snippet
    const envSnippet = generateEnvSnippet(subscriptions, oneTime);
    const envSnippetPath = path.resolve(__dirname, '../stripe-prices.env.example');
    fs.writeFileSync(envSnippetPath, envSnippet, 'utf-8');
    console.log(`✅ Env snippet written to: ${envSnippetPath}`);

    // Summary
    console.log('\n📊 Summary:');
    console.log(`   Subscriptions: ${Object.keys(subscriptions).length}`);
    for (const [key, config] of Object.entries(subscriptions)) {
      console.log(`     - ${key}: $${(config.price / 100).toFixed(2)}/mo`);
    }
    console.log(`   One-time: ${Object.keys(oneTime).length}`);
    for (const [key, config] of Object.entries(oneTime)) {
      console.log(`     - ${key}: $${(config.price / 100).toFixed(2)} (${config.sessions} session${config.sessions > 1 ? 's' : ''})`);
    }

    console.log('\n✨ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
