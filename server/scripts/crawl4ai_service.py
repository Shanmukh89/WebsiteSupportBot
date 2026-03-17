import sys
import json
import time
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import trafilatura
from playwright.sync_api import sync_playwright

# Domains that rely heavily on JS rendering (React/Next.js storefronts)
# trafilatura and requests return empty shells for these sites
JS_HEAVY_DOMAINS = [
    'myntra.com',
    'ajio.com',
    'nykaa.com',
    'flipkart.com',
    'amazon.in',
    'meesho.com',
]

def requires_js(url: str) -> bool:
    """Check if a URL belongs to a JS-heavy domain that needs Playwright rendering."""
    domain = urlparse(url).netloc.replace('www.', '')
    return any(d in domain for d in JS_HEAVY_DOMAINS)

def is_poisoned(text):
    if not text:
        return True
    lower_text = text.lower()
    poison_phrases = [
        "verify you are human",
        "robot",
        "checking your browser",
        "please verify you are a human",
        "are you a human"
    ]
    for phrase in poison_phrases:
        if phrase in lower_text:
            return True
            
    # If content length is too short after valid text extraction, treat as blocked/paywalled
    if len(text) < 500:
        return True
        
    return False

def get_product_links(start_url):
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
        }
        resp = requests.get(start_url, headers=headers, timeout=15)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.content, 'html.parser')
        
        domain = urlparse(start_url).netloc
        
        product_links = []
        visited = set()
        
        for a_tag in soup.find_all('a', href=True):
            href = a_tag['href']
            full_url = urljoin(start_url, href)
            parsed_full = urlparse(full_url)
            clean_url = full_url.split('#')[0]
            
            if parsed_full.netloc == domain:
                lower_url = clean_url.lower()
                if any(ext in lower_url for ext in ['.jpg', '.jpeg', '.png', '.pdf', '.css', '.js', '.svg', '.gif']):
                    continue
                # Assuming standard e-commerce routes
                if any(p in lower_url for p in ['/product', '/products', '/item', '/p/', '/collections']):
                    if clean_url not in visited and clean_url != start_url:
                        visited.add(clean_url)
                        product_links.append(clean_url)
                        if len(product_links) >= 30:
                            break
                            
        return product_links
    except Exception as e:
        return []

def scrape_with_playwright(url):
    """Fallback Playwright scraper for non-JS-heavy sites (simple text extraction)."""
    text = ""
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
            )
            page = context.new_page()
            try:
                # Add stealth evasion
                page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
                page.goto(url, wait_until="domcontentloaded", timeout=15000)
                page.wait_for_timeout(2000)
                html = page.content()
                soup = BeautifulSoup(html, 'html.parser')
                text = soup.get_text(separator=' ', strip=True)
            except:
                pass
            finally:
                browser.close()
    except:
        pass
    return text


