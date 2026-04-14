"""
zoning_checker.py
Evaluates building compliance against zoning rules.
Supports both real zone rules (from zoning_data.py) and legacy mock rules.
"""

from typing import Dict, Any, List, Optional

from zoning_data import DEFAULT_MOCK_RULES

# Legacy defaults (kept for backward compatibility)
MAX_FLOORS = 5
MIN_SETBACK = 3.0       # meters each side
MAX_COVERAGE = 0.60     # 60% of plot area
FLOOR_HEIGHT_M = 3.0    # meters per floor


def check_zoning(
    plot_width: float,
    plot_length: float,
    floors: int,
    building_width: float,
    building_length: float,
    zone_rules: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Evaluate building compliance.
    If zone_rules is provided, uses real FSI/height/setback/coverage limits.
    Otherwise falls back to legacy hardcoded rules.
    """
    rules = zone_rules if zone_rules else dict(DEFAULT_MOCK_RULES)

    max_fsi = float(rules.get("max_fsi", 3.0))
    max_floors_limit = int(rules.get("max_floors", MAX_FLOORS))
    max_height_m = float(rules.get("max_height_m", 24.0))
    min_setback_front = float(rules.get("min_setback_front_m", MIN_SETBACK))
    min_setback_side = float(rules.get("min_setback_side_m", MIN_SETBACK))
    min_setback_rear = float(rules.get("min_setback_rear_m", MIN_SETBACK))
    max_coverage_pct = float(rules.get("max_coverage_pct", MAX_COVERAGE * 100))

    violations: List[str] = []
    rule_results: List[Dict[str, Any]] = []

    plot_area = plot_width * plot_length
    building_area = building_width * building_length
    coverage = building_area / plot_area if plot_area > 0 else 0
    coverage_pct = round(coverage * 100, 1)

    # Building height
    building_height = floors * FLOOR_HEIGHT_M

    # Setbacks (assume building centered on plot)
    setback_x = (plot_width - building_width) / 2   # side setbacks
    setback_y = (plot_length - building_length) / 2  # front/rear setbacks

    # FSI (total built-up area / plot area)
    total_built = building_area * floors
    fsi_actual = total_built / plot_area if plot_area > 0 else 0

    # ---------- Rule 1: FSI ----------
    fsi_status = _get_status(fsi_actual, max_fsi)
    rule_results.append({
        "rule_name": "Floor Space Index (FSI)",
        "limit": max_fsi,
        "actual": round(fsi_actual, 2),
        "unit": "",
        "status": fsi_status,
        "message": f"FSI {fsi_actual:.2f} vs max {max_fsi}",
    })
    if fsi_status == "VIOLATION":
        violations.append(
            f"FSI violation: {fsi_actual:.2f} exceeds maximum {max_fsi}"
        )

    # ---------- Rule 2: Max Floors ----------
    floor_status = _get_status(floors, max_floors_limit)
    rule_results.append({
        "rule_name": "Maximum Floors",
        "limit": max_floors_limit,
        "actual": floors,
        "unit": "floors",
        "status": floor_status,
        "message": f"{floors} floors vs max {max_floors_limit}",
    })
    if floor_status == "VIOLATION":
        violations.append(
            f"Floor count violation: {floors} floors exceed maximum {max_floors_limit}"
        )

    # ---------- Rule 3: Max Height ----------
    height_status = _get_status(building_height, max_height_m)
    rule_results.append({
        "rule_name": "Maximum Height",
        "limit": max_height_m,
        "actual": building_height,
        "unit": "m",
        "status": height_status,
        "message": f"{building_height:.0f}m vs max {max_height_m:.0f}m",
    })
    if height_status == "VIOLATION":
        violations.append(
            f"Height violation: {building_height:.0f}m exceeds maximum {max_height_m:.0f}m"
        )

    # ---------- Rule 4: Front/Rear Setback ----------
    front_setback_status = _get_status_inverse(setback_y, min_setback_front)
    rule_results.append({
        "rule_name": "Front/Rear Setback",
        "limit": min_setback_front,
        "actual": round(setback_y, 1),
        "unit": "m",
        "status": front_setback_status,
        "message": f"{setback_y:.1f}m vs min {min_setback_front:.1f}m",
    })
    if front_setback_status == "VIOLATION":
        violations.append(
            f"Front/rear setback violation: {setback_y:.1f}m is less than minimum {min_setback_front:.1f}m"
        )

    # ---------- Rule 5: Side Setback ----------
    side_setback_status = _get_status_inverse(setback_x, min_setback_side)
    rule_results.append({
        "rule_name": "Side Setback",
        "limit": min_setback_side,
        "actual": round(setback_x, 1),
        "unit": "m",
        "status": side_setback_status,
        "message": f"{setback_x:.1f}m vs min {min_setback_side:.1f}m",
    })
    if side_setback_status == "VIOLATION":
        violations.append(
            f"Side setback violation: {setback_x:.1f}m is less than minimum {min_setback_side:.1f}m"
        )

    # ---------- Rule 6: Building Coverage ----------
    cov_status = _get_status(coverage_pct, max_coverage_pct)
    rule_results.append({
        "rule_name": "Ground Coverage",
        "limit": max_coverage_pct,
        "actual": coverage_pct,
        "unit": "%",
        "status": cov_status,
        "message": f"{coverage_pct}% vs max {max_coverage_pct:.0f}%",
    })
    if cov_status == "VIOLATION":
        violations.append(
            f"Coverage violation: {coverage_pct}% exceeds maximum {max_coverage_pct:.0f}%"
        )

    # Overall status
    statuses = [r["status"] for r in rule_results]
    if "VIOLATION" in statuses:
        overall = "FAIL"
    elif "WARNING" in statuses:
        overall = "WARNING"
    else:
        overall = "PASS"

    # Zone info for display
    zone_info = None
    if zone_rules:
        zone_info = {
            "zone_code": rules.get("zone_code", "—"),
            "zone_name": rules.get("zone_name", "—"),
            "city": rules.get("city", "—"),
            "authority": rules.get("authority", "—"),
            "source": rules.get("source", "—"),
        }

    return {
        "status": overall,
        "violations": violations,
        "coverage": coverage_pct,
        "setback_x": round(setback_x, 2),
        "setback_y": round(setback_y, 2),
        "fsi": round(fsi_actual, 2),
        "building_height": building_height,
        "rules": rule_results,
        "zone_info": zone_info,
        "rules_applied": {
            "max_fsi": max_fsi,
            "max_floors": max_floors_limit,
            "max_height_m": max_height_m,
            "min_setback_front_m": min_setback_front,
            "min_setback_side_m": min_setback_side,
            "min_setback_rear_m": min_setback_rear,
            "max_coverage_pct": max_coverage_pct,
        },
    }


def _get_status(actual: float, limit: float) -> str:
    """For 'must not exceed' rules: actual vs limit."""
    if actual > limit:
        return "VIOLATION"
    if actual > limit * 0.9:
        return "WARNING"
    return "OK"


def _get_status_inverse(actual: float, minimum: float) -> str:
    """For 'must be at least' rules: actual vs minimum."""
    if actual < minimum:
        return "VIOLATION"
    # Exact minimum setback is compliant; warn only in the narrow band just above minimum.
    if minimum < actual < minimum * 1.15:
        return "WARNING"
    return "OK"
