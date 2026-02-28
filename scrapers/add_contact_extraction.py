#!/usr/bin/env python3
"""
Script to add contact extraction method to all scrapers
"""
import os
import re

# Contact extraction method to add
CONTACT_EXTRACTION_METHOD = '''
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
                r'(\\+51\\s?)?\\(?9\\d{2}\\)?[\\s-]?\\d{3}[\\s-]?\\d{3}',  # Mobile: +51 9XX XXX XXX
                r'(\\+51\\s?)?\\(?\\d{1}\\)?[\\s-]?\\d{3}[\\s-]?\\d{4}',  # Landline: +51 1 XXX XXXX
                r'\\d{9}',  # Simple 9-digit format
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
            email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', page_source)
            if email_match:
                contact_info['ownerEmail'] = email_match.group(0)
            
            # Extract owner name (look for common patterns)
            name_patterns = [
                r'(?:propietario|dueño|contacto):\\s*([A-Z][a-záéíóúñ]+(?:\\s+[A-Z][a-záéíóúñ]+)*)',
                r'(?:vendedor|agente):\\s*([A-Z][a-záéíóúñ]+(?:\\s+[A-Z][a-záéíóúñ]+)*)',
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
'''

# Code to add before return statement
CONTACT_EXTRACTION_CALL = '''
            # Extract contact information from detail page
            if property_data.get('url') or property_data.get('sourceUrl'):
                try:
                    url = property_data.get('url') or property_data.get('sourceUrl')
                    contact_info = self.extract_contact_info(url)
                    property_data.update(contact_info)
                except Exception as e:
                    self.logger.error(f"Error extracting contact info: {e}")
'''

def add_contact_extraction_to_scraper(scraper_file):
    """Add contact extraction method to a scraper file"""
    print(f"Processing {scraper_file}...")
    
    with open(scraper_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if already has extract_contact_info method
    if 'def extract_contact_info' in content:
        print(f"  ✓ {scraper_file} already has extract_contact_info method")
        return False
    
    # Find the class definition
    class_match = re.search(r'class \w+Scraper\(BaseScraper\):', content)
    if not class_match:
        print(f"  ✗ Could not find class definition in {scraper_file}")
        return False
    
    # Find a good place to insert the method (after __init__ or other methods)
    # Look for the first method definition after __init__
    init_match = re.search(r'def __init__\(self\):.*?(?=\n    def |\nclass |\Z)', content, re.DOTALL)
    if init_match:
        insert_pos = init_match.end()
    else:
        # If no __init__, insert after class definition
        insert_pos = class_match.end()
    
    # Insert the contact extraction method
    new_content = content[:insert_pos] + '\n' + CONTACT_EXTRACTION_METHOD + '\n' + content[insert_pos:]
    
    # Now find where to add the call to extract_contact_info
    # Look for return property_data or similar patterns
    return_patterns = [
        r'(\n\s+)(return property_data)',
        r'(\n\s+)(return \{[^}]+\})',
    ]
    
    modified = False
    for pattern in return_patterns:
        matches = list(re.finditer(pattern, new_content))
        if matches:
            # Add before the last return statement in _extract_property_data or similar
            last_match = matches[-1]
            indent = last_match.group(1)
            
            # Check if contact extraction call already exists nearby
            context = new_content[max(0, last_match.start()-500):last_match.start()]
            if 'extract_contact_info' not in context:
                insertion = indent + CONTACT_EXTRACTION_CALL.strip().replace('\n', '\n' + indent) + '\n' + indent
                new_content = new_content[:last_match.start()] + insertion + new_content[last_match.start():]
                modified = True
                break
    
    if not modified:
        print(f"  ⚠ Could not find suitable place to add contact extraction call in {scraper_file}")
        # Still save the method addition
    
    # Write back
    with open(scraper_file, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"  ✓ Added contact extraction to {scraper_file}")
    return True

def main():
    scrapers_dir = '/home/ubuntu/real_estate_search_ai/scrapers'
    
    # List of scrapers to update (excluding urbania which is already done)
    scrapers = [
        'adondevivir.py',
        'infocasas.py',
        'properati.py',
        'babilonia.py',
        'losportales.py',
        'nexoinmobiliario.py',
        'mitula.py',
        'laencontre.py',
    ]
    
    updated_count = 0
    for scraper in scrapers:
        scraper_path = os.path.join(scrapers_dir, scraper)
        if os.path.exists(scraper_path):
            if add_contact_extraction_to_scraper(scraper_path):
                updated_count += 1
        else:
            print(f"  ✗ {scraper_path} not found")
    
    print(f"\n✓ Updated {updated_count} scrapers with contact extraction")

if __name__ == '__main__':
    main()
