#!/usr/bin/env python3
"""
Test script for Adondevivir scraper
"""
import logging
import sys
from adondevivir import AdondevivirScraper

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

def main():
    logger = logging.getLogger(__name__)
    logger.info("Starting Adondevivir scraper test...")
    
    try:
        scraper = AdondevivirScraper()
        scraper.scrape()
        logger.info("Scraper test completed successfully")
        return 0
    except Exception as e:
        logger.error(f"Scraper test failed: {e}", exc_info=True)
        return 1

if __name__ == "__main__":
    sys.exit(main())
