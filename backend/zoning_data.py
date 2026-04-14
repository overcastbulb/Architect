"""
zoning_data.py
Comprehensive Indian city zoning database.
Contains real FSI, height, setback, and coverage rules for Pune, Mumbai, and Bangalore.
Sources: UDCPR-2020, PMRDA DP 2041, DCPR 2034, BBMP Building Bye-Laws.
"""

from typing import Dict, Any, List, Optional

# ---------------------------------------------------------------------------
# City bounding boxes for coordinate-based city detection
# Format: { city: (lat_min, lat_max, lng_min, lng_max) }
# ---------------------------------------------------------------------------
CITY_BOUNDARIES: Dict[str, tuple] = {
    "pune": (18.40, 18.65, 73.72, 74.00),
    "mumbai": (18.87, 19.30, 72.77, 73.05),
    "bangalore": (12.85, 13.15, 77.45, 77.78),
}

# Broad India bounding box for nationwide fallback.
INDIA_BOUNDARY = (6.0, 37.5, 68.0, 98.5)  # lat_min, lat_max, lng_min, lng_max

# ---------------------------------------------------------------------------
# Zone database — keyed by "city:zone_code"
# ---------------------------------------------------------------------------
ZONE_DATABASE: Dict[str, Dict[str, Any]] = {
    # ========== PUNE (PMRDA / PMC) ==========
    "pune:R1": {
        "zone_code": "R1",
        "zone_name": "Low Density Residential",
        "city": "Pune",
        "authority": "PMC / PMRDA",
        "source": "UDCPR-2020 & PMRDA Development Plan 2041",
        "max_fsi": 1.1,
        "max_floors": 4,
        "max_height_m": 15.0,
        "min_setback_front_m": 3.0,
        "min_setback_side_m": 1.5,
        "min_setback_rear_m": 2.0,
        "max_coverage_pct": 55.0,
        "permitted_uses": [
            "Detached housing", "Row houses", "Bungalows",
            "Parks", "Playground", "Primary school"
        ],
        "conditional_uses": [
            "Home-based professional office",
            "Neighbourhood retail (ground floor, < 50 sqm)"
        ],
    },
    "pune:R2": {
        "zone_code": "R2",
        "zone_name": "Medium Density Residential",
        "city": "Pune",
        "authority": "PMC / PMRDA",
        "source": "UDCPR-2020 & PMRDA Development Plan 2041",
        "max_fsi": 1.5,
        "max_floors": 7,
        "max_height_m": 24.0,
        "min_setback_front_m": 3.0,
        "min_setback_side_m": 2.0,
        "min_setback_rear_m": 2.0,
        "max_coverage_pct": 50.0,
        "permitted_uses": [
            "Apartments", "Group housing", "Societies",
            "Parks", "Schools", "Clinics"
        ],
        "conditional_uses": [
            "Mixed-use retail (ground floor only)",
            "Home office", "Guest house"
        ],
    },
    "pune:C1": {
        "zone_code": "C1",
        "zone_name": "Local Commercial",
        "city": "Pune",
        "authority": "PMC / PMRDA",
        "source": "UDCPR-2020 & PMRDA Development Plan 2041",
        "max_fsi": 1.5,
        "max_floors": 5,
        "max_height_m": 18.0,
        "min_setback_front_m": 3.0,
        "min_setback_side_m": 2.0,
        "min_setback_rear_m": 2.0,
        "max_coverage_pct": 55.0,
        "permitted_uses": [
            "Retail shops", "Offices", "Restaurants",
            "Banks", "Showrooms"
        ],
        "conditional_uses": [
            "Residential above ground floor",
            "Clinic / Diagnostic centre"
        ],
    },
    "pune:C2": {
        "zone_code": "C2",
        "zone_name": "Central Commercial / CBD",
        "city": "Pune",
        "authority": "PMC / PMRDA",
        "source": "UDCPR-2020 & PMRDA Development Plan 2041",
        "max_fsi": 2.5,
        "max_floors": 12,
        "max_height_m": 45.0,
        "min_setback_front_m": 4.5,
        "min_setback_side_m": 3.0,
        "min_setback_rear_m": 3.0,
        "max_coverage_pct": 45.0,
        "permitted_uses": [
            "Corporate offices", "Shopping malls", "Hotels",
            "Multiplexes", "Convention centres"
        ],
        "conditional_uses": [
            "Residential (upper floors)",
            "Hospital", "Educational institution"
        ],
    },
    "pune:I": {
        "zone_code": "I",
        "zone_name": "Industrial",
        "city": "Pune",
        "authority": "PMC / PMRDA",
        "source": "UDCPR-2020 & PMRDA Development Plan 2041",
        "max_fsi": 1.0,
        "max_floors": 3,
        "max_height_m": 15.0,
        "min_setback_front_m": 6.0,
        "min_setback_side_m": 4.5,
        "min_setback_rear_m": 4.5,
        "max_coverage_pct": 60.0,
        "permitted_uses": [
            "Manufacturing", "Warehousing", "Logistics",
            "IT parks", "Processing units"
        ],
        "conditional_uses": [
            "Worker housing (within complex)",
            "Canteen / Cafeteria"
        ],
    },

    # ========== MUMBAI (BMC) ==========
    "mumbai:R1": {
        "zone_code": "R1",
        "zone_name": "Low Density Residential (Suburbs)",
        "city": "Mumbai",
        "authority": "BMC (MCGM)",
        "source": "DCPR 2034 — Development Control & Promotion Regulations",
        "max_fsi": 1.33,
        "max_floors": 5,
        "max_height_m": 18.0,
        "min_setback_front_m": 3.0,
        "min_setback_side_m": 2.0,
        "min_setback_rear_m": 2.0,
        "max_coverage_pct": 50.0,
        "permitted_uses": [
            "Detached housing", "Row houses",
            "Parks", "Schools"
        ],
        "conditional_uses": [
            "Home office", "Small retail (ground floor)"
        ],
    },
    "mumbai:R2": {
        "zone_code": "R2",
        "zone_name": "Medium–High Density Residential",
        "city": "Mumbai",
        "authority": "BMC (MCGM)",
        "source": "DCPR 2034 — Development Control & Promotion Regulations",
        "max_fsi": 2.5,
        "max_floors": 15,
        "max_height_m": 50.0,
        "min_setback_front_m": 4.5,
        "min_setback_side_m": 3.0,
        "min_setback_rear_m": 3.0,
        "max_coverage_pct": 40.0,
        "permitted_uses": [
            "Apartments", "High-rise towers", "Group housing",
            "Parks", "Schools", "Hospitals"
        ],
        "conditional_uses": [
            "Mixed-use retail (ground + first floor)",
            "Gym / Community centre"
        ],
    },
    "mumbai:C1": {
        "zone_code": "C1",
        "zone_name": "Commercial",
        "city": "Mumbai",
        "authority": "BMC (MCGM)",
        "source": "DCPR 2034 — Development Control & Promotion Regulations",
        "max_fsi": 3.0,
        "max_floors": 20,
        "max_height_m": 70.0,
        "min_setback_front_m": 6.0,
        "min_setback_side_m": 4.5,
        "min_setback_rear_m": 4.5,
        "max_coverage_pct": 40.0,
        "permitted_uses": [
            "Offices", "Retail", "Hotels", "Malls",
            "Entertainment", "Convention"
        ],
        "conditional_uses": [
            "Residential (upper floors)", "Hospital"
        ],
    },
    "mumbai:I": {
        "zone_code": "I",
        "zone_name": "Industrial",
        "city": "Mumbai",
        "authority": "BMC (MCGM)",
        "source": "DCPR 2034 — Development Control & Promotion Regulations",
        "max_fsi": 1.0,
        "max_floors": 4,
        "max_height_m": 15.0,
        "min_setback_front_m": 6.0,
        "min_setback_side_m": 4.5,
        "min_setback_rear_m": 4.5,
        "max_coverage_pct": 55.0,
        "permitted_uses": [
            "Manufacturing", "Warehousing", "Logistics"
        ],
        "conditional_uses": [
            "IT / ITES (in designated parks)"
        ],
    },

    # ========== BANGALORE (BBMP) ==========
    "bangalore:R1": {
        "zone_code": "R1",
        "zone_name": "Low Density Residential",
        "city": "Bangalore",
        "authority": "BBMP / BDA",
        "source": "BBMP Building Bye-Laws & RMP 2031",
        "max_fsi": 1.5,
        "max_floors": 4,
        "max_height_m": 15.0,
        "min_setback_front_m": 3.0,
        "min_setback_side_m": 1.5,
        "min_setback_rear_m": 1.5,
        "max_coverage_pct": 55.0,
        "permitted_uses": [
            "Independent houses", "Villas", "Row houses",
            "Parks", "Primary school"
        ],
        "conditional_uses": [
            "Home-based professional office"
        ],
    },
    "bangalore:R2": {
        "zone_code": "R2",
        "zone_name": "Medium–High Density Residential",
        "city": "Bangalore",
        "authority": "BBMP / BDA",
        "source": "BBMP Building Bye-Laws & RMP 2031",
        "max_fsi": 2.25,
        "max_floors": 10,
        "max_height_m": 35.0,
        "min_setback_front_m": 3.0,
        "min_setback_side_m": 2.0,
        "min_setback_rear_m": 2.0,
        "max_coverage_pct": 50.0,
        "permitted_uses": [
            "Apartments", "Group housing",
            "Parks", "Schools", "Clinics"
        ],
        "conditional_uses": [
            "Mixed-use (ground floor retail)",
            "Co-working space"
        ],
    },
    "bangalore:C1": {
        "zone_code": "C1",
        "zone_name": "Local Commercial",
        "city": "Bangalore",
        "authority": "BBMP / BDA",
        "source": "BBMP Building Bye-Laws & RMP 2031",
        "max_fsi": 2.5,
        "max_floors": 8,
        "max_height_m": 28.0,
        "min_setback_front_m": 3.0,
        "min_setback_side_m": 2.5,
        "min_setback_rear_m": 2.5,
        "max_coverage_pct": 50.0,
        "permitted_uses": [
            "Retail", "Offices", "Restaurants",
            "Banks", "Showrooms"
        ],
        "conditional_uses": [
            "Residential (upper floors)", "Clinic"
        ],
    },
    "bangalore:C2": {
        "zone_code": "C2",
        "zone_name": "Central Commercial / CBD",
        "city": "Bangalore",
        "authority": "BBMP / BDA",
        "source": "BBMP Building Bye-Laws & RMP 2031",
        "max_fsi": 3.25,
        "max_floors": 15,
        "max_height_m": 50.0,
        "min_setback_front_m": 6.0,
        "min_setback_side_m": 4.5,
        "min_setback_rear_m": 4.5,
        "max_coverage_pct": 45.0,
        "permitted_uses": [
            "Corporate offices", "Shopping malls", "Hotels",
            "Convention centres", "Multiplexes"
        ],
        "conditional_uses": [
            "Residential (upper floors)", "Hospital"
        ],
    },
    "bangalore:I": {
        "zone_code": "I",
        "zone_name": "Industrial",
        "city": "Bangalore",
        "authority": "BBMP / BDA",
        "source": "BBMP Building Bye-Laws & RMP 2031",
        "max_fsi": 1.5,
        "max_floors": 4,
        "max_height_m": 15.0,
        "min_setback_front_m": 6.0,
        "min_setback_side_m": 4.5,
        "min_setback_rear_m": 4.5,
        "max_coverage_pct": 55.0,
        "permitted_uses": [
            "Manufacturing", "Warehousing", "IT parks",
            "Logistics", "Processing"
        ],
        "conditional_uses": [
            "Worker housing", "Canteen"
        ],
    },

    # ========== INDIA (PAN-INDIA FALLBACK BASELINES) ==========
    # Used when city-specific zoning database is unavailable.
    # Conservative defaults; local ULB/DCR should be verified for approvals.
    "india:R1": {
        "zone_code": "R1",
        "zone_name": "Low Density Residential (Pan-India Baseline)",
        "city": "India",
        "authority": "Local ULB / Development Authority",
        "source": "Pan-India conservative zoning baseline (fallback)",
        "max_fsi": 1.2,
        "max_floors": 3,
        "max_height_m": 12.0,
        "min_setback_front_m": 3.0,
        "min_setback_side_m": 1.5,
        "min_setback_rear_m": 2.0,
        "max_coverage_pct": 50.0,
        "permitted_uses": ["Independent houses", "Row housing", "Parks", "Primary school"],
        "conditional_uses": ["Home office", "Neighbourhood convenience retail"],
    },
    "india:R2": {
        "zone_code": "R2",
        "zone_name": "Medium Density Residential (Pan-India Baseline)",
        "city": "India",
        "authority": "Local ULB / Development Authority",
        "source": "Pan-India conservative zoning baseline (fallback)",
        "max_fsi": 1.8,
        "max_floors": 5,
        "max_height_m": 18.0,
        "min_setback_front_m": 3.0,
        "min_setback_side_m": 2.0,
        "min_setback_rear_m": 2.0,
        "max_coverage_pct": 45.0,
        "permitted_uses": ["Apartments", "Group housing", "Schools", "Clinics"],
        "conditional_uses": ["Ground-floor local retail", "Community facilities"],
    },
    "india:C1": {
        "zone_code": "C1",
        "zone_name": "Local Commercial (Pan-India Baseline)",
        "city": "India",
        "authority": "Local ULB / Development Authority",
        "source": "Pan-India conservative zoning baseline (fallback)",
        "max_fsi": 2.0,
        "max_floors": 5,
        "max_height_m": 20.0,
        "min_setback_front_m": 3.0,
        "min_setback_side_m": 2.0,
        "min_setback_rear_m": 2.0,
        "max_coverage_pct": 50.0,
        "permitted_uses": ["Retail", "Offices", "Restaurants", "Banks"],
        "conditional_uses": ["Upper-floor residential", "Small clinics"],
    },
    "india:C2": {
        "zone_code": "C2",
        "zone_name": "Central Commercial / CBD (Pan-India Baseline)",
        "city": "India",
        "authority": "Local ULB / Development Authority",
        "source": "Pan-India conservative zoning baseline (fallback)",
        "max_fsi": 2.5,
        "max_floors": 8,
        "max_height_m": 30.0,
        "min_setback_front_m": 4.5,
        "min_setback_side_m": 3.0,
        "min_setback_rear_m": 3.0,
        "max_coverage_pct": 45.0,
        "permitted_uses": ["Corporate offices", "Retail centers", "Hotels"],
        "conditional_uses": ["Mixed-use residential above commercial"],
    },
    "india:I": {
        "zone_code": "I",
        "zone_name": "Industrial (Pan-India Baseline)",
        "city": "India",
        "authority": "Local ULB / Development Authority",
        "source": "Pan-India conservative zoning baseline (fallback)",
        "max_fsi": 1.5,
        "max_floors": 4,
        "max_height_m": 18.0,
        "min_setback_front_m": 6.0,
        "min_setback_side_m": 4.5,
        "min_setback_rear_m": 4.5,
        "max_coverage_pct": 55.0,
        "permitted_uses": ["Manufacturing", "Warehousing", "Logistics", "Industrial services"],
        "conditional_uses": ["Worker amenities", "Canteen"],
    },
}


