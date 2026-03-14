#!/usr/bin/env python3
"""
Babilonia.pe Web Scraper
Extracts real estate listings from Babilonia Peru
"""

import logging
from typing import Dict, List, Optional
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from base_scraper import BaseScraper
import time
import re

class BabiloniaScraper(BaseScraper):
    """Scraper for Babilonia.pe"""
    
    def __init__(self):
        super().__init__(portal_name="babilonia")
        self.base_url = "https://www.babilonia.pe"
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
        
        from selenium import webdriver
        service = self.get_webdriver_service('edge')
        self.driver = webdriver.Edge(service=service, options=edge_options)
        self.logger.info("Edge WebDriver initialized")
    
    def close_driver(self):
        """Close Selenium WebDriver"""
        if self.driver:
            self.driver.quit()
            self.logger.info("Edge WebDriver closed")
    
    def scroll_page(self):
        """Scroll page to load more content"""
        try:
            last_height = self.driver.execute_script("return document.body.scrollHeight")
            for _ in range(3):  # Scroll 3 times
                self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(2)
                new_height = self.driver.execute_script("return document.body.scrollHeight")
                if new_height == last_height:
                    break
                last_height = new_height
        except Exception as e:
            self.logger.debug(f"Error scrolling page: {e}")
        
    def get_search_urls(self) -> List[str]:
        """Return list of URLs to scrape - focused on specific districts"""
        # URLs con formato correcto: /inmuebles/{tipo}-en-{operacion}-en-lima-lima-{distrito}
        urls = [
            # VENTA de departamentos en La Molina (solicitud del usuario)
            f"{self.base_url}/inmuebles/departamentos-en-venta-en-lima-lima-la-molina",
            # Alquiler de departamentos en distritos prioritarios
            f"{self.base_url}/inmuebles/departamentos-en-alquiler-en-lima-lima-magdalena-del-mar",
            f"{self.base_url}/inmuebles/departamentos-en-alquiler-en-lima-lima-pueblo-libre",
            f"{self.base_url}/inmuebles/departamentos-en-alquiler-en-lima-lima-lima",  # Lima Cercado
            f"{self.base_url}/inmuebles/departamentos-en-alquiler-en-lima-lima-jesus-maria",
            f"{self.base_url}/inmuebles/departamentos-en-alquiler-en-lima-lima-lince",
            f"{self.base_url}/inmuebles/departamentos-en-alquiler-en-lima-lima-san-miguel",
            f"{self.base_url}/inmuebles/departamentos-en-alquiler-en-lima-lima-brena",
            # Páginas generales
            f"{self.base_url}/inmuebles/departamentos-en-alquiler",
            f"{self.base_url}/inmuebles/departamentos-en-venta",
        ]
        
        return urls
    
    def extract_properties(self, url: str) -> List[Dict]:
        """Extract properties from a search results page"""
        properties = []
        
        try:
            self.logger.info(f"Loading page: {url}")
            self.driver.get(url)
            
            # Wait for property cards to load
            time.sleep(5)
            
            # Scroll to load more properties
            self.scroll_page()
            
            # Find all property cards (a elements with property info)
            cards = self.driver.find_elements(By.CSS_SELECTOR, "a[href*='/inmueble/']")
            self.logger.info(f"Found {len(cards)} potential property cards")
            
            # Extract up to 20 properties per page
            count = 0
            for card in cards:
                if count >= 20:
                    break
                    
                try:
                    property_data = self._extract_property_from_card(card, url)
                    if property_data and property_data.get('price'):
                        properties.append(property_data)
                        count += 1
                        
                        # Log extracted property
                        title = property_data.get('title', 'N/A')
                        price = property_data.get('price', 0)
                        bedrooms = property_data.get('bedrooms', '')
                        bedrooms_str = f"{bedrooms} dormitorios - " if bedrooms else ""
                        currency_symbol = "$" if property_data.get('currency') == 'USD' else "S/"
                        self.logger.info(f"Extracted: {title} - {bedrooms_str}{currency_symbol}{price}")
                        
                except Exception as e:
                    self.logger.debug(f"Error extracting property from card: {e}")
                    continue
                    
        except Exception as e:
            self.logger.error(f"Error loading page {url}: {e}")
            
        return properties
    
    def _extract_property_from_card(self, card, source_url: str) -> Optional[Dict]:
        """Extract property data from a single card element"""
        try:
            # Get card text for parsing
            card_text = card.text
            
            if not card_text or len(card_text) < 20:
                return None
            
            # Extract URL (prefer listing link)
            property_url = self._select_best_anchor(card, base_url=self.base_url)
            if not property_url or 'babilonia.pe' not in property_url:
                return None
            
            # Generate external ID from URL
            external_id = self._extract_id_from_url(property_url)
            if not external_id:
                return None
            
            # Determine operation type from URL
            operation_type = "venta" if "/venta" in property_url or "venta" in source_url else "alquiler"
            
            # Extract property type from URL
            property_type = "apartment"
            if "/casa" in property_url or "casas" in source_url:
                property_type = "house"
            elif "/terreno" in property_url:
                property_type = "land"
            elif "/local" in property_url or "/comercial" in property_url:
                property_type = "commercial"
            elif "/oficina" in property_url:
                property_type = "office"
            
            # Extract title
            title = ""
            try:
                # Try to get title from card text - usually first line
                lines = card_text.split('\n')
                for line in lines:
                    if len(line) > 10 and '$' not in line and 'S/' not in line and 'dor' not in line:
                        title = line[:200]
                        break
            except:
                pass
            
            # Extract price
            price = 0
            currency = "USD"
            try:
                # Look for price in format "$179,999" or "S/611,999" or "desde S/257,998"
                price_match = re.search(r'(?:desde\s+)?\$\s*([\d,]+)|(?:desde\s+)?S/\s*([\d,]+)', card_text, re.IGNORECASE)
                if price_match:
                    if price_match.group(1):  # USD
                        price_str = price_match.group(1).replace(',', '')
                        price = float(price_str)
                        currency = "USD"
                    elif price_match.group(2):  # PEN
                        price_str = price_match.group(2).replace(',', '')
                        price = float(price_str)
                        currency = "PEN"
            except:
                pass
            
            if price == 0:
                return None
            
            # Extract bedrooms
            bedrooms = None
            try:
                # Format: "2 dor" or "3 dor"
                bed_match = re.search(r'(\d+)\s+dor', card_text)
                if bed_match:
                    bedrooms = int(bed_match.group(1))
            except:
                pass
            
            # Extract bathrooms
            bathrooms = None
            try:
                # Format: "2 bñ" or "3 bñ"
                bath_match = re.search(r'(\d+)\s+bñ', card_text)
                if bath_match:
                    bathrooms = int(bath_match.group(1))
            except:
                pass
            
            # Extract area
            area = None
            try:
                # Format: "80 m²" or "163 m²"
                area_match = re.search(r'(\d+)\s*m²', card_text)
                if area_match:
                    area = float(area_match.group(1))
            except:
                pass
            
            # Extract location/district
            district = None
            try:
                # Format: "Miraflores, Lima" or "San Isidro, Lima"
                # Extract district name before ", Lima"
                location_match = re.search(r'([A-Za-zÁ-ú\s]+),\s*Lima', card_text)
                if location_match:
                    district = location_match.group(1).strip()
            except:
                pass
            
            # Extract image
            image_url = self._select_best_image(card, base_url=self.base_url)
            
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
                'amenities': [],
            }
            
            # Extract contact information from detail page
            if property_data.get('url') or property_data.get('sourceUrl'):
                try:
                    url = property_data.get('url') or property_data.get('sourceUrl')
                    contact_info = self.extract_contact_info(url)
                    property_data.update(contact_info)
                except Exception as e:
                    self.logger.error(f"Error extracting contact info: {e}")
            
            return property_data
            
        except Exception as e:
            self.logger.debug(f"Error extracting property data: {e}")
            return None
    
    def _extract_id_from_url(self, url: str) -> Optional[str]:
        """Extract property ID from URL"""
        try:
            # Babilonia URLs format: /inmueble/123456/departamento-en-venta
            # Extract numeric ID
            id_match = re.search(r'/inmueble/(\d+)/', url)
            if id_match:
                return f"bab-{id_match.group(1)}"
            else:
                # Use hash of URL as fallback
                return f"bab-{abs(hash(url)) % 10000000}"
        except:
            pass
        return None
    
    def scrape(self) -> int:
        """
        Main scraping method
        
        Returns:
            Number of properties scraped
        """
        total_properties = 0
        
        try:
            self.init_driver()
            
            search_urls = self.get_search_urls()
            
            for url in search_urls:
                self.logger.info(f"Scraping: {url}")
                
                properties = self.extract_properties(url)
                
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

if __name__ == "__main__":
    scraper = BabiloniaScraper()
    result = scraper.run()
    print(f"Scraping completed: {result}")
