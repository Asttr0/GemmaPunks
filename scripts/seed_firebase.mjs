import { readFile } from "node:fs/promises";
import process from "node:process";

import {
  applicationDefault,
  deleteApp,
  initializeApp,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const defaultSeedPath = "packages/demo-data/firebase/developer-baseline.json";
const allowedOrganizationCollections = new Set([
  "memberships",
  "inventory_items",
  "documents",
  "ingestion_jobs",
  "extraction_drafts",
  "transactions",
  "inventory_movements",
  "supplier_catalog_items",
  "procurement_needs",
  "offers",
  "approvals",
  "agent_runs",
]);
const forbiddenFieldNames = new Set([
  "base64",
  "binary",
  "file_bytes",
  "raw_audio",
  "raw_image",
  "storage_path",
]);

function option(name, fallback = null) {
  const index = process.argv.indexOf(name);
  if (index === -1) {
    return fallback;
  }

  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function walk(value, visit, path = []) {
  visit(value, path);

  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, visit, [...path, index]));
    return;
  }

  if (isPlainObject(value)) {
    Object.entries(value).forEach(([key, item]) =>
      walk(item, visit, [...path, key]),
    );
  }
}

function validateSeed(seed) {
  const errors = [];

  if (!Number.isInteger(seed.schema_version) || seed.schema_version < 1) {
    errors.push("schema_version must be a positive integer");
  }
  if (!Array.isArray(seed.auth_users)) {
    errors.push("auth_users must be an array");
  }
  if (!Array.isArray(seed.documents) || seed.documents.length === 0) {
    errors.push("documents must be a non-empty array");
  }
  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }

  const authIds = new Set();
  const authEmails = new Set();
  for (const user of seed.auth_users) {
    if (!user.uid || authIds.has(user.uid)) {
      errors.push(`auth user UID is missing or duplicated: ${user.uid}`);
    }
    if (!user.email || authEmails.has(user.email)) {
      errors.push(`auth user email is missing or duplicated: ${user.email}`);
    }
    if (!user.claims?.organization_id || !user.claims?.role) {
      errors.push(
        `auth user ${user.uid} needs organization_id and role claims`,
      );
    }
    authIds.add(user.uid);
    authEmails.add(user.email);
  }

  const documentPaths = new Set();
  for (const document of seed.documents) {
    const segments = String(document.path ?? "")
      .split("/")
      .filter(Boolean);

    if (
      segments.length === 0 ||
      segments.length % 2 !== 0 ||
      document.path !== segments.join("/")
    ) {
      errors.push(`invalid Firestore document path: ${document.path}`);
      continue;
    }
    if (documentPaths.has(document.path)) {
      errors.push(`duplicate Firestore document path: ${document.path}`);
    }
    documentPaths.add(document.path);

    if (!isPlainObject(document.data)) {
      errors.push(`${document.path} data must be an object`);
      continue;
    }

    if (segments[0] === "organizations" && segments.length > 2) {
      const organizationId = segments[1];
      const collectionName = segments[2];
      if (!allowedOrganizationCollections.has(collectionName)) {
        errors.push(
          `${document.path} uses unknown organization collection ${collectionName}`,
        );
      }
      if (document.data.organization_id !== organizationId) {
        errors.push(
          `${document.path} must contain organization_id=${organizationId}`,
        );
      }
    }

    walk(document.data, (value, fieldPath) => {
      const lastPart = fieldPath.at(-1);
      if (typeof lastPart === "string" && forbiddenFieldNames.has(lastPart)) {
        errors.push(
          `${document.path}.${fieldPath.join(".")} stores forbidden evidence data`,
        );
      }
      if (
        typeof lastPart === "string" &&
        lastPart.endsWith("_centimes") &&
        value !== null &&
        !Number.isInteger(value)
      ) {
        errors.push(
          `${document.path}.${fieldPath.join(".")} must be integer centimes`,
        );
      }
      if (isPlainObject(value) && Object.hasOwn(value, "__timestamp__")) {
        const keys = Object.keys(value);
        const timestamp = new Date(value.__timestamp__);
        if (keys.length !== 1 || Number.isNaN(timestamp.getTime())) {
          errors.push(
            `${document.path}.${fieldPath.join(".")} has an invalid timestamp`,
          );
        }
      }
    });
  }

  const requiredPaths = [
    "system/schema",
    "profiles/demo-merchant",
    "profiles/demo-supplier",
    "products/cooking-oil-1l",
    "organizations/merchant-berrechid",
    "organizations/supplier-atlas",
    "organizations/merchant-berrechid/inventory_items/cooking-oil-1l",
    "organizations/merchant-berrechid/extraction_drafts/draft-001",
    "organizations/merchant-berrechid/procurement_needs/need-oil-001",
    "group_orders/group-oil-001",
  ];
  for (const requiredPath of requiredPaths) {
    if (!documentPaths.has(requiredPath)) {
      errors.push(`required seed document is missing: ${requiredPath}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Seed validation failed:\n- ${errors.join("\n- ")}`);
  }

  return {
    authUsers: seed.auth_users.length,
    documents: seed.documents.length,
  };
}

