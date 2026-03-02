#!/usr/bin/env python3
"""
FazWaz Scraper
Extracts property listings from FazWaz.com.pe
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


class FazWazScraper(BaseScraper):
    def __init__(self):
        super().__init__('fazwaz')
        self.base_url = 'https://www.fazwaz.com.pe'
        self.driver = None
        self.search_urls = [
            'https://www.fazwaz.com.pe/',  # Homepage with featured properties
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
        import hashlib
        # Use URL hash as external ID
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
            time.sleep(3)
            
            # Scroll to load more content
            self.scroll_page(scrolls=3)
            
            # Parse page with BeautifulSoup
            soup = BeautifulSoup(self.driver.page_source, 'html.parser')
            
            # Find property cards - FazWaz uses specific structure
            property_cards = soup.find_all('div', class_=re.compile(r'property-card|listing-card'))
            
            if not property_cards:
                # Try alternative selectors
                property_cards = soup.find_all('a', href=re.compile(r'/property/'))
            
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
            # Extract title
            title_elem = card.find(['h3', 'h4', 'h5', 'a'])
            title = title_elem.get_text(strip=True) if title_elem else "FazWaz Property"
            
            # Extract URL
            url = card.get('href') or (card.find('a').get('href') if card.find('a') else '')
            if url and not url.startswith('http'):
                url = self.base_url + url
            
            # Extract price
            price_elem = card.find(text=re.compile(r'\$|USD|S/'))
            price_text = price_elem.strip() if price_elem else ""
            price, currency = self._extract_price(price_text)
            
            # Extract location
            location_elem = card.find(text=re.compile(r'Lima|Callao|Cusco|Miraflores|San Isidro'))
            location = location_elem.strip() if location_elem else ""
            district = self._extract_district(location)
            
            # Extract area
            area_elem = card.find(text=re.compile(r'\d+\s*m'))
            area = self._extract_area(area_elem) if area_elem else None
            
            # Extract bedrooms
            bed_elem = card.find(text=re.compile(r'\d+\s*(bed|hab|dorm)'))
            bedrooms = self._extract_number(bed_elem) if bed_elem else None
            
            # Extract bathrooms
            bath_elem = card.find(text=re.compile(r'\d+\s*(bath|baño)'))
            bathrooms = self._extract_number(bath_elem) if bath_elem else None
            
            # Generate external ID
            externalId = self._extract_id_from_url(url) if url else None
            
            if not price or not externalId:
                return None
            
            return {
                'externalId': externalId,
                'title': title[:200] if title else "FazWaz Property",
                'description': title,
                'propertyType': 'departamento',
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
        price_text = price_text.replace(',', '').replace(' ', '')
        
        # Try to match USD or $
        if 'USD' in price_text or '$' in price_text:
            match = re.search(r'(?:USD|\$)(\d+(?:\.\d+)?)', price_text)
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
            'Surquillo', 'Ate', 'La Victoria', 'Breña', 'Lima Cercado'
        ]
        
        for district in districts:
            if district.lower() in location_text.lower():
                return district
        
        return None


if __name__ == '__main__':
    scraper = FazWazScraper()
    scraper.run()
