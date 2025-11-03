import usaddress
from rapidfuzz import fuzz

# Comprehensive normalization dictionaries
STATE_NORMALIZE = {
    # Full state names (lowercase)
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
    'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
    'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
    'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
    'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
    'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
    'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
    'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
    'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
    'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
    'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
    'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
    'wisconsin': 'WI', 'wyoming': 'WY',
    
    # Abbreviations (lowercase)
    'al': 'AL', 'ak': 'AK', 'az': 'AZ', 'ar': 'AR', 'ca': 'CA', 'co': 'CO',
    'ct': 'CT', 'de': 'DE', 'fl': 'FL', 'ga': 'GA', 'hi': 'HI', 'id': 'ID',
    'il': 'IL', 'in': 'IN', 'ia': 'IA', 'ks': 'KS', 'ky': 'KY', 'la': 'LA',
    'me': 'ME', 'md': 'MD', 'ma': 'MA', 'mi': 'MI', 'mn': 'MN', 'ms': 'MS',
    'mo': 'MO', 'mt': 'MT', 'ne': 'NE', 'nv': 'NV', 'nh': 'NH', 'nj': 'NJ',
    'nm': 'NM', 'ny': 'NY', 'nc': 'NC', 'nd': 'ND', 'oh': 'OH', 'ok': 'OK',
    'or': 'OR', 'pa': 'PA', 'ri': 'RI', 'sc': 'SC', 'sd': 'SD', 'tn': 'TN',
    'tx': 'TX', 'ut': 'UT', 'vt': 'VT', 'va': 'VA', 'wa': 'WA', 'wv': 'WV',
    'wi': 'WI', 'wy': 'WY',
    
    # Uppercase abbreviations
    'AL': 'AL', 'AK': 'AK', 'AZ': 'AZ', 'AR': 'AR', 'CA': 'CA', 'CO': 'CO',
    'CT': 'CT', 'DE': 'DE', 'FL': 'FL', 'GA': 'GA', 'HI': 'HI', 'ID': 'ID',
    'IL': 'IL', 'IN': 'IN', 'IA': 'IA', 'KS': 'KS', 'KY': 'KY', 'LA': 'LA',
    'ME': 'ME', 'MD': 'MD', 'MA': 'MA', 'MI': 'MI', 'MN': 'MN', 'MS': 'MS',
    'MO': 'MO', 'MT': 'MT', 'NE': 'NE', 'NV': 'NV', 'NH': 'NH', 'NJ': 'NJ',
    'NM': 'NM', 'NY': 'NY', 'NC': 'NC', 'ND': 'ND', 'OH': 'OH', 'OK': 'OK',
    'OR': 'OR', 'PA': 'PA', 'RI': 'RI', 'SC': 'SC', 'SD': 'SD', 'TN': 'TN',
    'TX': 'TX', 'UT': 'UT', 'VT': 'VT', 'VA': 'VA', 'WA': 'WA', 'WV': 'WV',
    'WI': 'WI', 'WY': 'WY'
}

STREET_TYPE_NORMALIZE = {
    # Full street types (lowercase)
    'alley': 'ALY', 'avenue': 'AVE', 'boulevard': 'BLVD', 'circle': 'CIR',
    'court': 'CT', 'drive': 'DR', 'lane': 'LN', 'place': 'PL',
    'road': 'RD', 'street': 'ST', 'way': 'WAY', 'parkway': 'PKWY',
    'highway': 'HWY', 'terrace': 'TER', 'plaza': 'PLZ', 'square': 'SQ',
    'trail': 'TRL', 'point': 'PT', 'ridge': 'RDG', 'loop': 'LOOP',
    'park': 'PARK', 'expressway': 'EXPY', 'freeway': 'FWY',
    
    # Common abbreviations (lowercase)
    'aly': 'ALY', 'ave': 'AVE', 'blvd': 'BLVD', 'cir': 'CIR', 'ct': 'CT',
    'dr': 'DR', 'ln': 'LN', 'pl': 'PL', 'rd': 'RD', 'st': 'ST', 'wy': 'WAY',
    'pkwy': 'PKWY', 'hwy': 'HWY', 'ter': 'TER', 'plz': 'PLZ', 'sq': 'SQ',
    'trl': 'TRL', 'pt': 'PT', 'rdg': 'RDG', 'expy': 'EXPY', 'fwy': 'FWY',
    
    # Uppercase versions
    'ALLEY': 'ALY', 'AVENUE': 'AVE', 'BOULEVARD': 'BLVD', 'CIRCLE': 'CIR',
    'COURT': 'CT', 'DRIVE': 'DR', 'LANE': 'LN', 'PLACE': 'PL',
    'ROAD': 'RD', 'STREET': 'ST', 'WAY': 'WAY', 'PARKWAY': 'PKWY',
    'HIGHWAY': 'HWY', 'TERRACE': 'TER', 'PLAZA': 'PLZ', 'SQUARE': 'SQ',
    'TRAIL': 'TRL', 'POINT': 'PT', 'RIDGE': 'RDG', 'LOOP': 'LOOP',
    'PARK': 'PARK', 'EXPRESSWAY': 'EXPY', 'FREEWAY': 'FWY',
    
    # Uppercase abbreviations
    'ALY': 'ALY', 'AVE': 'AVE', 'BLVD': 'BLVD', 'CIR': 'CIR', 'CT': 'CT',
    'DR': 'DR', 'LN': 'LN', 'PL': 'PL', 'RD': 'RD', 'ST': 'ST', 'WY': 'WAY',
    'PKWY': 'PKWY', 'HWY': 'HWY', 'TER': 'TER', 'PLZ': 'PLZ', 'SQ': 'SQ',
    'TRL': 'TRL', 'PT': 'PT', 'RDG': 'RDG', 'EXPY': 'EXPY', 'FWY': 'FWY'
}

