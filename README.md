# Vantage - Sales Data Analytics & Insights Platform

Upload Excel sales data to automatically detect sensitive information (phone numbers, IDs, emails, etc.) and provide intelligent data insights across **Region**, **Product**, and **Trend** dimensions.

## Feature Overview

### 🛡️ Data Security & Basic Analytics
- **📤 Excel Upload**: Supports `.xlsx`, `.xls`, `.csv` files with drag-and-drop or click-to-upload functionality
- **🔍 Sensitive Information Detection**: Automatically identifies phone numbers, ID numbers, email addresses, bank card numbers, Chinese names, and provides distribution reports by column
- **📊 Data Overview**: Displays key metrics including total records, data columns, and sensitive information counts

### 📈 Intelligent Sales Analytics
- **🔥 Hot Product Trend Prediction**:
  - Identifies products with viral potential based on sales share and recent sales volume
  - Automatically splits recent/historical data (supports date columns or row order)
  - Displays sales share, total sales, potential score, and other key indicators

- **🎯 Product Region Distribution Analysis**:
  - Analyzes user distribution for each product across different regions
  - Identifies which regions show higher preference for which products
  - Supports product list selection for detailed region distribution charts

- **🏆 Sales Top 3 Products Region Distribution (Dashboard)**:
  - Focuses on the top 3 products by sales volume
  - Stacked Bar Chart: Shows sales comparison of different products within each region
  - Grouped Bar Chart: Shows sales distribution of each product across different regions
  - Supports chart view switching with tooltips displaying data sorted by actual sales

### 📉 Multi-Dimensional Data Visualization
- **🗺️ Region/Source Concentration**: Pie and bar charts — automatically identifies columns containing "region", "province", "city", "source", "area", "State", "City", etc. (supports both Chinese and English)
- **💰 Regional Sales/Amount Summary**: Bar charts
- **🏷️ Category Distribution**: Pie charts
- **📊 Other Dimension Distribution & Trends**: Bar and line charts

## Local Development

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (typically http://localhost:5173 or http://localhost:5174).

## Sample Data Guidelines

For automatic dimension selection, Excel headers should include recognizable column names:

### 🌍 Region-Related Columns
- Chinese: `地区`, `省份`, `城市`, `客户来源`, `区域`, etc.
- English: `State`, `Region`, `Province`, `City`, `Address`, `Location`, `Country`, etc.

### 📦 Product-Related Columns
- Chinese: `产品`, `商品`, `品名`, `SKU`, `名称`, `品类`, `类目`, etc.
- English: `Product`, `Item`, `SKU`, `Name`, `Category`, `Goods`, etc.

### 🔢 Numeric Columns
- `金额`, `数量`, `销售额`, `Sales`, `Amount`, `Quantity`, etc.

### 📅 Date-Related Columns
- `日期`, `时间`, `下单日期`, `Date`, `Time`, `Order Date`, etc.

When these columns are present, the page automatically generates corresponding charts and analytics dashboards.

## Tech Stack

- **⚛️ React 18** + **⚡ Vite 5**: Modern frontend development framework
- **📗 xlsx (SheetJS)**: Excel file parsing
- **📈 Recharts**: Data visualization library
- **🔒 Pure Frontend Processing**: Data never leaves your device, ensuring privacy security

## Key Features

1. **🧠 Intelligent Column Recognition**: Supports automatic Chinese and English column name matching without manual configuration
2. **🔐 Data Security**: All data processing happens locally in the browser with no backend transmission
3. **🎨 Interactive Analytics**: Supports chart switching, product selection, data drilling, and other interactive operations
4. **📱 Responsive Design**: Adapts to different screen sizes for optimal user experience
5. **🔄 Hot Module Replacement**: Code changes trigger automatic refresh without restarting the dev server

## License

MIT
