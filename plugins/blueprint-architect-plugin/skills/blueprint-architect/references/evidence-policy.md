# Compatibility Evidence Policy

Use this policy for every version-sensitive compatibility claim.

## Source priority

1. Official product documentation and compatibility pages.
2. Official release notes or repositories.
3. Authoritative package metadata published by the maintainer.
4. Local capability rules for stable architectural constraints.
5. Community material only as supporting context for alternatives.

Only the first three source types can establish `verified_compatible` for a version-sensitive edge. A local rule can identify a stable condition or conflict but cannot prove a current vendor-version claim.

## Required evidence fields

Record the source URL or local reference, subject, applicable version range, retrieval date, exact supported claim, supported edge IDs, and contradicted edge IDs. If sources disagree, use `conditional` or `unverified` and show the disagreement.

## Privacy

External lookup may send technology names, public versions, capability names, and a generic compatibility question. Never send PRD prose, secrets, customer names, proprietary module names, private repository content, or private requirements.

## Lookup unavailable

Continue with deterministic capability rules. Mark version-sensitive edges `unverified` unless existing primary evidence in the specification supports them. Never convert missing evidence into compatibility.
