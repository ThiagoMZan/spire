# Files

Files are a kernel primitive because many modules need storage without knowing the underlying provider.

## Public API

```js
import { files } from "@spire/kernel";

const metadata = await files.save({
  fileName: "photo.jpg",
  contentType: "image/jpeg",
  buffer
});

const file = await files.read(metadata.id);
```

Metadata is stored in `kernel.file`.

## Drivers

The initial driver is local filesystem and is intended for development.

The service is intentionally separated from the driver:

```text
module
  |
files API
  |
FilesService
  |
Storage Driver
  |
local / S3-compatible / future provider
```

## Stateless production

Local disk is not valid shared state for horizontally scaled production APIs.

Before multi-instance production, add an S3-compatible provider and configure every instance to use the same object store.

Modules must not import storage drivers directly.
