"""
layout_generator.py
Generates a simple algorithmic rectangular floor layout with room divisions.
"""

from typing import List, Dict, Any
import math

SETBACK = 3.0  # meters each side


def generate_layout(
    plot_width: float,
    plot_length: float,
    floors: int,
    bedrooms: int,
    bathrooms: int,
    kitchen: bool,
) -> Dict[str, Any]:
    # Building footprint after setbacks
    bw = max(plot_width - 2 * SETBACK, 2.0)
    bl = max(plot_length - 2 * SETBACK, 2.0)

    total_area = bw * bl

    # Room list with type tags
    room_defs = []
    room_defs.append({"type": "living_room", "label": "Living Room", "weight": 2.5})
    if kitchen:
        room_defs.append({"type": "kitchen", "label": "Kitchen", "weight": 1.5})
    for i in range(bedrooms):
        room_defs.append({"type": "bedroom", "label": f"Bedroom {i+1}", "weight": 1.8})
    for i in range(bathrooms):
        room_defs.append({"type": "bathroom", "label": f"Bathroom {i+1}", "weight": 0.8})

    total_weight = sum(r["weight"] for r in room_defs)

    # Assign area proportionally
    for r in room_defs:
        r["area"] = round((r["weight"] / total_weight) * total_area, 2)

    # Layout: stack rooms in a grid-style arrangement
    # Strategy: divide building into rows based on room count
    rooms = _place_rooms(room_defs, bw, bl)

    dimensions = {
        "plot_width": plot_width,
        "plot_length": plot_length,
        "building_width": round(bw, 2),
        "building_length": round(bl, 2),
        "total_floor_area": round(total_area, 2),
        "setback": SETBACK,
        "floors": floors,
    }

    return {
        "rooms": rooms,
        "dimensions": dimensions,
        "building_width": round(bw, 2),
        "building_length": round(bl, 2),
    }


def _place_rooms(room_defs: List[Dict], bw: float, bl: float) -> List[Dict]:
    """
    Simple bin-packing layout:
    - Row 1 (front/entrance side): Living Room + Kitchen
    - Row 2+: Bedrooms + Bathrooms side by side
    """
    placed = []
    n = len(room_defs)

    if n == 0:
        return placed

    # Separate into front (living/kitchen) and back (bed/bath)
    front = [r for r in room_defs if r["type"] in ("living_room", "kitchen")]
    back = [r for r in room_defs if r["type"] not in ("living_room", "kitchen")]

    # Determine row heights proportionally
    front_weight = sum(r["weight"] for r in front) if front else 0
    back_weight = sum(r["weight"] for r in back) if back else 0
    total_w = front_weight + back_weight or 1

    front_height = round((front_weight / total_w) * bl, 2) if front else 0
    back_height = round(bl - front_height, 2) if back else 0

    # Place front row
    if front:
        front_height = max(front_height, 2.0)
        x_cursor = 0.0
        total_front_weight = sum(r["weight"] for r in front)
        for r in front:
            rw = round((r["weight"] / total_front_weight) * bw, 2)
            placed.append({
                "id": r["type"],
                "label": r["label"],
                "type": r["type"],
                "x": round(x_cursor, 2),
                "y": 0.0,
                "width": rw,
                "height": front_height,
                "area": round(rw * front_height, 2),
            })
            x_cursor += rw

    # Place back row (bedrooms + bathrooms alternated)
    if back:
        back_height = max(back_height, 2.0)
        # pair each bedroom with a bathroom if possible
        ordered_back = _interleave_rooms(back)
        x_cursor = 0.0
        total_back_weight = sum(r["weight"] for r in ordered_back)
        for r in ordered_back:
            rw = round((r["weight"] / total_back_weight) * bw, 2)
            placed.append({
                "id": r["type"] + str(ordered_back.index(r)),
                "label": r["label"],
                "type": r["type"],
                "x": round(x_cursor, 2),
                "y": front_height,
                "width": rw,
                "height": back_height,
                "area": round(rw * back_height, 2),
            })
            x_cursor += rw

    return placed


def _interleave_rooms(rooms: List[Dict]) -> List[Dict]:
    """Arrange bedrooms and bathrooms so bathrooms follow each bedroom."""
    bedrooms = [r for r in rooms if r["type"] == "bedroom"]
    bathrooms = [r for r in rooms if r["type"] == "bathroom"]
    result = []
    b_idx = 0
    for bed in bedrooms:
        result.append(bed)
        if b_idx < len(bathrooms):
            result.append(bathrooms[b_idx])
            b_idx += 1
    # remaining bathrooms
    result.extend(bathrooms[b_idx:])
    return result
