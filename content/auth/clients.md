# Clients

In Faable Auth, a **Client** represents an application that needs to authenticate users or request authorization to access APIs. Depending on what you are building, a Client could be a Single Page Application (React, Vue, Angular), a native mobile app (iOS, React Native), a server-side web application (Express, Next.js), or a backend machine-to-machine service.

Clients are the entities that initiate the OAuth2 and OpenID Connect flows. You register and manage all your clients directly from the [Faable Dashboard](https://dashboard.faable.com)

## Creating a Client

To integrate your application with Faable Auth, the first step is always to register a new Client in the dashboard. When you create a client, Faable Auth generates critical credentials that your app will use to identify itself to the authorization server:

- **Client ID:** A public, unique identifier for your application. This is safe to expose in client-side code (like a React or Expo app) and is used to tell Faable Auth which application is requesting a login screen.
- **Client Secret:** A confidential string used to authenticate the identity of the application. _This must be kept secure and should never be exposed in public apps (like SPAs or mobile apps)._ It is primarily used by backend services to exchange authorization codes for tokens.

## Types of Clients

When building with Faable Auth, the architecture of your application dictates how the Client should be configured and which OAuth2 flows it should use:

- **Single Page Web Applications (SPAs):** For frontend apps running entirely in the browser. Since they cannot securely store a Client Secret, they must use the Authorization Code Flow with PKCE.
- **Native / Mobile Apps:** For mobile and desktop applications. Like SPAs, they cannot guarantee the secrecy of credentials and also rely on PKCE for secure authentication.
- **Regular Web Applications:** For traditional server-side applications (like Express MVC or Next.js server components). Because the code runs on a secure backend server, these clients can safely store and utilize a Client Secret during the authentication flow.
- **Machine to Machine (M2M):** For backend services or background workers that need to securely call APIs without any human user involvement. They typically use the Client Credentials flow.

## Client Configuration

Within the dashboard, you can define essential security boundaries for each Client:

- **Allowed Callback URLs (Redirect URIs):** A strict whitelist of URLs (e.g., `https://myapp.com/callback`) where Faable Auth is permitted to redirect the user after a successful login. This is a critical security measure to prevent open redirect vulnerabilities.
- **Allowed Logout URLs:** URLs where users can be redirected after they successfully log out of their session.
- **Allowed Web Origins:** URLs representing the origins permitted to make cross-origin (CORS) requests to Faable Auth endpoints.
- **Connections:** You have granular control over which authentication methods (e.g., Google login, Passwordless) are enabled for each specific client.

## Next Steps

Once you have your Client ID and configured your callback URLs, you are ready to write code.

- **[Connections](connections.md):** Learn more about the different identity providers you can attach to your clients.
- **[Authorization Code Flow](oauth-flows/authorization-code.md):** Understand the mechanics of the standard login flow.
- **[Quickstart Next.js](quickstart/nextjs.md):** Jump straight into the code and see a full authentication implementation in action.
- **[Quickstart React Native](quickstart/react-native.md):** Jump straight into the code and see a full authentication implementation in action.
