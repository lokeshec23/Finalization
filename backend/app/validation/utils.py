# modules/utils.py
import re
import json
from datetime import datetime
import logging
import os
import usaddress
from .compare_strings import (  # ✅ ONLY CHANGE: Added dot
    safe_string_compare  
)
    
def get_logger(name="default"):
    # Find project root (assumes utils.py is in unix_ic/modules)
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(current_dir, ".."))

    # Ensure logs directory exists
    logs_dir = os.path.join(project_root, "logs")
    os.makedirs(logs_dir, exist_ok=True)

    # Force all logs to this file
    log_file_path = os.path.join(logs_dir, "finalization_api.log")
    json_log_path = os.path.join(logs_dir, "finalization_stats.json")

    
    # Create or get logger
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    if not logger.handlers:
        # File handler (accepts Unicode)
        file_handler = logging.FileHandler(log_file_path, encoding="utf-8")
        file_formatter = logging.Formatter("%(asctime)s [%(levelname)s] [%(name)s] %(message)s")
        file_handler.setFormatter(file_formatter)

        # Console handler (ASCII-safe)
        stream_handler = logging.StreamHandler()
        stream_formatter = logging.Formatter("%(asctime)s [%(levelname)s] [%(name)s] %(message)s")
        stream_handler.setFormatter(stream_formatter)
        
        # JSON summary stats
        json_handler = logging.FileHandler(json_log_path, encoding="utf-8")
        json_formatter = logging.Formatter('%(message)s')  # logs only raw JSON lines
        json_handler.setFormatter(json_formatter)
        json_handler.setLevel(logging.INFO)

        logger.addHandler(file_handler)
        logger.addHandler(stream_handler)
        logger.addHandler(json_handler)
        logger.setLevel(logging.INFO)
        logger.propagate = False

    return logger


# Create a default logger for utils module itself
utils_logger = get_logger("utils")

def safe_standardize_date(date_str):
    """
    Convert date string from formats like '3-16-25' or '3/16/25' to '3/16/25'.
    Returns original string if parsing fails.
    """
    if not date_str or date_str.lower() == "n/a":
        return ""
    try:
        return datetime.strptime(re.sub(r"[-]", "/", date_str), "%m/%d/%y").strftime("%-m/%-d/%y")
    except Exception as e:
        utils_logger.error(f"Error safe_standardize_date {date_str} : {str(e)}")
        return date_str
		
def standardize_date(date_str, context=""):
    """
    Converts various date formats to a standardized MM/DD/YY format.
    Supported input formats: MM/DD/YY, MM-DD-YY, etc.
    """
    if not date_str or date_str.lower() == "n/a":
        return ""

    date_str = date_str.strip()
    date_str = re.sub(r'\b(\d{1,2})(st|nd|rd|th)\b', r'\1', date_str, flags=re.IGNORECASE)



    # Try known formats

    for fmt in [
                "%m/%d/%y", "%m-%d-%y", "%m/%d/%Y", "%m-%d-%Y",
                "%d/%m/%Y", "%d-%m-%Y", "%d/%m/%y", "%d-%m-%y",
                "%m-%d %Y", "%m-%d %y",  # handles '04-15 24'
                "%m %d %Y", "%B %Y", "%b %Y", "%B %d, %Y" # 'August 2022'
                
                ]:
        
        try:
            dt = datetime.strptime(date_str, fmt)
            return dt.strftime("%#m/%#d/%y")  # Windows-friendly

        except ValueError as e:
            continue
    utils_logger.warning(f"Unrecognized date '{date_str}' {f'| Context: {context}' if context else ''}") 
    return ""  # Return empty if format not matched
    
def parse_date_old(date_str):
    try:
        if date_str and date_str.strip().lower() != "n/a":
            return datetime.strptime(date_str.strip(), "%m/%d/%Y")
    except Exception as e :
        utils_logger.error(f"Error parse_date {date_str} : {str(e)}")
        pass
    # fallback date for sorting (earliest possible)
    return datetime.min
    

def parse_date_new(date_str):
    try:
        for fmt in ("%m/%d/%Y", "%m/%d/%y"):
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:                
                continue
        raise ValueError(f"time data '{date_str}' does not match expected formats")
    except Exception as e:
        utils_logger.error(f"Error parse_date {date_str} : {str(e)}")
        return datetime.min

