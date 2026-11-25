# File storage security

Uploaded content is encrypted in fixed-size 1 MiB units with ChaCha20-Poly1305 before it reaches the storage adapter. Each unit has a unique nonce (`00000000` plus an 8-byte big-endian counter) and authenticated data containing the file id, unit index, and final-unit flag. Tags are verified before a decrypt transform emits that unit, so tampering, truncation, and reordering fail closed.

The per-file key is derived with HKDF-SHA256 from a versioned 32-byte master key and a random file salt. Metadata uses a separate HKDF context and encrypts the original name and MIME type. MongoDB stores only encrypted metadata, technical sizes, hashes of ciphertext, and a random storage key; it never stores plaintext, keys, or plaintext hashes.

Master key loss makes stored files unrecoverable, so back up keys securely. A master key leak defeats confidentiality. Rotate keys by adding a versioned environment key and changing `CURRENT_KEY_VERSION`; existing files retain their key version.

## Distributed storage threat table

| Threat | Protection and limitation |
|---|---|
| One provider outage | 4+1 reconstructs one missing shard per group. |
| Shard corruption | Stored SHA-256 detects it; Poly1305 is the final authenticated check. |
| Leaked individual shards | Shards are encrypted ciphertext and do not contain file metadata. |
| Database tampering | Hashes and layout metadata are integrity inputs; tampering can cause denial of service. |
| Key loss or compromise | Lost keys prevent recovery; compromised keys defeat confidentiality. |

4+1 does not protect against two bad shards in one group, key compromise, or
correlated provider failures. Five GridFS buckets in one MongoDB/Atlas cluster
are not independent failure domains. SHA-256 is detection, not authentication;
protect the stored hashes and rely on ChaCha20-Poly1305 for final integrity.
