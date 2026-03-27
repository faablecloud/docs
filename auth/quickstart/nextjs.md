# Next.js Quickstart

Add Faable Auth to your Next.js application to easily authenticate your users. This guide shows you how to integrate the Faable Auth login flow using the secure **Authorization Code Flow with PKCE**, meaning the token exchange happens automatically and securely on the client side.

## Prerequisites

Before you start, you need to prepare your Faable Auth environment:

1.  **Faable Auth Domain:** You need the URL of your Faable Auth instance. You can find this in the [Faable Dashboard](https://dashboard.faable.com).
2.  **Create a Client:** In the dashboard, create a new Client for your application. Note down the **Client ID**. Make sure you configure your `Allowed Callback URLs` (e.g., `http://localhost:3000/callback` for local development).

## Installation

Install the required Faable packages in your Next.js project:

```bash
npm install @faable/auth-js @faablecloud/auth-helpers-react
```

## Initialization

First, initialize the Faable Auth client. You can define this directly in your app setup or in a separate file.

```javascript
import { createClient } from '@faable/auth-js';

// Replace with your actual domain and client ID
export const faableauth = createClient(
  'YOUR_FAABLE_AUTH_DOMAIN', 
  'YOUR_CLIENT_ID'
);
```

## Adding the Auth Provider

To make the authentication state available throughout your React component tree, wrap your root component (usually `pages/_app.tsx` or `pages/_app.js`) with the `SessionContextProvider`.

```tsx
// pages/_app.tsx
import { SessionContextProvider } from '@faablecloud/auth-helpers-react';
import { faableauth } from '../lib/faable'; // Adjust path to where you initialized the client

export default function App({ Component, pageProps }) {
  return (
    <SessionContextProvider faableauthClient={faableauth as any}>
      <Component {...pageProps} />
    </SessionContextProvider>
  );
}
```

## Accessing User State

Once the provider is wrapping your application, any component can access the authentication state. 

You can use the `useSession` and `useUser` hooks to get the current session (which includes the `access_token`) and the user's profile information.

```tsx
// pages/profile.tsx
import { useSession, useUser } from '@faablecloud/auth-helpers-react';
import { faableauth } from '../lib/faable';

export default function Profile() {
  const session = useSession();
  const user = useUser();

  const handleLogin = async () => {
    // This automatically starts the PKCE flow
    await faableauth.auth.signInWithOAuth({
      options: {
        redirectTo: window.location.origin + '/callback',
      },
    });
  };

  const handleLogout = async () => {
    await faableauth.auth.signOut();
  };

  if (!session) {
    return (
      <div>
        <p>You are not logged in.</p>
        <button onClick={handleLogin}>Log In</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Welcome, {user?.email}</h1>
      <p>Your Access Token: {session.access_token}</p>
      <button onClick={handleLogout}>Log Out</button>
    </div>
  );
}
```

When you call `signInWithOAuth`, the `@faable/auth-js` library takes care of redirecting the user, securely generating the PKCE verifier, and handling the automatic token exchange when the user is sent back to your callback URL.
