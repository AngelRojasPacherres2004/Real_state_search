#!/usr/bin/env python3
"""
Nexo Inmobiliario Scraper
Extracts property data from nexoinmobiliario.pe
"""

from base_scraper import BaseScraper
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import re


class NexoInmobiliarioScraper(BaseScraper):
    def __init__(self):
        super().__init__('nexoinmobiliario')
        self.base_url = 'https://nexoinmobiliario.pe'
        self.driver = None
        self.search_urls = [
            'https://nexoinmobiliario.pe/',  # Homepage with featured projects
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
        self.logger.info(f"Found {len(cards)} potential project cards")
        
        for card in cards:
            try:
                property_data = self._extract_property_data(card, url)
                if property_data:
                    properties.append(property_data)
                    self.logger.info(f"Extracted: {property_data.get('title')} - {property_data.get('district')} - S/{property_data.get('price')}")
            except Exception as e:
                self.logger.error(f"Error extracting property: {e}")
                continue
        
        self.logger.info(f"Saved {len(properties)} properties from {url}")
        return properties
    
    def _extract_property_data(self, card, source_url):
        """Extract property data from a card element"""
        try:
            # Get card HTML
            card_html = card.get_attribute('outerHTML')
            card_text = card.text
            
            # Extract property URL (prefer listing link)
            property_url = self._select_best_anchor(card)
            if property_url and not property_url.startswith('http'):
                property_url = self.base_url + property_url
            
            if not property_url or 'nexoinmobiliario.pe' not in property_url:
                return None
            
            # Generate external ID from URL
            external_id = self._extract_id_from_url(property_url)
            if not external_id:
                return None
            
            # Nexo Inmobiliario mainly sells properties (venta)
            operation_type = "venta"
            
            # Extract property type - Nexo focuses on projects (apartments)
            property_type = "apartment"  # Default for Nexo Inmobiliario
            
            # Extract title (project name)
            title = ""
            try:
                # Try to find project name in card
                title_elem = card.find_element(By.CSS_SELECTOR, "h3, h2, .project-name, .title")
                title = title_elem.text.strip()
            except:
                # Fallback: extract from card text
                lines = card_text.split('\n')
                for line in lines:
                    if line and len(line) > 3 and not line.startswith('Desde') and not line.startswith('S/.'):
                        title = line.strip()
                        break
            
            # Extract price
            price = None
            currency = "PEN"  # Nexo uses Soles
            try:
                price_text = card_text
                price_match = re.search(r'S/\.\s*([\d,]+)', price_text)
                if price_match:
                    price_str = price_match.group(1).replace(',', '')
                    price = float(price_str)
            except:
                pass
            
            if not price:
                return None
            
            # Extract area (m²)
            area = None
            try:
                area_match = re.search(r'([\d.]+)\s*-\s*([\d.]+)\s*m2', card_text)
                if area_match:
                    # Use average of range
                    min_area = float(area_match.group(1))
                    max_area = float(area_match.group(2))
                    area = (min_area + max_area) / 2
            except:
                pass
            
            # Extract bedrooms
            bedrooms = None
            try:
                bed_match = re.search(r'(\d+)\s*-\s*(\d+)\s*dorm', card_text)
                if bed_match:
                    # Use average of range
                    min_bed = int(bed_match.group(1))
                    max_bed = int(bed_match.group(2))
                    bedrooms = (min_bed + max_bed) // 2
            except:
                pass
            
            # Extract bathrooms (not always available)
            bathrooms = None
            
            # Extract district
            district = None
            try:
                # Look for district in address line
                lines = card_text.split('\n')
                for line in lines:
                    if '-' in line and ('Lima' in line or 'Callao' in line):
                        parts = line.split('-')
                        if len(parts) >= 2:
                            district = parts[-1].strip()
                            break
            except:
                pass
            
            # Extract image URL
            image_url = self._select_best_image(card)
            if image_url and not image_url.startswith('http'):
                image_url = self.base_url + image_url
            
            # Build property data
            property_data = {
                'externalId': external_id,
                'title': title or f"Proyecto {property_type.title()} en Lima",
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
                'amenities': [],
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
    scraper = NexoInmobiliarioScraper()
    scraper.run()
