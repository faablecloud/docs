# Security and Compliance measures

This page covers the protection and compliance measures Faable takes to ensure the security of your data, including DDoS protection, SOC2 Type 2 compliance, Data encryption, and more.

## Security

## DDoS protection

A Distributed Denial of Service attack (DDoS) happens when multiple connected devices are used to simultaneously overwhelm a website with targeted, fake traffic. The end goal of this attack is to bring down the servers hosting the website.

DDoS attacks often target the layer 3 (network), layer 4 (transport), and layer 7 (application) layers of the OSI model. Faable's DDoS protection mitigates L3, L4, and L7 DDoS attacks, and protects the entire platform and all customers from attacks that would otherwise affect reliability.

**Layer 3 DDoS**

The goal of a Layer 3 (L3) DDoS attack is to crash and slow down networks, servers, and programs. They target the network layer, as opposed to the transport or application layer. Layer 3 DDoS attacks are often used to target specific IP addresses, but can also target entire networks.

**Layer 4 DDoS**

The goal of a Layer 4 (L4) DDoS attack is to crash and slow down applications. They target the 3-way-handshake performed on TCP connections. This is often called a SYN flood. Layer 4 DDoS attacks are used to target specific ports, but can also target entire protocols.

**Layer 7 DDoS**

The goal of a Layer 7 (L7) DDoS attack is to crash and slow down software at the application layer by targeting protocols such as HTTP GET and POST requests. They are often silent and look to leverage vulnerabilities by sending many innocuous requests to a single page.

## Access control

Apps can be protected with Password protection and SSO protection. Password protection is available for Teams on Pro and Enterprise plans, while SSO protection is only available for Teams on the Enterprise plan. Both methods can be used to protect production deployments.

### Password protection

Password protection applies to production deployments. This feature can be enabled via the Teams Project dashboard. Read more about in the documentation here.

### Faable Authentication

Faable Authentication protection applies to production deployments. When enabled, a person with a Personal Account that is a member of a Team, can use their login credentials to access the deployment. This feature can be enabled via the Teams Project dashboard.

Both Password protection, and Faable Authentication can be enabled at the same time. When this is the case, the person trying to access the deployment will be presented with an option to use either method to access the deployment.

Read more about in the documentation here.

## Compliance

### SOC2

System and Organization Control type 2 (SOC2) is a form of auditing that ensures a cloud service provider manages customer data, and protects privacy. Faable is SOC2 Type 2 compliant.

### GDPR

General Data Protection Regulation (GDPR), is a comprehensive EU-wide data protection law that governs the use, sharing, transfer, and processing of EU resident personal data.

Faable is GDPR compliant, which means that we commit to the following:

Maintaining appropriate technical and organizational security measures surrounding customer data
Notify our customers without undue delay of any data breaches
Hold our sub-processors to the same level of data protection that we are committed to
Honor our EU customer's right to access and erasure, among others
For more information on how Faable protects your personal data, and the data of your customers, please refer to our Privacy Policy.

### PCI

Payment Card Industry Data Security Standard (PCI) is a standard that defines the security and privacy requirements for payment card processing.

Faable does not store personal credit card information for any of our customers. We use Stripe to securely process transactions and trust their commitment to best-in-class security. Stripe is a certified PCI Service Provider Level 1, which is the highest level of certification in the payments industry.

## Faable Cloud Infrastructure

### Data encryption

Faable encrypts data at rest (when on disk) with 256 bit Advanced Encryption Standard (AES-256). While data is in transit (on route between source and destination), Faable uses HTTPS/TLS 1.3.

### Data backup

Faable backs-up customer data at an interval of every hour, each backup is persisted for 30 days, and is globally replicated for resiliency against regional disasters. Automatic backups are taken without affecting the performance or availability of the database operations.

All backups are stored separately in a storage service. If a database instance is deleted, all associated backups are also automatically deleted. Backups are periodically tested by the Faable engineering team.

### Penetration testing and Audit scans

Faable conducts regular penetration testing through third-party penetration testers, and has daily code reviews and static analysis checks.
