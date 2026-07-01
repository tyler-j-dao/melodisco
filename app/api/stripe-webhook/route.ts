import Stripe from "stripe";
import { updateOrderStatus } from "@/models/order";

export async function POST(req: Request) {
  // Stripe's retry behavior is driven by the HTTP status code, not a JSON
  // body, so this route returns real 2xx/4xx/5xx statuses instead of the
  // app's usual respOk/respErr (always-200) convention.
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    console.log("stripe webhook missing signature or STRIPE_WEBHOOK_SECRET");
    return Response.json({ message: "invalid request" }, { status: 400 });
  }

  const rawBody = await req.text();
  const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY || "");

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (e) {
    console.log("stripe webhook signature verification failed:", e);
    return Response.json({ message: "invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const order_no = session.metadata?.order_no;

      if (!order_no) {
        console.log(
          "checkout.session.completed missing order_no metadata:",
          session.id
        );
        return Response.json({ message: "ok" }, { status: 200 });
      }

      const paied_at = new Date().toISOString();
      await updateOrderStatus(order_no, 2, paied_at);
      console.log("order fulfilled via webhook:", order_no, paied_at);
    }

    return Response.json({ message: "ok" }, { status: 200 });
  } catch (e) {
    console.log("stripe webhook processing failed:", e);
    // 500 so Stripe retries a verified event that failed for a transient reason.
    return Response.json({ message: "processing failed" }, { status: 500 });
  }
}
