"""
Urbania.pe scraper
Extracts real property data from Urbania.pe
"""
import re
import time
from typing import List, Dict, Optional
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.edge.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException, StaleElementReferenceException
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from base_scraper import BaseScraper

class UrbaniaScraper(BaseScraper):
    """Scraper for Urbania.pe"""
    
    def __init__(self):
        super().__init__('urbania')
        self.base_url = 'https://urbania.pe'
        self.driver = None
        
    def init_driver(self):
        """Initialize Selenium WebDriver"""
        service = self.get_webdriver_service('edge')

        edge_options = Options()
        edge_options.add_argument('--headless')
        edge_options.add_argument('--no-sandbox')
        edge_options.add_argument('--disable-dev-shm-usage')
        edge_options.add_argument('--disable-gpu')
        edge_options.add_argument('--window-size=1920,1080')
        edge_options.add_argument('--disable-infobars')
        edge_options.add_argument('--disable-blink-features=AutomationControlled')
        edge_options.add_argument('--disable-features=IsolateOrigins,site-per-process')

        # More realistic user agent
        edge_options.add_argument(
            'user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )
        # Disable automation flags to avoid detection
        edge_options.add_experimental_option('excludeSwitches', ['enable-automation'])
        edge_options.add_experimental_option('useAutomationExtension', False)

        self.driver = webdriver.Edge(service=service, options=edge_options)

        # Hide webdriver flag and other automation indicators
        self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        self.driver.execute_script("window.navigator.chrome = { runtime: {} };" )
        self.driver.execute_script("Object.defineProperty(navigator, 'languages', {get: () => ['en-US', 'en']});")
        self.driver.execute_script("Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3, 4, 5]});")

        self.logger.info("Edge WebDriver initialized")
        
    def close_driver(self):
        """Close Selenium WebDriver"""
        if self.driver:
            self.driver.quit()
            self.logger.info("Edge WebDriver closed")
            
    def extract_price(self, price_text: str) -> tuple:
        """Extract price and currency from text"""
        price_text = price_text.replace(',', '').replace(' ', '')
        
        if 'S/' in price_text or 'S/.' in price_text:
            match = re.search(r'S/\.?(\d+(?:\.\d+)?)', price_text)
            if match:
                soles = float(match.group(1))
                usd = round(soles / 3.75, 2)
                return (usd, 'USD')
        elif 'USD' in price_text or '$' in price_text:
            match = re.search(r'(?:USD|\$)(\d+(?:\.\d+)?)', price_text)
            if match:
                return (float(match.group(1)), 'USD')
                
        return (None, None)
        
    def extract_number(self, text: str) -> Optional[int]:
        """Extract first number from text"""
        match = re.search(r'(\d+)', text)
        return int(match.group(1)) if match else None
        
    def extract_area(self, text: str) -> Optional[float]:
        """Extract area in m² from text"""
        match = re.search(r'(\d+(?:\.\d+)?)\s*m', text)
        return float(match.group(1)) if match else None
        
    def scrape_property_card(self, card_element) -> Optional[Dict]:
        """Extract data from a single property card"""
        try:
            property_data = {
                'externalId': None,
                'title': None,
                'description': None,
                'operationType': 'venta',
                'propertyType': 'departamento',
                'price': None,
                'currency': 'USD',
                'area': None,
                'bedrooms': None,
                'bathrooms': None,
                'district': None,
                'province': 'Lima',
                'department': 'Lima',
                'address': None,
                'latitude': -12.0464,
                'longitude': -77.0428,
                'imageUrl': None,
                'sourceUrl': None,
                'amenities': [],
                'ownerName': None,
                'ownerPhone': None,
                'ownerEmail': None,
                'ownerWhatsapp': None
            }
            
            # Extract link and external ID (prefer listing URL)
            try:
                property_url = self._select_best_anchor(card_element, base_url=self.base_url)
                if property_url:
                    property_data['sourceUrl'] = property_url
                    id_match = re.search(r'/([0-9]+)(?:/|$)', property_url)
                    if id_match:
                        property_data['externalId'] = f"urb-{id_match.group(1)}"
                    else:
                        property_data['externalId'] = f"urb-{hash(property_url) % 10000000}"
            except (NoSuchElementException, StaleElementReferenceException):
                pass

            # Extract image (use shared logic to avoid placeholders/brand logos)
            try:
                image_url = self._select_best_image(card_element, base_url=self.base_url)
                if image_url:
                    property_data['imageUrl'] = image_url
            except Exception:
                pass

            # Extract contact info from detail page (if available)
            try:
                if property_data.get('sourceUrl'):
                    contact_info = self.extract_contact_info(property_data['sourceUrl'])
                    property_data.update(contact_info)
            except Exception:
                pass
                
            # Extract text content
            try:
                card_text = card_element.text
            except StaleElementReferenceException:
                return None
                
            lines = [line.strip() for line in card_text.split('\n') if line.strip()]
            
            # Extract price
            for line in lines:
                if 'S/' in line or 'USD' in line or '$' in line:
                    price, currency = self.extract_price(line)
                    if price:
                        property_data['price'] = price
                        property_data['currency'] = currency
                    break
                    
            # Extract address
            for line in lines:
                if any(keyword in line.lower() for keyword in ['av.', 'calle', 'jr.', 'ca.']):
                    property_data['address'] = line
                    break
                    
            # Extract district
            for line in lines:
                if ',' in line and any(district in line for district in ['Lima', 'Miraflores', 'San Isidro', 'Surco', 'San Borja']):
                    parts = line.split(',')
                    if len(parts) >= 2:
                        property_data['district'] = parts[0].strip()
                    break
                    
            # Extract bedrooms - improved regex
            for line in lines:
                if 'dorm' in line.lower() or 'hab' in line.lower():
                    # Try multiple patterns
                    patterns = [
                        r'(\d+)\s*dorm', r'(\d+)\s*hab', 
                        r'(\d+)\s*couch', r'(\d+)\s*pieza'
                    ]
                    for pattern in patterns:
                        match = re.search(pattern, line.lower())
                        if match:
                            bedrooms = int(match.group(1))
                            if bedrooms:
                                property_data['bedrooms'] = bedrooms
                            break
                    if property_data['bedrooms']:
                        break
                        
            # Extract bathrooms - improved regex  
            for line in lines:
                if 'bañ' in line.lower() or 'bath' in line.lower():
                    patterns = [
                        r'(\d+)\s*bañ', r'(\d+)\s*bath',
                        r'(\d+)\s*baño'
                    ]
                    for pattern in patterns:
                        match = re.search(pattern, line.lower())
                        if match:
                            bathrooms = int(match.group(1))
                            if bathrooms:
                                property_data['bathrooms'] = bathrooms
                            break
                    if property_data['bathrooms']:
                        break
                    
            # Extract area
            for line in lines:
                if 'm²' in line or 'm2' in line:
                    area = self.extract_area(line)
                    if area:
                        property_data['area'] = area
                    break
                    
            # Extract amenities
            amenities_keywords = {
                'gimnasio': 'Gimnasio',
                'gym': 'Gimnasio',
                'piscina': 'Piscina',
                'pool': 'Piscina',
                'parrilla': 'Parrilla',
                'estacionamiento': 'Estacionamiento',
                'parking': 'Estacionamiento',
                'seguridad': 'Seguridad 24h',
                'ascensor': 'Ascensor',
                'elevator': 'Ascensor',
                'terraza': 'Terraza',
                'jardín': 'Jardín',
                'jardin': 'Jardín'
            }
            
            card_text_lower = card_text.lower()
            for keyword, amenity in amenities_keywords.items():
                if keyword in card_text_lower and amenity not in property_data['amenities']:
                    property_data['amenities'].append(amenity)
                    
            # Create title
            if property_data['district']:
                property_data['title'] = f"{property_data['propertyType']} en {property_data['district']}"
                if property_data['bedrooms']:
                    property_data['title'] += f" - {property_data['bedrooms']} dormitorios"
            else:
                property_data['title'] = f"{property_data['propertyType']} en Lima"
                
            # Create description
            desc_parts = []
            if property_data['bedrooms']:
                desc_parts.append(f"{property_data['bedrooms']} dormitorios")
            if property_data['bathrooms']:
                desc_parts.append(f"{property_data['bathrooms']} baños")
            if property_data['area']:
                desc_parts.append(f"{property_data['area']}m²")
            if property_data['amenities']:
                desc_parts.append(f"Amenidades: {', '.join(property_data['amenities'][:3])}")
                
            property_data['description'] = f"{property_data['propertyType']} en {property_data['district'] or 'Lima'}. " + '. '.join(desc_parts)
            
            # Validate required fields
            if not property_data['price']:
                self.logger.warning(f"Skipping property - no price found")
                return None
                
            return property_data      
        except Exception as e:
            self.logger.error(f"Error extracting property card: {e}")
            return None
            
    def scrape_page(self, url: str, max_pages: int = 3) -> List[Dict]:
        """Scrape properties from a single page or multiple pages if pagination is available"""
        all_properties = []
        
        # First page
        page_properties = self._scrape_current_page(url)
        all_properties.extend(page_properties)
        self.logger.info(f"Page 1: extracted {len(page_properties)} properties")
        
        # Try subsequent pages
        for page in range(2, max_pages + 1):
            try:
                # Try URL-based pagination first
                if '?' in url:
                    page_url = f"{url}&page={page}"
                else:
                    page_url = f"{url}?page={page}"
                
                self.logger.info(f"Attempting to load page {page}: {page_url}")
                self.driver.get(page_url)
                time.sleep(3)
                
                page_properties = self._scrape_current_page(page_url)
                if len(page_properties) == 0:
                    self.logger.info(f"No properties found on page {page}, stopping pagination")
                    break
                    
                all_properties.extend(page_properties)
                self.logger.info(f"Page {page}: extracted {len(page_properties)} properties")
                
            except Exception as e:
                self.logger.warning(f"Could not scrape page {page}: {e}")
                break
                
        return all_properties
        
    def _scrape_current_page(self, url: str = None) -> List[Dict]:
        """Scrape properties from the current page"""
        properties = []
        
        try:
            current_url = url or self.driver.current_url
            self.logger.info(f"Scraping page: {current_url}")
            self.logger.info(f"Page title: {self.driver.title}")

            # Wait for page to load and for property cards to appear
            wait = WebDriverWait(self.driver, 40)
            try:
                wait.until(EC.presence_of_element_located((By.XPATH, "//div[contains(@class, 'posting-card')]")))
            except TimeoutException:
                self.logger.warning("Timeout waiting for posting-card elements; proceeding anyway")

            # Wait for document ready state complete
            try:
                WebDriverWait(self.driver, 20).until(
                    lambda d: d.execute_script('return document.readyState') == 'complete'
                )
            except Exception:
                pass

            # Scroll to load more content
            for _ in range(3):
                self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(2)

            # Find property cards using stable selectors
            selectors = [
                "//div[contains(@class, 'posting-card') or contains(@class, 'postingCard')]",
                "//div[contains(@class, 'posting-card') or contains(@class, 'postingCard')]/..",  # sometimes nested
                "//a[contains(@href, '/inmueble/')]",
            ]

            potential_cards = []
            for selector in selectors:
                try:
                    cards = self.driver.find_elements(By.XPATH, selector)
                    if cards and len(cards) > len(potential_cards):
                        potential_cards = cards
                        self.logger.debug(f"Found {len(cards)} cards with selector: {selector}")
                except Exception as e:
                    self.logger.debug(f"Error finding cards with selector {selector}: {e}")

            self.logger.info(f"Found {len(potential_cards)} potential property cards")

            for i, card in enumerate(potential_cards[:150]):
                try:
                    property_data = self.scrape_property_card(card)
                    if property_data:
                        properties.append(property_data)
                        self.logger.info(f"Extracted: {property_data['title']} - ${property_data['price']}")
                    time.sleep(0.2)
                except Exception as e:
                    self.logger.debug(f"Error processing card {i}: {e}")
                    continue

        except TimeoutException:
            self.logger.error(f"Timeout loading page")
        except Exception as e:
            self.logger.error(f"Error scraping page: {e}")
            
        return properties
        
    def scrape(self) -> int:
        """Main scraping method"""
        total_properties = 0
        
        try:
            self.init_driver()
            
            search_urls = [
                f"{self.base_url}/buscar/venta-de-departamentos",
                f"{self.base_url}/buscar/venta-de-casas",
                f"{self.base_url}/buscar/alquiler-de-departamentos",
                f"{self.base_url}/buscar/alquiler-de-casas",
            ]
            
            for url in search_urls:
                self.logger.info(f"Scraping: {url}")
                
                operation_type = 'alquiler' if 'alquiler' in url else 'venta'
                property_type = 'casa' if 'casas' in url else 'departamento'
                
                properties = self.scrape_page(url, max_pages=3)  # Scrape up to 3 pages per category
                
                for prop in properties:
                    prop['operationType'] = operation_type
                    prop['propertyType'] = property_type
                    
                for prop in properties:
                    if self.save_property(prop):
                        total_properties += 1
                        
                self.logger.info(f"Saved {len(properties)} properties from {url}")
                time.sleep(3)
                
        finally:
            self.close_driver()
            
        return total_properties

if __name__ == '__main__':
    scraper = UrbaniaScraper()
    result = scraper.run()
    print(f"Scraping completed: {result}")