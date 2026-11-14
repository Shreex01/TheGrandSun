import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID')!
const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!

async function matchesPaymentSignature(orderId: string, paymentId: string, signature: string) {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(razorpayKeySecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const digest = new Uint8Array(await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`${orderId}|${paymentId}`),
  ))
  const expected = Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('')
  if (!/^[\da-f]{64}$/i.test(signature) || signature.length !== expected.length) return false
  let mismatch = 0
  for (let index = 0; index < expected.length; index += 1) {
    mismatch |= expected.charCodeAt(index) ^ signature.toLowerCase().charCodeAt(index)
  }
  return mismatch === 0
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405)
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !razorpayKeyId || !razorpayKeySecret) {
    return jsonResponse({ error: 'Payment verification is not configured. Contact the store administrator.' }, 503)
  }

  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return jsonResponse({ error: 'Sign in before verifying payment.' }, 401)

  try {
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data: { user }, error: authError } = await userClient.auth.getUser(token)
    if (authError || !user) return jsonResponse({ error: 'Your session is invalid. Sign in again.' }, 401)

    let body
    try {
      body = await request.json()
    } catch {
      return jsonResponse({ error: 'The request body must be valid JSON.' }, 400)
    }
    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = body ?? {}
    if (typeof orderId !== 'string' || !orderId || typeof paymentId !== 'string' || !paymentId
      || typeof signature !== 'string' || !signature) {
      return jsonResponse({ error: 'Payment order, payment, and signature fields are required.' }, 400)
    }
    if (!await matchesPaymentSignature(orderId, paymentId, signature)) {
      return jsonResponse({ error: 'Payment signature verification failed.' }, 400)
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data: order, error: orderError } = await adminClient
      .from('orders')
      .select('id,user_id,amount_paise,razorpay_order_id,status')
      .eq('razorpay_order_id', orderId)
      .maybeSingle()
    if (orderError) throw orderError
    if (!order || order.user_id !== user.id) return jsonResponse({ error: 'Order not found for this account.' }, 404)
    if (order.status === 'paid') return jsonResponse({ verified: true, order_record_id: order.id })
    if (order.status !== 'pending') return jsonResponse({ error: 'This order is no longer payable.' }, 409)

    const paymentResponse = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}` },
    })
    let payment
    try {
      payment = await paymentResponse.json()
    } catch {
      payment = null
    }
    if (paymentResponse.status === 401) return jsonResponse({ error: 'Razorpay rejected the API credentials.' }, 401)
    if (!paymentResponse.ok) {
      console.error('Razorpay payment lookup failed', payment?.error?.code ?? paymentResponse.status)
      return jsonResponse({ error: 'Unable to confirm this payment with Razorpay.' }, 500)
    }
    if (payment.order_id !== orderId || payment.amount !== order.amount_paise || payment.currency !== 'INR') {
      return jsonResponse({ error: 'Payment details do not match this order.' }, 400)
    }
    if (payment.status === 'authorized') {
      const captureResponse = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}/capture`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: order.amount_paise, currency: 'INR' }),
      })
      try {
        payment = await captureResponse.json()
      } catch {
        payment = null
      }
      if (captureResponse.status === 401) return jsonResponse({ error: 'Razorpay rejected the API credentials.' }, 401)
      if (!captureResponse.ok) {
        console.error('Razorpay payment capture failed', payment?.error?.code ?? captureResponse.status)
        return jsonResponse({ error: 'Unable to capture this payment with Razorpay.' }, 500)
      }
    }
    if (payment.status !== 'captured') {
      return jsonResponse({ error: 'Payment has not been captured yet.' }, 409)
    }

    const { error: fulfillmentError } = await adminClient.rpc('fulfill_razorpay_standard_order', {
      p_order_id: order.id,
      p_razorpay_order_id: orderId,
      p_payment_id: paymentId,
      p_amount_paid_paise: payment.amount,
    })
    if (fulfillmentError) {
      console.error('Payment fulfillment failed', fulfillmentError.message)
      return jsonResponse({ error: 'Payment was received, but purchase access could not be updated. Contact support.' }, 500)
    }
    return jsonResponse({ verified: true, order_record_id: order.id })
  } catch (error) {
    console.error('Payment verification failed', error instanceof Error ? error.message : 'Unknown error')
    return jsonResponse({ error: 'Unable to verify this payment. Please try again.' }, 500)
  }
})
