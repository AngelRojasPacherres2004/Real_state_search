import logging
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from base_scraper import BaseScraper
import time
import re

logger = logging.getLogger(__name__)

class AdondevivirScraper(BaseScraper):
    """
    Scraper for Adondevivir.com - Peruvian real estate portal
    """
    
    def __init__(self):
        super().__init__("adondevivir")
        self.base_url = "https://www.adondevivir.com"
        self.driver = None
    

    def extract_contact_info(self, property_url: str) -> dict:
        """Extract contact information from property detail page."""
        self.logger.info(f"Extracting contact info from: {property_url}")
        contact_info = super().extract_contact_info(property_url)
        self.logger.info(f"Extracted contact: phone={contact_info.get('ownerPhone')}, email={contact_info.get('ownerEmail')}")
        return contact_info


    def init_driver(self):
        """Initialize Selenium WebDriver"""
        from selenium.webdriver.edge.options import Options
        edge_options = Options()
        edge_options.add_argument('--headless')
        edge_options.add_argument('--no-sandbox')
        edge_options.add_argument('--disable-dev-shm-usage')
        edge_options.add_argument('--disable-gpu')
        edge_options.add_argument('--window-size=1920,1080')
        edge_options.add_argument(f'user-agent={self.session.headers["User-Agent"]}')
        
        service = self.get_webdriver_service('edge')
        self.driver = webdriver.Edge(service=service, options=edge_options)
        self.logger.info("Edge WebDriver initialized")
    
    def close_driver(self):
        """Close Selenium WebDriver"""
        if self.driver:
            self.driver.quit()
            self.logger.info("Edge WebDriver closed")
        
    def scrape(self):
        """
        Main scraping method for Adondevivir
        """
        total_properties = 0
        
        # URLs to scrape
        urls = [
            f"{self.base_url}/propiedades/venta/departamentos",
            f"{self.base_url}/propiedades/venta/casas",
            f"{self.base_url}/propiedades/alquiler/departamentos",
            f"{self.base_url}/propiedades/alquiler/casas",
        ]
        
        try:
            self.init_driver()
            
            for url in urls:
                self.logger.info(f"Scraping: {url}")
                properties = self._scrape_listing_page(self.driver, url)
                
                # Save to database
                for prop in properties:
                    if self.save_property(prop):
                        total_properties += 1
                        
                self.logger.info(f"Saved {len(properties)} properties from {url}")
                time.sleep(2)  # Be polite
                
        finally:
            self.close_driver()
            
        return total_properties
            
    def _scrape_listing_page(self, driver, url):
        """
        Scrape a single listing page
        """
        properties = []
        
        try:
            logger.info(f"Loading page: {url}")
            driver.get(url)
            
            # Wait for property cards to load
            try:
                WebDriverWait(driver, 15).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, ".aviso-row, .property-card, article"))
                )
            except TimeoutException:
                logger.error(f"Timeout loading page: {url}")
                return properties
            
            # Scroll to load more content (lazy loading)
            self._scroll_page(driver)
            
            # Find property cards - try multiple selectors
            property_cards = driver.find_elements(By.CSS_SELECTOR, ".aviso-row") or \
                           driver.find_elements(By.CSS_SELECTOR, ".property-card") or \
                           driver.find_elements(By.CSS_SELECTOR, "article")
            
            logger.info(f"Found {len(property_cards)} potential property cards")
            
            for card in property_cards[:20]:  # Limit to first 20 per page
                try:
                    property_data = self._extract_property_data(card, url)
                    if property_data:
                        properties.append(property_data)
                        logger.info(f"Extracted: {property_data.get('title', 'Unknown')} - ${property_data.get('price', 0)}")
                except Exception as e:
                    logger.error(f"Error extracting property: {e}")
                    continue
                    
        except Exception as e:
            logger.error(f"Error scraping page {url}: {e}")
            
        return properties
        
    def _extract_property_data(self, card, source_url):
        """
        Extract property data from a property card element
        """
        try:
            # Extract title
            title_elem = card.find_element(By.CSS_SELECTOR, "h2, h3, .title, .property-title")
            title = title_elem.text.strip() if title_elem else "Propiedad en Adondevivir"
            
            # Extract price
            price_text = ""
            try:
                price_elem = card.find_element(By.CSS_SELECTOR, ".price, .precio, .property-price")
                price_text = price_elem.text.strip()
            except NoSuchElementException:
                pass
            
            price = self._parse_price(price_text)
            if not price or price == 0:
                return None  # Skip properties without price
            
            # Extract property type and operation type from URL
            operation_type = "venta" if "/venta/" in source_url else "alquiler"
            property_type = "departamento" if "/departamentos" in source_url else "casa"
            
            # Extract bedrooms
            bedrooms = None
            try:
                bed_elem = card.find_element(By.CSS_SELECTOR, ".bedrooms, .dormitorios, [class*='bed']")
                bed_text = bed_elem.text.strip()
                bedrooms = self._parse_number(bed_text)
            except NoSuchElementException:
                pass
            
            # Extract bathrooms
            bathrooms = None
            try:
                bath_elem = card.find_element(By.CSS_SELECTOR, ".bathrooms, .baños, [class*='bath']")
                bath_text = bath_elem.text.strip()
                bathrooms = self._parse_number(bath_text)
            except NoSuchElementException:
                pass
            
            # Extract area
            area = None
            try:
                area_elem = card.find_element(By.CSS_SELECTOR, ".area, .superficie, [class*='m2']")
                area_text = area_elem.text.strip()
                area = self._parse_area(area_text)
            except NoSuchElementException:
                pass
            
            # Extract district/location
            district = None
            try:
                location_elem = card.find_element(By.CSS_SELECTOR, ".location, .ubicacion, .district, .address")
                district = location_elem.text.strip()
            except NoSuchElementException:
                pass
            
            # Extract property URL (prioritize listing link)
            property_url = self._select_best_anchor(card, base_url=self.base_url) or source_url

            # Extract image URL
            image_url = self._select_best_image(card, base_url=self.base_url)
            
            # Generate external ID from URL or use hash
            external_id = self._generate_external_id(property_url)
            
            # Extract contact information from detail page
            contact_info = {}
            if property_url:
                try:
                    contact_info = self.extract_contact_info(property_url)
                except Exception as e:
                    self.logger.error(f"Error extracting contact info: {e}")
            
            return {
                "externalId": external_id,
                "title": title,
                "operationType": operation_type,
                "propertyType": property_type,
                "price": price,
                "currency": "USD",
                "area": area,
                "bedrooms": bedrooms,
                "bathrooms": bathrooms,
                "district": district,
                "province": "Lima",
                "department": "Lima",
                "address": None,
                "latitude": None,
                "longitude": None,
                "sourceUrl": property_url,
                "imageUrl": image_url,
                "amenities": [],
                "ownerName": contact_info.get('ownerName'),
                "ownerPhone": contact_info.get('ownerPhone'),
                "ownerWhatsapp": contact_info.get('ownerWhatsapp'),
                "ownerEmail": contact_info.get('ownerEmail'),
            }
            
        except Exception as e:
            logger.error(f"Error extracting property data: {e}")
            return None
            
    def _scroll_page(self, driver):
        """
        Scroll page to trigger lazy loading
        """
        try:
            last_height = driver.execute_script("return document.body.scrollHeight")
            for _ in range(3):  # Scroll 3 times
                driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(1)
                new_height = driver.execute_script("return document.body.scrollHeight")
                if new_height == last_height:
                    break
                last_height = new_height
        except Exception as e:
            logger.error(f"Error scrolling page: {e}")
            
    def _parse_price(self, price_text):
        """
        Parse price from text like 'S/ 350,000' or 'US$ 120,000'
        """
        if not price_text:
            return None
            
        # Remove currency symbols and convert to number
        price_text = price_text.replace("S/", "").replace("US$", "").replace("$", "")
        price_text = price_text.replace(",", "").replace(".", "").strip()
        
        try:
            price = float(price_text)
            # Convert soles to USD if needed (approximate rate: 1 USD = 3.75 PEN)
            if "S/" in price_text or "soles" in price_text.lower():
                price = price / 3.75
            return price
        except ValueError:
            return None
            
    def _parse_number(self, text):
        """
        Extract first number from text
        """
        if not text:
            return None
        match = re.search(r'\d+', text)
        return int(match.group()) if match else None
        
    def _parse_area(self, area_text):
        """
        Parse area from text like '85 m²' or '85m2'
        """
        if not area_text:
            return None
        match = re.search(r'(\d+(?:\.\d+)?)', area_text)
        return float(match.group(1)) if match else None
        
    def _generate_external_id(self, url):
        """
        Generate external ID from URL or hash
        """
        # Try to extract ID from URL
        match = re.search(r'/propiedad/(\d+)', url) or re.search(r'/inmueble/(\d+)', url)
        if match:
            return f"adv-{match.group(1)}"
        # Fallback to hash
        return f"adv-{hash(url) % 10000000}"

if __name__ == "__main__":
    scraper = AdondevivirScraper()
    result = scraper.run()
    print(f"Scraping completed: {result}")
