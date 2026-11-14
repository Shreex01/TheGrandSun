import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID')!
const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405)
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !razorpayKeyId || !razorpayKeySecret) {
    return jsonResponse({ error: 'Payment checkout is not configured. Contact the store administrator.' }, 503)
  }

  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return jsonResponse({ error: 'Sign in before checkout.' }, 401)

  try {
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data: { user }, error: authError } = await userClient.auth.getUser(token)
    if (authError || !user?.email) return jsonResponse({ error: 'Your session is invalid. Sign in again.' }, 401)

    let body
    try {
      body = await request.json()
    } catch {
      return jsonResponse({ error: 'The request body must be valid JSON.' }, 400)
    }

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

    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: 'INR',
        receipt: order.id,
        notes: { order_record_id: order.id, user_id: user.id },
      }),
    })
    let razorpayOrder
    try {
      razorpayOrder = await razorpayResponse.json()
    } catch {
      razorpayOrder = null
    }
    if (razorpayResponse.status === 401) {
      await adminClient.from('orders').update({ status: 'failed' }).eq('id', order.id)
      return jsonResponse({ error: 'Razorpay rejected the API credentials.' }, 401)
    }
    if (!razorpayResponse.ok || typeof razorpayOrder?.id !== 'string'
      || razorpayOrder.amount !== amountPaise || razorpayOrder.currency !== 'INR') {
      await adminClient.from('orders').update({ status: 'failed' }).eq('id', order.id)
      console.error('Razorpay order creation failed', razorpayOrder?.error?.code ?? razorpayResponse.status)
      return jsonResponse({ error: 'Razorpay could not start this payment. Please try again.' }, 500)
    }

    const { error: saveOrderError } = await adminClient
      .from('orders')
      .update({ razorpay_order_id: razorpayOrder.id })
      .eq('id', order.id)
    if (saveOrderError) {
      await adminClient.from('orders').update({ status: 'failed' }).eq('id', order.id)
      throw saveOrderError
    }

    return jsonResponse({
      order_id: razorpayOrder.id,
      order_record_id: order.id,
      amount: amountPaise,
      currency: 'INR',
    })
  } catch (error) {
    console.error('Razorpay order request failed', error instanceof Error ? error.message : 'Unknown error')
    return jsonResponse({ error: 'Unable to start checkout. Please try again.' }, 500)
  }
})
