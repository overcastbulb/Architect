"""
zoning_data.py
Hardcoded zoning database for top 10 Indian construction cities.
Sources: UDCPR-2020, DCPR 2034, DDA MPD-2021, BBMP Bye-Laws, HMDA Rules,
         CMDA Building Rules, AUDA GDCR, SUDA DCR, NMC DCR, CIDCO Regulations.
Falls back to AI-estimated or default mock rules for other cities.
"""

from typing import Dict, Any, List, Optional

# ---------------------------------------------------------------------------
# City name aliases for robust detection from Nominatim address strings
# Keys are canonical city names, values are lowercase aliases to match
# ---------------------------------------------------------------------------
CITY_ALIASES: Dict[str, List[str]] = {
    "Mumbai": [
        "mumbai", "bombay", "greater mumbai", "brihanmumbai",
        "bandra", "andheri", "worli", "powai", "malad", "borivali",
        "dadar", "kurla", "goregaon", "juhu", "colaba", "bkc",
        "kandivali", "chembur", "mulund", "ghatkopar", "vikhroli",
        "santacruz", "vile parle",
    ],
    "Pune": [
        "pune", "poona", "pmrda", "pimpri", "chinchwad",
        "hinjewadi", "kothrud", "hadapsar", "wakad", "baner",
        "koregaon", "viman nagar", "kharadi", "aundh", "shivajinagar",
        "magarpatta", "kalyani nagar", "pashan", "bavdhan", "undri",
        "warje", "sinhagad", "katraj",
    ],
    "Delhi": [
        "delhi", "new delhi", "nct of delhi", "nct", "national capital territory",
        "dwarka", "rohini", "saket", "connaught", "karol bagh",
        "lajpat nagar", "defence colony", "vasant kunj", "janakpuri",
        "pitampura", "south delhi", "north delhi", "east delhi",
        "west delhi", "central delhi", "noida", "gurgaon", "gurugram",
    ],
    "Bangalore": [
        "bangalore", "bengaluru", "whitefield", "koramangala",
        "indiranagar", "jayanagar", "hsr layout", "electronic city",
        "marathahalli", "hebbal", "yelahanka", "jp nagar", "btm",
        "sarjapur", "bannerghatta", "rajajinagar", "malleshwaram",
        "basavanagudi",
    ],
    "Hyderabad": [
        "hyderabad", "secunderabad", "hitec city", "hitech city",
        "gachibowli", "madhapur", "banjara hills", "jubilee hills",
        "kukatpally", "miyapur", "kondapur", "begumpet",
        "ameerpet", "charminar", "shamshabad",
    ],
    "Chennai": [
        "chennai", "madras", "anna nagar", "t nagar", "t. nagar",
        "adyar", "velachery", "tambaram", "porur", "guindy",
        "sholinganallur", "omr", "ecr", "mylapore", "perambur",
        "nungambakkam", "kodambakkam",
    ],
    "Ahmedabad": [
        "ahmedabad", "ahemdabad", "ahmadabad",
        "satellite", "bodakdev", "prahlad nagar", "thaltej",
        "vastrapur", "navrangpura", "maninagar", "bopal",
        "science city", "sg highway",
    ],
    "Surat": [
        "surat", "adajan", "vesu", "piplod", "athwa",
        "varachha", "katargam", "dumas",
    ],
    "Nashik": [
        "nashik", "nasik", "nashick",
        "gangapur", "panchavati", "cidco nashik",
    ],
    "Navi Mumbai": [
        "navi mumbai", "new mumbai", "cidco",
        "vashi", "kharghar", "belapur", "nerul", "airoli",
        "panvel", "kopar khairane", "sanpada", "seawoods",
        "ulwe", "taloja",
    ],
}

