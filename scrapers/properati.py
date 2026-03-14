#!/usr/bin/env python3
"""
Properati.com.pe Web Scraper
Extracts real estate listings from Properati Peru
"""

import logging
from typing import Dict, List, Optional
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from base_scraper import BaseScraper
import time
import re

class ProperatiScraper(BaseScraper):
    """Scraper for Properati.com.pe"""
    
    def __init__(self):
        super().__init__(portal_name="properati")
        self.base_url = "https://www.properati.com.pe"
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
        """Return list of URLs to scrape"""
        return [
            f"{self.base_url}/s/lima/departamento/venta",
            f"{self.base_url}/s/lima/casa/venta",
            f"{self.base_url}/s/lima/departamento/alquiler",
            f"{self.base_url}/s/lima/casa/alquiler",
        ]
    
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
            
            # Find all property cards (article elements)
            cards = self.driver.find_elements(By.CSS_SELECTOR, "article")
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
                        self.logger.info(f"Extracted: {title} - {bedrooms_str}${price}")
                        
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
            if not property_url or 'properati.com.pe' not in property_url:
                return None
            
            # Generate external ID from URL
            external_id = self._extract_id_from_url(property_url)
            if not external_id:
                return None
            
            # Determine operation type from URL
            operation_type = "venta" if "/venta" in property_url or "venta" in source_url else "alquiler"
            
            # Extract property type from URL
            property_type = "apartment"
            if "/casa" in property_url:
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
                title_element = card.find_element(By.CSS_SELECTOR, "a[href*='/detalle/']")
                title = title_element.get_attribute('title') or title_element.text
                title = title.strip()
            except:
                # Try to extract from card text
                lines = card_text.split('\n')
                for line in lines:
                    if len(line) > 10 and 'USD' not in line and 'S/.' not in line:
                        title = line[:200]
                        break
            
            # Extract price
            price = 0
            currency = "USD"
            try:
                # Look for price in format "USD400,000" or "S/.300,000" or "Desde S/.313,000"
                price_match = re.search(r'(?:Desde\s+)?USD\s*([\d,]+)|(?:Desde\s+)?S/\.?\s*([\d,]+)', card_text)
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
                # Format: "3 dormitorios" or "1 - 3 dormitorios"
                bed_match = re.search(r'(\d+)(?:\s*-\s*\d+)?\s+dormitorio', card_text)
                if bed_match:
                    bedrooms = int(bed_match.group(1))
            except:
                pass
            
            # Extract bathrooms
            bathrooms = None
            try:
                # Format: "3 baños" or "2.5 baños"
                bath_match = re.search(r'([\d.]+)\s+baño', card_text)
                if bath_match:
                    bathrooms = int(float(bath_match.group(1)))
            except:
                pass
            
            # Extract area
            area = None
            try:
                # Format: "266 m²" or "Desde 46 m²"
                area_match = re.search(r'(?:Desde\s+)?(\d+)\s*m²', card_text)
                if area_match:
                    area = float(area_match.group(1))
            except:
                pass
            
            # Extract location/district
            district = None
            try:
                # Format: "San Isidro, Lima Centro, Lima, Lima"
                # Extract first part before comma
                location_match = re.search(r'([A-Za-zÁ-ú\s]+),\s*(?:Lima|Lima Centro|Lima Sur|Lima Este|Lima Norte)', card_text)
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
            if property_data.get('sourceUrl'):
                try:
                    contact_info = self.extract_contact_info(property_data['sourceUrl'])
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
            # Properati URLs format: /detalle/123456/apartamento-en-venta-en-san-isidro
            # Extract numeric ID
            id_match = re.search(r'/detalle/(\d+)/', url)
            if id_match:
                return f"prop-{id_match.group(1)}"
            else:
                # Use hash of URL as fallback
                return f"prop-{abs(hash(url)) % 10000000}"
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
    scraper = ProperatiScraper()
    result = scraper.run()
    print(f"Scraping completed: {result}")
