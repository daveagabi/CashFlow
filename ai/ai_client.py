#!/usr/bin/env python3
"""
CashFlow AI Client - Python Integration
This is a sample implementation that you can replace with your actual AI code
"""

import sys
import json
import re
import argparse
from datetime import datetime

def parseTranscript(transcript):
    """
    Parse transcript and extract transaction information
    Replace this function with your actual AI parsing logic
    """
    try:
        # Your AI parsing logic goes here
        # This is a sample implementation - replace with your actual code
        
        result = {
            "success": True,
            "transcript": transcript,
            "parsed_data": {},
            "confidence": 0.0,
            "timestamp": datetime.now().isoformat()
        }
        
        # Sample parsing logic (replace with your AI model)
        amount_match = re.search(r'\$?(\d+(?:\.\d{2})?)', transcript.lower())
        if amount_match:
            result["parsed_data"]["amount"] = float(amount_match.group(1))
            result["confidence"] += 0.3
        
        # Detect transaction type
        if any(word in transcript.lower() for word in ['spent', 'paid', 'bought', 'cost']):
            result["parsed_data"]["type"] = "expense"
            result["confidence"] += 0.2
        elif any(word in transcript.lower() for word in ['received', 'earned', 'got', 'salary']):
            result["parsed_data"]["type"] = "income"
            result["confidence"] += 0.2
        else:
            result["parsed_data"]["type"] = "expense"  # default
        
        # Detect category
        categories = {
            "food": ["lunch", "dinner", "breakfast", "coffee", "restaurant", "food", "eat"],
            "transport": ["uber", "taxi", "bus", "train", "gas", "fuel"],
            "shopping": ["clothes", "shoes", "shopping", "store", "buy"],
            "entertainment": ["movie", "cinema", "game", "concert", "show"],
            "health": ["doctor", "medicine", "pharmacy", "hospital"]
        }
        
        detected_category = "other"
        for category, keywords in categories.items():
            if any(keyword in transcript.lower() for keyword in keywords):
                detected_category = category
                result["confidence"] += 0.2
                break
        
        result["parsed_data"]["category"] = detected_category
        
        # Extract description
        description = transcript
        if amount_match:
            description = description.replace(amount_match.group(0), "").strip()
        
        # Remove common words
        for word in ["spent", "paid", "bought", "on", "for", "at", "the", "a", "an"]:
            description = re.sub(r'\b' + word + r'\b', '', description, flags=re.IGNORECASE)
        
        result["parsed_data"]["description"] = description.strip() or "Transaction"
        
        # Ensure confidence is between 0 and 1
        result["confidence"] = min(result["confidence"], 1.0)
        
        return result
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "transcript": transcript,
            "timestamp": datetime.now().isoformat()
        }

def main():
    """Main function to handle command line arguments"""
    parser = argparse.ArgumentParser(description='CashFlow AI Parser')
    parser.add_argument('transcript', nargs='?', help='Transcript to parse')
    parser.add_argument('--mode', default='simple', help='Parsing mode (simple/advanced)')
    parser.add_argument('--input', help='JSON input for advanced mode')
    
    args = parser.parse_args()
    
    try:
        if args.mode == 'advanced' and args.input:
            # Advanced mode with JSON input
            input_data = json.loads(args.input)
            transcript = input_data.get('transcript', '')
            user_id = input_data.get('userId')
            
            result = parseTranscript(transcript)
            result['userId'] = user_id
            result['mode'] = 'advanced'
            
        elif args.transcript:
            # Simple mode with transcript argument
            result = parseTranscript(args.transcript)
            result['mode'] = 'simple'
            
        else:
            # No input provided
            result = {
                "success": False,
                "error": "No transcript provided",
                "usage": "python ai_client.py 'I spent $20 on lunch'"
            }
        
        # Output JSON result
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)

if __name__ == "__main__":
    main()