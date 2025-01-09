import validator from 'validator'; // Keep validator for URL validation
import chalk from 'chalk'; // Chalk for styling terminal output
import { URL } from 'url'; // Use URL constructor to work with search parameters
import fs from 'fs'; // File system module for saving to .txt file

// Initialize urlCounts globally
let urlCounts = {
  blocked: 0,
  unblocked: 0,
  unblockedUrls: [],
};

const blacklist = ["http://blocked.com", "http://malicious.com", "http://tiktok.com", "http://chatGPT.com"];

// Function to validate if the URL is valid
function isValidUrl(url) {
  return validator.isURL(url);
}

// Function to check if the URL is blacklisted
function isBlacklisted(url) {
  return blacklist.includes(url);
}

// Function to extract search parameters from the URL
function extractSearchParams(url) {
  try {
    const parsedUrl = new URL(url); // Parse the URL
    const params = parsedUrl.searchParams; // Extract query parameters

    // Convert params to an object for better display
    const paramsObj = {};
    params.forEach((value, key) => {
      paramsObj[key] = value;
    });
    return paramsObj;
  } catch (error) {
    return null; // If there's an error parsing the URL, return null
  }
}

function inspectUrl(url) {
  if (!isValidUrl(url)) {
    logOutput("The URL is invalid. Please enter a valid URL.", "color: red;");
    return;
  }

  const searchParams = extractSearchParams(url);

  if (isBlacklisted(url)) {
    urlCounts.blocked++;
    saveUrlToJson(url, "blocked", searchParams);
    logOutput(chalk.bold.red(`The URL is blocked! Block count: ${urlCounts.blocked}`)); // Bold red for blocked URL
    saveBlockedUrlToTxt(url); // Save blocked URL to Blocked.txt file
    return;
  }

  if (searchParams) {
    logOutput("Search Parameters:", "color: green;");
    for (const [key, value] of Object.entries(searchParams)) {
      logOutput(`${key}: ${value}`, "color: blue;");
    }
  }

  urlCounts.unblocked++;
  urlCounts.unblockedUrls.push(url);
  saveUrlToJson(url, "unblocked", searchParams);
  
  // Display in green for unblocked URLs and red for invalid ones
  const statusMessage = `URL is valid and unblocked! Unblock count: ${urlCounts.unblocked}`;
  logOutput(chalk.green(statusMessage)); // Green for valid and unblocked URL
}

function saveUrlToJson(url, status, searchParams) {
  const entry = {
    url,
    status,
    searchParams: searchParams || "None",
    visitedAt: new Date().toISOString(),
  };

  const filePath = "urls.json";
  let urlsData = [];
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    urlsData = JSON.parse(fileContent || "[]");
  }
  urlsData.push(entry);
  fs.writeFileSync(filePath, JSON.stringify(urlsData, null, 2), "utf-8");
  logOutput(`Saved URL: ${url} with status: ${status}`, "color: blue;");
}

function saveBlockedUrlToTxt(url) {
  const filePath = "Blocked.txt";
  const blockedMessage = `Blocked URL: ${url} at ${new Date().toISOString()}\n`;

  fs.appendFileSync(filePath, blockedMessage, "utf-8"); // Append the blocked URL to Blocked.txt
  logOutput(`Blocked URL saved to Blocked.txt: ${url}`, "color: red;");
}

// General function to handle output for both Node and Browser
function logOutput(message, style = "") {
  if (typeof window === "undefined") {
    console.log(message); // Terminal output
  } else {
    const outputDiv = document.getElementById("output");
    if (outputDiv) {
      const paragraph = document.createElement("p");
      paragraph.textContent = message;
      paragraph.style.cssText = style; // Apply inline CSS for browser styling
      outputDiv.appendChild(paragraph);
    } else {
      console.log(message); // Fallback for browser console
    }
  }
}

// Main function for browser compatibility
function main(urls) {
  urls.forEach((url) => inspectUrl(url));

  logOutput(`\nFinal Counts:`);
  logOutput(`Blocked URLs: ${urlCounts.blocked}`, "color: red;");
  logOutput(`Unblocked URLs: ${urlCounts.unblocked}`, "color: green;");
  logOutput(`Unblocked URL List: ${urlCounts.unblockedUrls.join(", ")}`, "color: blue;");
}

// Node.js or browser-specific entry points
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log("Please provide arguments. Usage:");
  console.log("node main.mjs <url1> <url2> ...");
  process.exit(1);
}
main(args);
