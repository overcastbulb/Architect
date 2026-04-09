"""
zoning_checker.py
Evaluates building compliance against zoning rules.
"""

from typing import Dict, Any, List

MAX_FLOORS = 5
MIN_SETBACK = 3.0       # meters each side
MAX_COVERAGE = 0.60     # 60% of plot area


def check_zoning(
    plot_width: float,
    plot_length: float,
    floors: int,
    building_width: float,
    building_length: float,
) -> Dict[str, Any]:
    violations: List[str] = []

    # 1. Setback check
    setback_x = (plot_width - building_width) / 2
    setback_y = (plot_length - building_length) / 2

    if setback_x < MIN_SETBACK:
        violations.append(
            f"Setback violation: side setback is {setback_x:.1f}m "
            f"(minimum required: {MIN_SETBACK}m)"
        )
    if setback_y < MIN_SETBACK:
        violations.append(
            f"Setback violation: front/rear setback is {setback_y:.1f}m "
            f"(minimum required: {MIN_SETBACK}m)"
        )

    # 2. Floor count check
    if floors > MAX_FLOORS:
        violations.append(
            f"Floor count violation: {floors} floors exceed the maximum of {MAX_FLOORS} floors"
        )

    # 3. Building coverage check
    plot_area = plot_width * plot_length
    building_area = building_width * building_length
    coverage = building_area / plot_area if plot_area > 0 else 0

    if coverage > MAX_COVERAGE:
        violations.append(
            f"Coverage violation: building covers {coverage*100:.1f}% of plot "
            f"(maximum allowed: {MAX_COVERAGE*100:.0f}%)"
        )

    status = "PASS" if not violations else "FAIL"

    return {
        "status": status,
        "violations": violations,
        "coverage": round(coverage * 100, 1),
        "setback_x": round(setback_x, 2),
        "setback_y": round(setback_y, 2),
        "rules": {
            "max_floors": MAX_FLOORS,
            "min_setback_m": MIN_SETBACK,
            "max_coverage_pct": MAX_COVERAGE * 100,
        },
    }
