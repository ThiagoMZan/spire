# Next Steps

The initial kernel intentionally stops before implementing every platform concern.

Recommended next sequence:

1. run the current foundation locally and fix runtime/package issues;
2. implement authentication and PostgreSQL-backed sessions;
3. implement permissions/RBAC and expose them through the public kernel API;
4. add functional audit separate from technical logs;
5. add an S3-compatible file storage provider;
6. create `@spire/module-example` as the reference module;
7. prove backend route, frontend route/menu, module schema, hooks, events and files through that module;
8. create the scheduler/jobs module only after the kernel/module boundary is validated;
9. add CI that builds the web app and checks database contracts against a test database.

The reference module is the architectural test: it must work without importing any internal Spire file.
