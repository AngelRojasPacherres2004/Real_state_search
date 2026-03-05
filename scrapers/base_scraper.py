"""
Base scraper class with common functionality
"""
import time
import logging
import mysql.connector
from typing import List, Dict, Optional
from datetime import datetime
import requests
from bs4 import BeautifulSoup
from config import DB_CONFIG, SCRAPER_CONFIG

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

class BaseScraper:
    """Base class for all property scrapers"""
    
    def __init__(self, portal_name: str):
        self.portal_name = portal_name
        self.logger = logging.getLogger(f"Scraper.{portal_name}")
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': SCRAPER_CONFIG['user_agent']
        })
        self.db_connection = None
        
    def connect_db(self):
        """Connect to MySQL database"""
        try:
            self.db_connection = mysql.connector.connect(**DB_CONFIG)
            self.logger.info(f"Connected to database: {DB_CONFIG['database']}")
            return True
        except mysql.connector.Error as err:
            self.logger.error(f"Database connection error: {err}")
            return False

    def ensure_db_connection(self):
        """Ensure database connection is active, reconnect if needed"""
        try:
            if self.db_connection is None or not self.db_connection.is_connected():
                self.logger.warning("Database connection lost, reconnecting...")
                self.connect_db()
            else:
                # Ping to keep connection alive
                self.db_connection.ping(reconnect=True, attempts=3, delay=2)
        except mysql.connector.Error as err:
            self.logger.error(f"Error reconnecting to database: {err}")
            self.connect_db()
            
    def close_db(self):
        """Close database connection"""
        if self.db_connection and self.db_connection.is_connected():
            self.db_connection.close()
            self.logger.info("Database connection closed")
            
    def fetch_page(self, url: str, max_retries: int = None) -> Optional[BeautifulSoup]:
        """
        Fetch and parse a web page
        
        Args:
            url: URL to fetch
            max_retries: Maximum number of retries (default from config)
            
        Returns:
            BeautifulSoup object or None if failed
        """
        if max_retries is None:
            max_retries = SCRAPER_CONFIG['max_retries']
            
        for attempt in range(max_retries):
            try:
                self.logger.info(f"Fetching: {url} (attempt {attempt + 1}/{max_retries})")
                response = self.session.get(
                    url,
                    timeout=SCRAPER_CONFIG['timeout']
                )
                response.raise_for_status()
                
                # Add delay between requests
                time.sleep(SCRAPER_CONFIG['delay_between_requests'])
                
                return BeautifulSoup(response.content, 'html.parser')
                
            except requests.RequestException as e:
                self.logger.warning(f"Request failed (attempt {attempt + 1}): {e}")
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff
                else:
                    self.logger.error(f"Failed to fetch {url} after {max_retries} attempts")
                    return None
                    
    def save_property(self, property_data: Dict) -> bool:
        """
        Save property to database
        
        Args:
            property_data: Dictionary with property information
            
        Returns:
            True if successful, False otherwise
        """
        # Ensure connection is alive before saving
        self.ensure_db_connection()

        if not self.db_connection or not self.db_connection.is_connected():
            self.logger.error("No database connection")
            return False
            
        try:
            cursor = self.db_connection.cursor()
            
            # Check if property already exists
            check_query = """
                SELECT id FROM properties 
                WHERE externalId = %s AND portal = %s
            """
            cursor.execute(check_query, (property_data['externalId'], self.portal_name))
            existing = cursor.fetchone()
            
            if existing:
                # Update existing property
                update_query = """
                    UPDATE properties SET
                        title = %s,
                        description = %s,
                        operationType = %s,
                        propertyType = %s,
                        price = %s,
                        currency = %s,
                        area = %s,
                        bedrooms = %s,
                        bathrooms = %s,
                        district = %s,
                        province = %s,
                        department = %s,
                        address = %s,
                        latitude = %s,
                        longitude = %s,
                        imageUrl = %s,
                        sourceUrl = %s,
                        amenities = %s,
                        ownerName = %s,
                        ownerPhone = %s,
                        ownerWhatsapp = %s,
                        ownerEmail = %s,
                        updatedAt = NOW()
                    WHERE id = %s
                """
                cursor.execute(update_query, (
                    property_data['title'],
                    property_data['description'],
                    property_data['operationType'],
                    property_data['propertyType'],
                    property_data['price'],
                    property_data['currency'],
                    property_data['area'],
                    property_data['bedrooms'],
                    property_data['bathrooms'],
                    property_data['district'],
                    property_data['province'],
                    property_data['department'],
                    property_data['address'],
                    property_data['latitude'],
                    property_data['longitude'],
                    property_data['imageUrl'],
                    property_data['sourceUrl'],
                    ','.join(property_data.get('amenities', [])),
                    property_data.get('ownerName'),
                    property_data.get('ownerPhone'),
                    property_data.get('ownerWhatsapp'),
                    property_data.get('ownerEmail'),
                    existing[0]
                ))
                self.logger.info(f"Updated property: {property_data['externalId']}")
            else:
                # Insert new property
                insert_query = """
                    INSERT INTO properties (
                        externalId, portal, title, description, operationType,
                        propertyType, price, currency, area, bedrooms, bathrooms,
                        district, province, department, address, latitude, longitude,
                        imageUrl, sourceUrl, amenities, ownerName, ownerPhone, ownerWhatsapp, ownerEmail, createdAt, updatedAt
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW()
                    )
                """
                cursor.execute(insert_query, (
                    property_data['externalId'],
                    self.portal_name,
                    property_data['title'],
                    property_data['description'],
                    property_data['operationType'],
                    property_data['propertyType'],
                    property_data['price'],
                    property_data['currency'],
                    property_data['area'],
                    property_data['bedrooms'],
                    property_data['bathrooms'],
                    property_data['district'],
                    property_data['province'],
                    property_data['department'],
                    property_data['address'],
                    property_data['latitude'],
                    property_data['longitude'],
                    property_data['imageUrl'],
                    property_data['sourceUrl'],
                    ','.join(property_data.get('amenities', [])),
                    property_data.get('ownerName'),
                    property_data.get('ownerPhone'),
                    property_data.get('ownerWhatsapp'),
                    property_data.get('ownerEmail'),
                ))
                self.logger.info(f"Inserted new property: {property_data['externalId']}")
                
            self.db_connection.commit()
            cursor.close()
            return True
            
        except mysql.connector.Error as err:
            self.logger.error(f"Database error: {err}")
            if self.db_connection:
                self.db_connection.rollback()
            return False
            
    def scrape(self) -> int:
        """
        Main scraping method - to be implemented by subclasses
        
        Returns:
            Number of properties scraped
        """
        raise NotImplementedError("Subclasses must implement scrape() method")
        
    def run(self) -> Dict:
        """
        Run the scraper with error handling
        
        Returns:
            Dictionary with scraping results
        """
        start_time = datetime.now()
        self.logger.info(f"Starting {self.portal_name} scraper")
        
        result = {
            'portal': self.portal_name,
            'success': False,
            'properties_scraped': 0,
            'errors': [],
            'start_time': start_time.isoformat(),
            'end_time': None,
            'duration_seconds': 0
        }
        
        try:
            if not self.connect_db():
                result['errors'].append("Failed to connect to database")
                return result
                
            properties_count = self.scrape()
            result['properties_scraped'] = properties_count
            result['success'] = True
            
        except Exception as e:
            self.logger.error(f"Scraping error: {e}", exc_info=True)
            result['errors'].append(str(e))
            
        finally:
            self.close_db()
            end_time = datetime.now()
            result['end_time'] = end_time.isoformat()
            result['duration_seconds'] = (end_time - start_time).total_seconds()
            
        self.logger.info(
            f"Finished {self.portal_name} scraper: "
            f"{result['properties_scraped']} properties in "
            f"{result['duration_seconds']:.2f}s"
        )
        
        return result