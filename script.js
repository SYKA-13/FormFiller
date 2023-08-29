const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/submit', async (req, res) => {
    const url = req.body.url;
    const formData = req.body.formData;

    if (!url) return res.status(400).send({ message: 'URL is required' });

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto(url);

    // Click on the 'apply' button
    await page.evaluate(() => {
        let elements = Array.from(document.querySelectorAll('a, button, input[type="submit"], input[type="button"]'));
        let applyButton = elements.find(element => ['apply', 'submit', 'send', 'go'].some(verb => element.textContent.toLowerCase().includes(verb)));
        if (applyButton) applyButton.click();
    });

    // Delay to ensure page navigation after click
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Fill in the form fields
    await page.evaluate((inputs) => {
        for (let key in inputs) {
            let element = document.querySelector(`input[name="${key}"], textarea[name="${key}"], select[name="${key}"]`);
            if (element) {
                if (element.tagName === 'SELECT') {
                    // Handle select element
                    for (let option of Array.from(element.options)) {
                        if (option.text === inputs[key]) {
                            option.selected = true;
                        }
                    }
                } else if (element.type === 'checkbox' || element.type === 'radio') {
                    // Handle checkbox and radio button
                    element.checked = inputs[key].toLowerCase() === 'true';
                } else {
                    // Handle text fields
                    element.value = inputs[key];
                }
            }
        }
    }, formData);

    res.send({ message: 'Form filled successfully!' });
});

app.listen(3000, () => console.log('Server is running on port 3000'));
