# Frontend Integration Guide: Subscription Management

## Overview

This guide explains how to integrate subscription management UI with the backend auto-renewal API.

## API Endpoints

All endpoints require JWT authentication in the `Authorization` header.

### Get User Subscriptions

```typescript
GET /api/subscriptions
Response: {
  success: boolean,
  data: SubscriptionInfo[]
}

interface SubscriptionInfo {
  id: string
  packageName: string
  credits: number
  price: number
  autoRenewEnabled: boolean
  nextRenewalDate: string | null
  renewalCount: number
  cancelledAt: string | null
  cancellationReason: string | null
  createdAt: string
}
```

### Get Single Subscription

```typescript
GET /api/subscriptions/{subscriptionId}
Response: Same as above
```

### Enable Auto-Renewal

```typescript
POST /api/subscriptions/{subscriptionId}/enable-renewal
Body: {}
Response: {
  success: boolean,
  message: string,
  subscriptionId: string
}
```

### Disable Auto-Renewal

```typescript
POST /api/subscriptions/{subscriptionId}/disable-renewal
Body: {}
Response: {
  success: boolean,
  message: string,
  subscriptionId: string
}
```

### Cancel Subscription

```typescript
POST /api/subscriptions/{subscriptionId}/cancel
Body: {
  reason?: string  // Optional cancellation reason
}
Response: {
  success: boolean,
  message: string,
  subscriptionId: string
}
```

## UI Components to Build

### 1. Active Subscriptions List

**Location:** User Settings / Subscriptions Tab

**Features:**
- Display all active subscriptions
- Show package name, credits, and monthly price
- Display auto-renewal status
- Show next renewal date
- Display renewal count (how many times renewed)

**Example Data Display:**
```
📦 Pro Package
├─ Credits: 160
├─ Monthly Price: $59.99
├─ Auto-Renewal: ✅ Enabled
├─ Next Renewal: April 17, 2026
├─ Renewals: 2 times
└─ Actions: [Enable/Disable] [Cancel]
```

### 2. Subscription Settings Modal

**Triggers:** When user clicks on a subscription or settings icon

**Toggles:**
- **Auto-Renewal Toggle**
  - Show next renewal date when enabled
  - Warn user before disabling (remind them they can re-enable anytime)
  
- **Cancel Subscription**
  - Show confirmation modal
  - Ask for optional cancellation reason
  - Clear warning: "Your remaining credits will continue to work"

**Status Display:**
- Active/Cancelled status
- If cancelled: Show cancellation date and reason

### 3. Cancellation Confirmation Modal

**Appears when:** User clicks "Cancel Subscription"

**Content:**
```
⚠️ Cancel Subscription?

Subscription: Pro Package ($59.99/month)
Remaining Credits: 120

This will disable auto-renewal. Your remaining credits 
will continue to work until exhausted.

You can reactivate anytime from your settings.

[Optional: Cancellation Reason]
[Cancel Subscription] [Keep Subscription]
```

### 4. Renewal Summary Card

**Location:** Dashboard / Billing Info Section

**Shows:**
- Next renewal date
- Amount that will be charged
- Package details
- Quick toggle for auto-renewal
- Quick cancel button

### 5. Help/Info Section

**Location:** Settings / Subscriptions

**Content to Display:**
```
📋 How Subscriptions Work

✅ Auto-Renewal
• Enabled by default on successful purchase
• Automatic charge every month
• Same package, same price

🔄 Manage Auto-Renewal
• Disable to prevent future charges
• Enable to re-activate
• Can toggle anytime

❌ Cancel Subscription
• Stops automatic renewals
• Keeps existing credits
• No refunds (credits were already purchased)

📧 Email Notifications
• You'll receive email on each renewal
• Cancellation confirmation via email
```

## React Component Examples

### Subscription List Component