function convertSpecialValues(value) {
  if (Array.isArray(value)) {
    return value.map(convertSpecialValues);
  }
  if (!isPlainObject(value)) {
    return value;
  }
  if (Object.hasOwn(value, "__timestamp__")) {
    return Timestamp.fromDate(new Date(value.__timestamp__));
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      convertSpecialValues(item),
    ]),
  );
}

async function upsertAuthUsers(authClient, users, usingEmulators) {
  for (const user of users) {
    const password = usingEmulators
      ? user.emulator_password
      : process.env[user.shared_password_env];

    if (!password) {
      throw new Error(
        `Set ${user.shared_password_env} before seeding shared Auth`,
      );
    }

    try {
      await authClient.getUser(user.uid);
      await authClient.updateUser(user.uid, {
        email: user.email,
        displayName: user.display_name,
        emailVerified: true,
        password,
      });
    } catch (error) {
      if (error.code !== "auth/user-not-found") {
        throw error;
      }
      await authClient.createUser({
        uid: user.uid,
        email: user.email,
        displayName: user.display_name,
        emailVerified: true,
        password,
      });
    }

    await authClient.setCustomUserClaims(user.uid, user.claims);
  }
}

async function writeDocuments(database, documents) {
  const batchSize = 400;

  for (let start = 0; start < documents.length; start += batchSize) {
    const batch = database.batch();
    for (const document of documents.slice(start, start + batchSize)) {
      batch.set(
        database.doc(document.path),
        convertSpecialValues(document.data),
      );
    }
    await batch.commit();
  }
}

async function verifySeed(database, authClient, seed) {
  const documentPaths = [
    "system/schema",
    "profiles/demo-merchant",
    "products/cooking-oil-1l",
    "organizations/merchant-berrechid",
    "organizations/merchant-berrechid/extraction_drafts/draft-001",
    "group_orders/group-oil-001",
  ];

  const snapshots = await database.getAll(
    ...documentPaths.map((path) => database.doc(path)),
  );
  const missing = snapshots
    .filter((snapshot) => !snapshot.exists)
    .map((snapshot) => snapshot.ref.path);
  if (missing.length > 0) {
    throw new Error(`Seed verification is missing: ${missing.join(", ")}`);
  }

  for (const user of seed.auth_users) {
    const record = await authClient.getUser(user.uid);
    if (record.customClaims?.organization_id !== user.claims.organization_id) {
      throw new Error(`Auth claims were not applied for ${user.uid}`);
    }
  }
}

async function main() {
  const seedPath = option("--data", defaultSeedPath);
  const seed = JSON.parse(await readFile(seedPath, "utf8"));
  const counts = validateSeed(seed);

  if (hasFlag("--validate-only")) {
    console.log(
      `Seed is valid: ${counts.authUsers} Auth users, ${counts.documents} Firestore documents`,
    );
    return;
  }

  const projectId =
    option("--project") ?? process.env.FIREBASE_PROJECT_ID ?? "demo-gemmapunks";
  const usingEmulators = Boolean(
    process.env.FIRESTORE_EMULATOR_HOST &&
    process.env.FIREBASE_AUTH_EMULATOR_HOST,
  );

  if (projectId.startsWith("demo-") && !usingEmulators) {
    throw new Error(
      "A demo-* project may be seeded only while Auth and Firestore emulators are running",
    );
  }

  if (!usingEmulators) {
    const sharedConfirmed =
      hasFlag("--allow-shared") &&
      projectId === "gemmapunks" &&
      process.env.FIREBASE_SEED_CONFIRM_PROJECT === projectId;
    if (!sharedConfirmed) {
      throw new Error(
        "Shared seeding requires --allow-shared and FIREBASE_SEED_CONFIRM_PROJECT=gemmapunks",
      );
    }
  }

  const appOptions = { projectId };
  if (!usingEmulators) {
    appOptions.credential = applicationDefault();
  }
  const app = initializeApp(appOptions);

  try {
    const authClient = getAuth(app);
    const database = getFirestore(app);
    await upsertAuthUsers(authClient, seed.auth_users, usingEmulators);
    await writeDocuments(database, seed.documents);

    if (hasFlag("--verify")) {
      await verifySeed(database, authClient, seed);
    }

    console.log(
      `Seeded ${counts.authUsers} Auth users and ${counts.documents} Firestore documents into ${projectId}`,
    );
  } finally {
    await deleteApp(app);
  }
}

await main();