def parse_date(date_str: str, context: str = "") -> datetime or None:
    if not date_str or not date_str.strip():
        return None

    date_str = date_str.strip()
    formats_to_try = [
        "%m/%d/%Y",  # e.g., 11/08/2024
        "%m/%d/%y",  # e.g., 11/08/24
        "%d/%m/%Y",  # e.g., 30/10/2024
        "%d/%m/%y",  # e.g., 30/10/24
        "%Y-%m-%d",  # e.g., 2024-10-30
    ]

    for fmt in formats_to_try:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue

    utils_logger.warning(f"Unrecognized date '{date_str}'")
    utils_logger.error(f"Error parse_date {date_str} : time data '{date_str}' does not match expected formats")
    return None

 
def get_label_value(data, label_name, skill_name, context=""):
    """
    Safely extract the first non-empty value for a given label and skill.
    """
    try:
        for skill in data.get("Summary", []):
            if skill.get("SkillName", "").strip().lower() == skill_name.lower():
                for label in skill.get("Labels", []):
                    if label.get("LabelName", "").strip().lower() == label_name.lower():
                        values = label.get("Values", [])
                        for val in values:
                            value_text = val.get("Value", "").strip()
                            if value_text and value_text.lower() != "n/a":
                                return value_text
        return ""
    except Exception as e:
        utils_logger.error(
            f"Error extracting label '{label_name}' from skill '{skill_name}'"
            + (f" | Context: {context}" if context else "")
            + f": {str(e)}"
        )
        return ""
        
def get_label_value_child(data, label_name, skill_name, context=""):
    """
    Safely extract the first non-empty value for a given label and skill.
    Handles both top-level Labels and nested ChildLabels.
    """
    try:
        for skill in data.get("Summary", []):
            if skill.get("SkillName", "").strip().lower() == skill_name.lower():
                labels = skill.get("Labels", [])
                for label in labels:
                    # Check top-level label
                    if label.get("LabelName", "").strip().lower() == label_name.lower():
                        for val in label.get("Values", []):
                            value_text = val.get("Value", "").strip()
                            if value_text and value_text.lower() != "n/a":
                                return value_text

                    # Check child labels
                    for child in label.get("ChildLabels", []):
                        if child.get("LabelName", "").strip().lower() == label_name.lower():
                            for val in child.get("Values", []):
                                value_text = val.get("Value", "").strip()
                                if value_text and value_text.lower() != "n/a":
                                    return value_text

        return ""
    except Exception as e:
        utils_logger.error(
            f"Error extracting label '{label_name}' from skill '{skill_name}'"
            + (f" | Context: {context}" if context else "")
            + f": {str(e)}"
        )
        return ""

def get_nested_label_value(data, top_label_name, child_label_name, skill_name, context=""):
    """
    Extract value from a child label nested under a specific top-level label inside a skill block.
    """
    try:
        for skill in data.get("Summary", []):
            if skill.get("SkillName", "").strip().lower() == skill_name.lower():
                for label in skill.get("Labels", []):
                    if label.get("LabelName", "").strip().lower() == top_label_name.lower():
                        for child in label.get("ChildLabels", []):
                            if child.get("LabelName", "").strip().lower() == child_label_name.lower():
                                for val in child.get("Values", []):
                                    value_text = val.get("Value", "").strip()
                                    if value_text and value_text.lower() != "n/a":
                                        return value_text
        return ""
    except Exception as e:
        #utils_logger.error(f"Error extracting child label '{child_label_name}' under '{top_label_name}': {str(e)}")
        utils_logger.error(
            f"Error extracting child label '{child_label_name}' under '{top_label_name}' from skill '{skill_name}'"
            + (f" | Context: {context}" if context else "")
            + f": {str(e)}"
        )
        return ""

