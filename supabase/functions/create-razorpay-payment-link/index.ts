import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID')!
const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!
const appUrl = Deno.env.get('APP_URL')!

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405)
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !razorpayKeyId || !razorpayKeySecret || !appUrl) {
    return jsonResponse({ error: 'Payment checkout is not configured. Contact the store administrator.' }, 503)
  }

  const authorization = request.headers.get('Authorization')
  const token = authorization?.replace(/^Bearer\s+/i, '')
  if (!token) return jsonResponse({ error: 'Sign in before checkout.' }, 401)

  try {
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data: { user }, error: authError } = await userClient.auth.getUser(token)
    if (authError || !user?.email) return jsonResponse({ error: 'Your session is invalid. Sign in again.' }, 401)

    const body = await request.json()
    const productIds = body?.product_ids
    if (!Array.isArray(productIds) || productIds.length < 1 || productIds.length > 20
      || productIds.some((id) => typeof id !== 'string')
      || new Set(productIds).size !== productIds.length) {
      return jsonResponse({ error: 'Choose between 1 and 20 different products.' }, 400)
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const [courses, ebooks] = await Promise.all([
      adminClient.from('courses').select('id,title,price_inr,published').in('id', productIds),
      adminClient.from('ebooks').select('id,title,price_inr,published').in('id', productIds),
    ])
    if (courses.error) throw courses.error
    if (ebooks.error) throw ebooks.error

    const products = [
      ...courses.data.map((item) => ({ id: item.id, title: item.title, type: 'course', price: item.price_inr, published: item.published })),
      ...ebooks.data.map((item) => ({ id: item.id, title: item.title, type: 'ebook', price: item.price_inr, published: item.published })),
    ]
    if (products.length !== productIds.length || products.some((item) => !item.published)) {
      return jsonResponse({ error: 'One or more selected products are no longer available.' }, 409)
    }

    const amountPaise = products.reduce((sum, item) => sum + item.price * 100, 0)
    if (!Number.isSafeInteger(amountPaise) || amountPaise < 100 || amountPaise > 10_000_000_00) {
      return jsonResponse({ error: 'The order amount is outside the supported range.' }, 400)
    }

    const { data: order, error: orderError } = await adminClient
      .from('orders')
      .insert({
        user_id: user.id,
        amount_paise: amountPaise,
        currency: 'INR',
        product_snapshot: products.map(({ id, type }) => ({ id, type })),
      })
      .select('id')
      .single()
    if (orderError) throw orderError

    const razorpayResponse = await fetch('https://api.razorpay.com/v1/payment_links', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: 'INR',
        accept_partial: false,
        description: `Infinivium order ${order.id}`,
        reference_id: order.id,
        customer: { name: user.user_metadata?.full_name ?? user.email, email: user.email },
        notify: { email: true, sms: false },
        reminder_enable: false,
        callback_url: `${appUrl.replace(/\/$/, '')}/payment-return`,
        callback_method: 'get',
        notes: { order_id: order.id, user_id: user.id },
      }),
    })
    const paymentLink = await razorpayResponse.json()
    if (!razorpayResponse.ok || typeof paymentLink.short_url !== 'string') {
      await adminClient.from('orders').update({ status: 'failed' }).eq('id', order.id)
      console.error('Razorpay payment link creation failed', paymentLink.error?.code ?? razorpayResponse.status)
      return jsonResponse({ error: 'Razorpay could not start this payment. Please try again.' }, 502)
    }

    const { error: saveLinkError } = await adminClient
      .from('orders')
      .update({ razorpay_payment_link_id: paymentLink.id })
      .eq('id', order.id)
    if (saveLinkError) {
      await fetch(`https://api.razorpay.com/v1/payment_links/${encodeURIComponent(paymentLink.id)}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}` },
      })
      await adminClient.from('orders').update({ status: 'failed' }).eq('id', order.id)
      throw saveLinkError
    }

    const paymentUrl = new URL(paymentLink.short_url)
    if (paymentUrl.protocol !== 'https:' || !['rzp.io', 'razorpay.com'].some((host) => paymentUrl.hostname === host || paymentUrl.hostname.endsWith(`.${host}`))) {
      console.error('Razorpay returned an unexpected payment URL host')
      return jsonResponse({ error: 'Razorpay returned an invalid payment URL.' }, 502)
    }
    return jsonResponse({ payment_url: paymentUrl.toString(), order_id: order.id })
  } catch (error) {
    console.error('Payment link request failed', error instanceof Error ? error.message : 'Unknown error')
    return jsonResponse({ error: 'Unable to start checkout. Please try again.' }, 500)
  }
})
