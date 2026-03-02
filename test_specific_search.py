#!/usr/bin/env python3
"""
Test script for specific search: Casa en venta en Pueblo Libre y Surco, USD$ 300,000 - USD$ 1,300,000
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scrapers.urbania import UrbaniaScraper
import time

def test_specific_search():
    """Test scraping with specific search criteria"""
    print("=" * 80)
    print("PRUEBA DE BÚSQUEDA ESPECÍFICA")
    print("Criterios: Casa en venta en Pueblo Libre y Surco")
    print("Precio: USD$ 300,000 - USD$ 1,300,000")
    print("=" * 80)
    print()
    
    scraper = UrbaniaScraper()
    
    try:
        # Run the scraper
        print("Iniciando scraper de Urbania...")
        scraper.run()
        
        # Wait a bit for data to be saved
        time.sleep(2)
        
        # Query the database for results
        import mysql.connector
        from dotenv import load_dotenv
        load_dotenv()
        
        db_url = os.getenv('DATABASE_URL')
        # Parse DATABASE_URL: mysql://user:pass@host:port/dbname
        import re
        match = re.match(r'mysql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)', db_url)
        if match:
            user, password, host, port, database = match.groups()
            
            conn = mysql.connector.connect(
                host=host,
                port=int(port),
                user=user,
                password=password,
                database=database
            )
            cursor = conn.cursor(dictionary=True)
            
            # Query for houses in Pueblo Libre and Surco with price range
            query = """
                SELECT 
                    title,
                    propertyType,
                    district,
                    price,
                    currency,
                    bedrooms,
                    bathrooms,
                    area,
                    ownerPhone,
                    ownerWhatsapp,
                    ownerEmail,
                    sourceUrl
                FROM properties
                WHERE 
                    source = 'Urbania'
                    AND operationType = 'venta'
                    AND propertyType LIKE '%casa%'
                    AND (district LIKE '%Pueblo Libre%' OR district LIKE '%Surco%')
                    AND currency = 'USD'
                    AND price BETWEEN 300000 AND 1300000
                ORDER BY createdAt DESC
                LIMIT 20
            """
            
            cursor.execute(query)
            results = cursor.fetchall()
            
            print(f"\n{'=' * 80}")
            print(f"RESULTADOS ENCONTRADOS: {len(results)} propiedades")
            print(f"{'=' * 80}\n")
            
            for i, prop in enumerate(results, 1):
                print(f"{i}. {prop['title']}")
                print(f"   Tipo: {prop['propertyType']}")
                print(f"   Distrito: {prop['district']}")
                print(f"   Precio: {prop['currency']} ${prop['price']:,.0f}")
                print(f"   Área: {prop['area']} m²")
                print(f"   Dormitorios: {prop['bedrooms']}, Baños: {prop['bathrooms']}")
                if prop['ownerWhatsapp']:
                    print(f"   📱 WhatsApp: {prop['ownerWhatsapp']}")
                if prop['ownerPhone']:
                    print(f"   📞 Teléfono: {prop['ownerPhone']}")
                if prop['ownerEmail']:
                    print(f"   📧 Email: {prop['ownerEmail']}")
                print(f"   🔗 URL: {prop['sourceUrl']}")
                print()
            
            cursor.close()
            conn.close()
            
            if len(results) > 0:
                print(f"✅ Prueba exitosa: Se encontraron {len(results)} casas en Pueblo Libre/Surco en el rango de precio especificado")
            else:
                print("⚠️  No se encontraron propiedades que coincidan con los criterios")
                print("   Esto puede deberse a que:")
                print("   - El scraper aún no ha extraído propiedades de esos distritos")
                print("   - No hay casas disponibles en ese rango de precio")
                print("   - Los filtros del scraper necesitan ajuste")
        
    except Exception as e:
        print(f"❌ Error durante la prueba: {e}")
        import traceback
        traceback.print_exc()
    finally:
        scraper.close_driver()

if __name__ == '__main__':
    test_specific_search()
