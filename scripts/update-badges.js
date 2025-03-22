#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Path to the coverage summary JSON file
const coverageSummaryPath = path.join(__dirname, '../coverage/coverage-summary.json');
// Path to the README file
const readmePath = path.join(__dirname, '../README.md');

// Define badge colors based on coverage thresholds
function getBadgeColor(coverage) {
  if (coverage >= 90) return 'brightgreen';
  if (coverage >= 80) return 'green';
  if (coverage >= 70) return 'yellowgreen';
  if (coverage >= 60) return 'yellow';
  if (coverage >= 50) return 'orange';
  return 'red';
}

// Create a shields.io badge URL for a coverage metric
function createBadgeUrl(label, coverage) {
  const color = getBadgeColor(coverage);
  return `https://img.shields.io/badge/${label}-${coverage}%25-${color}`;
}

try {
  // Read the coverage summary
  const coverageSummary = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf8'));
  
  // Extract coverage metrics
  const metrics = {
    statements: coverageSummary.total.statements.pct,
    branches: coverageSummary.total.branches.pct,
    functions: coverageSummary.total.functions.pct,
    lines: coverageSummary.total.lines.pct
  };
  
  console.log('Coverage metrics extracted:');
  console.log(metrics);
  
  // Generate badge URLs
  const badges = {
    statements: createBadgeUrl('statements', metrics.statements),
    branches: createBadgeUrl('branches', metrics.branches),
    functions: createBadgeUrl('functions', metrics.functions),
    lines: createBadgeUrl('lines', metrics.lines)
  };
  
  // Read the README
  let readme = fs.readFileSync(readmePath, 'utf8');
  
  // Define badge placeholders in README
  const badgePlaceholders = {
    statements: '![Statements](https://img.shields.io/badge/statements-0%25-red)',
    branches: '![Branches](https://img.shields.io/badge/branches-0%25-red)',
    functions: '![Functions](https://img.shields.io/badge/functions-0%25-red)',
    lines: '![Lines](https://img.shields.io/badge/lines-0%25-red)'
  };
  
  // Define updated badge markdown
  const updatedBadges = {
    statements: `![Statements](${badges.statements})`,
    branches: `![Branches](${badges.branches})`,
    functions: `![Functions](${badges.functions})`,
    lines: `![Lines](${badges.lines})`
  };
  
  // Check if badges already exist in README
  let updatedReadme = readme;
  let badgesUpdated = false;
  
  // Try to replace existing badges
  for (const [key, placeholder] of Object.entries(badgePlaceholders)) {
    const badgeRegex = new RegExp(`!\\[${key.charAt(0).toUpperCase() + key.slice(1)}\\]\\(https://img\\.shields\\.io/badge/${key}-[\\d\\.]+%25-[a-z]+\\)`, 'i');
    
    if (badgeRegex.test(updatedReadme)) {
      updatedReadme = updatedReadme.replace(badgeRegex, updatedBadges[key]);
      badgesUpdated = true;
    }
  }
  
  // If no badges were found and updated, add them after the project title
  if (!badgesUpdated) {
    const titleRegex = /^# .+$/m;
    if (titleRegex.test(updatedReadme)) {
      updatedReadme = updatedReadme.replace(titleRegex, (match) => {
        return `${match}\n\n${updatedBadges.statements} ${updatedBadges.branches} ${updatedBadges.functions} ${updatedBadges.lines}`;
      });
    } else {
      // If no title found, add badges at the beginning
      updatedReadme = `${updatedBadges.statements} ${updatedBadges.branches} ${updatedBadges.functions} ${updatedBadges.lines}\n\n${updatedReadme}`;
    }
  }
  
  // Write the updated README
  fs.writeFileSync(readmePath, updatedReadme);
  console.log('README updated with coverage badges.');
  
} catch (error) {
  console.error('Error updating badges:', error.message);
  process.exit(1);
}
