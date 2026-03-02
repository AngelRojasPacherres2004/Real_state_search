"""
Master script to run all scrapers
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from urbania import UrbaniaScraper
from adondevivir import AdondevivirScraper
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

def run_all_scrapers():
    """Run all available scrapers"""
    scrapers = [
        ('Urbania', UrbaniaScraper),
        ('Adondevivir', AdondevivirScraper),
        # Add more scrapers here as they're implemented
        # ('Infocasas', InfocasasScraper),
    ]
    
    results = []
    total_properties = 0
    
    logger.info("=" * 60)
    logger.info("STARTING SCRAPER RUN")
    logger.info("=" * 60)
    
    for name, ScraperClass in scrapers:
        logger.info(f"\nRunning {name} scraper...")
        try:
            scraper = ScraperClass()
            result = scraper.run()
            results.append({
                'portal': name,
                'result': result
            })
            total_properties += result['properties_scraped']
            
            if result['success']:
                logger.info(f"✅ {name}: {result['properties_scraped']} properties in {result['duration_seconds']:.2f}s")
            else:
                logger.error(f"❌ {name}: Failed")
                if result['errors']:
                    for error in result['errors']:
                        logger.error(f"   - {error}")
        except Exception as e:
            logger.error(f"❌ {name}: Exception - {str(e)}")
            results.append({
                'portal': name,
                'result': {
                    'success': False,
                    'properties_scraped': 0,
                    'errors': [str(e)]
                }
            })
    
    logger.info("\n" + "=" * 60)
    logger.info("SCRAPER RUN COMPLETE")
    logger.info("=" * 60)
    logger.info(f"Total properties scraped: {total_properties}")
    logger.info("=" * 60)
    
    return results

if __name__ == '__main__':
    run_all_scrapers()
