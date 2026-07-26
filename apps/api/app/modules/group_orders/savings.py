from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal


@dataclass(frozen=True)
class CollectiveSavings:
    product_saving_centimes: int
    delivery_saving_centimes: int
    total_saving_centimes: int
    collective_delivery_share_centimes: int


def calculate_collective_savings(
    *,
    member_quantity: float,
    total_quantity: float,
    original_unit_price_centimes: int,
    collective_unit_price_centimes: int,
    original_delivery_centimes: int,
    collective_delivery_total_centimes: int,
) -> CollectiveSavings:
    if member_quantity <= 0 or total_quantity <= 0:
        raise ValueError("Quantities must be greater than zero")
    if member_quantity > total_quantity:
        raise ValueError("Member quantity cannot exceed total quantity")

    collective_delivery_share = int(
        (
            Decimal(collective_delivery_total_centimes)
            * Decimal(str(member_quantity))
            / Decimal(str(total_quantity))
        ).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    )
    unit_difference = max(
        0,
        original_unit_price_centimes - collective_unit_price_centimes,
    )
    product_saving = int(
        (Decimal(unit_difference) * Decimal(str(member_quantity))).quantize(
            Decimal("1"),
            rounding=ROUND_HALF_UP,
        )
    )
    delivery_saving = max(
        0,
        original_delivery_centimes - collective_delivery_share,
    )
    return CollectiveSavings(
        product_saving_centimes=product_saving,
        delivery_saving_centimes=delivery_saving,
        total_saving_centimes=product_saving + delivery_saving,
        collective_delivery_share_centimes=collective_delivery_share,
    )
