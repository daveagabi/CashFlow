# Regex-based fallback parser
# ai/fallback_parser.py
"""
Regex-based fallback parser for when GPT parsing fails
Handles Nigerian Pidgin/Yoruba patterns and amount formats
"""

import re
from typing import Dict, Optional, Any
from datetime import datetime


def extract_amount(text: str) -> Optional[int]:
    """
    Extract amount from text with Nigerian formatting
    Handles: 15k, 15,000, 15000, etc.

    Args:
        text: Input text containing amount

    Returns:
        Amount in Naira as integer, or None
    """
    # Pattern 1: Numbers with 'k' or 'K' (e.g., "15k" = 15,000)
    k_pattern = r'(\d+(?:\.\d+)?)\s*[kK]'
    k_match = re.search(k_pattern, text)
    if k_match:
        value = float(k_match.group(1)) * 1000
        return int(value)

    # Pattern 2: Numbers with commas (e.g., "15,000")
    comma_pattern = r'(\d{1,3}(?:,\d{3})+)'
    comma_match = re.search(comma_pattern, text)
    if comma_match:
        value = comma_match.group(1).replace(',', '')
        return int(value)

    # Pattern 3: Plain numbers over 100 (assume it's an amount)
    plain_pattern = r'\b(\d{3,})\b'
    plain_match = re.search(plain_pattern, text)
    if plain_match:
        return int(plain_match.group(1))

    return None


def detect_transaction_type(text: str) -> str:
    """
    Detect if transaction is income, expense, or debt
    Uses Nigerian Pidgin and English keywords

    Args:
        text: Input text

    Returns:
        "income", "expense", or "debt"
    """
    text_lower = text.lower()

    # Debt indicators (highest priority)
    debt_keywords = [
        r'\bowes?\b', r'\bowe\b', r'\bdebt\b', r'\bcredit\b',
        r'\blend\b', r'\bborrow\b'
    ]
    for pattern in debt_keywords:
        if re.search(pattern, text_lower):
            return "debt"

    # Income indicators
    income_keywords = [
        r'\bsold?\b', r'\bsell\b', r'\bcollect\b', r'\breceive[d]?\b',
        r'\bmake\b.*\bmoney\b', r'\bgot\b.*\bpaid\b', r'\bincome\b'
    ]
    for pattern in income_keywords:
        if re.search(pattern, text_lower):
            return "income"

    # Expense indicators (including Pidgin)
    expense_keywords = [
        r'\bbuy\b', r'\bbought\b', r'\bpay\b', r'\bpaid\b',
        r'\bchop\b',  # Pidgin for "spend"
        r'\bspend\b', r'\bspent\b', r'\bexpense\b',
        r'\btake\b.*\bchange\b'
    ]
    for pattern in expense_keywords:
        if re.search(pattern, text_lower):
            return "expense"

    # Default to expense if unclear
    return "expense"


def extract_person_name(text: str) -> Optional[str]:
    """
    Extract person names with Nigerian prefixes
    Common: Mama, Iya, Baba, Chief, Oga, etc.

    Args:
        text: Input text

    Returns:
        Person name or None
    """
    # Pattern for Nigerian name prefixes + name
    name_patterns = [
        r'\b(Mama|Iya|Baba|Chief|Oga|Mr|Mrs|Miss)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)',
        r'\bfrom\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)',
        r'\bto\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)'
    ]

    for pattern in name_patterns:
        match = re.search(pattern, text)
        if match:
            # Return full name (prefix + name) or just name
            return match.group(0).replace('from ', '').replace('to ', '').strip()

    return None


def extract_item(text: str) -> Optional[str]:
    """
    Extract item/product name

    Args:
        text: Input text

    Returns:
        Item name or None
    """
    # Look for patterns like "bags of rice", "stock", "goods"
    item_patterns = [
        r'(?:bags? of|sacks? of|cartons? of|pieces? of)\s+([a-z]+)',
        r'(?:buy|bought|sold|sell)\s+([a-z]+(?:\s+[a-z]+)?)',
        r'\b(rice|beans|garri|yam|fish|meat|stock|goods)\b'
    ]

    for pattern in item_patterns:
        match = re.search(pattern, text.lower())
        if match:
            return match.group(1) if match.lastindex else match.group(0)

    return None


def extract_quantity(text: str) -> Optional[int]:
    """
    Extract quantity of items

    Args:
        text: Input text

    Returns:
        Quantity as integer or None
    """
    # Pattern for "3 bags", "2 cartons", etc.
    quantity_pattern = r'\b(\d+)\s+(?:bags?|sacks?|cartons?|pieces?|items?)\b'
    match = re.search(quantity_pattern, text.lower())

    if match:
        return int(match.group(1))

    return None


def extract_payment_method(text: str) -> Optional[str]:
    """
    Extract payment method (cash, POS, transfer)

    Args:
        text: Input text

    Returns:
        "cash", "pos", "transfer", or None
    """
    text_lower = text.lower()

    if re.search(r'\bpos\b', text_lower):
        return "pos"
    elif re.search(r'\btransfer\b', text_lower):
        return "transfer"
    elif re.search(r'\bcash\b', text_lower):
        return "cash"

    return None


def fallback_parse(transcript: str) -> Dict[str, Any]:
    """
    Main fallback parser function
    Uses regex patterns to extract structured data

    Args:
        transcript: Raw transcript text

    Returns:
        Structured transaction dictionary
    """
    print(f"🔧 Using fallback parser for: {transcript}")

    transaction = {
        "type": detect_transaction_type(transcript),
        "item": extract_item(transcript),
        "quantity": extract_quantity(transcript),
        "amount": extract_amount(transcript),
        "currency": "NGN",
        "method": extract_payment_method(transcript),
        "person": extract_person_name(transcript),
        "date": None,  # Date extraction is complex, leave for manual entry
        "raw": transcript
    }

    print(f"✓ Fallback result: {transaction}")
    return transaction


# Test the fallback parser
if __name__ == "__main__":
    print("🧪 Testing Fallback Parser...\n")

    test_cases = [
        "Sold 3 bags of rice for 15k cash",
        "Mama Ngozi owes me 12k",
        "I buy stock for 10,000 from Iya Biliki",
        "Took 2k as change",
        "Chief Ade paid 50k via POS",
        "Bought garri 5,000 naira",
        "Oga Chidi borrow me 20k"
    ]

    for i, test in enumerate(test_cases, 1):
        print(f"\n{'=' * 50}")
        print(f"Test {i}: {test}")
        result = fallback_parse(test)

        print(f"Type: {result['type']}")
        print(f"Amount: ₦{result['amount']:,}" if result['amount'] else "Amount: None")
        print(f"Item: {result['item']}")
        print(f"Person: {result['person']}")
        print(f"Method: {result['method']}")