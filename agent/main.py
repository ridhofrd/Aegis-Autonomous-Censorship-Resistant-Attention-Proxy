import requests
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
from stellar_utils import check_publisher_trust, pay_publisher

def fetch_rss_feed(feed_url):
    """
    Simulates fetching a decentralized RSS feed containing IPFS hashes
    and publisher Stellar addresses.
    """
    # MVP MOCK: In reality, we'd fetch this from IPFS or a gateway
    print(f"[*] Fetching decentralized RSS feed from {feed_url}...")
    
    # Mocking an RSS response for the hackathon
    mock_rss = """
    <rss version="2.0" xmlns:web3="http://aegis.protocol/web3">
        <channel>
            <title>Decentralized Tech News</title>
            <item>
                <title>Soroban Smart Contracts on Mainnet</title>
                <link>ipfs://QmExampleHash12345</link>
                <web3:stellar_address>G_TRUSTED_PUBLISHER_ADDRESS</web3:stellar_address>
            </item>
            <item>
                <title>Fake News Article</title>
                <link>ipfs://QmFakeHash67890</link>
                <web3:stellar_address>G_UNTRUSTED_PUBLISHER_ADDRESS</web3:stellar_address>
            </item>
        </channel>
    </rss>
    """
    return ET.fromstring(mock_rss)

def extract_ipfs_content(ipfs_hash):
    """
    Fetches the raw text content from IPFS.
    """
    print(f"[*] Fetching content from {ipfs_hash}...")
    # MVP MOCK: We simulate fetching the text.
    return "This is the full text of the article about Soroban smart contracts..."

def summarize_with_llm(text):
    """
    Uses LangChain/OpenAI to summarize the article.
    """
    print("[*] Passing text to LLM for summary...")
    # MVP MOCK: To avoid requiring an OpenAI API key to just run the script, 
    # we return a mocked summary. 
    # Real implementation: 
    # llm = ChatOpenAI(temperature=0)
    # return llm.invoke("Summarize this: " + text).content
    return "Summary: Soroban brings powerful smart contracts to the Stellar network, enabling new decentralized applications."

def main():
    print("=== Aegis Protocol AI Agent ===")
    
    feed = fetch_rss_feed("ipfs://QmFeedHash...")
    
    articles = []
    
    for item in feed.findall('./channel/item'):
        title = item.find('title').text
        ipfs_link = item.find('link').text
        # Namespace trick for parsing custom XML tags
        stellar_address = item.find('{http://aegis.protocol/web3}stellar_address').text
        
        print(f"\nEvaluating Article: '{title}'")
        print(f"Publisher: {stellar_address}")
        
        # 1. VERIFICATION: Query the Trust Registry Smart Contract
        is_trusted = check_publisher_trust(stellar_address)
        
        if not is_trusted:
            print("[-] Publisher is NOT trusted (No ZK-Proof or sufficient stake). Skipping article.")
            continue
            
        print("[+] Publisher is highly trusted.")
        
        # 2. PAYMENT: Sign transaction to Attention Vault
        payment_success = pay_publisher(stellar_address, "0.05") # Pay 0.05 USDC
        
        if payment_success:
            print("[+] Payment executed successfully from Attention Vault.")
            
            # 3. DELIVERY: Fetch and Summarize
            content = extract_ipfs_content(ipfs_link)
            summary = summarize_with_llm(content)
            
            articles.append({
                "title": title,
                "summary": summary
            })
        else:
            print("[-] Payment failed (Daily limit exceeded or contract error).")

    print("\n=== YOUR DAILY BRIEFING ===")
    for a in articles:
        print(f"\nTitle: {a['title']}")
        print(f"{a['summary']}")

if __name__ == "__main__":
    main()
