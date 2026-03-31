# Features

Faable Auth is a modern, developer-first identity platform built for scale. We provide all the enterprise-grade features you need to secure your applications, with a focus on simplicity, extensibility, and fair pricing.

---

## 🆚 Feature Comparison

See how Faable Auth stands against industry leaders.

| Feature                         |     **Faable Auth**     |      Auth0      | Firebase Auth | AWS Cognito |
| :------------------------------ | :---------------------: | :-------------: | :-----------: | :---------: |
| **Pricing (Free Tier)**         |   **Up to 5,000 MAU**   | Up to 7,000 MAU |     PAYG      |    PAYG     |
| **Passwordless (OTP/Link)**     | ✅ (Ltd. to 100 emails) |       ✅        |      ❌       |     ❌      |
| **Social Login (Google, etc.)** |           ✅            |       ✅        |      ✅       |     ✅      |
| **Role-Based Access Control**   |           ✅            |       ✅        |      ❌       |     ❌      |
| **Custom Actions / Hooks**      |           ✅            |       ✅        |      ❌       |     ✅      |
| **M2M (Client Credentials)**    |           ✅            |       ✅        |      ❌       |     ✅      |
| **Developer Experience (DX)**   |        **High**         |     Medium      |      Low      |     Low     |

---

## 💎 Core Features

### 📧 Passwordless Authentication

Eliminate the friction of passwords. Faable Auth supports **One-Time Passwords (OTP)** and **Magic Links** out of the box. Users receive a secure bridge directly to their inbox, increasing conversion and security.

👉 **[Learn more about Passwordless](passwordless.md)**

### 🛡️ Role-Based Access Control (RBAC)

Manage permissions with precision. Define roles, assign permissions, and group users effortlessly. Our RBAC system is designed to handle complex organizational structures while remaining intuitive for developers.

### ⚡ Extensible Actions

Inject custom logic into your authentication flows. Use **Faable Actions** to call external APIs, enrich user profiles, or enforce custom validation rules during login or registration.

### 🤖 Machine-to-Machine (M2M)

Secure your backend services and background workers using the standardized **Client Credentials** flow. Ideal for service-to-service communication without human intervention.

👉 **[Learn more about Client Credentials](oauth-flows/client-credentials.md)**

### 📱 Modern SDKs

Our official SDKs, like **`@faable/auth-js`**, are designed to handle the heavy lifting (PKCE, Token Refresh, Session Management) so you can focus on building your features.

---

## 🛠️ Security by Design

- **Standards First**: Built on top of OAuth 2.0 and OIDC.
- **Secure Defaults**: PKCE enabled for all public clients.
- **Data Integrity**: Cryptographically signed tokens (JWT).
- **Compliance**: Designed for high-security and privacy standards.

---

## 🚀 Ready to Start?

Stop worrying about auth and start building what matters.

1. **[Create a Client](clients.md)**
2. **[Configure Connections](connections.md)**
3. **[Choose a Quickstart](get-started.md)**

> [!TIP]
> You can migrate from Auth0 or Firebase in minutes. Check out our migration guides or contact support for help.
