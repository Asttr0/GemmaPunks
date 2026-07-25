import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8082";
process.env.GCLOUD_PROJECT = "demo-gemmapunks";

initializeApp({
  projectId: "demo-gemmapunks",
});

const db = getFirestore();

const orgId = "supplier-atlas"; // the seeded supplier org ID from your fixtures

const catalog = await db
  .collection("organizations")
  .doc(orgId)
  .collection("supplier_catalog_items")
  .get();
console.log(`supplier_catalog_items: ${catalog.size} docs`);
catalog.forEach((d) => console.log(d.id, d.data()));

const opportunities = await db
  .collection("organizations")
  .doc(orgId)
  .collection("supplier_opportunities")
  .get();
console.log(`supplier_opportunities: ${opportunities.size} docs`);
opportunities.forEach((d) => console.log(d.id, d.data()));

process.exit(0);
