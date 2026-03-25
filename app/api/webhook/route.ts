import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16' as any, // The TS fix!
});

// Initialize Supabase for the backend
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(req: Request) {
  const payload = await req.text();
  
  let event;
  try {
    event = JSON.parse(payload);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Check if the event is a successful payment
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id; 

    if (userId) {
      // Update the user's subscription status in Supabase to 'active'
      const { error } = await supabase
        .from('users')
        .update({ subscription_status: 'active' })
        .eq('id', userId);

      if (error) {
        console.error("Supabase update error:", error);
        return NextResponse.json({ error: "Database update failed" }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}