# ---------------------------------------------------------------------------
# Hardcoded zoning rules for top 10 cities
# Internal field names match what zoning_checker.py expects
# ---------------------------------------------------------------------------
CITY_ZONES: Dict[str, Dict[str, Dict[str, Any]]] = {
    "Mumbai": {
        "R1": {
            "zone_code": "R1",
            "zone_name": "Low Density Residential",
            "city": "Mumbai",
            "authority": "BMC (MCGM)",
            "source": "DCPR 2034",
            "max_fsi": 1.0,
            "max_floors": 3,
            "max_height_m": 10.0,
            "min_setback_front_m": 3.0,
            "min_setback_side_m": 1.5,
            "min_setback_rear_m": 3.0,
            "max_coverage_pct": 50.0,
            "permitted_uses": ["residential"],
        },
        "R2": {
            "zone_code": "R2",
            "zone_name": "Medium Density Residential",
            "city": "Mumbai",
            "authority": "BMC (MCGM)",
            "source": "DCPR 2034",
            "max_fsi": 1.33,
            "max_floors": 8,
            "max_height_m": 24.0,
            "min_setback_front_m": 4.5,
            "min_setback_side_m": 2.5,
            "min_setback_rear_m": 3.0,
            "max_coverage_pct": 55.0,
            "permitted_uses": ["residential", "mixed"],
        },
        "C1": {
            "zone_code": "C1",
            "zone_name": "Commercial",
            "city": "Mumbai",
            "authority": "BMC (MCGM)",
            "source": "DCPR 2034",
            "max_fsi": 2.0,
            "max_floors": 10,
            "max_height_m": 30.0,
            "min_setback_front_m": 6.0,
            "min_setback_side_m": 3.0,
            "min_setback_rear_m": 3.0,
            "max_coverage_pct": 60.0,
            "permitted_uses": ["commercial", "mixed"],
        },
    },
    "Pune": {
        "R1": {
            "zone_code": "R1",
            "zone_name": "Low Density Residential",
            "city": "Pune",
            "authority": "PMC / PMRDA",
            "source": "UDCPR-2020 & PMRDA DP 2041",
            "max_fsi": 1.0,
            "max_floors": 3,
            "max_height_m": 10.0,
            "min_setback_front_m": 3.0,
            "min_setback_side_m": 1.5,
            "min_setback_rear_m": 3.0,
            "max_coverage_pct": 50.0,
            "permitted_uses": ["residential"],
        },
        "R2": {
            "zone_code": "R2",
            "zone_name": "Medium Density Residential",
            "city": "Pune",
            "authority": "PMC / PMRDA",
            "source": "UDCPR-2020 & PMRDA DP 2041",
            "max_fsi": 1.5,
            "max_floors": 5,
            "max_height_m": 15.0,
            "min_setback_front_m": 3.0,
            "min_setback_side_m": 2.0,
            "min_setback_rear_m": 3.0,
            "max_coverage_pct": 60.0,
            "permitted_uses": ["residential", "mixed"],
        },
        "C1": {
            "zone_code": "C1",
            "zone_name": "Commercial",
            "city": "Pune",
            "authority": "PMC / PMRDA",
            "source": "UDCPR-2020 & PMRDA DP 2041",
            "max_fsi": 2.0,
            "max_floors": 8,
            "max_height_m": 24.0,
            "min_setback_front_m": 4.5,
            "min_setback_side_m": 3.0,
            "min_setback_rear_m": 3.0,
            "max_coverage_pct": 60.0,
            "permitted_uses": ["commercial", "mixed"],
        },
    },
    "Delhi": {
        "Residential": {
            "zone_code": "Residential",
            "zone_name": "Residential Zone",
            "city": "Delhi",
            "authority": "DDA",
            "source": "DDA MPD-2021",
            "max_fsi": 1.2,
            "max_floors": 4,
            "max_height_m": 15.0,
            "min_setback_front_m": 3.0,
            "min_setback_side_m": 2.0,
            "min_setback_rear_m": 3.0,
            "max_coverage_pct": 50.0,
            "permitted_uses": ["residential"],
        },
        "Commercial": {
            "zone_code": "Commercial",
            "zone_name": "Commercial Zone",
            "city": "Delhi",
            "authority": "DDA",
            "source": "DDA MPD-2021",
            "max_fsi": 3.5,
            "max_floors": 10,
            "max_height_m": 30.0,
            "min_setback_front_m": 6.0,
            "min_setback_side_m": 3.0,
            "min_setback_rear_m": 3.0,
            "max_coverage_pct": 60.0,
            "permitted_uses": ["commercial", "mixed"],
        },
        "Mixed Use": {
            "zone_code": "Mixed Use",
            "zone_name": "Mixed Use Zone",
            "city": "Delhi",
            "authority": "DDA",
            "source": "DDA MPD-2021",
            "max_fsi": 2.0,
            "max_floors": 8,
            "max_height_m": 24.0,
            "min_setback_front_m": 4.5,
            "min_setback_side_m": 3.0,
            "min_setback_rear_m": 3.0,
            "max_coverage_pct": 55.0,
            "permitted_uses": ["residential", "commercial", "mixed"],
        },
    },
    "Bangalore": {
        "R1": {
            "zone_code": "R1",
            "zone_name": "Low Density Residential",
            "city": "Bangalore",
            "authority": "BBMP / BDA",
            "source": "BBMP Building Bye-Laws & RMP 2031",
            "max_fsi": 1.75,
            "max_floors": 4,
            "max_height_m": 15.0,
            "min_setback_front_m": 3.0,
            "min_setback_side_m": 1.5,
            "min_setback_rear_m": 3.0,
            "max_coverage_pct": 55.0,
            "permitted_uses": ["residential"],
        },
        "R2": {
            "zone_code": "R2",
            "zone_name": "Medium Density Residential",
            "city": "Bangalore",
            "authority": "BBMP / BDA",
            "source": "BBMP Building Bye-Laws & RMP 2031",
            "max_fsi": 2.25,
            "max_floors": 6,
            "max_height_m": 18.0,
            "min_setback_front_m": 3.0,
            "min_setback_side_m": 2.0,
            "min_setback_rear_m": 3.0,
            "max_coverage_pct": 60.0,
            "permitted_uses": ["residential", "mixed"],
        },
        "C1": {
            "zone_code": "C1",
            "zone_name": "Commercial",
            "city": "Bangalore",
            "authority": "BBMP / BDA",
            "source": "BBMP Building Bye-Laws & RMP 2031",
            "max_fsi": 2.5,
            "max_floors": 10,
            "max_height_m": 30.0,
            "min_setback_front_m": 4.5,
            "min_setback_side_m": 3.0,
            "min_setback_rear_m": 3.0,
            "max_coverage_pct": 60.0,
            "permitted_uses": ["commercial", "mixed"],
        },
    },
    "Hyderabad": {
        "R1": {
            "zone_code": "R1",
            "zone_name": "Low Density Residential",
            "city": "Hyderabad",
            "authority": "HMDA / GHMC",
            "source": "HMDA Zoning Regulations",
            "max_fsi": 1.5,
            "max_floors": 3,
            "max_height_m": 10.0,
            "min_setback_front_m": 3.0,
            "min_setback_side_m": 1.5,
            "min_setback_rear_m": 3.0,
            "max_coverage_pct": 50.0,
            "permitted_uses": ["residential"],
        },
        "R2": {
            "zone_code": "R2",
            "zone_name": "Medium Density Residential",
            "city": "Hyderabad",
            "authority": "HMDA / GHMC",
            "source": "HMDA Zoning Regulations",
            "max_fsi": 1.75,
            "max_floors": 6,
            "max_height_m": 18.0,
            "min_setback_front_m": 3.0,
            "min_setback_side_m": 2.0,
            "min_setback_rear_m": 3.0,
            "max_coverage_pct": 55.0,
            "permitted_uses": ["residential", "mixed"],
        },
        "C1": {
            "zone_code": "C1",
            "zone_name": "Commercial",
            "city": "Hyderabad",
            "authority": "HMDA / GHMC",
            "source": "HMDA Zoning Regulations",
            "max_fsi": 2.5,
            "max_floors": 8,
            "max_height_m": 24.0,
            "min_setback_front_m": 4.5,
            "min_setback_side_m": 3.0,
            "min_setback_rear_m": 3.0,
            "max_coverage_pct": 60.0,
            "permitted_uses": ["commercial", "mixed"],
        },
    },
    "Chennai": {
        "R1": {
            "zone_code": "R1",
            "zone_name": "Low Density Residential",
            "city": "Chennai",
            "authority": "CMDA / GCC",
            "source": "CMDA Building Rules",
            "max_fsi": 1.5,
            "max_floors": 3,
            "max_height_m": 10.0,
            "min_setback_front_m": 3.0,
            "min_setback_side_m": 1.5,
            "min_setback_rear_m": 3.0,
            "max_coverage_pct": 50.0,
            "permitted_uses": ["residential"],
        },
        "R2": {
            "zone_code": "R2",
            "zone_name": "Medium Density Residential",
            "city": "Chennai",
            "authority": "CMDA / GCC",
            "source": "CMDA Building Rules",
            "max_fsi": 2.0,
            "max_floors": 6,
            "max_height_m": 18.0,
            "min_setback_front_m": 3.0,
            "min_setback_side_m": 2.0,
            "min_setback_rear_m": 3.0,
            "max_coverage_pct": 60.0,
            "permitted_uses": ["residential", "mixed"],
        },
        "C1": {
            "zone_code": "C1",
            "zone_name": "Commercial",
            "city": "Chennai",
            "authority": "CMDA / GCC",
            "source": "CMDA Building Rules",
            "max_fsi": 2.5,
            "max_floors": 8,
            "max_height_m": 24.0,
            "min_setback_front_m": 4.5,
            "min_setback_side_m": 3.0,
            "min_setback_rear_m": 3.0,
            "max_coverage_pct": 60.0,
            "permitted_uses": ["commercial", "mixed"],
        },
    },
    "Ahmedabad": {
        "R1": {
            "zone_code": "R1",
            "zone_name": "Low Density Residential",
            "city": "Ahmedabad",
            "authority": "AUDA / AMC",
            "source": "AUDA GDCR",
            "max_fsi": 1.2,
            "max_floors": 3,
            "max_height_m": 10.0,
            "min_setback_front_m": 3.0,
            "min_setback_side_m": 1.5,
            "min_setback_rear_m": 3.0,
            "max_coverage_pct": 50.0,
            "permitted_uses": ["residential"],
        },
        "R2": {
            "zone_code": "R2",
            "zone_name": "Medium Density Residential",
            "city": "Ahmedabad",
            "authority": "AUDA / AMC",
            "source": "AUDA GDCR",
            "max_fsi": 1.8,
            "max_floors": 5,
            "max_height_m": 15.0,
            "min_setback_front_m": 3.0,
            "min_setback_side_m": 2.0,
            "min_setback_rear_m": 3.0,
            "max_coverage_pct": 60.0,
            "permitted_uses": ["residential", "mixed"],
        },
        "C1": {
            "zone_code": "C1",
            "zone_name": "Commercial",
            "city": "Ahmedabad",
            "authority": "AUDA / AMC",
            "source": "AUDA GDCR",
            "max_fsi": 2.0,
            "max_floors": 8,
            "max_height_m": 24.0,
            "min_setback_front_m": 4.5,
            "min_setback_side_m": 3.0,
            "min_setback_rear_m": 3.0,
            "max_coverage_pct": 60.0,
            "permitted_uses": ["commercial", "mixed"],
        },
    },
    "Surat": {
        "R1": {
            "zone_code": "R1",
            "zone_name": "Low Density Residential",
            "city": "Surat",
            "authority": "SUDA / SMC",
            "source": "SUDA DCR",
            "max_fsi": 1.2,
            "max_floors": 3,
            "max_height_m": 10.0,
            "min_setback_front_m": 3.0,
            "min_setback_side_m": 1.5,
            "min_setback_rear_m": 3.0,
            "max_coverage_pct": 50.0,
            "permitted_uses": ["residential"],
        },
        "R2": {
            "zone_code": "R2",
            "zone_name": "Medium Density Residential",
            "city": "Surat",
            "authority": "SUDA / SMC",
            "source": "SUDA DCR",
            "max_fsi": 1.8,
            "max_floors": 5,
            "max_height_m": 15.0,
            "min_setback_front_m": 3.0,
            "min_setback_side_m": 2.0,
            "min_setback_rear_m": 3.0,
            "max_coverage_pct": 55.0,
            "permitted_uses": ["residential", "mixed"],
        },
        "C1": {
            "zone_code": "C1",
            "zone_name": "Commercial",
            "city": "Surat",
            "authority": "SUDA / SMC",
            "source": "SUDA DCR",
            "max_fsi": 2.0,
            "max_floors": 7,
            "max_height_m": 20.0,
            "min_setback_front_m": 4.5,
            "min_setback_side_m": 3.0,
            "min_setback_rear_m": 3.0,
            "max_coverage_pct": 60.0,
            "permitted_uses": ["commercial", "mixed"],
        },
    },
    "Nashik": {
        "R1": {
            "zone_code": "R1",
            "zone_name": "Low Density Residential",
            "city": "Nashik",
            "authority": "NMC",
            "source": "NMC DCR",
            "max_fsi": 1.0,
            "max_floors": 3,
            "max_height_m": 10.0,
            "min_setback_front_m": 3.0,
            "min_setback_side_m": 1.5,
            "min_setback_rear_m": 3.0,
            "max_coverage_pct": 50.0,
            "permitted_uses": ["residential"],
        },
        "R2": {
            "zone_code": "R2",
            "zone_name": "Medium Density Residential",
            "city": "Nashik",
            "authority": "NMC",
            "source": "NMC DCR",
            "max_fsi": 1.5,
            "max_floors": 5,
            "max_height_m": 15.0,
            "min_setback_front_m": 3.0,
            "min_setback_side_m": 2.0,
            "min_setback_rear_m": 3.0,
            "max_coverage_pct": 60.0,
            "permitted_uses": ["residential", "mixed"],
        },
        "C1": {
            "zone_code": "C1",
            "zone_name": "Commercial",
            "city": "Nashik",
            "authority": "NMC",
            "source": "NMC DCR",
            "max_fsi": 2.0,
            "max_floors": 7,
            "max_height_m": 20.0,
            "min_setback_front_m": 4.5,
            "min_setback_side_m": 3.0,
            "min_setback_rear_m": 3.0,
            "max_coverage_pct": 60.0,
            "permitted_uses": ["commercial", "mixed"],
        },
    },
    "Navi Mumbai": {
        "R1": {
            "zone_code": "R1",
            "zone_name": "Low Density Residential",
            "city": "Navi Mumbai",
            "authority": "CIDCO / NMMC",
            "source": "CIDCO Regulations",
            "max_fsi": 1.0,
            "max_floors": 3,
            "max_height_m": 10.0,
            "min_setback_front_m": 3.0,
            "min_setback_side_m": 1.5,
            "min_setback_rear_m": 3.0,
            "max_coverage_pct": 50.0,
            "permitted_uses": ["residential"],
        },
        "R2": {
            "zone_code": "R2",
            "zone_name": "Medium Density Residential",
            "city": "Navi Mumbai",
            "authority": "CIDCO / NMMC",
            "source": "CIDCO Regulations",
            "max_fsi": 2.0,
            "max_floors": 8,
            "max_height_m": 24.0,
            "min_setback_front_m": 4.5,
            "min_setback_side_m": 2.5,
            "min_setback_rear_m": 3.0,
            "max_coverage_pct": 60.0,
            "permitted_uses": ["residential", "mixed"],
        },
        "C1": {
            "zone_code": "C1",
            "zone_name": "Commercial",
            "city": "Navi Mumbai",
            "authority": "CIDCO / NMMC",
            "source": "CIDCO Regulations",
            "max_fsi": 2.5,
            "max_floors": 10,
            "max_height_m": 30.0,
            "min_setback_front_m": 6.0,
            "min_setback_side_m": 3.0,
            "min_setback_rear_m": 3.0,
            "max_coverage_pct": 60.0,
            "permitted_uses": ["commercial", "mixed"],
        },
    },
}

