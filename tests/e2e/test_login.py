import os, time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

BASE_URL = os.getenv("APP_BASE_URL", "https://house-book-frontend-web-mocha.vercel.app/")  # adjust to your dev server

def test_login_and_welcome():
    # Selenium 4+ auto-manages drivers in most cases
    driver = webdriver.Chrome()
    try:
        driver.get(f"{https://house-book-frontend-web-mocha.vercel.app/}/login")

        email = driver.find_element(By.NAME, "email")
        password = driver.find_element(By.NAME, "password")

        email.send_keys(os.environ["TEST_EMAIL"])
        password.send_keys(os.environ["TEST_PASSWORD"])
        password.send_keys(Keys.RETURN)

        # Prefer explicit waits in real projects; using sleep for brevity
        time.sleep(3)

        body_text = driver.find_element(By.TAG_NAME, "body").text
        assert "Welcome" in body_text, "Login did not show Welcome text"
    finally:
        driver.quit()