def get_deep_nested_label_value(data, top_label_name, mid_label_name, child_label_name, skill_name,  context=""):
    """
    Extract value from a child label nested under mid-level label under a top-level label inside a skill block.
    """
    try:
        for skill in data.get("Summary", []):
            if skill.get("SkillName", "").strip().lower() == skill_name.lower():
                for label in skill.get("Labels", []):
                    if label.get("LabelName", "").strip().lower() == top_label_name.lower():
                        for mid in label.get("ChildLabels", []):
                            if mid.get("LabelName", "").strip().lower() == mid_label_name.lower():
                                for child in mid.get("ChildLabels", []):
                                    if child.get("LabelName", "").strip().lower() == child_label_name.lower():
                                        for val in child.get("Values", []):
                                            value_text = val.get("Value", "").strip()
                                            if value_text and value_text.lower() != "n/a":
                                                return value_text
        return ""
    except Exception as e:
        utils_logger.error(
            f"Error extracting deep-nested label '{child_label_name}' under '{mid_label_name}' under '{top_label_name}'"
            + f" in skill '{skill_name}' | Context: {context}: {str(e)}"
        )
        return ""

def get_label_value_any_depth(data, label_name, skill_name, context=""):
    """
    Recursively search and extract the first non-empty value for a given label name under a specific skill name.
    Handles Labels, ChildLabels, and arbitrary levels of nested ChildLabels.
    """
    def recursive_search(labels):
        for label in labels:
            if label.get("LabelName", "").strip().lower() == label_name.strip().lower():
                for val in label.get("Values", []):
                    value_text = val.get("Value", "").strip()
                    if value_text and value_text.lower() != "n/a":
                        return value_text
            # Recurse into any ChildLabels
            if "ChildLabels" in label:
                result = recursive_search(label["ChildLabels"])
                if result:
                    return result
        return ""

    try:
        for skill in data.get("Summary", []):
            if skill.get("SkillName", "").strip().lower() == skill_name.lower():
                return recursive_search(skill.get("Labels", []))
        return ""
    except Exception as e:
        utils_logger.error(
            f"Error extracting label '{label_name}' from skill '{skill_name}'"
            + (f" | Context: {context}" if context else "")
            + f": {str(e)}"
        )
        return ""

def get_first_label_value_any_depth(data, label_name, skill_name, context=""):
    try:
        def find_value(labels):
            for label in labels:
                # Match at current level
                if label.get("LabelName", "").strip().lower() == label_name.strip().lower():
                    for val in label.get("Values", []):
                        v = val.get("Value", "").strip()
                        if v and v.lower() != "n/a":
                            return v

                # Search in Groups > RecordLabels
                for group in label.get("Groups", []):
                    result = find_value(group.get("RecordLabels", []))
                    if result:
                        return result

                # Search in ChildLabels
                result = find_value(label.get("ChildLabels", []))
                if result:
                    return result

            return None

        for skill in data.get("Summary", []):
            if skill.get("SkillName", "").strip().lower() == skill_name.lower():
                value = find_value(skill.get("Labels", []))
                if value:
                    return value

        return ""
    except Exception as e:
        utils_logger.error(
            f"Error extracting label '{label_name}' from skill '{skill_name}'"
            + (f" | Context: {context}" if context else "")
            + f": {str(e)}"
        )
        return ""



def get_all_label_values_any_depth(data, label_name, skill_name, context=""):
    try:
        results = []

        def search_labels(labels):
            for label in labels:
                if label.get("LabelName", "").strip().lower() == label_name.lower():
                    values = label.get("Values", [])
                    for val in values:
                        v = val.get("Value", "").strip()
                        if v and v.lower() != "n/a":
                            results.append(v)

                # Recursively check nested groups
                if "Groups" in label:
                    for group in label["Groups"]:
                        search_labels(group.get("RecordLabels", []))

                # Recursively check child labels
                if "ChildLabels" in label:
                    search_labels(label["ChildLabels"])

        for skill in data.get("Summary", []):
            if skill.get("SkillName", "").strip().lower() == skill_name.lower():
                search_labels(skill.get("Labels", []))

        return results

    except Exception as e:
        utils_logger.error(
            f"Error extracting label '{label_name}' from skill '{skill_name}'"
            + (f" | Context: {context}" if context else "")
            + f": {str(e)}"
        )
        return []

# Combine all into one list
def flatten_to_string(value):
    if isinstance(value, list):
        return " ".join(str(v).strip() for v in value if v)
    elif isinstance(value, str):
        return value.strip()
    return ""
       
def safe_json_load(file_path):
    """
    Load JSON file with exception handling. Returns tuple (data, error_msg)
    """
    try:
        with open(file_path, 'r', encoding="utf-8") as f:

            content = json.load(f)
            return content  # Don't raise; let caller handle type check
    except json.JSONDecodeError as e:
        utils_logger.error(f"Error JSON decoding failed '{filepath}' : {str(e)}")
        raise ValueError(f"JSON decoding failed: {str(e)}")