# ---------------------------------------------------------------------------
# Default mock rules (when no city or zone is detected)
# ---------------------------------------------------------------------------
DEFAULT_MOCK_RULES: Dict[str, Any] = {
    "zone_code": "DEFAULT",
    "zone_name": "Default Zone",
    "city": "Unknown",
    "authority": "N/A",
    "source": "Default rules (no city detected)",
    "max_fsi": 1.5,
    "max_floors": 4,
    "max_height_m": 15.0,
    "min_setback_front_m": 3.0,
    "min_setback_side_m": 2.0,
    "min_setback_rear_m": 3.0,
    "max_coverage_pct": 50.0,
    "permitted_uses": ["residential", "commercial"],
}

# Indian state names for address-based India detection
INDIAN_STATES = [
    "andhra pradesh", "arunachal pradesh", "assam", "bihar", "chhattisgarh",
    "goa", "gujarat", "haryana", "himachal pradesh", "jharkhand", "karnataka",
    "kerala", "madhya pradesh", "maharashtra", "manipur", "meghalaya",
    "mizoram", "nagaland", "odisha", "orissa", "punjab", "rajasthan",
    "sikkim", "tamil nadu", "telangana", "tripura", "uttar pradesh",
    "uttarakhand", "west bengal", "india",
]


def detect_city_from_address(address: str) -> Optional[str]:
    """
    Detect a top-10 city from a Nominatim address string.
    Checks all city aliases against all parts of the address.
    Returns canonical city name or None.
    """
    addr_lower = address.lower()

    # Check Navi Mumbai BEFORE Mumbai (since "navi mumbai" contains "mumbai")
    for alias in CITY_ALIASES.get("Navi Mumbai", []):
        if alias in addr_lower:
            return "Navi Mumbai"

    # Check all other cities
    for city, aliases in CITY_ALIASES.items():
        if city == "Navi Mumbai":
            continue  # Already checked
        for alias in aliases:
            if alias in addr_lower:
                return city

    return None


def is_indian_address(address: str) -> bool:
    """Check if address appears to be from India."""
    addr_lower = address.lower()
    for state in INDIAN_STATES:
        if state in addr_lower:
            return True
    return False


def get_city_zone_codes(city: str) -> List[str]:
    """Return available zone codes for a detected city."""
    city_data = CITY_ZONES.get(city, {})
    return list(city_data.keys())


def get_zone_rules(city: str, zone_code: str) -> Optional[Dict[str, Any]]:
    """Get hardcoded zone rules for a city + zone code."""
    city_data = CITY_ZONES.get(city, {})
    return city_data.get(zone_code)


def get_default_zone_for_city(city: str) -> Dict[str, Any]:
    """Return R2 (or first zone) as default for a city."""
    city_data = CITY_ZONES.get(city, {})
    if "R2" in city_data:
        return dict(city_data["R2"])
    if "Residential" in city_data:
        return dict(city_data["Residential"])
    if city_data:
        first_key = next(iter(city_data))
        return dict(city_data[first_key])
    return dict(DEFAULT_MOCK_RULES)
