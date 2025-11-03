from rapidfuzz import fuzz
from rapidfuzz.distance import JaroWinkler, Levenshtein
from difflib import SequenceMatcher
from .compare_normalize_address import fuzzy_address_match  # ✅ ONLY CHANGE: Added dot
import re

def normalize(text):
    if not text:
        return ""
    # Lowercase, remove extra spaces and punctuation
    text = text.lower()
    text = re.sub(r'[^\w\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def tokenize_name(name):
    name = name.lower()
    name = re.sub(r'[^\w\s]', '', name)  # remove punctuation
    tokens = set(name.strip().split())
    return tokens

def loose_name_match(name1, name2):
    tokens1 = tokenize_name(name1)
    tokens2 = tokenize_name(name2)

    # Rule 1: exact token set match
    if tokens1 == tokens2:
        return True

    # Rule 2: one is subset of another
    if tokens1.issubset(tokens2) or tokens2.issubset(tokens1):
        return True

    # Rule 3 (optional): majority fuzzy match of tokens (80+ threshold)
    matched = 0
    for t1 in tokens1:
        for t2 in tokens2:
            if fuzz.ratio(t1, t2) >= 85:
                matched += 1
                break  # move to next t1
    return matched >= min(len(tokens1), len(tokens2))  # majority match

def compare_strings_similarity(str1, str2, field_type="default"):
    """
    Compares two strings using various similarity metrics and returns a score summary and decision.
    
    :param str1: First string to compare
    :param str2: Second string to compare
    :param field_type: Type of field being compared (name, address, default)
    :return: dict with similarity scores and final match decision
    """
    str1_clean = normalize(str1)
    str2_clean = normalize(str2)
    
    # Default thresholds
    thresholds = {
        "name": {
            "fuzz_ratio": 85,
            "jaro_winkler": 0.90,
            "levenshtein_distance": 2,
            "sequence_matcher": 0.85
        },
        "address": {
            "fuzz_ratio": 80,              # lowered for abbreviation noise
            "jaro_winkler": 0.88,
            "levenshtein_distance": 10,    # allow more edits
            "sequence_matcher": 0.85
        },
        "default": {
            "fuzz_ratio": 85,
            "jaro_winkler": 0.85,
            "levenshtein_distance": 3,
            "sequence_matcher": 0.85
        }
    }[field_type]
  
    # Compute similarity scores
    fuzz_score = fuzz.ratio(str1_clean, str2_clean)
    jaro_score = JaroWinkler.similarity(str1_clean, str2_clean)
    levenshtein_dist = Levenshtein.distance(str1_clean, str2_clean)
    seq_ratio = SequenceMatcher(None, str1_clean, str2_clean).ratio()

    # Final decision: majority vote of the methods
    votes = [
        fuzz_score >= thresholds["fuzz_ratio"],
        jaro_score >= thresholds["jaro_winkler"],
        levenshtein_dist <= thresholds["levenshtein_distance"],
        seq_ratio >= thresholds["sequence_matcher"]
    ]
    
    match_decision = votes.count(True) >= 3  # 3 out of 4 methods agree

    return {
        "fuzz_ratio": fuzz_score,
        "jaro_winkler": round(jaro_score, 4),
        "levenshtein_distance": levenshtein_dist,
        "sequence_matcher": round(seq_ratio, 4),
        "match_decision": match_decision
    }
    
def safe_string_compare(a, b, field_type="default"):
    if not a or not b:
        return False
    match_score = compare_strings_similarity(a, b, field_type)
    
    if field_type == "name":
        return match_score["match_decision"] or loose_name_match(a, b)
    
    if field_type == "address":
        return match_score["match_decision"] or fuzzy_address_match(a, b, threshold=85)
        
        
    return match_score["match_decision"]

def are_name_lists_fuzzy_matched(list1, list2):
    """
    Returns True if all names in list1 have a fuzzy match in list2, regardless of order.
    Each name must match only once.
    """
    if len(list1) != len(list2):
        return False

    used_indices = set()

    for name1 in list1:
        found_match = False
        for idx, name2 in enumerate(list2):
            if idx in used_indices:
                continue
            if safe_string_compare(name1, name2, "name"):
                used_indices.add(idx)
                found_match = True
                break
        if not found_match:
            return False

    return True
    
    
def normalize_name(name):
    # Remove special characters, extra spaces, and lowercase
    return re.sub(r'\s+', ' ', re.sub(r'[^a-zA-Z ]', '', name or '')).strip().lower()

def identify_borrowers(doc_borrowers, note_borrowers_dict):
    """
    Identifies which note borrower positions match the document borrowers.
    
    :param doc_borrowers: List of borrower names from the document
    :param note_borrowers_dict: Dict with borrower positions {1: name1, 2: name2, ...}
    :return: List of matching borrower position numbers as strings
    """
    if not doc_borrowers:
        return []
    
    # Normalize document borrower names
    doc_names = [normalize_name(name) for name in doc_borrowers if name and name.strip()]
    if not doc_names:
        return []
    
    matching_positions = []
    
    # Check each note borrower position
    for position, note_borrower_name in note_borrowers_dict.items():
        if not note_borrower_name or not note_borrower_name.strip():
            continue
            
        normalized_note_name = normalize_name(note_borrower_name)
        if not normalized_note_name:
            continue
        
        # Check if this note borrower matches any document borrower
        for doc_name in doc_names:
            print("\n doc_name:",doc_name," and note name:",normalized_note_name," \n")
            if safe_string_compare(doc_name, normalized_note_name, field_type="name"):
                matching_positions.append(str(position))
                break  # Found a match for this position, move to next position
    
    return sorted(matching_positions)

def borrower_list_subset_match_old(doc_borrower_names, note_borrower_names):
    """
    Returns True if every borrower in doc_borrower_names has a match in note_borrower_names.
    
    :param doc_borrower_names: List of borrower names from document
    :param note_borrower_names: List of borrower names from note
    :return: Boolean indicating if all doc borrowers have matches in note borrowers
    """
    if not doc_borrower_names:
        return False
    
    # Normalize and filter empty names
    doc_names = [normalize_name(name) for name in doc_borrower_names if name and name.strip()]
    note_names = [normalize_name(name) for name in note_borrower_names if name and name.strip()]
    
    if not doc_names or not note_names:
        return False
    
    # Check if each doc borrower has a match in note borrowers
    for doc_name in doc_names:
        if not any(safe_string_compare(doc_name, note_name, field_type="name") for note_name in note_names):
            return False
    
    return True
    
def borrower_list_subset_match(doc_borrower_names, note_borrower_names):
    """
    Returns True if at least one borrower in doc_borrower_names has a match in note_borrower_names.
    Returns False only if none of the document borrowers match any note borrowers.
    
    :param doc_borrower_names: List of borrower names from document
    :param note_borrower_names: List of borrower names from note
    :return: Boolean indicating if at least one doc borrower has a match in note borrowers
    """
    if not doc_borrower_names:
        return False
    if not note_borrower_names:
        return False
    
    # Normalize and filter empty names
    doc_names = [normalize_name(name) for name in doc_borrower_names if name and name.strip()]
    note_names = [normalize_name(name) for name in note_borrower_names if name and name.strip()]
    
    if not doc_names or not note_names:
        return False
    
    # Check if any doc borrower has a match in note borrowers
    for doc_name in doc_names:
        if any(safe_string_compare(doc_name, note_name, field_type="name") for note_name in note_names):
            return True  # Found at least one match, return True immediately
    
    return False  # No matches found

'''
# Test cases
result = compare_strings_similarity("2104 North Old, Highway 91", "2104 North Old Highway 91", "default")
print(result["match_decision"])
result = safe_string_compare("2104 N Old CA 91", "2104 North Old California 91", "default")
print(result)    

b1 = "Ana M Lemus Zepeda"
b2 = "Rosa M Lemus Zepeda"
b3 = "Antonio Lemus Becerra"

borrower_name = [
    "Rosa M Lemus Zepeda",
    "Antonio Lemus Becerra",
    "Ana M Lemus Zepeda"
]

name_match = are_name_lists_fuzzy_matched(borrower_name, [b1, b2, b3])
print(name_match)

property_address = "1271 seaview ave pacific grove, ca 93950"
note_address = "1271 seaview ave pacific grove , ca 93950"

result = safe_string_compare(property_address, note_address, field_type="address")
print(result)

# Test the fixed identify_borrowers function
doc_borrowers = ["HOMAJEE SINGH CHEEMA"]
note_borrowers_dict = {
    1: "HOMAJEE SINGH CHEEMA",
    2: "",
    3: "",
    4: ""
}
matching = identify_borrowers(doc_borrowers, note_borrowers_dict)
print(f"Matching borrowers: {matching}")  # Should print: ['1']
'''