def log_error(filepath, error_message):
    return {
        "filename": os.path.basename(filepath),
        "status": "error",
        "error_message": error_message,
        "filepath": filepath
    }


def group_and_label_basic(documents, dedup_key_func):
    """
    Groups documents by a deduplication key and labels first doc in each group as 'original',
    rest as 'duplicate'. No signature field considered.
    """
    from collections import defaultdict

    grouped = defaultdict(list)
    labeled = []

    for doc in documents:
        if "data" not in doc:
            continue
        try:
            key = dedup_key_func(doc)
            filename = doc.get("filename", "unknown")
            utils_logger.info(f"[DEDUPE] {filename} → key: {key}")
            grouped[key].append(doc)
        except Exception as e:
            doc["status"] = "error"
            doc["error_message"] = f"Key extraction error: {str(e)}"
            labeled.append(doc)
            utils_logger.error(f"[ERROR] dedup key extraction for {filename}: {str(e)}")
            

    for group_docs in grouped.values():
        try:
            group_docs.sort(key=lambda d: d["filename"])
            group_docs[0]["status"] = "original"
            for d in group_docs[1:]:
                d["status"] = "duplicate"
            labeled.extend(group_docs)
        except Exception as e:
            for d in group_docs:
                d["status"] = "error"
                d["error_message"] = f"Deduplication error: {str(e)}"
            labeled.extend(group_docs)
            utils_logger.error(f"Error Deduplication error: {str(e)}")

    return labeled

def group_and_label_with_signature(documents, dedup_key_func, signature_extractor):
    """
    Groups documents by a deduplication key, considers 'Signature' field.
    If one signed doc, it's 'original'. If multiple, pick first. If none, default to filename order.
    """
    from collections import defaultdict

    grouped = defaultdict(list)
    labeled = []

    for doc in documents:
        if "data" not in doc:
            continue
        try:
            key = dedup_key_func(doc)
            filename = doc.get("filename", "unknown")
            utils_logger.info(f"[DEDUPE] {filename} → key: {key}")
            grouped[key].append(doc)
        except Exception as e:
            doc["status"] = "error"
            doc["error_message"] = f"Key extraction error: {str(e)}"
            labeled.append(doc)
            utils_logger.error(f"[ERROR] dedup key extraction for {filename}: {str(e)}")

    for group_docs in grouped.values():
        try:
            valid_signatures = {"yes", "signed", "true"}
            
            signed_docs = [d for d in group_docs if signature_extractor(d).strip().lower() in valid_signatures]

            if signed_docs:
                # Case 1: Signed document(s) exist
                signed_docs.sort(key=lambda d: d["filename"])
                signed_original = signed_docs[0]
                signed_original["status"] = "original"

                for d in group_docs:
                    if d != signed_original:
                        d["status"] = "duplicate"
            else:
                # Case 2: No signed documents
                group_docs.sort(key=lambda d: d["filename"])
                group_docs[0]["status"] = "original"
                for d in group_docs[1:]:
                    d["status"] = "duplicate"

            labeled.extend(group_docs)
        except Exception as e:
            for d in group_docs:
                d["status"] = "error"
                d["error_message"] = f"Deduplication error: {str(e)}"
            labeled.extend(group_docs)
            utils_logger.error(f"Error Deduplication error: {str(e)}")

    return labeled
    
