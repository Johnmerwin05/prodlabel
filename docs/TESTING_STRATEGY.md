# Testing Strategy

- Unit tests: DTO mapping, template variable rendering, permission helpers, repository filters.
- Feature tests: customer CRUD, product creation, upload preview/commit, print queue request, policy denials, restore flows.
- Job tests: fake events and queues for `ProcessPrintJob`, assert progress counters and rendered payloads.
- Contract tests: validate OpenAPI examples against API resources.
- Performance tests: seed millions of products by customer, benchmark indexed list/report queries, and test queue concurrency with realistic print batch sizes.
