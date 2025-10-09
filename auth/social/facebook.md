## Facebook Social Login

The Facebook social connection allows users to log in to your application using their Facebook profile.

By default, FaableAuth automatically syncs user profile data with each user login, thereby ensuring that changes made in the connection source are automatically updated in FaableAuth. Optionally, you can disable user profile data synchronization to allow for updating profile attributes from your application.

## Prerequisites

Before you begin, sign up for a Facebook Developer account.

## Set up app in Facebook

Create an app in the Facebook Developer portal, and add Facebook Login to the app as a Product. During this process, Facebook will generate a App ID and App Secret for your application; make note of these.

While setting up your app, use the following settings:

| Field                       | Value to Provide                                                                                                                       |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| How are you using your app? | Select For everything else.                                                                                                            |
| Permissions and Features    | Select the permissions your app will require. Only the `public_profile` and `email` permissions do not require app review by Facebook. |

While setting up the Facebook Login product, use the following settings:

| Field                     | Value to Provide                                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Client OAuth Settings     | Enable Web OAuth Login (web applications) or Client OAuth Login (native applications), depending on your app type. |
| Valid OAuth Redirect URIs | `https://YOUR_DOMAIN/login/callback`                                                                               |
| Deauthorize Callback URL  | Enter the URL you would like Facebook to call when a user does not consent to your app.                            |

## Find your FaableAuth domain name

If your FaableAuth domain name is not shown above and you are not using our custom domains feature, your domain name is your tenant name, your regional subdomain (unless your tenant is in the US region and was created before June 2020), plus `.auth.faable.link`. For example, if your tenant name were `exampleco-enterprises`, your FaableAuth domain name would be `exampleco-enterprises.auth.faable.link` and your redirect URI would be `https://exampleco-enterprises.auth.faable.link/login/callback`.

## Test connection

You're ready to test your connection. After logging in, you'll be prompted to allow your app access. To do so, click Install unlisted app.

## Advanced Access now requires Business Verification

As of February 1, 2023, if your app requires advanced level access to permissions, you might need to complete Business Verification. See this blog post for more information.