def group_and_label_with_signature_date(documents, dedup_key_func, signature_extractor, signature_date_extractor):
    """
    Priority-based deduplication:
    1. Signed with signature date → latest date wins
    2. Signed but no date → first by filename wins
    3. No signature → fallback to first by filename
    """
    from collections import defaultdict

    grouped = defaultdict(list)
    labeled = []

    valid_signatures = {"yes", "signed", "true"}

    def is_signed(val):
        return val.strip().lower() in valid_signatures

    for doc in documents:
        if "data" not in doc:
            continue
        try:
            key = dedup_key_func(doc)
            filename = doc.get("filename", "unknown")
            utils_logger.info(f"[DEDUPE] {filename} → key: {key}")
            grouped[key].append(doc)
        except Exception as e:
            doc["status"] = "error"
            doc["error_message"] = f"Key extraction error: {str(e)}"
            labeled.append(doc)
            utils_logger.error(f"[ERROR] dedup key extraction for {filename}: {str(e)}")

    for group_docs in grouped.values():
        try:
            bucket1 = []  # signed + date
            bucket2 = []  # signed only
            bucket3 = []  # no signature (or only date)

            for d in group_docs:
                sig = signature_extractor(d).strip().lower()
                sig_date_str = signature_date_extractor(d)
                
                is_sig = is_signed(sig)

                if is_sig and sig_date_str:
                    try:
                        parsed_date = standardize_date(sig_date_str)
                        bucket1.append((d, parsed_date))
                    except Exception as e:
                        utils_logger.warning(f"Invalid signature date in doc {d['filename']}: {sig_date_str}")
                        bucket2.append(d)  # Treat as signature only if date is unparseable
                elif is_sig:
                    bucket2.append(d)
                else:
                    bucket3.append(d)

            if bucket1:
                # Priority 1: signed + valid date
                bucket1.sort(key=lambda x: x[1], reverse=True)
                bucket1[0][0]["status"] = "original"
                rest = [doc for doc, _ in bucket1[1:]] + bucket2 + bucket3
                for d in rest:
                    d["status"] = "duplicate"

            elif bucket2:
                # Priority 2: signature only
                bucket2.sort(key=lambda d: d["filename"])
                bucket2[0]["status"] = "original"
                for d in bucket2[1:] + bucket3:
                    d["status"] = "duplicate"

            else:
                # Priority 3: no signature at all
                group_docs.sort(key=lambda d: d["filename"])
                group_docs[0]["status"] = "original"
                for d in group_docs[1:]:
                    d["status"] = "duplicate"

            labeled.extend(group_docs)

        except Exception as e:
            for d in group_docs:
                d["status"] = "error"
                d["error_message"] = f"Deduplication error: {str(e)}"
            labeled.extend(group_docs)
            utils_logger.error(f"Deduplication error: {str(e)}")

    return labeled
    
def label_all_original(documents):
    """
    Tags every document as 'original' without performing any deduplication.
    Used for document types where no logic is available to distinguish original vs duplicate.
    """
    for doc in documents:
        doc["status"] = "original"
    return documents
    
def group_and_label_with_w2c(documents, dedup_key_func):
    from collections import defaultdict

    grouped = defaultdict(list)
    labeled = []

    # Group by deduplication key
    for doc in documents:
        if "data" not in doc:
            continue
        try:
            key = dedup_key_func(doc)
            filename = doc.get("filename", "unknown")
            grouped[key].append(doc)
            utils_logger.info(f"[DEDUPE] {filename} -> key: {key}")
        except Exception as e:
            doc["status"] = "error"
            doc["error_message"] = f"Key extraction error: {str(e)}"
            labeled.append(doc)
            utils_logger.error(f"Error in dedup_key for doc {doc.get('filename', '')}: {str(e)}")

    for key, group_docs in grouped.items():
        # Separate w2-c and w2 docs based on folder (or any other marker)
        w2c_docs = [d for d in group_docs if "w2_c" in d.get("folder_name", "").lower()]
        w2_docs = [d for d in group_docs if "w2" in d.get("folder_name", "").lower() and "w2_c" not in d.get("folder_name", "").lower()]

        if w2c_docs:
            # Mark one W2-C as original, rest duplicates
            w2c_docs[0]["status"] = "original"
            for d in w2c_docs[1:]:
                d["status"] = "duplicate"
            # All W2 in same group become duplicate
            for d in w2_docs:
                d["status"] = "duplicate"
            labeled.extend(w2c_docs + w2_docs)
        else:
            # Only W2s present - one original, rest duplicate
            w2_docs[0]["status"] = "original"
            for d in w2_docs[1:]:
                d["status"] = "duplicate"
            labeled.extend(w2_docs)

    return labeled
    
def normalize_name(name):
    """
    Normalize name by stripping whitespace, lowercasing, and collapsing internal spaces.
    """
    return ' '.join(name.lower().strip().split())

