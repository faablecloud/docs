# Health checks

Ensuring service availiability is critical for important backend workloads such as an API.

To ensure your service is healthy, Faable will check the base endpoint `/`.
Your **APP** must return a `200 OK` status code. Otherwise service will be restarted.

To ignore health checks, always return `200 OK`.