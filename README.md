# ITPM_Assignment1
Option 2: Thanglish to Tamil Converter

## 1. Project Overview
This project is created for ITPM Assignment 1 to demonstrate automated testing using Playwright.
The system under test is a Thanglish to Tamil converter website.

The automation reads test cases directly from an Excel file, executes them on the real website,
compares actual and expected results, and reports pass or fail outcomes.

## 2. Website Under Test
https://tamil.changathi.com/

This website converts Tamil words written in English letters (Thanglish) into Tamil Unicode text.
Conversion happens word by word when the SPACE key is pressed.

## 3. Tools and Technologies Used
- Playwright
- JavaScript
- Node.js
- Excel
- VS Code

## 4. Test Case Design
Test cases are written in an Excel file named:

Assignment1_TestCases.xlsx

The Excel file contains:
- Positive test cases (valid inputs)
- Negative test cases (invalid or unsupported inputs)
- UI test case (real-time conversion behavior)

Minimum required test cases:
- Positive test cases: 24
- Negative test cases: 10
- UI test cases: At least 1

## 5. Project Structure
ITPM_Assignment1_Playwright/
│
├── data/
│   └── Assignment1_TestCases.xlsx
│
├── tests/
│   └── translator.spec.js
│
├── playwright.config.js
├── package.json
├── package-lock.json
├── README.md
└── git_repository_link.txt

## 6. How Automation Works
1. Playwright starts execution.
2. The Excel file is read and test cases are loaded.
3. For each test case:
   - The website is opened.
   - Input is typed character by character (human-like typing).
   - SPACE key is pressed after each word to trigger conversion.
   - The output is read from the same text area.
   - Actual output is compared with expected output.
4. Each test case is marked as PASS or FAIL.
5. A summary is shown in the terminal and in the HTML report.

## 7. Installation Instructions

Prerequisites:
- Node.js (LTS version)
- VS Code

Install dependencies:
npm install
npx playwright install

## 8. How to Run Tests
Run the following command:
npm test

To view the HTML report:
npx playwright show-report

## 9. Test Results Explanation
- Positive test cases pass when expected Tamil text appears in the output.
- Negative test cases pass when invalid inputs are not converted.
- Some positive test cases may fail due to known website limitations such as:
  - Partial conversion
  - Punctuation handling issues
  - Inconsistent spelling

These failures represent identified system issues, not automation errors.

## 10. Known Limitations
- Conversion is not consistent for all words.
- Some inputs require multiple SPACE presses.
- Punctuation and mixed-language sentences may result in partial conversion.

## 11. Git Repository
The complete Playwright project is uploaded to a public GitHub repository.
The repository link is provided in the file:
git_repository_link.txt

## 12. Conclusion
This project demonstrates Excel-driven test automation using Playwright,
covering positive, negative, and UI test scenarios, and identifying real system limitations.
