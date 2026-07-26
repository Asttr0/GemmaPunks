# MIZAN Control — live demo script

Target length: 4–5 minutes.

## 1. Open the control tower

Sign in with **Demo finance team** and open the control tower.

Say:

> Atlas Distribution Maroc handles many suppliers, warehouses, invoices,
> deliveries, and payments. MIZAN continuously connects that evidence so
> finance sees what needs attention before money leaves the company.

Point to:

- 1,248,500 MAD monitored spend.
- 18,850 MAD preventable leakage.
- 240,000 MAD cash at risk.
- Three open financial-control findings.

## 2. Show real AI extraction

Open **Financial evidence** and upload:

```text
packages/demo-data/financial-records/invoice-inv-8821.png
```

Explain that Gemma reads the French Moroccan supplier invoice and creates a
draft. It does not write an official record or release payment.

Review the extracted line and confirm it only if the values are correct.

## 3. Run the control audit

Open **Audit center** and click **Run control audit**.

Show the tool timeline:

1. Gemma classifies and normalizes multilingual evidence.
2. Deterministic code performs the three-way match.
3. Deterministic code checks duplicate bank payments.
4. Deterministic code forecasts working capital.
5. Deterministic code ranks supplier risk.

Say:

> Gemma understands the documents. Code calculates the money. A human decides.

## 4. Investigate INV-8821

Open the critical finding and show the evidence chain:

| Evidence | Value |
|---|---:|
| PO-1042 | 500 cartons × 180 MAD |
| BL-4478 | 480 cartons received |
| INV-8821 | 500 cartons × 185 MAD |
| Approved payable | 86,400 MAD |
| Supplier invoice | 92,500 MAD |
| Preventable leakage | 6,100 MAD |

Click **Prepare supplier dispute**.

Emphasize that the system records human approval and prepares an evidence pack;
it does not execute a payment automatically.

## 5. Show wider company value

Open **Cash-flow forecast**:

- show the 118,000 MAD projected low point on 16 August;
- show the Marjane receivable that helps the balance recover.

Open **Supplier intelligence**:

- show 68% category concentration with Maghreb Oils & Foods;
- show Nord Agro Distribution as the recommended backup;
- compare delivery reliability and contract compliance.

Open **Connected records** and show that one invoice links back to its PO and
delivery note.

## 6. Close on investor impact

Open **Demo impact** and say:

> MIZAN Control does not replace the ERP. It becomes the intelligence and
> financial-control layer above the records a distributor already has.

Closing line:

> Every disconnected record is a risk. MIZAN turns those records into protected
> cash, stronger supplier control, and decisions management can explain.

## Recovery plan

- Hosted AI problem: set `AI_PROVIDER=fixture` and restart the API.
- Unknown uploaded file in fixture mode: use
  `packages/demo-data/financial-records/invoice-inv-8821.png` with hosted Gemma,
  or use the approved fixture filename.
- Dirty emulator state: restart the emulators and run the seed command again.
- Network failure: show the control-tower preview data and backup recording.
