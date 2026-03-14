#!/usr/bin/env python3
"""
LosPortales.com.pe Web Scraper
Extracts real estate projects from Los Portales Peru
"""

import logging
from typing import Dict, List, Optional
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from base_scraper import BaseScraper
import time
import re

class LosPortalesScraper(BaseScraper):
    """Scraper for LosPortales.com.pe"""
    
    def __init__(self):
        super().__init__(portal_name="losportales")
        self.base_url = "https://www.losportales.com.pe"
        self.driver = None
    

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
            f"{self.base_url}/proyectos",
            f"{self.base_url}/condominios",
            f"{self.base_url}/lotes",
            f"{self.base_url}/casas",
        ]
    
    def extract_properties(self, url: str) -> List[Dict]:
        """Extract properties from a search results page"""
        properties = []
        
        try:
            self.logger.info(f"Loading page: {url}")
            self.driver.get(url)
            
            # Wait for project cards to load
            time.sleep(5)
            
            # Scroll to load more properties
            self.scroll_page()
            
            # Find all project cards (a elements with project info)
            cards = self.driver.find_elements(By.CSS_SELECTOR, "a[href*='/proyecto/'], a[href*='/condominio/'], a[href*='/lote/']")
            self.logger.info(f"Found {len(cards)} potential project cards")
            
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
                        area = property_data.get('area', '')
                        area_str = f"{area}m² - " if area else ""
                        currency_symbol = "$" if property_data.get('currency') == 'USD' else "S/"
                        self.logger.info(f"Extracted: {title} - {area_str}{currency_symbol}{price}")
                        
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
            
            # Extract URL
            property_url = card.get_attribute('href')
            
            if not property_url or 'losportales.com.pe' not in property_url:
                return None
            
            # Generate external ID from URL
            external_id = self._extract_id_from_url(property_url)
            if not external_id:
                return None
            
            # Los Portales mainly sells properties (venta)
            operation_type = "venta"
            
            # Extract property type from URL
            property_type = "land"  # Default for Los Portales
            if "/condominio" in property_url:
                property_type = "apartment"
            elif "/casa" in property_url:
                property_type = "house"
            elif "/lote" in property_url:
                property_type = "land"
            
            # Extract title
            title = ""
            try:
                # Try to get title from card text - usually first line
                lines = card_text.split('\n')
                for line in lines:
                    if len(line) > 10 and 'S/' not in line and 'desde' not in line.lower():
                        title = line[:200]
                        break
            except:
                pass
            
            # Extract price
            price = 0
            currency = "PEN"  # Los Portales mainly uses PEN
            try:
                # Look for price in format "S/ 120,000" or "desde S/ 50,000"
                price_match = re.search(r'(?:desde\s+)?S/\s*([\d,]+)', card_text, re.IGNORECASE)
                if price_match:
                    price_str = price_match.group(1).replace(',', '')
                    price = float(price_str)
                    currency = "PEN"
                else:
                    # Try USD format
                    price_match = re.search(r'(?:desde\s+)?\$\s*([\d,]+)', card_text, re.IGNORECASE)
                    if price_match:
                        price_str = price_match.group(1).replace(',', '')
                        price = float(price_str)
                        currency = "USD"
            except:
                pass
            
            if price == 0:
                return None
            
            # Extract area (for land/lotes)
            area = None
            try:
                # Format: "120 m²" or "desde 80 m²"
                area_match = re.search(r'(?:desde\s+)?(\d+)\s*m²', card_text, re.IGNORECASE)
                if area_match:
                    area = float(area_match.group(1))
            except:
                pass
            
            # Extract location/district
            district = None
            try:
                # Los Portales projects are usually in specific locations
                # Look for common district names in the text
                districts = ['Chilca', 'Huampaní', 'Ica', 'Chincha', 'Cañete', 'Lurín', 'Pachacámac', 'Asia']
                for dist in districts:
                    if dist.lower() in card_text.lower():
                        district = dist
                        break
            except:
                pass
            
            # Extract image
            image_url = None
            try:
                img_element = card.find_element(By.CSS_SELECTOR, "img")
                image_url = img_element.get_attribute('src')
                if image_url and not image_url.startswith('http'):
                    image_url = self.base_url + image_url
            except:
                pass
            
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
                'bedrooms': None,  # Projects don't always have specific bedroom counts
                'bathrooms': None,
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
            # Los Portales URLs format: /proyecto/nombre-del-proyecto or /condominio/nombre
            # Use hash of URL as ID since they don't have numeric IDs
            return f"lp-{abs(hash(url)) % 10000000}"
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
    scraper = LosPortalesScraper()
    result = scraper.run()
    print(f"Scraping completed: {result}")
