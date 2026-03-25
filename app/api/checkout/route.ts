import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16' as any, // The TS fix!
});

export async function POST(req: Request) {
  try {
    const { priceId, userId, email } = await req.json();

    // Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      client_reference_id: userId, // We pass your Supabase User ID here to track who paid!
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      // Redirect back to dashboard after payment
      success_url: `https://digital-heroes-golf-platform-chi.vercel.app/dashboard?success=true`,
      cancel_url: `https://digital-heroes-golf-platform-chi.vercel.app/dashboard?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}