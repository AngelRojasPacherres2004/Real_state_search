#!/usr/bin/env python3
"""
Import properties from Octoparse CSV export to database
"""
import csv
import mysql.connector
from config import DB_CONFIG
import logging
import sys
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def import_csv_to_db(csv_file_path, portal_name):
    """
    Import properties from Octoparse CSV export to database
    
    Args:
        csv_file_path: Path to CSV file exported from Octoparse
        portal_name: Name of the portal (urbania, adondevivir, etc.)
    
    Returns:
        Number of properties imported
    """
    if not os.path.exists(csv_file_path):
        logger.error(f"CSV file not found: {csv_file_path}")
        return 0
    
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    imported = 0
    errors = 0
    
    logger.info(f"Importing from {csv_file_path} for portal: {portal_name}")
    
    with open(csv_file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for idx, row in enumerate(reader, 1):
            try:
                # Generate external ID
                external_id = row.get('ID') or row.get('PropertyID') or str(hash(row.get('URL', '')))
                external_id = f"oct-{portal_name}-{external_id}"
                
                # Parse price
                price_str = row.get('Price', '0').replace(',', '').replace('$', '').replace('S/', '').strip()
                try:
                    price = float(price_str)
                except ValueError:
                    price = 0
                
                # Determine operation type from URL or column
                url = row.get('URL', '')
                operation_type = 'venta' if 'venta' in url.lower() else 'alquiler'
                if 'OperationType' in row:
                    operation_type = row['OperationType'].lower()
                
                # Determine property type from URL or column
                property_type = 'departamento'
                if 'casa' in url.lower():
                    property_type = 'casa'
                elif 'oficina' in url.lower():
                    property_type = 'oficina'
                if 'PropertyType' in row:
                    property_type = row['PropertyType'].lower()
                
                # Parse area
                area = None
                if row.get('Area'):
                    try:
                        area = float(row.get('Area', '0').replace(',', '').strip())
                    except ValueError:
                        pass
                
                # Parse bedrooms
                bedrooms = None
                if row.get('Bedrooms'):
                    try:
                        bedrooms = int(row.get('Bedrooms', '0'))
                    except ValueError:
                        pass
                
                # Parse bathrooms
                bathrooms = None
                if row.get('Bathrooms'):
                    try:
                        bathrooms = int(row.get('Bathrooms', '0'))
                    except ValueError:
                        pass
                
                property_data = {
                    'externalId': external_id,
                    'portal': portal_name,
                    'title': row.get('Title', 'Propiedad sin título'),
                    'operationType': operation_type,
                    'propertyType': property_type,
                    'price': price,
                    'currency': 'USD',
                    'area': area,
                    'bedrooms': bedrooms,
                    'bathrooms': bathrooms,
                    'district': row.get('District') or row.get('Location'),
                    'address': row.get('Address'),
                    'sourceUrl': url,
                    'imageUrl': row.get('Image') or row.get('ImageURL'),
                    'description': row.get('Description'),
                }
                
                # Insert or update
                sql = """
                INSERT INTO properties 
                (externalId, portal, title, operationType, propertyType, price, currency, 
                 area, bedrooms, bathrooms, district, address, sourceUrl, imageUrl, description, scrapedAt)
                VALUES (%(externalId)s, %(portal)s, %(title)s, %(operationType)s, %(propertyType)s, 
                        %(price)s, %(currency)s, %(area)s, %(bedrooms)s, %(bathrooms)s, 
                        %(district)s, %(address)s, %(sourceUrl)s, %(imageUrl)s, %(description)s, NOW())
                ON DUPLICATE KEY UPDATE
                    title = VALUES(title),
                    price = VALUES(price),
                    area = VALUES(area),
                    bedrooms = VALUES(bedrooms),
                    bathrooms = VALUES(bathrooms),
                    district = VALUES(district),
                    address = VALUES(address),
                    imageUrl = VALUES(imageUrl),
                    description = VALUES(description),
                    scrapedAt = NOW()
                """
                
                cursor.execute(sql, property_data)
                imported += 1
                
                if imported % 10 == 0:
                    logger.info(f"Imported {imported} properties...")
                
            except Exception as e:
                logger.error(f"Error importing row {idx}: {e}")
                errors += 1
                continue
    
    conn.commit()
    cursor.close()
    conn.close()
    
    logger.info(f"✅ Import complete: {imported} properties imported, {errors} errors")
    return imported

def main():
    if len(sys.argv) < 3:
        print("Usage: python import_from_octoparse.py <csv_file> <portal_name>")
        print("\nExample:")
        print("  python import_from_octoparse.py /path/to/urbania_export.csv urbania")
        print("\nSupported portals:")
        print("  urbania, adondevivir, infocasas, properati, babilonia, etc.")
        sys.exit(1)
    
    csv_file = sys.argv[1]
    portal = sys.argv[2]
    
    try:
        count = import_csv_to_db(csv_file, portal)
        sys.exit(0 if count > 0 else 1)
    except Exception as e:
        logger.error(f"Import failed: {e}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    main()
