import { readFile } from "node:fs/promises";
import { after, before, beforeEach, test } from "node:test";

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";

const projectId = "demo-gemmapunks-rules";
let testEnvironment;

before(async () => {
  const rules = await readFile("firestore.rules", "utf8");
  testEnvironment = await initializeTestEnvironment({
    projectId,
    firestore: { rules },
  });
});

beforeEach(async () => {
  await testEnvironment.clearFirestore();

  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const database = context.firestore();

    await Promise.all([
      setDoc(doc(database, "profiles/merchant-user"), {
        display_name: "Demo Merchant",
        primary_organization_id: "merchant-one",
      }),
      setDoc(doc(database, "profiles/other-user"), {
        display_name: "Other Merchant",
        primary_organization_id: "merchant-two",
      }),
      setDoc(doc(database, "organizations/merchant-one"), {
        name: "Merchant One",
        type: "MERCHANT",
      }),
      setDoc(doc(database, "organizations/merchant-two"), {
        name: "Merchant Two",
        type: "MERCHANT",
      }),
      setDoc(doc(database, "organizations/supplier-one"), {
        name: "Supplier One",
        type: "SUPPLIER",
      }),
      setDoc(doc(database, "organizations/supplier-two"), {
        name: "Supplier Two",
        type: "SUPPLIER",
      }),
      setDoc(
        doc(database, "organizations/merchant-one/memberships/merchant-user"),
        {
          organization_id: "merchant-one",
          user_id: "merchant-user",
          role: "OWNER",
        },
      ),
      setDoc(
        doc(database, "organizations/merchant-one/memberships/teammate-user"),
        {
          organization_id: "merchant-one",
          user_id: "teammate-user",
          role: "MEMBER",
        },
      ),
      setDoc(
        doc(
          database,
          "organizations/merchant-one/transactions/transaction-one",
        ),
        {
          organization_id: "merchant-one",
          status: "CONFIRMED",
          total_centimes: 44000,
        },
      ),
      setDoc(
        doc(
          database,
          "organizations/merchant-two/transactions/transaction-two",
        ),
        {
          organization_id: "merchant-two",
          status: "CONFIRMED",
          total_centimes: 22000,
        },
      ),
      setDoc(doc(database, "products/cooking-oil-1l"), {
        canonical_name: "Cooking oil 1L",
        unit: "BOTTLE",
      }),
      setDoc(doc(database, "supplier_opportunities/opportunity-one"), {
        supplier_organization_id: "supplier-one",
        product_id: "cooking-oil-1l",
        coarse_area: "Berrechid",
        total_quantity: 55,
        status: "ACTIVE",
      }),
      setDoc(doc(database, "group_orders/group-one"), {
        product_id: "cooking-oil-1l",
        participant_organization_ids: ["merchant-one", "merchant-two"],
        status: "PROPOSED",
      }),
    ]);
  });
});

after(async () => {
  await testEnvironment.cleanup();
});

function merchantDatabase() {
  return testEnvironment
    .authenticatedContext("merchant-user", {
      organization_id: "merchant-one",
      role: "OWNER",
    })
    .firestore();
}

function supplierDatabase() {
  return testEnvironment
    .authenticatedContext("supplier-user", {
      organization_id: "supplier-one",
      role: "OWNER",
    })
    .firestore();
}

function otherSupplierDatabase() {
  return testEnvironment
    .authenticatedContext("supplier-user-two", {
      organization_id: "supplier-two",
      role: "OWNER",
    })
    .firestore();
}

test("unauthenticated users cannot read Firebase business data", async () => {
  const database = testEnvironment.unauthenticatedContext().firestore();

  await assertFails(getDoc(doc(database, "products/cooking-oil-1l")));
  await assertFails(getDoc(doc(database, "organizations/merchant-one")));
  await assertFails(
    getDoc(doc(database, "supplier_opportunities/opportunity-one")),
  );
});

test("a user can read their own profile, organization, and private records", async () => {
  const database = merchantDatabase();

  await assertSucceeds(getDoc(doc(database, "profiles/merchant-user")));
  await assertSucceeds(getDoc(doc(database, "organizations/merchant-one")));
  await assertSucceeds(
    getDoc(
      doc(database, "organizations/merchant-one/transactions/transaction-one"),
    ),
  );
  await assertSucceeds(
    getDocs(collection(database, "organizations/merchant-one/transactions")),
  );
});

test("a user cannot read another organization or profile", async () => {
  const database = merchantDatabase();

  await assertFails(getDoc(doc(database, "profiles/other-user")));
  await assertFails(getDoc(doc(database, "organizations/merchant-two")));
  await assertFails(
    getDoc(
      doc(database, "organizations/merchant-two/transactions/transaction-two"),
    ),
  );
});

test("a user can read only their own membership document", async () => {
  const database = merchantDatabase();

  await assertSucceeds(
    getDoc(
      doc(database, "organizations/merchant-one/memberships/merchant-user"),
    ),
  );
  await assertFails(
    getDoc(
      doc(database, "organizations/merchant-one/memberships/teammate-user"),
    ),
  );
  await assertFails(
    getDocs(collection(database, "organizations/merchant-one/memberships")),
  );
});

test("signed-in users can read canonical products", async () => {
  await assertSucceeds(
    getDoc(doc(merchantDatabase(), "products/cooking-oil-1l")),
  );
  await assertSucceeds(
    getDoc(doc(supplierDatabase(), "products/cooking-oil-1l")),
  );
});

test("client writes to business records are always denied", async () => {
  const database = merchantDatabase();

  await assertFails(
    setDoc(
      doc(database, "organizations/merchant-one/transactions/client-write"),
      {
        organization_id: "merchant-one",
        status: "CONFIRMED",
        total_centimes: 1,
      },
    ),
  );
  await assertFails(
    setDoc(doc(database, "products/client-product"), {
      canonical_name: "Unsafe product",
    }),
  );
});

test("only supplier organizations can read aggregated opportunities", async () => {
  await assertSucceeds(
    getDoc(doc(supplierDatabase(), "supplier_opportunities/opportunity-one")),
  );
  await assertFails(
    getDoc(doc(merchantDatabase(), "supplier_opportunities/opportunity-one")),
  );
  await assertFails(
    getDoc(
      doc(otherSupplierDatabase(), "supplier_opportunities/opportunity-one"),
    ),
  );
});

test("group-order storage is server-only even for participants", async () => {
  await assertFails(getDoc(doc(merchantDatabase(), "group_orders/group-one")));
  await assertFails(getDoc(doc(supplierDatabase(), "group_orders/group-one")));
});
