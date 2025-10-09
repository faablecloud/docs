## Google Social Login

Google is a popular social connection that allows users to log in to your application using their Google profile.

To set up a Google social connection, you must:

1. Create Google OAuth credentials with the Google Auth Platform.
1. Configure and test a Google social connection with the FaableAuth Dashboard.

## Prerequisites

Before you begin:

1. [Sign up for a Google Developer account](https://console.developers.google.com/).
1. [Create a Google Project](https://support.google.com/googleapi/answer/6251787?ref_topic=7014522)

## Google Auth Platform

The Google Auth Platform helps you manage your applications and OAuth credentials for logging in and calling Google APIs. To learn more, read [Get started with the Google Auth Platform](https://support.google.com/cloud/answer/15544987?hl=en).

Use the Google Auth Platform to:

1. Configure Google consent screen
1. Create Google OAuth 2.0 Client

Detailed instructions for each step are provided in the sections below.

### Configure Google consent screen

> If your application requests sensitive OAuth scopes or uses a custom image, Google limits it to 100 logins until the OAuth consent screen is verified. Consent screen verification may take up to several days.

When you use OAuth 2.0 for authorization, your application requests authorization for one or more scopes of access from a Google Account. Google displays a consent screen to the user, including a summary of your project, its policies, and the requested access scopes.

Before creating an OAuth client ID, you must first configure the OAuth consent screen with information about your application.

In the Google Cloud Console, [configure your Google OAuth consent screen](https://developers.google.com/workspace/guides/configure-oauth-consent):

1. Navigate to Google Auth Platform > Branding: For Authorized domains, enter `faable.auth.link`. If you’re using a custom domain, enter your custom domain instead.
1. Navigate to Google Auth Platform > Audience: For User type, select Make External. In Test Users, you can add the email addresses you want to use for testing.
1. Navigate to Google Auth Platform > Data Access to add or remove scopes. To learn more, read OAuth 2.0 Scopes for Google APIs.
1. Follow the rest of the instructions to finish configuring your Google OAuth consent screen.
1. Select Save Changes.

### Create Google OAuth 2.0 Client

To create a Google OAuth 2.0 Client, you need your FaableAuth domain, which you can find in the FaableAuth Dashboard.

1. Navigate to **Settings > Custom Domains**.
1. If you haven’t configured a custom domain, your FaableAuth domain name is `{YOUR_FAABLEAUTH_NAME}.auth.faable.link`. It will be bolded in the introduction. Your redirect URI is `https://{YOUR_FAABLEAUTH_NAME}.auth.faable.link/login/callback`.

In the Google Cloud Console, [create a new OAuth 2.0 Client](https://console.cloud.google.com/auth/clients/create):

1. Navigate to Google Auth Platform > Clients. Then, select New Client.
1. For the Application type, select Web application.
1. Enter the following information for your OAuth 2.0 Client:

- Name: The name of your OAuth 2.0 Client.
- Authorized Javascript origins: `https://{YOUR_DOMAIN}`
- Authorized redirect URIs: `https://{YOUR_DOMAIN}/login/callback`

1. Select Create.
