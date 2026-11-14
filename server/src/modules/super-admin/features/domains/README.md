# Super Admin domains

Super Admins can assign domains to existing clubs, verify ownership using the `_dinknest.<domain>` TXT challenge, and record a manual confirmation that HTTPS is configured. A domain serves club content only when DNS is verified, HTTPS readiness is confirmed, the club is active, and `MULTICLUB_ENABLED=true`.

The HTTPS confirmation is an explicit Super Admin attestation; configure the hosting ingress to serve a valid certificate and redirect or block plain HTTP before confirming it.
