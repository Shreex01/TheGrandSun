import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')!

async function verifySignature(body: string, signature: string) {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(webhookSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const digest = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(body)))
  const expected = Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('')
  if (signature.length !== expected.length) return false
  let mismatch = 0
  for (let index = 0; index < expected.length; index += 1) {
    mismatch |= expected.charCodeAt(index) ^ signature.charCodeAt(index)
  }
  return mismatch === 0
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405)
  if (!supabaseUrl || !serviceRoleKey || !webhookSecret) {
    return jsonResponse({ error: 'Webhook is not configured.' }, 503)
  }

  const rawBody = await request.text()
  const signature = request.headers.get('x-razorpay-signature') ?? ''
  if (!await verifySignature(rawBody, signature)) {
    return jsonResponse({ error: 'Invalid webhook signature.' }, 401)
  }

  try {
    const event = JSON.parse(rawBody)
    if (event.event !== 'payment_link.paid') return jsonResponse({ received: true })

    const paymentLink = event.payload?.payment_link?.entity
    const payment = event.payload?.payment?.entity
    if (paymentLink?.status !== 'paid' || typeof paymentLink.reference_id !== 'string'
      || typeof paymentLink.id !== 'string' || typeof paymentLink.amount_paid !== 'number') {
      return jsonResponse({ error: 'The paid event is missing required payment details.' }, 400)
    }

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { error } = await serviceClient.rpc('fulfill_razorpay_order', {
      p_order_id: paymentLink.reference_id,
      p_payment_link_id: paymentLink.id,
      p_payment_id: typeof payment?.id === 'string' ? payment.id : '',
      p_amount_paid_paise: paymentLink.amount_paid,
    })
    if (error) {
      console.error('Payment fulfillment failed', error.message)
      return jsonResponse({ error: 'Payment fulfillment failed; retry this webhook.' }, 500)
    }
    return jsonResponse({ received: true })
  } catch (error) {
    console.error('Razorpay webhook processing failed', error instanceof Error ? error.message : 'Unknown error')
    return jsonResponse({ error: 'Unable to process the payment event.' }, 500)
  }
})
