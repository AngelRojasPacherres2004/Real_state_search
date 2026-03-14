"""
Base scraper class with common functionality
"""
import os
import re
import time
import logging
import mysql.connector
from typing import List, Dict, Optional
from datetime import datetime
from urllib.parse import urljoin, urlparse
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
            
    def _resolve_driver_path(self, env_var: str, config_key: str) -> Optional[str]:
        """Resolve a local WebDriver binary path from env var or config."""
        candidate = os.getenv(env_var) or SCRAPER_CONFIG.get(config_key, '')
        if not candidate:
            return None

        candidate = os.path.expanduser(candidate)
        if not os.path.isabs(candidate):
            # Treat as relative to project root
            candidate = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', candidate))

        if os.path.isfile(candidate):
            return candidate

        self.logger.warning(f"Specified driver path for {env_var} does not exist: {candidate}")
        return None

    def _find_executable_in_path(self, name: str) -> Optional[str]:
        """Return full path to an executable found in the PATH, if any."""
        import shutil
        path = shutil.which(name)
        return path

    def get_webdriver_service(self, browser: str = 'edge'):
        """Return a Selenium Service using a local driver binary if configured.

        Falls back to webdriver-manager if no local driver is configured.
        """
        browser = browser.lower()
        if browser == 'edge':
            from selenium.webdriver.edge.service import Service as EdgeService
            driver_path = self._resolve_driver_path('EDGE_DRIVER_PATH', 'edge_driver_path')
            if not driver_path:
                # Look for a driver next to this repo as a convenience (e.g., ./scrapers/msedgedriver.exe)
                possible = os.path.join(os.path.dirname(__file__), 'msedgedriver.exe')
                if os.path.isfile(possible):
                    driver_path = possible
                else:
                    possible = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'msedgedriver.exe'))
                    if os.path.isfile(possible):
                        driver_path = possible

            if not driver_path:
                # Fall back to system PATH for msedgedriver
                driver_path = self._find_executable_in_path('msedgedriver') or self._find_executable_in_path('msedgedriver.exe')

            if driver_path:
                self.logger.info(f"Using local Edge WebDriver binary: {driver_path}")
                return EdgeService(driver_path)

            self.logger.warning(
                "No local Edge WebDriver binary found. "
                "Set EDGE_DRIVER_PATH to a valid msedgedriver.exe or place msedgedriver.exe next to the scrapers folder."
            )
            try:
                from webdriver_manager.microsoft import EdgeChromiumDriverManager
                return EdgeService(EdgeChromiumDriverManager().install())
            except Exception as e:
                self.logger.error(f"Unable to initialize Edge WebDriver: {e}")
                raise
        elif browser == 'chrome':
            from selenium.webdriver.chrome.service import Service as ChromeService
            driver_path = self._resolve_driver_path('CHROME_DRIVER_PATH', 'chrome_driver_path')
            if not driver_path:
                # Look for a driver next to this repo (e.g., ./scrapers/chromedriver.exe)
                possible = os.path.join(os.path.dirname(__file__), 'chromedriver.exe')
                if os.path.isfile(possible):
                    driver_path = possible
                else:
                    possible = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'chromedriver.exe'))
                    if os.path.isfile(possible):
                        driver_path = possible

            if not driver_path:
                driver_path = self._find_executable_in_path('chromedriver') or self._find_executable_in_path('chromedriver.exe')

            if driver_path:
                self.logger.info(f"Using local Chrome WebDriver binary: {driver_path}")
                return ChromeService(driver_path)

            self.logger.warning(
                "No local Chrome WebDriver binary found. "
                "Set CHROME_DRIVER_PATH to a valid chromedriver.exe or place chromedriver.exe next to the scrapers folder."
            )
            try:
                from webdriver_manager.chrome import ChromeDriverManager
                return ChromeService(ChromeDriverManager().install())
            except Exception as e:
                self.logger.error(f"Unable to initialize Chrome WebDriver: {e}")
                raise
        else:
            raise ValueError(f"Unsupported browser for WebDriver service: {browser}")

    def _make_absolute_url(self, url: str, base_url: Optional[str] = None) -> Optional[str]:
        """Normalize a URL to be absolute.

        - Adds https: prefix for protocol-relative URLs (e.g. //example.com/image.jpg)
        - Joins relative URLs using the provided base_url
        - Returns None for empty or invalid input
        """
        if not url:
            return None

        url = url.strip()
        if not url:
            return None

        # Protocol-relative URLs
        if url.startswith('//'):
            return f"https:{url}"

        # Already absolute
        if url.startswith('http://') or url.startswith('https://'):
            return url

        # Try to join relative URLs if we have a base
        if base_url:
            try:
                return urljoin(base_url, url)
            except Exception:
                pass

        return url

    def _select_best_anchor(self, element, preferred_substrings=None, base_url: Optional[str] = None):
        """Pick the best anchor (<a>) from a card element.

        Args:
            element: Selenium WebElement representing the card.
            preferred_substrings: list of substrings to prioritize (e.g. ['/inmueble/', '/propiedad/']).
            base_url: Optional base URL used to normalize relative links.

        Returns:
            The chosen absolute href string or None.
        """
        try:
            from selenium.webdriver.common.by import By
        except ImportError:
            return None

        if preferred_substrings is None:
            preferred_substrings = ['/inmueble/', '/propiedad/', '/detalle/', '/venta-', '/alquiler-']

        try:
            anchors = element.find_elements(By.TAG_NAME, 'a')
        except Exception:
            return None

        best = None
        for a in anchors:
            try:
                href = (a.get_attribute('href') or '').strip()
            except Exception:
                continue
            if not href or href.startswith('#') or href.startswith('javascript:') or href.lower().startswith('mailto:'):
                continue

            normalized = self._make_absolute_url(href, base_url)
            if not normalized:
                continue

            # Prefer anchors containing one of the preferred substrings
            if any(sub in normalized for sub in preferred_substrings):
                return normalized
            if not best:
                best = normalized
        return best

    def _select_best_image(self, element, base_url: Optional[str] = None):
        """Pick the best image URL from a card element.

        Uses src or data-src and filters out logos/placeholders.
        """
        try:
            from selenium.webdriver.common.by import By
        except ImportError:
            return None

        try:
            imgs = element.find_elements(By.TAG_NAME, 'img')
        except Exception:
            return None

        candidates = []
        for img in imgs:
            try:
                # Prefer common lazy-loaded attributes
                src = (
                    img.get_attribute('data-original')
                    or img.get_attribute('data-lazy')
                    or img.get_attribute('data-src')
                    or img.get_attribute('src')
                    or ''
                ).strip()
            except Exception:
                continue
            if not src:
                continue

            low = src.lower()

            # Skip placeholders, icons and tracking images
            if any(ignore in low for ignore in ['.svg', 'logo', 'brand', 'placeholder', 'blank', 'spinner', 'loading', 'pixel', 'track']):
                continue

            # Skip base64 tiny placeholders
            if low.startswith('data:image'):
                continue

            # Accept common image extensions
            if any(ext in low for ext in ['.jpg', '.jpeg', '.png', '.webp', '.gif']):
                candidates.append(src)

        # Prefer the longest (likely higher-res) URL if multiple found
        if candidates:
            candidates.sort(key=len, reverse=True)
            return self._make_absolute_url(candidates[0], base_url)

        # Fallback: look for background-image inline styles
        for img in imgs:
            try:
                style = img.get_attribute('style') or ''
                if 'background-image' in style:
                    match = re.search(r"url\(['\"]?(.*?)['\"]?\)", style)
                    if match:
                        return self._make_absolute_url(match.group(1), base_url)
            except Exception:
                continue

        return None

    def extract_contact_info_from_html(self, html: str, page_url: Optional[str] = None) -> Dict[str, Optional[str]]:
        """Extract contact info (phone/email/whatsapp) from HTML content."""
        contact_info = {
            'ownerName': None,
            'ownerPhone': None,
            'ownerEmail': None,
            'ownerWhatsapp': None
        }

        if not html:
            return contact_info

        # Prefer parsing clickable links first (tel:, mailto:, whatsapp)
        try:
            soup = BeautifulSoup(html, 'html.parser')

            # Phone via tel: links
            tel_link = soup.select_one('a[href^="tel:"]')
            if tel_link:
                href = tel_link.get('href', '')
                phone = re.sub(r'[^0-9+]', '', href.replace('tel:', ''))
                if phone:
                    contact_info['ownerPhone'] = phone
                    contact_info['ownerWhatsapp'] = phone

            # Email via mailto:
            mail_link = soup.select_one('a[href^="mailto:"]')
            if mail_link:
                href = mail_link.get('href', '')
                email = href.replace('mailto:', '').split('?')[0]
                if email:
                    contact_info['ownerEmail'] = email

            # WhatsApp links
            wa_link = soup.select_one('a[href*="wa.me/"]') or soup.select_one('a[href*="api.whatsapp.com/send"]')
            if wa_link and not contact_info['ownerWhatsapp']:
                href = wa_link.get('href', '')
                match = re.search(r'(?:wa\.me/|phone=)(\+?[0-9]+)', href)
                if match:
                    contact_info['ownerWhatsapp'] = re.sub(r'[^0-9+]', '', match.group(1))
                    if not contact_info['ownerPhone']:
                        contact_info['ownerPhone'] = contact_info['ownerWhatsapp']
        except Exception:
            pass

        # Also look for raw phone/email in the HTML as a fallback
        if not contact_info['ownerPhone']:
            phone_patterns = [
                r'(\+51\s?)?\(?9\d{2}\)?[\s-]?\d{3}[\s-]?\d{3}',  # Mobile
                r'(\+51\s?)?\(?\d{1}\)?[\s-]?\d{3}[\s-]?\d{4}',  # Landline
                r'\d{9}',  # Simple 9-digit
            ]
            for pattern in phone_patterns:
                match = re.search(pattern, html)
                if match:
                    phone = re.sub(r'[^0-9+]', '', match.group(0))
                    if len(phone) >= 9:
                        contact_info['ownerPhone'] = phone
                        if not contact_info['ownerWhatsapp']:
                            contact_info['ownerWhatsapp'] = phone
                        break

        if not contact_info['ownerEmail']:
            email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', html)
            if email_match:
                contact_info['ownerEmail'] = email_match.group(0)

        # Owner name - try to infer from common labels
        if not contact_info['ownerName']:
            name_patterns = [
                r'(?:propietario|dueño|contacto)[:\s]+([A-Z][a-záéíóúñ]+(?:\s+[A-Z][a-záéíóúñ]+)*)',
                r'(?:vendedor|agente)[:\s]+([A-Z][a-záéíóúñ]+(?:\s+[A-Z][a-záéíóúñ]+)*)',
            ]
            for pattern in name_patterns:
                match = re.search(pattern, html, re.IGNORECASE)
                if match:
                    contact_info['ownerName'] = match.group(1).strip()
                    break

        return contact_info

    def extract_contact_info(self, property_url: str) -> Dict[str, Optional[str]]:
        """Load a property URL and extract contact information."""
        contact_info = {
            'ownerName': None,
            'ownerPhone': None,
            'ownerEmail': None,
            'ownerWhatsapp': None
        }

        if not property_url:
            return contact_info

        try:
            html = None
            # Use Selenium driver if available (most scrapers use it)
            if hasattr(self, 'driver') and getattr(self, 'driver', None):
                try:
                    self.driver.get(property_url)
                    time.sleep(2)
                    html = self.driver.page_source
                except Exception:
                    html = None
            else:
                # Fallback to simple HTTP fetch
                soup = self.fetch_page(property_url)
                html = soup.prettify() if soup else None

            return self.extract_contact_info_from_html(html, page_url=property_url)
        except Exception:
            return contact_info

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