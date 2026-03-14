"""
Configuration for scrapers
"""
import os
from dotenv import load_dotenv

load_dotenv()

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DATABASE_HOST', 'localhost'),
    'user': os.getenv('DATABASE_USER', 'root'),
    'password': os.getenv('DATABASE_PASSWORD', ''),
    'database': os.getenv('DATABASE_NAME', 'real_estate_search_ai'),
}

# Extract from DATABASE_URL if available
DATABASE_URL = os.getenv('DATABASE_URL', '')
if DATABASE_URL:
    # Parse DATABASE_URL format: mysql://user:password@host:port/database?params
    import re
    # Remove query parameters first
    url_without_params = DATABASE_URL.split('?')[0]
    match = re.match(r'mysql://([^:]*):([^@]*)@([^:/]+)(?::(\d+))?/(.+)', url_without_params)
    if match:
        DB_CONFIG = {
            'host': match.group(3),
            'user': match.group(1),
            'password': match.group(2),
            'database': match.group(5),
            'port': int(match.group(4)) if match.group(4) else 3306,
            'ssl_disabled': False  # Enable SSL for TiDB
        }

# Scraping configuration
SCRAPER_CONFIG = {
    'timeout': 30,  # Request timeout in seconds
    'max_retries': 3,  # Maximum number of retries
    'delay_between_requests': 1,  # Delay in seconds between requests
    'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    # Optional local driver paths (override webdriver-manager downloads)
    'edge_driver_path': os.getenv('EDGE_DRIVER_PATH', ''),
    'chrome_driver_path': os.getenv('CHROME_DRIVER_PATH', ''),
    'gecko_driver_path': os.getenv('GECKO_DRIVER_PATH', ''),
}

# Portal URLs
PORTAL_URLS = {
    'urbania': 'https://urbania.pe',
    'adondevivir': 'https://www.adondevivir.com',
    'infocasas': 'https://www.infocasas.com.pe',
    'properati': 'https://www.properati.com.pe',
    'babilonia': 'https://www.babilonia.pe',
    'losportales': 'https://www.losportales.com.pe',
    'laencontre': 'https://www.laencontre.com.pe',
    'mitula': 'https://casas.mitula.pe',
    'nexo': 'https://www.nexoinmobiliario.pe',
    'fazwaz': 'https://www.fazwaz.com.pe',
    'ubicasa': 'https://www.ubicasa.pe',
}
