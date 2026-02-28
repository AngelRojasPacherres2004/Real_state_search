"""
Test script for Urbania scraper
"""
import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from urbania import UrbaniaScraper

if __name__ == '__main__':
    print("=" * 60)
    print("TESTING URBANIA SCRAPER")
    print("=" * 60)
    
    scraper = UrbaniaScraper()
    result = scraper.run()
    
    print("\n" + "=" * 60)
    print("SCRAPING RESULTS")
    print("=" * 60)
    print(f"Portal: {result['portal']}")
    print(f"Success: {result['success']}")
    print(f"Properties scraped: {result['properties_scraped']}")
    print(f"Duration: {result['duration_seconds']:.2f} seconds")
    
    if result['errors']:
        print(f"\nErrors:")
        for error in result['errors']:
            print(f"  - {error}")
    
    print("=" * 60)
