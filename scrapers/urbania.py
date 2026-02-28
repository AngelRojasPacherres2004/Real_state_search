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
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
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
            
    def extract_price(self, price_text: str) -> tuple:
        """
        Extract price and currency from text
        Returns: (price, currency)
        """
        # Remove commas and spaces
        price_text = price_text.replace(',', '').replace(' ', '')
        
        # Try to match S/ or USD
        if 'S/' in price_text or 'S/.' in price_text:
            match = re.search(r'S/\.?(\d+(?:\.\d+)?)', price_text)
            if match:
                # Convert soles to USD (approximate rate: 1 USD = 3.75 PEN)
                soles = float(match.group(1))
                usd = round(soles / 3.75, 2)
                return (usd, 'USD')
        elif 'USD' in price_text or '$' in price_text:
            match = re.search(r'(?:USD|\\$)(\d+(?:\.\d+)?)', price_text)
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
        
    def extract_contact_info(self, property_url: str) -> Dict:
        """
        Extract contact information from property detail page
        
        Args:
            property_url: URL of the property detail page
            
        Returns:
            Dictionary with contact information
        """
        contact_info = {
            'ownerName': None,
            'ownerPhone': None,
            'ownerEmail': None,
            'ownerWhatsapp': None
        }
        
        try:
            self.logger.info(f"Extracting contact info from: {property_url}")
            self.driver.get(property_url)
            time.sleep(2)  # Wait for page to load
            
            page_text = self.driver.page_source.lower()
            
            # Extract phone numbers (Peruvian format)
            phone_patterns = [
                r'(\+51\s?)?\(?9\d{2}\)?[\s-]?\d{3}[\s-]?\d{3}',  # Mobile: +51 9XX XXX XXX
                r'(\+51\s?)?\(?\d{1}\)?[\s-]?\d{3}[\s-]?\d{4}',  # Landline: +51 1 XXX XXXX
                r'\d{9}',  # Simple 9-digit format
            ]
            
            for pattern in phone_patterns:
                match = re.search(pattern, self.driver.page_source)
                if match:
                    phone = match.group(0).strip()
                    # Clean phone number
                    phone = re.sub(r'[^0-9+]', '', phone)
                    if len(phone) >= 9:
                        contact_info['ownerPhone'] = phone
                        contact_info['ownerWhatsapp'] = phone  # Assume WhatsApp available
                        break
            
            # Extract email
            email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', self.driver.page_source)
            if email_match:
                contact_info['ownerEmail'] = email_match.group(0)
            
            # Extract owner name (look for common patterns)
            name_patterns = [
                r'(?:propietario|dueño|contacto):\s*([A-Z][a-záéíóúñ]+(?:\s+[A-Z][a-záéíóúñ]+)*)',
                r'(?:vendedor|agente):\s*([A-Z][a-záéíóúñ]+(?:\s+[A-Z][a-záéíóúñ]+)*)',
            ]
            
            for pattern in name_patterns:
                match = re.search(pattern, self.driver.page_source, re.IGNORECASE)
                if match:
                    contact_info['ownerName'] = match.group(1).strip()
                    break
            
            self.logger.info(f"Extracted contact: phone={contact_info['ownerPhone']}, email={contact_info['ownerEmail']}")
            
        except Exception as e:
            self.logger.error(f"Error extracting contact info: {e}")
        
        return contact_info
    
    def scrape_property_card(self, card_element) -> Optional[Dict]:
        """
        Extract data from a single property card
        
        Args:
            card_element: Selenium WebElement of the property card
            
        Returns:
            Dictionary with property data or None if failed
        """
        try:
            property_data = {
                'externalId': None,
                'title': None,
                'description': None,
                'operationType': 'venta',  # Default for this search (lowercase)
                'propertyType': 'departamento',  # Default for this search (lowercase)
                'price': None,
                'currency': 'USD',
                'area': None,
                'bedrooms': None,
                'bathrooms': None,
                'district': None,
                'province': 'Lima',
                'department': 'Lima',
                'address': None,
                'latitude': -12.0464,  # Default Lima coordinates
                'longitude': -77.0428,
                'imageUrl': None,
                'sourceUrl': None,
                'amenities': [],
                'ownerName': None,
                'ownerPhone': None,
                'ownerEmail': None,
                'ownerWhatsapp': None
            }
            
            # Extract link and external ID
            try:
                link = card_element.find_element(By.TAG_NAME, 'a')
                property_url = link.get_attribute('href')
                if property_url:
                    property_data['sourceUrl'] = property_url
                    # Extract ID from URL
                    id_match = re.search(r'/(\d+)(?:/|$)', property_url)
                    if id_match:
                        property_data['externalId'] = f"urb-{id_match.group(1)}"
                    else:
                        # Generate ID from URL hash
                        property_data['externalId'] = f"urb-{hash(property_url) % 10000000}"
            except NoSuchElementException:
                pass
                
            # Extract image
            try:
                img = card_element.find_element(By.TAG_NAME, 'img')
                property_data['imageUrl'] = img.get_attribute('src')
            except NoSuchElementException:
                pass
                
            # Extract text content
            card_text = card_element.text
            lines = [line.strip() for line in card_text.split('\n') if line.strip()]
            
            # Extract price
            for line in lines:
                if 'S/' in line or 'USD' in line or '$' in line:
                    price, currency = self.extract_price(line)
                    if price:
                        property_data['price'] = price
                        property_data['currency'] = currency
                    break
                    
            # Extract address and district
            for line in lines:
                if any(keyword in line.lower() for keyword in ['av.', 'calle', 'jr.', 'ca.']):
                    property_data['address'] = line
                    break
                    
            for line in lines:
                if ',' in line and any(district in line for district in ['Lima', 'Miraflores', 'San Isidro', 'Surco', 'San Borja']):
                    parts = line.split(',')
                    if len(parts) >= 2:
                        property_data['district'] = parts[0].strip()
                    break
                    
            # Extract bedrooms
            for line in lines:
                if 'dorm' in line.lower():
                    bedrooms = self.extract_number(line)
                    if bedrooms:
                        property_data['bedrooms'] = bedrooms
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
                
            # Create description from available data
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
                self.logger.warning(f"Skipping property - missing required fields")
                return None
            
            # Extract contact information from detail page
            if property_data['sourceUrl']:
                try:
                    contact_info = self.extract_contact_info(property_data['sourceUrl'])
                    property_data.update(contact_info)
                except Exception as e:
                    self.logger.error(f"Error extracting contact info: {e}")
                
            return property_data      
        except Exception as e:
            self.logger.error(f"Error extracting property card: {e}")
            return None
            
    def scrape_page(self, url: str) -> List[Dict]:
        """
        Scrape properties from a single page
        
        Args:
            url: URL to scrape
            
        Returns:
            List of property dictionaries
        """
        properties = []
        
        try:
            self.logger.info(f"Loading page: {url}")
            self.driver.get(url)
            
            # Wait for property cards to load
            wait = WebDriverWait(self.driver, 15)
            wait.until(EC.presence_of_element_located((By.TAG_NAME, 'img')))
            
            # Additional wait for dynamic content
            time.sleep(3)
            
            # Scroll to load more content
            self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight/2);")
            time.sleep(2)
            
            # Find property cards - they contain images and text
            # Strategy: find all divs that contain both an image and price text
            page_source = self.driver.page_source
            
            # Find all elements that look like property cards
            potential_cards = self.driver.find_elements(By.XPATH, "//div[.//img and contains(., 'S/') or contains(., 'USD')]")
            
            self.logger.info(f"Found {len(potential_cards)} potential property cards")
            
            for card in potential_cards[:20]:  # Limit to first 20 per page
                property_data = self.scrape_property_card(card)
                if property_data:
                    properties.append(property_data)
                    self.logger.info(f"Extracted: {property_data['title']} - ${property_data['price']}")
                    
        except TimeoutException:
            self.logger.error(f"Timeout loading page: {url}")
        except Exception as e:
            self.logger.error(f"Error scraping page: {e}")
            
        return properties
        
    def scrape(self) -> int:
        """
        Main scraping method
        
        Returns:
            Number of properties scraped
        """
        total_properties = 0
        
        try:
            self.init_driver()
            
            # URLs to scrape
            search_urls = [
                f"{self.base_url}/buscar/venta-de-departamentos",
                f"{self.base_url}/buscar/venta-de-casas",
                f"{self.base_url}/buscar/alquiler-de-departamentos",
                f"{self.base_url}/buscar/alquiler-de-casas",
            ]
            
            for url in search_urls:
                self.logger.info(f"Scraping: {url}")
                
                # Determine operation type and property type from URL
                operation_type = 'alquiler' if 'alquiler' in url else 'venta'
                property_type = 'casa' if 'casas' in url else 'departamento'
                
                properties = self.scrape_page(url)
                
                # Update operation and property types
                for prop in properties:
                    prop['operationType'] = operation_type
                    prop['propertyType'] = property_type
                    
                # Save to database
                for prop in properties:
                    if self.save_property(prop):
                        total_properties += 1
                        
                self.logger.info(f"Saved {len(properties)} properties from {url}")
                
                # Delay between pages
                time.sleep(2)
                
        finally:
            self.close_driver()
            
        return total_properties

if __name__ == '__main__':
    scraper = UrbaniaScraper()
    result = scraper.run()
    print(f"Scraping completed: {result}")