```typescript
import React, { useEffect, useState } from 'react'
import { getSubscriptions, cancelSubscription } from '@/api/subscriptions'

export function SubscriptionsList() {
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSubscriptions()
  }, [])

  const loadSubscriptions = async () => {
    try {
      const response = await getSubscriptions()
      setSubscriptions(response.data)
    } catch (error) {
      console.error('Failed to load subscriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (subscriptionId: string) => {
    if (window.confirm('Are you sure? Your credits will still work.')) {
      try {
        await cancelSubscription(subscriptionId, 'User requested')
        loadSubscriptions() // Refresh list
        // Show success toast
      } catch (error) {
        // Show error toast
      }
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="subscriptions-list">
      {subscriptions.map(sub => (
        <div key={sub.id} className="subscription-card">
          <h3>{sub.packageName}</h3>
          <p>Credits: {sub.credits}</p>
          <p>Price: ${sub.price}/month</p>
          <p>
            Auto-Renewal: {sub.autoRenewEnabled ? '✅ On' : '❌ Off'}
          </p>
          {sub.nextRenewalDate && (
            <p>
              Next Renewal: {new Date(sub.nextRenewalDate).toLocaleDateString()}
            </p>
          )}
          {sub.cancelledAt && (
            <p className="cancelled">
              Cancelled: {new Date(sub.cancelledAt).toLocaleDateString()}
            </p>
          )}
          <button onClick={() => handleCancel(sub.id)}>
            {sub.cancelledAt ? 'Reactivate' : 'Cancel'}
          </button>
        </div>
      ))}
    </div>
  )
}
```

### Auto-Renewal Toggle Component

```typescript
import React from 'react'
import { enableAutoRenewal, disableAutoRenewal } from '@/api/subscriptions'

export function AutoRenewalToggle({ subscription, onUpdate }) {
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    setLoading(true)
    try {
      if (subscription.autoRenewEnabled) {
        await disableAutoRenewal(subscription.id)
      } else {
        await enableAutoRenewal(subscription.id)
      }
      onUpdate() // Refresh data
    } catch (error) {
      console.error('Failed to toggle auto-renewal:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auto-renewal-toggle">
      <label>
        Auto-Renewal
        <input
          type="checkbox"
          checked={subscription.autoRenewEnabled}
          onChange={handleToggle}
          disabled={loading || subscription.cancelledAt}
        />
      </label>
      {subscription.autoRenewEnabled && subscription.nextRenewalDate && (
        <p className="renewal-date">
          Next charge: {new Date(subscription.nextRenewalDate).toLocaleDateString()}
        </p>
      )}
    </div>
  )
}
```

## API Client Functions

Create these in your API client (`src/api/subscriptions.ts`):

```typescript
import axios from 'axios'

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3003'

export async function getSubscriptions() {
  const response = await axios.get(`${API_BASE}/api/subscriptions`)
  return response.data
}

export async function getSubscription(subscriptionId: string) {
  const response = await axios.get(
    `${API_BASE}/api/subscriptions/${subscriptionId}`
  )
  return response.data
}

export async function enableAutoRenewal(subscriptionId: string) {
  const response = await axios.post(
    `${API_BASE}/api/subscriptions/${subscriptionId}/enable-renewal`
  )
  return response.data
}

export async function disableAutoRenewal(subscriptionId: string) {
  const response = await axios.post(
    `${API_BASE}/api/subscriptions/${subscriptionId}/disable-renewal`
  )
  return response.data
}

export async function cancelSubscription(
  subscriptionId: string,
  reason?: string
) {
  const response = await axios.post(
    `${API_BASE}/api/subscriptions/${subscriptionId}/cancel`,
    { reason }
  )
  return response.data
}
```

## State Management (Zustand)

```typescript
import { create } from 'zustand'
import * as subscriptionsAPI from '@/api/subscriptions'

interface SubscriptionStore {
  subscriptions: any[]
  loading: boolean
  error: string | null
  fetchSubscriptions: () => Promise<void>
  updateAutoRenewal: (id: string, enabled: boolean) => Promise<void>
  cancelSubscription: (id: string, reason?: string) => Promise<void>
}

export const useSubscriptionStore = create<SubscriptionStore>((set) => ({
  subscriptions: [],
  loading: false,
  error: null,

  fetchSubscriptions: async () => {
    set({ loading: true })
    try {
      const response = await subscriptionsAPI.getSubscriptions()
      set({ subscriptions: response.data, error: null })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An error occurred',
      })
    } finally {
      set({ loading: false })
    }
  },

  updateAutoRenewal: async (id: string, enabled: boolean) => {
    try {
      if (enabled) {
        await subscriptionsAPI.enableAutoRenewal(id)
      } else {
        await subscriptionsAPI.disableAutoRenewal(id)
      }
      // Refresh subscriptions
      set((state) => ({
        subscriptions: state.subscriptions.map((sub) =>
          sub.id === id ? { ...sub, autoRenewEnabled: enabled } : sub
        ),
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An error occurred',
      })
    }
  },

  cancelSubscription: async (id: string, reason?: string) => {
    try {
      await subscriptionsAPI.cancelSubscription(id, reason)
      // Refresh subscriptions
      const response = await subscriptionsAPI.getSubscriptions()
      set({ subscriptions: response.data })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An error occurred',
      })
    }
  },
}))
```