def borrower_lists_match(list1, list2):
    """
    Check if both borrower lists contain the same names, in any order, after normalization.
    """
    normalized_1 = {normalize_name(n) for n in list1 if n.strip()}
    normalized_2 = {normalize_name(n) for n in list2 if n.strip()}

    return normalized_1 == normalized_2

'''
def identify_matching_borrower(doc_borrowers, final_context):
    doc_names = [normalize_name(n) for n in doc_borrowers]

    for i in range(1, 5):
        note_name = normalize_name(final_context.get(f"borrower_name_{i}", ""))
        if note_name in doc_names:
            return f"B{i}"
    return None
'''    
def identify_matching_borrowers(doc_borrowers, final_context):
    doc_names = [normalize_name(n) for n in doc_borrowers]
    borrower_list = []
    for i in range(1, 5):
        note_name = normalize_name(final_context.get(f"note_borrower_{i}", ""))
        if note_name in doc_names:
            borrower_list.append(f"B{i}")
            
    return borrower_list
    
def identify_matching_borrower(doc_borrowers, final_context):
    """
    Identifies which borrower position (B1-B4) matches any of the document borrowers using fuzzy logic.
    
    :param doc_borrowers: List of borrower names from the document
    :param final_context: Dictionary containing borrower_name_1, borrower_name_2, etc.
    :return: String like "B1", "B2", etc. or None if no match found
    """
    # Normalize and filter empty document borrower names
    doc_names = [normalize_name(name) for name in doc_borrowers if name and name.strip()]
    
    if not doc_names:
        return None
    
    # Check each borrower position (1-4)
    for i in range(1, 5):
        note_name = final_context.get(f"borrower_name_{i}", "")
        
        # Skip empty note names
        if not note_name or not note_name.strip():
            continue
            
        normalized_note_name = normalize_name(note_name)
        if not normalized_note_name:
            continue
        
        # Use fuzzy matching to compare with each document borrower
        for doc_name in doc_names:
            if safe_string_compare(doc_name, normalized_note_name, field_type="name"):
                return f"B{i}"
    
    return None
   

def extract_property_address(content, context="", note_skill_name = "Note Extraction"):
    if note_skill_name == "Note Extraction" or note_skill_name == "1003":
        address =  flatten_to_string(get_first_label_value_any_depth(content, "Property Address", note_skill_name, context=context))
        city =  flatten_to_string(get_first_label_value_any_depth(content, "Property City", note_skill_name, context=context))
        state =  flatten_to_string(get_label_value_any_depth(content, "Property State", note_skill_name, context=context))
        print("note state:",state)
        zipcode =  flatten_to_string(get_first_label_value_any_depth(content, "Property Zip Code", note_skill_name, context=context))
        property_address = address + " " + city + " , " + state + " " + zipcode
    else:
        property_address =  flatten_to_string(get_first_label_value_any_depth(content, "Property Address", note_skill_name, context))
    
    return property_address
    
def safe_compare(a, b):
    if not a or not b:
        return False
    return compare_strings_similarity(a, b)["match_decision"]
    
def extract_street_only(address):
    try:
        components, addr_type = usaddress.tag(address)
        parsed = components
        if addr_type == "Street Address":
            
            print("\n US Address:", parsed, "\n")
            
            street_labels = [
                'AddressNumber', 
                'StreetNamePreDirectional',
                'StreetName', 
                'StreetNamePostType',
                'StreetNamePostDirectional'
            ]
            
            street_parts = [parsed.get(label, '') for label in street_labels if parsed.get(label)]
            
            # Simplified - no need for conditionals
            PlaceName = parsed.get("PlaceName", '')
            StateName = parsed.get("StateName", '')
            ZipCode = parsed.get("ZipCode", '')
            
            #print("\n US Address street_only:", street_parts, "\n")
            #print("\n US Address PlaceName:", PlaceName, "\n")
            #print("\n US Address StateName:", StateName, "\n")
            #print("\n US Address ZipCode:", ZipCode, "\n")
            
            StreetName = " ".join(street_parts)
        elif addr_type == "PO Box":
            street_labels = [
                'USPSBoxType', 
                'USPSBoxID',
                'PlaceName'
            ]
            
            street_parts = [parsed.get(label, '') for label in street_labels if parsed.get(label)]
            StreetName = " ".join(street_parts)
        else:
            StreetName = address
            
        if StreetName:  
            return StreetName
        else:
            return address
    except:
        return address