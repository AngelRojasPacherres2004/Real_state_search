from urbania import UrbaniaScraper
import logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

scraper = UrbaniaScraper()
scraper.connect_db()
scraper.init_driver()

try:
    url = 'https://urbania.pe/buscar/venta-de-departamentos'
    print(f'Loading: {url}')
    scraper.driver.get(url)

    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.common.by import By

    wait = WebDriverWait(scraper.driver, 20)
    wait.until(EC.presence_of_element_located((By.TAG_NAME, 'img')))

    import time
    time.sleep(4)

    cards = scraper.driver.find_elements(By.XPATH, "//div[.//img and (contains(., 'S/') or contains(., 'USD'))]")
    print(f'Found {len(cards)} potential property cards')

    if cards:
        prop = scraper.scrape_property_card(cards[0])
        print('Property extracted:')
        if prop:
            for k, v in prop.items():
                print(f'  {k}: {v}')
        else:
            print('  No property data extracted')

        if prop:
            saved = scraper.save_property(prop)
            print(f'Saved to DB: {saved}')

finally:
    scraper.close_driver()
    scraper.close_db()