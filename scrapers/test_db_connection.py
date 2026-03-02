"""
Test database connection and property saving
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from base_scraper import BaseScraper

class TestScraper(BaseScraper):
    """Test scraper to verify DB connection"""
    
    def scrape(self):
        """Test scraping with fake data"""
        # Create test property
        test_property = {
            'externalId': 'test-001',
            'title': 'Departamento de Prueba en Miraflores',
            'description': 'Departamento de prueba para verificar conexión a base de datos',
            'operationType': 'venta',
            'propertyType': 'Departamento',
            'price': 150000,
            'currency': 'USD',
            'area': 85.5,
            'bedrooms': 2,
            'bathrooms': 2,
            'district': 'Miraflores',
            'province': 'Lima',
            'department': 'Lima',
            'address': 'Av. Test 123',
            'latitude': -12.1191,
            'longitude': -77.0350,
            'imageUrl': 'https://via.placeholder.com/400x300',
            'sourceUrl': 'https://test.com/property/001',
            'amenities': ['Gimnasio', 'Piscina', 'Estacionamiento']
        }
        
        # Try to save
        if self.save_property(test_property):
            self.logger.info("✅ Test property saved successfully!")
            return 1
        else:
            self.logger.error("❌ Failed to save test property")
            return 0

if __name__ == '__main__':
    print("=" * 60)
    print("TESTING DATABASE CONNECTION")
    print("=" * 60)
    
    scraper = TestScraper('test')
    result = scraper.run()
    
    print("\n" + "=" * 60)
    print("TEST RESULTS")
    print("=" * 60)
    print(f"Success: {result['success']}")
    print(f"Properties saved: {result['properties_scraped']}")
    
    if result['errors']:
        print(f"\nErrors:")
        for error in result['errors']:
            print(f"  - {error}")
    else:
        print("\n✅ Database connection and saving works!")
    
    print("=" * 60)
