# Add a Domain

Go to [Faable Dashboard > Domains](https://www.faable.com/dashboard/domains) and create a Domain entry. Follow instructions to link it to your deployed Faable App.

Then point your domain `example.com` to Faable Cloud. You have to create a `CNAME` record in your DNS server pointing it to our datacenter as follows:

```txt
www    IN      CNAME      <domain_id>.domains.faable.link.
```

🚀 Your site is ready at: `https://www.example.com`

## Apex Domains

If you domain is an Apex domain create an `ALIAS` record instead.

```txt
.    IN      ALIAS      <domain_id>.domains.faable.link.
```

Check with your DNS provider that it allows you to create an alias record as domain apex as it is not widely supported.
