#!/usr/bin/env python3
"""
Mitula Scraper
Extracts property data from casas.mitula.pe
"""

from base_scraper import BaseScraper
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import re


class MitulaScraper(BaseScraper):
    def __init__(self):
        super().__init__('mitula')
        self.base_url = 'https://casas.mitula.pe'
        self.driver = None
        self.search_urls = [
            'https://casas.mitula.pe/casas/st-lima-metropolitana',  # All properties in Lima
        ]
    

    def extract_contact_info(self, property_url: str) -> dict:
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
            
            page_source = self.driver.page_source
            
            # Extract phone numbers (Peruvian format)
            phone_patterns = [
                r'(\+51\s?)?\(?9\d{2}\)?[\s-]?\d{3}[\s-]?\d{3}',  # Mobile: +51 9XX XXX XXX
                r'(\+51\s?)?\(?\d{1}\)?[\s-]?\d{3}[\s-]?\d{4}',  # Landline: +51 1 XXX XXXX
                r'\d{9}',  # Simple 9-digit format
            ]
            
            for pattern in phone_patterns:
                match = re.search(pattern, page_source)
                if match:
                    phone = match.group(0).strip()
                    # Clean phone number
                    phone = re.sub(r'[^0-9+]', '', phone)
                    if len(phone) >= 9:
                        contact_info['ownerPhone'] = phone
                        contact_info['ownerWhatsapp'] = phone  # Assume WhatsApp available
                        break
            
            # Extract email
            email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', page_source)
            if email_match:
                contact_info['ownerEmail'] = email_match.group(0)
            
            # Extract owner name (look for common patterns)
            name_patterns = [
                r'(?:propietario|dueño|contacto):\s*([A-Z][a-záéíóúñ]+(?:\s+[A-Z][a-záéíóúñ]+)*)',
                r'(?:vendedor|agente):\s*([A-Z][a-záéíóúñ]+(?:\s+[A-Z][a-záéíóúñ]+)*)',
            ]
            
            for pattern in name_patterns:
                match = re.search(pattern, page_source, re.IGNORECASE)
                if match:
                    contact_info['ownerName'] = match.group(1).strip()
                    break
            
            self.logger.info(f"Extracted contact: phone={contact_info['ownerPhone']}, email={contact_info['ownerEmail']}")
            
        except Exception as e:
            self.logger.error(f"Error extracting contact info: {e}")
        
        return contact_info


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
        
        self.logger.info(f"Loading page: {url}")
        self.driver.get(url)
        
        # Wait for property cards to load
        try:
            WebDriverWait(self.driver, 15).until(
                EC.presence_of_element_located((By.TAG_NAME, "article"))
            )
        except:
            self.logger.warning(f"No articles found on {url}")
            return properties
        
        # Scroll to load more content
        self.scroll_page()
        
        # Find all property cards
        cards = self.driver.find_elements(By.TAG_NAME, "article")
        self.logger.info(f"Found {len(cards)} potential property cards")
        
        for card in cards:
            try:
                property_data = self._extract_property_data(card, url)
                if property_data:
                    properties.append(property_data)
                    self.logger.info(f"Extracted: {property_data.get('title')} - {property_data.get('district')} - {property_data.get('currency')}{property_data.get('price')}")
            except Exception as e:
                self.logger.error(f"Error extracting property: {e}")
                continue
        
        self.logger.info(f"Saved {len(properties)} properties from {url}")
        return properties
    
    def _extract_property_data(self, card, source_url):
        """Extract property data from a card element"""
        try:
            # Get card HTML and text
            card_html = card.get_attribute('outerHTML')
            card_text = card.text
            
            # Extract property URL
            property_url = None
            try:
                link = card.find_element(By.CSS_SELECTOR, "a[href*='casas.mitula.pe']")
                property_url = link.get_attribute('href')
            except:
                return None
            
            if not property_url or 'mitula.pe' not in property_url:
                return None
            
            # Generate external ID from URL
            external_id = self._extract_id_from_url(property_url)
            if not external_id:
                return None
            
            # Determine operation type from URL or context
            operation_type = "venta" if "/venta" in property_url or "venta" in source_url.lower() else "alquiler"
            
            # Extract property type from card text
            property_type = "apartment"  # Default
            if "Casa" in card_text:
                property_type = "house"
            elif "Minidepartamento" in card_text or "Departamento" in card_text:
                property_type = "apartment"
            elif "Terreno" in card_text:
                property_type = "land"
            elif "Oficina" in card_text:
                property_type = "office"
            elif "Local" in card_text or "Comercial" in card_text:
                property_type = "commercial"
            
            # Extract title (location or property description)
            title = ""
            try:
                # Look for location text
                lines = card_text.split('\n')
                for line in lines:
                    if ',' in line and len(line) > 10 and len(line) < 100:
                        title = line.strip()
                        break
            except:
                pass
            
            # Extract price and currency
            price = None
            currency = "PEN"  # Default
            try:
                price_text = card_text
                # Try USD first
                usd_match = re.search(r'USD\s*([\d,]+)', price_text)
                if usd_match:
                    price_str = usd_match.group(1).replace(',', '')
                    price = float(price_str)
                    currency = "USD"
                else:
                    # Try PEN
                    pen_match = re.search(r'S/\.\s*([\d,]+)', price_text)
                    if pen_match:
                        price_str = pen_match.group(1).replace(',', '')
                        price = float(price_str)
                        currency = "PEN"
            except:
                pass
            
            if not price:
                return None
            
            # Extract area (m²)
            area = None
            try:
                area_match = re.search(r'(\d+)\s*m²', card_text)
                if area_match:
                    area = float(area_match.group(1))
            except:
                pass
            
            # Extract bedrooms
            bedrooms = None
            try:
                bed_match = re.search(r'(\d+)\s*Dormitorio', card_text)
                if bed_match:
                    bedrooms = int(bed_match.group(1))
            except:
                pass
            
            # Extract bathrooms
            bathrooms = None
            try:
                bath_match = re.search(r'(\d+)\s*Baño', card_text)
                if bath_match:
                    bathrooms = int(bath_match.group(1))
            except:
                pass
            
            # Extract district from location
            district = None
            try:
                lines = card_text.split('\n')
                for line in lines:
                    if ',' in line:
                        parts = line.split(',')
                        if len(parts) >= 2:
                            # Last part before "Lima" is usually the district
                            for part in reversed(parts):
                                part = part.strip()
                                if part and part != 'Lima' and len(part) > 3:
                                    district = part
                                    break
                            break
            except:
                pass
            
            # Extract image URL
            image_url = None
            try:
                img = card.find_element(By.TAG_NAME, "img")
                image_url = img.get_attribute('src')
            except:
                pass
            
            # Extract amenities from card text
            amenities = []
            amenity_keywords = [
                'Aire acondicionado', 'Armario empotrado', 'Cochera', 'Internet',
                'Vista panorámica', 'Cuarto de servicio', 'Ascensor', 'Seguridad',
                'Piscina', 'Gimnasio', 'Jardín', 'Balcón', 'Terraza', 'Patio'
            ]
            for keyword in amenity_keywords:
                if keyword in card_text:
                    amenities.append(keyword)
            
            # Build property data
            property_data = {
                'externalId': external_id,
                'title': title or f"{property_type.title()} en Lima",
                'description': card_text[:500] if card_text else None,
                'propertyType': property_type,
                'operationType': operation_type,
                'price': price,
                'currency': currency,
                'area': area,
                'bedrooms': bedrooms,
                'bathrooms': bathrooms,
                'district': district,
                'province': 'Lima',
                'department': 'Lima',
                'address': None,
                'latitude': None,
                'longitude': None,
                'sourceUrl': property_url,
                'imageUrl': image_url,
                'amenities': amenities,
            }
            
            # Extract contact information from detail page
            if property_data.get('sourceUrl'):
                try:
                    contact_info = self.extract_contact_info(property_data['sourceUrl'])
                    property_data.update(contact_info)
                except Exception as e:
                    self.logger.error(f"Error extracting contact info: {e}")
            
            return property_data
            
        except Exception as e:
            self.logger.error(f"Error in _extract_property_data: {e}")
            return None


if __name__ == "__main__":
    scraper = MitulaScraper()
    scraper.run()
