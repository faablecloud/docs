---
title: Apple Social Login
description: Implement Sign In with Apple in your application using Faable Auth. Detailed instructions for configuring identifiers, services, and keys in the Apple Developer portal.
---

## Apple Social Login

The Apple social connection allows users to log in to your application using their Apple account. The Apple App Store Developer guidelines require Sign In With Apple (SIWA) be available in applications that only use third-party sign-in options, such as Facebook or Google.

By default, FaableAuth syncs user profile attributes with each user login. Syncing user profile data ensures that changes in the connection source are automatically updated in FaableAuth.

Apple does not allow branding changes to the Apple login page display.

## Prerequisites

This process requires:

An Apple Developer Program account. If you are a member of the iOS Developer University Program, sign up for a free trial.

## Set up an app in Apple

1. To set up an application, navigate to the Apple Developer Dashboard and select Certs, Identifiers, and Profiles then Identifiers.

1. Choose Create New Identifier and choose App IDs.

1. Next, select the App type and Continue.

1. Specify a description of the app.

1. Enable the Sign In with Apple capability in the Capabilities section.

Save your changes.

## Create a Service ID

Return to Identifiers by clicking All Identifiers

Select Services IDs from the dropdown on the right.

Register the Services ID with a description and identifier. Select Continue and then Register.

Return to Service Registration and enable Sign in with Apple. Select Configure

Select the AppID you created and add your FaableAuth tenant domain and callback URL. Review your changes and save.

## Create a Signing Key

Return to Identifiers by clicking All Identifiers and choose Keys from the dropdown on the right.

Add a keyname and enable Sign in with Apple below. Add the AppID of the application you created in the first step and save your changes.

Continue and register. Download a copy of your key.

## Update your FaableAuth configuration

Now that you have your application information, update your FaableAuth configuration.

In your FaableAuth dashboard, navigate to Authentication > Social Connections and Create Connection. Find the Apple connection and enable Apple access to FaableAuth.

Name your social connection and update the fields with the information below.

- **Client ID**: Add the identifier of the Services ID you created in Apple. Not the ID of the App ID.
- **Client Secret Signing Key**: Paste the contents of your keyfile downloaded from Apple. Paste the entire key, including the BEGIN/END PRIVATE KEY lines.
- **Apple Team ID**: Add your Apple Team ID. In the Apple Developer Console top right menu, navigate to View Membership > Membership > Team ID.
- **Key ID**: Paste the key ID of your Apple key. To find this, navigate to Certs, Identifiers, and Profiles in the Apple Developer Console. Choose Keys and open your key.
