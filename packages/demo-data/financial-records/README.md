# Atlas Distribution Maroc — synthetic demo evidence

All files in this folder are fictional and safe to use during the hackathon.
They demonstrate one explainable three-way-match exception:

- `PO-1042`: 500 cartons of cooking oil approved at 180.00 MAD per carton.
- `BL-4478`: the Casablanca warehouse received 480 cartons.
- `INV-8821`: the supplier invoiced 500 cartons at 185.00 MAD per carton.
- Deterministic approved payable: `480 × 180.00 = 86,400.00 MAD`.
- Supplier invoice: `500 × 185.00 = 92,500.00 MAD`.
- Preventable leakage: `6,100.00 MAD`.

Pitch-ready files:

1. `purchase-order-po-1042.png` — approved order: 500 cartons at 180 MAD.
2. `delivery-note-bl-4478.png` — warehouse received only 480 cartons.
3. `invoice-inv-8821.png` — supplier billed 500 cartons at 185 MAD.

Upload these exact PNG filenames on **Financial evidence**. They are approved
demo fixtures, so the flow remains reliable if live inference is unavailable.
The same references already appear in **Connected records**, **Audit center**,
and the control-tower decision brief.

The app must treat every AI result as a draft. A human reviews extracted fields
and approves any financial-control action.
