# ai/tests/run_tests.py
"""
Test suite for AI transcription and parsing
Tests various Nigerian English, Pidgin, and Yoruba patterns
"""

import json
import sys
import os

# Add project root to Python path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
sys.path.insert(0, project_root)

from ai.ai_client import AIClient
from ai.fallback_parser import fallback_parse


# Test samples covering various scenarios
TEST_SAMPLES = [
    # Standard income transactions
    {
        "input": "Sold 3 bags of rice for 15k cash",
        "expected": {"type": "income", "amount": 15000, "item": "rice", "quantity": 3}
    },
    {
        "input": "I collect 50,000 naira from customer",
        "expected": {"type": "income", "amount": 50000}
    },
    {
        "input": "Receive payment 100k via POS",
        "expected": {"type": "income", "amount": 100000, "method": "pos"}
    },
    
    # Expense transactions
    {
        "input": "I buy stock for 10,000 from Iya Biliki",
        "expected": {"type": "expense", "amount": 10000, "person": "Iya Biliki"}
    },
    {
        "input": "Bought 5 cartons of tomatoes 25k",
        "expected": {"type": "expense", "amount": 25000, "item": "tomatoes", "quantity": 5}
    },
    {
        "input": "Pay transport 2k cash",
        "expected": {"type": "expense", "amount": 2000, "method": "cash"}
    },
    {
        "input": "I chop 5k for lunch",  # Pidgin for "spent"
        "expected": {"type": "expense", "amount": 5000}
    },
    
    # Debt transactions
    {
        "input": "Mama Ngozi owes me 12k",
        "expected": {"type": "debt", "amount": 12000, "person": "Mama Ngozi"}
    },
    {
        "input": "Chief Ade owe me 50,000 naira",
        "expected": {"type": "debt", "amount": 50000, "person": "Chief Ade"}
    },
    {
        "input": "Baba Tunde borrow 20k from me",
        "expected": {"type": "debt", "amount": 20000, "person": "Baba Tunde"}
    },
    {
        "input": "Credit customer 15k",
        "expected": {"type": "debt", "amount": 15000}
    },
    
    # Mixed patterns with Nigerian names
    {
        "input": "Oga Chidi paid 30k via transfer",
        "expected": {"type": "income", "amount": 30000, "person": "Oga Chidi", "method": "transfer"}
    },
    {
        "input": "Mrs Adeyemi buy 2 bags of beans 18k",
        "expected": {"type": "income", "amount": 18000, "person": "Mrs Adeyemi", "item": "beans", "quantity": 2}
    },
    
    # Edge cases
    {
        "input": "Took 2k as change",
        "expected": {"type": "expense", "amount": 2000}
    },
    {
        "input": "Sold garri 7,500",
        "expected": {"type": "income", "amount": 7500, "item": "garri"}
    },
    {
        "input": "Buy fuel for generator 3k",
        "expected": {"type": "expense", "amount": 3000}
    },
    
    # Large amounts
    {
        "input": "Receive payment 500k from supplier",
        "expected": {"type": "income", "amount": 500000}
    },
    
    # Small amounts
    {
        "input": "Give boy 200 naira for errand",
        "expected": {"type": "expense", "amount": 200}
    },
    
    # No clear amount (should handle gracefully)
    {
        "input": "Customer collect goods on credit",
        "expected": {"type": "debt"}
    },
    
    # Multiple items
    {
        "input": "Sell rice and beans 45k total",
        "expected": {"type": "income", "amount": 45000}
    }
]


def run_test_suite(use_gpt=True, verbose=True):
    """
    Run full test suite on all samples
    
    Args:
        use_gpt: If True, use GPT parsing. If False, use fallback only
        verbose: Print detailed results
    
    Returns:
        Dictionary with test results and accuracy
    """
    print("=" * 70)
    print(f"🧪 Running Test Suite ({len(TEST_SAMPLES)} samples)")
    print(f"Mode: {'GPT Parsing' if use_gpt else 'Fallback Only'}")
    print("=" * 70)
    
    if use_gpt:
        try:
            client = AIClient()
        except ValueError as e:
            print(f"⚠️  Cannot run GPT tests: {e}")
            print("Falling back to regex-only tests...\n")
            use_gpt = False
    
    results = {
        "total": len(TEST_SAMPLES),
        "passed": 0,
        "failed": 0,
        "partial": 0,
        "details": []
    }
    
    for i, sample in enumerate(TEST_SAMPLES, 1):
        input_text = sample["input"]
        expected = sample["expected"]
        
        if verbose:
            print(f"\n{'─' * 70}")
            print(f"Test {i}/{len(TEST_SAMPLES)}")
            print(f"Input: '{input_text}'")
        
        # Parse using GPT or fallback
        if use_gpt:
            result = client.parse_transcript(input_text)
            parsed = result.get("parsed", {})
            confidence = result.get("confidence", "unknown")
        else:
            parsed = fallback_parse(input_text)
            confidence = "fallback"
        
        # Check results against expected
        matches = []
        mismatches = []
        
        for key, expected_value in expected.items():
            actual_value = parsed.get(key)
            
            if actual_value == expected_value:
                matches.append(key)
            else:
                mismatches.append(f"{key}: expected {expected_value}, got {actual_value}")
        
        # Determine test result
        if len(mismatches) == 0:
            status = "✓ PASSED"
            results["passed"] += 1
        elif len(matches) >= len(mismatches):
            status = "⚠ PARTIAL"
            results["partial"] += 1
        else:
            status = "✗ FAILED"
            results["failed"] += 1
        
        results["details"].append({
            "input": input_text,
            "status": status,
            "parsed": parsed,
            "matches": matches,
            "mismatches": mismatches,
            "confidence": confidence
        })
        
        if verbose:
            print(f"Status: {status} (Confidence: {confidence})")
            print(f"Parsed: {json.dumps(parsed, indent=2)}")
            if mismatches:
                print(f"Issues: {', '.join(mismatches)}")
    
    # Summary
    print("\n" + "=" * 70)
    print("📊 TEST SUMMARY")
    print("=" * 70)
    print(f"Total Tests: {results['total']}")
    print(f"✓ Passed: {results['passed']} ({results['passed']/results['total']*100:.1f}%)")
    print(f"⚠ Partial: {results['partial']} ({results['partial']/results['total']*100:.1f}%)")
    print(f"✗ Failed: {results['failed']} ({results['failed']/results['total']*100:.1f}%)")
    
    accuracy = (results['passed'] + results['partial'] * 0.5) / results['total'] * 100
    print(f"\n🎯 Overall Accuracy: {accuracy:.1f}%")
    
    if accuracy < 80:
        print("⚠️  Accuracy below 80% - consider improving prompts or regex patterns")
    elif accuracy >= 90:
        print("🎉 Great accuracy! System is working well")
    
    return results


def save_test_report(results, filename="test_report.json"):
    """Save test results to JSON file"""
    with open(filename, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"\n💾 Test report saved to {filename}")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Run AI parsing tests')
    parser.add_argument('--fallback-only', action='store_true', 
                       help='Use fallback parser only (no GPT)')
    parser.add_argument('--quiet', action='store_true',
                       help='Minimal output')
    parser.add_argument('--save', action='store_true',
                       help='Save test report to file')
    
    args = parser.parse_args()
    
    results = run_test_suite(
        use_gpt=not args.fallback_only,
        verbose=not args.quiet
    )
    
    if args.save:
        save_test_report(results)