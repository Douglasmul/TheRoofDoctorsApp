#!/usr/bin/env node

/**
 * Company Branding Demo Script
 * Demonstrates the functionality of the newly implemented CompanyBrandingService
 */

const { CompanyBrandingService } = require('./src/services/CompanyBrandingService');

async function demonstrateCompanyBranding() {
  console.log('🏢 Company Branding Service Demo\n');
  
  // Get the service instance
  const service = CompanyBrandingService.getInstance();
  
  // Initialize the service
  await service.initialize();
  
  console.log('1. Default Company Info:');
  let companyInfo = service.getCompanyInfo();
  console.log(`   Name: ${companyInfo.name}`);
  console.log(`   Logo: ${companyInfo.logoUri || 'No custom logo'}`);
  console.log(`   Custom Branding: ${companyInfo.hasCustomBranding ? 'Yes' : 'No'}`);
  console.log(`   Copyright: ${companyInfo.copyright}\n`);
  
  console.log('2. Setting Custom Company Name...');
  await service.updateCompanyName('Acme Roofing Solutions');
  companyInfo = service.getCompanyInfo();
  console.log(`   Name: ${companyInfo.name}`);
  console.log(`   Custom Branding: ${companyInfo.hasCustomBranding ? 'Yes' : 'No'}`);
  console.log(`   Copyright: ${companyInfo.copyright}\n`);
  
  console.log('3. Setting Custom Logo...');
  await service.updateCompanyLogo('file://path/to/custom-logo.png');
  companyInfo = service.getCompanyInfo();
  console.log(`   Name: ${companyInfo.name}`);
  console.log(`   Logo: ${companyInfo.logoUri}`);
  console.log(`   Custom Branding: ${companyInfo.hasCustomBranding ? 'Yes' : 'No'}\n`);
  
  console.log('4. Clearing All Branding...');
  await service.clearBranding();
  companyInfo = service.getCompanyInfo();
  console.log(`   Name: ${companyInfo.name}`);
  console.log(`   Logo: ${companyInfo.logoUri || 'No custom logo'}`);
  console.log(`   Custom Branding: ${companyInfo.hasCustomBranding ? 'Yes' : 'No'}`);
  console.log(`   Copyright: ${companyInfo.copyright}\n`);
  
  console.log('✅ Demo completed successfully!');
  console.log('\n📱 In the React Native app:');
  console.log('• Use useCompanyBranding() hook to access this functionality');
  console.log('• HomeScreen shows custom logo and branding indicator');
  console.log('• SettingsScreen provides full branding customization UI');
}

// Only run if called directly
if (require.main === module) {
  demonstrateCompanyBranding().catch(console.error);
}

module.exports = { demonstrateCompanyBranding };