DIRECTION_NORMALIZE = {
    # Full directions (lowercase)
    'north': 'N', 'south': 'S', 'east': 'E', 'west': 'W',
    'northeast': 'NE', 'northwest': 'NW', 'southeast': 'SE', 'southwest': 'SW',
    
    # Single letter abbreviations (lowercase)
    'n': 'N', 's': 'S', 'e': 'E', 'w': 'W',
    'ne': 'NE', 'nw': 'NW', 'se': 'SE', 'sw': 'SW',
    
    # Uppercase versions
    'NORTH': 'N', 'SOUTH': 'S', 'EAST': 'E', 'WEST': 'W',
    'NORTHEAST': 'NE', 'NORTHWEST': 'NW', 'SOUTHEAST': 'SE', 'SOUTHWEST': 'SW',
    
    # Uppercase abbreviations
    'N': 'N', 'S': 'S', 'E': 'E', 'W': 'W',
    'NE': 'NE', 'NW': 'NW', 'SE': 'SE', 'SW': 'SW'
}

def normalize_address_components(address):
    """Parse address and normalize components for comparison"""
    try:
        parsed = usaddress.tag(address)[0]
    except:
        # If parsing fails, return original address as string
        return str(address)
    
    # Extract and normalize components
    components = {
        'number': parsed.get('AddressNumber', '').strip(),
        'pre_direction': DIRECTION_NORMALIZE.get(parsed.get('StreetNamePreDirectional', ''), parsed.get('StreetNamePreDirectional', '')),
        'street_name': parsed.get('StreetName', '').strip(),
        'street_type': STREET_TYPE_NORMALIZE.get(parsed.get('StreetNamePostType', ''), parsed.get('StreetNamePostType', '')),
        'post_direction': DIRECTION_NORMALIZE.get(parsed.get('StreetNamePostDirectional', ''), parsed.get('StreetNamePostDirectional', '')),
        'city': parsed.get('PlaceName', '').strip().replace(',', '').strip(),
        'state': STATE_NORMALIZE.get(parsed.get('StateName', ''), parsed.get('StateName', '')),
        'zip': parsed.get('ZipCode', '').strip()
    }
    
    return components

def components_to_string(components):
    """Convert normalized components to a single string for fuzzy matching"""
    if isinstance(components, str):
        return components
    
    # Build string from components, filtering out empty values
    parts = []
    for key in ['number', 'pre_direction', 'street_name', 'street_type', 'post_direction', 'city', 'state', 'zip']:
        value = str(components.get(key, '')).strip()
        if value:
            parts.append(value)
    
    return ' '.join(parts)


def fuzzy_address_match(addr1, addr2, threshold=85):
    """Compare addresses using fuzzy string matching"""
    try:
        # Normalize both addresses
        norm1 = normalize_address_components(addr1)
        norm2 = normalize_address_components(addr2)
        
        # Convert to strings for fuzzy matching
        str1 = components_to_string(norm1)
        str2 = components_to_string(norm2)
        
        print(f"Normalized string 1: '{str1}'")
        print(f"Normalized string 2: '{str2}'")
        
        # Calculate similarity
        ratio = fuzz.ratio(str1, str2)
        token_sort_ratio = fuzz.token_sort_ratio(str1, str2)
        token_set_ratio = fuzz.token_set_ratio(str1, str2)
        
        # Use the highest score
        best_ratio = max(ratio, token_sort_ratio, token_set_ratio)
        
        print(f"Ratio: {ratio}, Token Sort: {token_sort_ratio}, Token Set: {token_set_ratio}")
        print(f"Best Ratio: {best_ratio}")
        
        return best_ratio >= threshold
        
    except Exception as e:
        print(f"Error in fuzzy matching: {e}")
        return False

'''
# Test the functions
if __name__ == "__main__":
    addr1 = "1566 east 5th street, ontario, san bernardino, california, 91764"
    addr2 = "1566 E 5th ST, ontario, CA, 91764"
    
    # Test component normalization
    norm1 = normalize_address_components(addr1)
    norm2 = normalize_address_components(addr2)
    
    print("Address 1 components:", norm1)
    print("Address 2 components:", norm2)
    
    # Test exact matching
    exact_match = exact_address_match(addr1, addr2)
    print(f"\nExact match: {exact_match}")
    
    # Test fuzzy matching
    print("\nFuzzy matching:")
    fuzzy_match = fuzzy_address_match(addr1, addr2, threshold=85)
    print(f"Fuzzy match (85% threshold): {fuzzy_match}")
    
    # Test with different threshold
    fuzzy_match_90 = fuzzy_address_match(addr1, addr2, threshold=90)
    print(f"Fuzzy match (90% threshold): {fuzzy_match_90}")
'''