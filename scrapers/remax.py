#!/usr/bin/env python3
"""
RE/MAX Perú Scraper
Extracts property listings from Remax.pe
"""

from base_scraper import BaseScraper
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
import time
import re


class RemaxScraper(BaseScraper):
    def __init__(self):
        super().__init__('remax')
        self.base_url = 'https://www.remax.pe'
        self.driver = None
        self.search_urls = [
            'https://www.remax.pe/web/search/all/propertys/list/',  # All properties
        ]
    
    def init_driver(self):
        """Initialize Selenium WebDriver"""
        from selenium import webdriver
        from selenium.webdriver.chrome.options import Options
        
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        chrome_options.add_argument(f'user-agent={self.session.headers["User-Agent"]}')
        
        self.driver = webdriver.Chrome(options=chrome_options)
        self.logger.info("Chrome WebDriver initialized")
    
    def close_driver(self):
        """Close Selenium WebDriver"""
        if self.driver:
            self.driver.quit()
            self.logger.info("Chrome WebDriver closed")
    
    def scroll_page(self, scrolls=3):
        """Scroll page to load dynamic content"""
        for i in range(scrolls):
            self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(1)
    
    def _extract_id_from_url(self, url):
        """Extract unique ID from property URL"""
        # Try to extract ID from URL
        match = re.search(r'ID:\s*(\d+)', url)
        if match:
            return f"REMAX{match.group(1)}"
        # Try alternative pattern
        match = re.search(r'/(\d+)/?$', url)
        if match:
            return f"REMAX{match.group(1)}"
        # Fallback to hash
        import hashlib
        return hashlib.md5(url.encode()).hexdigest()[:16]
    
    def scrape(self):
        """Main scraping method"""
        all_properties = []
        
        # Initialize WebDriver
        self.init_driver()
        
        try:
            for url in self.search_urls:
                self.logger.info(f"Scraping: {url}")
                properties = self._scrape_page(url)
                all_properties.extend(properties)
                time.sleep(2)  # Be respectful
            
            # Save all properties
            saved_count = 0
            for prop in all_properties:
                if self.save_property(prop):
                    saved_count += 1
            
            self.logger.info(f"Saved {saved_count} properties from {self.portal_name}")
            return saved_count
        finally:
            # Close WebDriver
            self.close_driver()
    
    def _scrape_page(self, url):
        """Scrape a single page"""
        properties = []
        
        try:
            self.logger.info(f"Loading page: {url}")
            self.driver.get(url)
            time.sleep(5)  # Wait for page to load (may have CAPTCHA)
            
            # Scroll to load more content
            self.scroll_page(scrolls=5)
            
            # Parse page with BeautifulSoup
            soup = BeautifulSoup(self.driver.page_source, 'html.parser')
            
            # Find property cards - RE/MAX uses specific structure
            property_cards = soup.find_all(['div', 'article'], class_=re.compile(r'property|listing|item'))
            
            if not property_cards:
                # Try alternative selectors - look for links with property IDs
                property_cards = soup.find_all('a', href=re.compile(r'/property/|/propiedad/'))
            
            if not property_cards:
                # Try to find by ID pattern
                id_elements = soup.find_all(text=re.compile(r'ID:\s*\d+'))
                property_cards = [elem.parent.parent for elem in id_elements if elem.parent]
            
            self.logger.info(f"Found {len(property_cards)} potential property cards")
            
            for card in property_cards:
                try:
                    property_data = self._extract_property_data(card)
                    if property_data:
                        properties.append(property_data)
                        self.logger.info(f"Extracted: {property_data.get('title')} - {property_data.get('district')} - ${property_data.get('price')}")
                except Exception as e:
                    self.logger.error(f"Error in _extract_property_data: {e}")
                    continue
            
            self.logger.info(f"Saved {len(properties)} properties from {url}")
            
        except Exception as e:
            self.logger.error(f"Error scraping page {url}: {e}", exc_info=True)
        
        return properties
    
    def _extract_property_data(self, card):
        """Extract property data from a card element"""
        try:
            # Extract ID
            id_elem = card.find(text=re.compile(r'ID:\s*\d+'))
            external_id = None
            if id_elem:
                match = re.search(r'ID:\s*(\d+)', id_elem)
                if match:
                    external_id = f"REMAX{match.group(1)}"
            
            # Extract title
            title_elem = card.find(['h2', 'h3', 'h4', 'h5'])
            title = title_elem.get_text(strip=True) if title_elem else "RE/MAX Property"
            
            # Extract URL
            url_elem = card.find('a', href=re.compile(r'/property/|/propiedad/'))
            url = url_elem.get('href') if url_elem else (card.get('href') or '')
            if url and not url.startswith('http'):
                url = self.base_url + url
            
            # Extract price - RE/MAX shows both S/ and USD
            price_elem = card.find(text=re.compile(r'S/\.|USD'))
            price_text = price_elem.strip() if price_elem else ""
            price, currency = self._extract_price(price_text)
            
            # Extract location
            location_elem = card.find(text=re.compile(r'Lima|Callao|Cusco|Miraflores|San Isidro|Arequipa'))
            location = location_elem.strip() if location_elem else ""
            district = self._extract_district(location or title)
            
            # Extract area
            area_elem = card.find(text=re.compile(r'Área\s*(?:Construida|Terreno).*?(\d+(?:\.\d+)?)\s*m'))
            area = self._extract_area(area_elem) if area_elem else None
            
            # Extract bedrooms
            bed_elem = card.find(text=re.compile(r'(\d+)\s*(?:Habitacion|Dormitorio)'))
            bedrooms = self._extract_number(bed_elem) if bed_elem else None
            
            # Extract bathrooms
            bath_elem = card.find(text=re.compile(r'(\d+)\s*Baño'))
            bathrooms = self._extract_number(bath_elem) if bath_elem else None
            
            # Determine property type
            propertyType = 'departamento'
            if 'CASA' in title.upper():
                propertyType = 'casa'
            elif 'TERRENO' in title.upper():
                propertyType = 'terreno'
            elif 'OFICINA' in title.upper():
                propertyType = 'oficina'
            elif 'LOCAL' in title.upper():
                propertyType = 'local comercial'
            
            # Generate external ID if not found
            if not external_id and url:
                external_id = self._extract_id_from_url(url)
            
            if not price or not external_id:
                return None
            
            return {
                'externalId': external_id,
                'title': title[:200] if title else "RE/MAX Property",
                'description': title,
                'propertyType': propertyType,
                'operationType': 'venta',
                'price': price,
                'currency': currency,
                'area': area,
                'bedrooms': bedrooms,
                'bathrooms': bathrooms,
                'district': district,
                'address': location[:200] if location else None,
                'url': url,
                'imageUrl': None,
                'amenities': [],
                'ownerName': None,
                'ownerPhone': None,
                'ownerEmail': None,
                'ownerWhatsapp': None,
            }
            
        except Exception as e:
            self.logger.error(f"Error extracting property data: {e}")
            return None
    
    def _extract_price(self, price_text):
        """Extract price and currency from text"""
        if not price_text:
            return (None, None)
        
        # Remove commas and spaces
        price_text = price_text.replace(',', '').replace(' ', '').replace("'", "")
        
        # Try to match USD first (RE/MAX shows both)
        if 'USD' in price_text:
            match = re.search(r'USD(\d+(?:\.\d+)?)', price_text)
            if match:
                return (float(match.group(1)), 'USD')
        # Try to match S/
        elif 'S/' in price_text:
            match = re.search(r'S/\.?(\d+(?:\.\d+)?)', price_text)
            if match:
                # Convert soles to USD (approximate rate: 1 USD = 3.75 PEN)
                soles = float(match.group(1))
                usd = round(soles / 3.75, 2)
                return (usd, 'USD')
        
        return (None, None)
    
    def _extract_number(self, text):
        """Extract first number from text"""
        if not text:
            return None
        match = re.search(r'(\d+)', str(text))
        return int(match.group(1)) if match else None
    
    def _extract_area(self, text):
        """Extract area in m² from text"""
        if not text:
            return None
        match = re.search(r'(\d+(?:\.\d+)?)\s*m', str(text))
        return float(match.group(1)) if match else None
    
    def _extract_district(self, location_text):
        """Extract district from location text"""
        if not location_text:
            return None
        
        # Common districts in Lima
        districts = [
            'Miraflores', 'San Isidro', 'Barranco', 'Surco', 'Santiago de Surco',
            'La Molina', 'San Borja', 'Jesús María', 'Lince', 'Magdalena',
            'Pueblo Libre', 'San Miguel', 'Callao', 'Bellavista', 'Lima',
            'Surquillo', 'Ate', 'La Victoria', 'Breña', 'Lima Cercado',
            'San Juan de Lurigancho', 'Comas', 'Villa El Salvador', 'San Martin de Porres'
        ]
        
        for district in districts:
            if district.lower() in location_text.lower():
                return district
        
        return None


if __name__ == '__main__':
    scraper = RemaxScraper()
    scraper.run()
