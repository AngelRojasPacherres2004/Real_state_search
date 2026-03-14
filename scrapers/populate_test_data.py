#!/usr/bin/env python3
"""
Populate database with test/sample properties for demonstration
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from base_scraper import BaseScraper
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


def populate_sample_properties():
    """Insert sample properties into the database"""
    
    sample_properties = [
        {
            'externalId': 'sample-001',
            'portal': 'sample',
            'title': 'Departamento en Lima - 2 dormitorios',
            'description': 'Hermoso departamento en San Isidro, completamente amueblado con vista al mar.',
            'operationType': 'venta',
            'propertyType': 'departamento',
            'price': '450000',
            'currency': 'USD',
            'area': '120',
            'bedrooms': 2,
            'bathrooms': 2,
            'district': 'San Isidro',
            'province': 'Lima',
            'department': 'Lima',
            'address': 'Av. Petit Thouars 4200',
            'latitude': '-12.0960',
            'longitude': '-77.0368',
            'imageUrl': 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500',
            'sourceUrl': 'https://example.com/property-1',
            'amenities': 'Gimnasio, Piscina, Seguridad 24h',
        },
        {
            'externalId': 'sample-002',
            'portal': 'sample',
            'title': 'Casa en Surco - 3 dormitorios',
            'description': 'Casa moderna en Surco con amplio jardín y piscina privada.',
            'operationType': 'venta',
            'propertyType': 'casa',
            'price': '750000',
            'currency': 'USD',
            'area': '280',
            'bedrooms': 3,
            'bathrooms': 3,
            'district': 'Surco',
            'province': 'Lima',
            'department': 'Lima',
            'address': 'Calle Los Espejos 456',
            'latitude': '-12.1100',
            'longitude': '-76.9800',
            'imageUrl': 'https://images.unsplash.com/photo-1570129477492-45a003537e1f?w=500',
            'sourceUrl': 'https://example.com/property-2',
            'amenities': 'Piscina, Terraza, Estacionamiento',
        },
        {
            'externalId': 'sample-003',
            'portal': 'sample',
            'title': 'Departamento en Miraflores - 2 dormitorios',
            'description': 'Departamento acogedor con vista al acantilado de Miraflores.',
            'operationType': 'alquiler',
            'propertyType': 'departamento',
            'price': '1500',
            'currency': 'USD',
            'area': '95',
            'bedrooms': 2,
            'bathrooms': 1,
            'district': 'Miraflores',
            'province': 'Lima',
            'department': 'Lima',
            'address': 'Av. Larco 850',
            'latitude': '-12.1206',
            'longitude': '-77.0272',
            'imageUrl': 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500',
            'sourceUrl': 'https://example.com/property-3',
            'amenities': 'Ascensor, Seguridad 24h',
        },
        {
            'externalId': 'sample-004',
            'portal': 'sample',
            'title': 'Casa en La Molina - 4 dormitorios',
            'description': 'Casa grande y espaciosa ideal para familia, lote de 800m2.',
            'operationType': 'venta',
            'propertyType': 'casa',
            'price': '950000',
            'currency': 'USD',
            'area': '450',
            'bedrooms': 4,
            'bathrooms': 3,
            'district': 'La Molina',
            'province': 'Lima',
            'department': 'Lima',
            'address': 'Calle 4 La Molina 1200',
            'latitude': '-12.0700',
            'longitude': '-76.9400',
            'imageUrl': 'https://images.unsplash.com/photo-1570129477492-45a003537e1f?w=500',
            'sourceUrl': 'https://example.com/property-4',
            'amenities': 'Piscina, Jardín, Parrilla, Estacionamiento',
        },
        {
            'externalId': 'sample-005',
            'portal': 'sample',
            'title': 'Departamento en San Borja - 1 dormitorio',
            'description': 'Departamento tipo estudio perfecto para jóvenes profesionales.',
            'operationType': 'alquiler',
            'propertyType': 'departamento',
            'price': '900',
            'currency': 'USD',
            'area': '50',
            'bedrooms': 1,
            'bathrooms': 1,
            'district': 'San Borja',
            'province': 'Lima',
            'department': 'Lima',
            'address': 'Av. San Borja Sur 1500',
            'latitude': '-12.0850',
            'longitude': '-76.9600',
            'imageUrl': 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500',
            'sourceUrl': 'https://example.com/property-5',
            'amenities': 'Ascensor, Gimnasio',
        },
        {
            'externalId': 'sample-006',
            'portal': 'sample',
            'title': 'Nuevo departamento en Pueblo Libre',
            'description': 'Departamento nuevecito en zona residencial de Pueblo Libre.',
            'operationType': 'venta',
            'propertyType': 'departamento',
            'price': '380000',
            'currency': 'USD',
            'area': '100',
            'bedrooms': 2,
            'bathrooms': 2,
            'district': 'Pueblo Libre',
            'province': 'Lima',
            'department': 'Lima',
            'address': 'Av. Bolívar 3456',
            'latitude': '-12.0900',
            'longitude': '-77.0500',
            'imageUrl': 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500',
            'sourceUrl': 'https://example.com/property-6',
            'amenities': 'Ascensor, Piscina, Seguridad 24h',
        },
    ]
    
    scraper = BaseScraper('sample')
    
    try:
        if not scraper.connect_db():
            logger.error("Failed to connect to database")
            return False
        
        logger.info(f"{'=' * 60}")
        logger.info("Inserting {0} sample properties...".format(len(sample_properties)))
        logger.info(f"{'=' * 60}")
        
        inserted = 0
        for prop in sample_properties:
            if scraper.save_property(prop):
                inserted += 1
                logger.info(f"✓ Inserted: {prop['title']}")
            else:
                logger.warning(f"✗ Failed to insert: {prop['title']}")
        
        logger.info(f"{'=' * 60}")
        logger.info(f"Successfully inserted {inserted}/{len(sample_properties)} properties")
        logger.info(f"{'=' * 60}")
        
        # Verify
        import mysql.connector
        from config import DB_CONFIG
        
        db_conn = mysql.connector.connect(**DB_CONFIG)
        cursor = db_conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM properties")
        total = cursor.fetchone()[0]
        logger.info(f"\nTotal properties in database: {total}")
        
        cursor.execute("SELECT COUNT(*) FROM properties WHERE portal = 'sample'")
        sample = cursor.fetchone()[0]
        logger.info(f"Sample properties: {sample}")
        
        cursor.close()
        db_conn.close()
        
        return True
        
    except Exception as e:
        logger.error(f"Error populating sample data: {e}", exc_info=True)
        return False
    finally:
        scraper.close_db()


if __name__ == '__main__':
    success = populate_sample_properties()
    sys.exit(0 if success else 1)