# ---------------------------------------------------------------------------
# Default mock rules (backward-compatible fallback)
# ---------------------------------------------------------------------------
DEFAULT_MOCK_RULES: Dict[str, Any] = {
    "zone_code": "MOCK",
    "zone_name": "Default Mock Zone",
    "city": "—",
    "authority": "—",
    "source": "Mock rules (no address provided)",
    "max_fsi": 3.0,
    "max_floors": 5,
    "max_height_m": 24.0,
    "min_setback_front_m": 3.0,
    "min_setback_side_m": 3.0,
    "min_setback_rear_m": 3.0,
    "max_coverage_pct": 60.0,
    "permitted_uses": ["Residential", "Commercial"],
    "conditional_uses": [],
}


def detect_city(lat: float, lng: float) -> Optional[str]:
    """Detect city from lat/lng using bounding boxes."""
    for city, (lat_min, lat_max, lng_min, lng_max) in CITY_BOUNDARIES.items():
        if lat_min <= lat <= lat_max and lng_min <= lng <= lng_max:
            return city
    return None


def is_india_coordinate(lat: float, lng: float) -> bool:
    """Approximate India geofence check for nationwide zoning fallback."""
    lat_min, lat_max, lng_min, lng_max = INDIA_BOUNDARY
    return lat_min <= lat <= lat_max and lng_min <= lng <= lng_max


def get_zone(city: str, zone_code: str) -> Optional[Dict[str, Any]]:
    """Look up zone rules by city and zone code."""
    key = f"{city.lower()}:{zone_code.upper()}"
    return ZONE_DATABASE.get(key)


def get_city_zones(city: str) -> List[str]:
    """Return all zone codes available for a given city."""
    prefix = city.lower() + ":"
    return [
        data["zone_code"]
        for key, data in ZONE_DATABASE.items()
        if key.startswith(prefix)
    ]


def get_default_zone(city: str) -> Dict[str, Any]:
    """Return the default zone (R2) for a city, or India R2 fallback."""
    zone = get_zone(city, "R2")
    if zone:
        return zone
    india_zone = get_zone("india", "R2")
    if india_zone:
        return dict(india_zone)
    return dict(DEFAULT_MOCK_RULES)
