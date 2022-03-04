# Configure a custom domain

To configure your `www.example.com` domain and point it to Faable Cloud:

- Access your domain register to configure DNS
- Create a `CNAME` record and point subdomain `www` to `balance.faable.com`

```
www     IN      CNAME       balance.faable.com
```

- Access [Faable Dashboard](https://www.faable.com/dashboard) and inside your app, click on domains and add `www.example.com` to your app.
- Wait ~2 minutes for SSL Certificates to be obtained for your domain automatically.

🚀 Your site is ready at: `www.example.com`