## User Flows

### Flow 1: User Purchases a Plan

1. User clicks "Subscribe" button
2. Stripe checkout modal opens
3. User completes payment
4. Backend creates `user_credit_purchase` record with:
   - `autoRenewEnabled: true`
   - `nextRenewalDate: 1 month from now`
5. Confirmation email sent
6. Frontend shows success message

### Flow 2: User Disables Auto-Renewal

1. User navigates to Settings > Subscriptions
2. Sees active subscriptions list
3. Clicks "Manage" or toggle on subscription
4. Toggles OFF Auto-Renewal
5. API call to `/disable-renewal`
6. nextRenewalDate cleared
7. UI updates immediately
8. Confirmation shown

### Flow 3: User Cancels Subscription

1. User clicks "Cancel Subscription"
2. Cancellation confirmation modal appears
3. Optional: User enters cancellation reason
4. User confirms cancellation
5. API call to `/cancel` endpoint
6. Backend updates:
   - `autoRenewEnabled: false`
   - `cancelledAt: now`
   - `cancellationReason: user input`
7. Cancellation email sent
8. UI shows subscription as "Cancelled"
9. User can still use remaining credits

### Flow 4: Automatic Monthly Renewal (Backend)

1. Cron job runs daily
2. Checks for subscriptions with `nextRenewalDate <= now`
3. For each due subscription:
   - Creates Stripe invoice
   - Charges user's default payment method
   - Updates `nextRenewalDate` to +1 month
   - Increments `renewalCount`
   - Sends renewal email
4. User sees updated subscription info
5. Next renewal date updated in UI

## Edge Cases to Handle

### 1. Cancelled Subscription Re-activation

Currently: User cannot re-activate from UI
Option: Add "Reactivate" button if cancelled

```typescript
if (subscription.cancelledAt) {
  return <button onClick={handleReactivate}>Reactivate</button>
}
```

### 2. Multiple Active Subscriptions

User can have multiple active subscriptions (different packages).
- Each can be toggled independently
- Each has its own renewal date
- Each can be cancelled separately

### 3. Payment Failure

If Stripe payment fails:
- Renewal not recorded in DB
- Cron will retry next day
- Optional: Send "Payment Failed" email to user

### 4. No Default Payment Method

If user has no saved card:
- Invoice created but not auto-paid
- Manual payment required
- User notified

## Localization

Translate these strings:

- "Auto-Renewal Enabled"
- "Auto-Renewal Disabled"
- "Cancel Subscription"
- "Subscription Cancelled"
- "Next Renewal: {date}"
- "Your credits will continue to work"
- "Proceed with cancellation?"

## Accessibility

- Use proper form labels for toggles
- ARIA labels for enable/disable states
- Confirmation modals with focus management
- Keyboard navigation for all controls

## Performance Optimization

- Cache subscriptions list (5-10 minute TTL)
- Lazy load subscription details
- Batch API calls when possible
- Debounce toggle clicks

## Testing Checklist

- [ ] Load and display active subscriptions
- [ ] Toggle auto-renewal on/off
- [ ] Cancel subscription with reason
- [ ] Verify email addresses in UI
- [ ] Test with multiple subscriptions
- [ ] Test cancelled subscription display
- [ ] Verify renewal dates format
- [ ] Test error states and messages
- [ ] Test loading states
- [ ] Responsive design on mobile

## Stripe Integration Notes

For the purchase flow, ensure:

1. When creating Stripe session, include metadata:
   ```typescript
   metadata: {
     purchaseFor: "individual",
     userId: currentUser.id,
   }
   ```

2. This allows backend to properly link purchases to users

3. Renewal charges happen server-side via cron