def scrape_js_heavy_listing(url):
    """
    Scrape JS-rendered listing pages (Myntra, Flipkart, etc.) by:
    1. Launching headless Chromium with stealth settings
    2. Waiting for JS to render the page content
    3. Scrolling to trigger lazy-loaded product cards
    4. Extracting structured product data from DOM selectors
    5. Falling back to full-page text if no product cards found
    Returns list of {url, title, content} dicts matching the existing output format.
    """
    pages = []
    
    try:
        with sync_playwright() as p:
            # Use real Chrome (channel='chrome') — Myntra/Flipkart block bundled Chromium
            # Fall back to bundled Chromium if Chrome isn't installed
            try:
                browser = p.chromium.launch(
                    headless=True,
                    channel='chrome',
                    args=[
                        '--disable-blink-features=AutomationControlled',
                        '--no-sandbox',
                        '--disable-dev-shm-usage',
                    ]
                )
            except Exception:
                print("  Chrome not found, falling back to Chromium", file=sys.stderr)
                browser = p.chromium.launch(
                    headless=True,
                    args=[
                        '--disable-blink-features=AutomationControlled',
                        '--no-sandbox',
                        '--disable-dev-shm-usage',
                    ]
                )
            context = browser.new_context(
                viewport={'width': 1920, 'height': 1080},
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                java_script_enabled=True,
            )
            page = context.new_page()
            
            # Stealth: hide webdriver flag
            page.add_init_script("""
                Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
                window.chrome = { runtime: {} };
            """)
            
            print(f"  Navigating to {url}...", file=sys.stderr)
            
            # Use domcontentloaded (NOT networkidle — SPAs never reach networkidle)
            # Then wait explicitly for JS to render
            try:
                page.goto(url, wait_until='domcontentloaded', timeout=45000)
            except Exception as nav_err:
                # Some SPA pages throw protocol errors on first load, retry with commit
                print(f"  Navigation warning: {nav_err}, retrying...", file=sys.stderr)
                try:
                    page.goto(url, wait_until='commit', timeout=45000)
                except Exception as retry_err:
                    print(f"  Navigation failed: {retry_err}", file=sys.stderr)
                    browser.close()
                    return pages
            
            # Wait for JS framework to render content
            print(f"  Waiting for JS render...", file=sys.stderr)
            page.wait_for_timeout(8000)
            
            # Scroll down multiple times to trigger lazy loading
            print(f"  Scrolling to load products...", file=sys.stderr)
            for i in range(10):
                page.evaluate("window.scrollBy(0, 1000)")
                page.wait_for_timeout(1000)
            
            # Scroll back to top and wait a bit more
            page.evaluate("window.scrollTo(0, 0)")
            page.wait_for_timeout(2000)
            
            # Try to extract structured product cards
            # Try multiple selector patterns for different e-commerce sites
            selectors_to_try = [
                'li.product-base',           # Myntra primary
                '.product-base',             # Myntra alt
                '[data-testid="product-card"]',  # Generic test id
                '._1AtVbE',                  # Flipkart 
                '._4ddWXP',                  # Flipkart alt
                '.product-card',             # Generic
                '.product-item',             # Generic
            ]
            
            product_cards = []
            for selector in selectors_to_try:
                try:
                    cards = page.query_selector_all(selector)
                    if cards and len(cards) > 0:
                        product_cards = cards
                        print(f"  Found {len(cards)} cards with selector: {selector}", file=sys.stderr)
                        break
                except Exception:
                    continue
            
            products_found = []
            for card in product_cards[:30]:  # limit to 30 products
                try:
                    # Try multiple selector patterns for product info
                    name_el = (
                        card.query_selector('.product-product') or
                        card.query_selector('.product-title') or
                        card.query_selector('.IRpwTa') or
                        card.query_selector('.s1Q9rs') or
                        card.query_selector('[data-testid="product-name"]')
                    )
                    brand_el = (
                        card.query_selector('.product-brand') or
                        card.query_selector('._2WkVRV') or
                        card.query_selector('[data-testid="product-brand"]')
                    )
                    price_el = (
                        card.query_selector('.product-discountedPrice') or
                        card.query_selector('.product-price') or
                        card.query_selector('._30jeq3') or
                        card.query_selector('[data-testid="product-price"]')
                    )
                    link_el = card.query_selector('a')
                    
                    name = name_el.inner_text().strip() if name_el else ''
                    brand = brand_el.inner_text().strip() if brand_el else ''
                    price = price_el.inner_text().strip() if price_el else ''
                    
                    # Build full product URL
                    product_url = url
                    if link_el:
                        href = link_el.get_attribute('href')
                        if href:
                            if href.startswith('http'):
                                product_url = href
                            else:
                                parsed = urlparse(url)
                                product_url = f"{parsed.scheme}://{parsed.netloc}{href}"
                    
                    # Only keep cards with actual product data
                    if name or brand:
                        product_title = f"{brand} {name}".strip() if brand else name
                        content = f"Product: {name}\nBrand: {brand}\nPrice: {price}\nURL: {product_url}\nSource: {url}"
                        
                        products_found.append({
                            'url': product_url,
                            'title': product_title,
                            'content': content
                        })
                except Exception:
                    continue
            
            if products_found:
                pages = products_found
                print(f"  Extracted {len(products_found)} products", file=sys.stderr)
            else:
                # Fallback: no product cards found, grab full-page rendered text
                print(f"  No product cards found, using full-page text fallback", file=sys.stderr)
                html = page.content()
                soup = BeautifulSoup(html, 'html.parser')
                
                # Remove script/style tags for cleaner text
                for tag in soup(['script', 'style', 'noscript', 'header', 'footer', 'nav']):
                    tag.decompose()
                
                text = soup.get_text(separator='\n', strip=True)
                # Clean up excessive whitespace
                lines = [line.strip() for line in text.splitlines() if line.strip()]
                text = '\n'.join(lines)
                
                if text and len(text) >= 200:
                    pages.append({
                        'url': url,
                        'title': 'Category Listing',
                        'content': text[:10000]  # Cap at 10k chars
                    })
            
            browser.close()
    except Exception as e:
        print(f"JS-heavy scrape error: {type(e).__name__}: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
    
    return pages

def scrape_page(url):
    # Priority 1: Trafilatura
    try:
        downloaded = trafilatura.fetch_url(url)
        if downloaded:
            text = trafilatura.extract(downloaded)
            if text and len(text) >= 100:
                return text
    except:
        pass
        
    # Priority 2: BeautifulSoup (Requests)
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
        }
        resp = requests.get(url, headers=headers, timeout=10)
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.content, 'html.parser')
            text = soup.get_text(separator=' ', strip=True)
            if text and len(text) >= 100:
                return text
    except:
        pass
        
    # Priority 3: Playwright (Sync)
    return scrape_with_playwright(url)

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No URL provided"}))
        sys.exit(1)
        
    start_url = sys.argv[1]
    
    # Force stdout to be utf-8 to avoid Windows encoding issues with emojis
    sys.stdout.reconfigure(encoding='utf-8')
    
    # ── JS-heavy site path: use dedicated Playwright product card scraper ──
    if requires_js(start_url):
        print(f"JS-heavy site detected, using Playwright for {start_url}", file=sys.stderr)
        scraped_pages = scrape_js_heavy_listing(start_url)
        
        if not scraped_pages:
            print(f"WARNING: No content scraped from JS-heavy site {start_url}", file=sys.stderr)
        
        print(json.dumps({"pages": scraped_pages, "count": len(scraped_pages)}))
        return
    
    # ── Standard site path: trafilatura/BS4/Playwright cascade ──
    product_links = get_product_links(start_url)
    
    if not product_links:
        product_links = [start_url]
        
    scraped_pages = []
    
    for url in product_links:
        time.sleep(1) # sequential scrape with delay
        
        content = scrape_page(url)
        
        # Poison pill detection
        if is_poisoned(content):
            # Skip this URL, do not retry
            continue
            
        if content and len(content) >= 500:
            title = urlparse(url).path.split('/')[-1] or "Product Page"
            title = title.replace('-', ' ').title()
            
            scraped_pages.append({
                "url": url,
                "title": title,
                "content": content
            })
            
    # Always include the original category/start page if we found products
    # This helps context on overall category descriptions
    if start_url not in [p['url'] for p in scraped_pages]:
        time.sleep(1)
        start_content = scrape_page(start_url)
        if not is_poisoned(start_content):
            scraped_pages.append({
                "url": start_url,
                "title": "Category Listing",
                "content": start_content
            })
            
    print(json.dumps({"pages": scraped_pages, "count": len(scraped_pages)}))

if __name__ == "__main__":
    main()
