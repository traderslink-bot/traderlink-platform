import { createHash } from "node:crypto";

import {
  serializeCanonicalValue,
  type CanonicalSerializationFailure,
  type CanonicalValue,
} from "../canonical";
import type { ExactResult } from "../exact";

export type ContentIdentityDomain =
  | "canonical_content"
  | "canonical_execution"
  | "canonical_source_document";

declare const canonicalDigestBrand: unique symbol;
declare const canonicalExecutionDigestBrand: unique symbol;
declare const canonicalSourceDocumentDigestBrand: unique symbol;

export type CanonicalContentDigest = string & {
  readonly [canonicalDigestBrand]: "CanonicalContentDigest";
};

export type CanonicalExecutionDigest = CanonicalContentDigest & {
  readonly [canonicalExecutionDigestBrand]: "CanonicalExecutionDigest";
};

export type CanonicalSourceDocumentDigest = CanonicalContentDigest & {
  readonly [canonicalSourceDocumentDigestBrand]: "CanonicalSourceDocumentDigest";
};

export type ContentDigestFailure =
  | CanonicalSerializationFailure
  | { code: "ti_v3_digest_domain_invalid"; path: "$" }
  | { code: "ti_v3_digest_version_invalid"; path: "$" }
  | { code: "ti_v3_digest_identifier_invalid"; path: "$" };

export interface CanonicalContentIdentity {
  domain: ContentIdentityDomain;
  version: `v${number}`;
  algorithm: "sha256";
  canonicalValue: CanonicalValue;
  canonicalJson: string;
  canonicalBytes: Uint8Array;
  digestHex: string;
  identifier: CanonicalContentDigest;
}

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function identifier(
  domain: ContentIdentityDomain,
  version: `v${number}`,
  digestHex: string,
): CanonicalContentDigest {
  return `ti_v3:${domain}:${version}:sha256:${digestHex}` as CanonicalContentDigest;
}

export function createCanonicalContentIdentity(
  domain: ContentIdentityDomain,
  version: `v${number}`,
  value: unknown,
): ExactResult<CanonicalContentIdentity, ContentDigestFailure> {
  if (!/^[a-z][a-z0-9_]*$/.test(domain)) {
    return { ok: false, error: { code: "ti_v3_digest_domain_invalid", path: "$" } };
  }
  if (!/^v[1-9][0-9]*$/.test(version)) {
    return { ok: false, error: { code: "ti_v3_digest_version_invalid", path: "$" } };
  }
  const serialized = serializeCanonicalValue(value);
  if (!serialized.ok) {
    return serialized;
  }
  const digestHex = sha256(serialized.value.utf8);
  return {
    ok: true,
    value: {
      domain,
      version,
      algorithm: "sha256",
      canonicalValue: serialized.value.value,
      canonicalJson: serialized.value.json,
      canonicalBytes: serialized.value.utf8,
      digestHex,
      identifier: identifier(domain, version, digestHex),
    },
  };
}

export function createCanonicalSourceDocumentDigest(
  bytes: Uint8Array,
): CanonicalSourceDocumentDigest {
  return identifier(
    "canonical_source_document",
    "v1",
    sha256(bytes),
  ) as CanonicalSourceDocumentDigest;
}

export function parseCanonicalContentDigest(
  input: unknown,
): ExactResult<CanonicalContentDigest, ContentDigestFailure> {
  if (
    typeof input !== "string" ||
    !/^ti_v3:(?:canonical_content|canonical_execution|canonical_source_document):v[1-9][0-9]*:sha256:[0-9a-f]{64}$/.test(
      input,
    )
  ) {
    return { ok: false, error: { code: "ti_v3_digest_identifier_invalid", path: "$" } };
  }
  return { ok: true, value: input as CanonicalContentDigest };
}

export function canonicalBytesEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) {
    return false;
  }
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }
  return true;
}
