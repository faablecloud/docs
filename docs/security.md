# Security and Compliance measures

This page covers the protection and compliance measures Faable takes to ensure the security of your data, including DDoS protection, SOC2 Type 2 compliance, Data encryption, and more.

## SOC2

System and Organization Control type 2 (SOC2) is a form of auditing that ensures a cloud service provider manages customer data, and protects privacy. Faable is SOC2 Type 2 compliant.

## GDPR

General Data Protection Regulation (GDPR), is a comprehensive EU-wide data protection law that governs the use, sharing, transfer, and processing of EU resident personal data.

Faable is GDPR compliant, which means that we commit to the following:

Maintaining appropriate technical and organizational security measures surrounding customer data
Notify our customers without undue delay of any data breaches
Hold our sub-processors to the same level of data protection that we are committed to
Honor our EU customer's right to access and erasure, among others
For more information on how Faable protects your personal data, and the data of your customers, please refer to our Privacy Policy.

## PCI

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
