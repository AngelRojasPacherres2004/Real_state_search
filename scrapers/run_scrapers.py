"""
Master script to run all scrapers
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from urbania import UrbaniaScraper
from adondevivir import AdondevivirScraper
from infocasas import InfocasasScraper
from properati import ProperatiScraper
from babilonia import BabiloniaScraper
from nexoinmobiliario import NexoInmobiliarioScraper
from mitula import MitulaScraper
from laencontre import LaEncontreScraper
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

def run_all_scrapers():
    scrapers = [
        ('Urbania', UrbaniaScraper),
        ('Adondevivir', AdondevivirScraper),
        ('Infocasas', InfocasasScraper),
        ('Properati', ProperatiScraper),
        ('Babilonia', BabiloniaScraper),
        ('Nexo Inmobiliario', NexoInmobiliarioScraper),
        ('Mitula', MitulaScraper),
        ('La Encontre', LaEncontreScraper),
    ]
    
    logger.info("=" * 50)
    logger.info("INICIANDO EJECUCIÓN DE TODOS LOS SCRAPERS")
    logger.info("=" * 50)
    
    successful = []
    failed = []
    
    for name, scraper_class in scrapers:
        try:
            logger.info(f"▶ Iniciando scraper: {name}")
            scraper = scraper_class()
            scraper.scrape()
            successful.append(name)
            logger.info(f"✓ {name} completado exitosamente")
        except Exception as e:
            failed.append((name, str(e)))
            logger.error(f"✗ Error en {name}: {str(e)}", exc_info=True)
        
        logger.info("")
    
    # Resumen final
    logger.info("=" * 50)
    logger.info("RESUMEN DE EJECUCIÓN")
    logger.info("=" * 50)
    logger.info(f"Exitosos: {len(successful)}/{len(scrapers)}")
    if successful:
        for name in successful:
            logger.info(f"  ✓ {name}")
    
    if failed:
        logger.warning(f"Fallidos: {len(failed)}/{len(scrapers)}")
        for name, error in failed:
            logger.warning(f"  ✗ {name}: {error}")
    
    logger.info("=" * 50)


if __name__ == "__main__":
    run_all_scrapers()