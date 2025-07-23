import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Helper function to get initial state from local storage
const getInitialState = (key, defaultValue) => {
  const storedValue = localStorage.getItem(key);
  if (storedValue) {
    try {
      return JSON.parse(storedValue);
    } catch (error) {
      console.error(`Error parsing JSON from localStorage for key "${key}":`, error);
      return defaultValue;
    }
  }
  return defaultValue;
};


// Main App Component
const App = () => {
  // State for Company Details
  const [company, setCompany] = useState(() => getInitialState('company', {
    name: 'Your Company Name',
    address: '123 Business Rd, City, Postcode',
    email: 'info@yourcompany.com',
    phone: '+123 456 7890',
    logoUrl: 'https://placehold.co/150x50/E0E7FF/4338CA?text=Your+Logo', // Placeholder logo
  }));

  // State for Client Details
  const [client, setClient] = useState(() => getInitialState('client', {
    name: 'Client Name',
    address: 'Client Address, City, Postcode',
    email: 'client@example.com',
  }));

  // State for Invoice Details
  const [invoiceDetails, setInvoiceDetails] = useState(() => getInitialState('invoiceDetails', {
    invoiceNumber: 'INV-001',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
  }));

  // State for Service Items
  const [serviceItems, setServiceItems] = useState(() => getInitialState('serviceItems', [
    { id: 1, description: 'Website Design', quantity: 1, unitPrice: 1200.00 },
    { id: 2, description: 'Monthly Hosting', quantity: 1, unitPrice: 50.00 },
  ]));

  // State for Tax Rate and whether tax is applicable
  const [taxRate, setTaxRate] = useState(() => getInitialState('taxRate', 0.20)); // 20% tax
  const [isTaxApplicable, setIsTaxApplicable] = useState(() => getInitialState('isTaxApplicable', true)); // New state for tax applicability

  // State for Bank Details
  const [bankDetails, setBankDetails] = useState(() => getInitialState('bankDetails', {
    bankName: 'Your Bank Name',
    accountName: 'Your Account Name',
    accountNumber: '12345678',
    sortCode: '12-34-56',
  }));

  // Save state to local storage on change
  useEffect(() => {
    localStorage.setItem('company', JSON.stringify(company));
  }, [company]);

  useEffect(() => {
    localStorage.setItem('client', JSON.stringify(client));
  }, [client]);

  useEffect(() => {
    localStorage.setItem('invoiceDetails', JSON.stringify(invoiceDetails));
  }, [invoiceDetails]);

  useEffect(() => {
    localStorage.setItem('serviceItems', JSON.stringify(serviceItems));
  }, [serviceItems]);

  useEffect(() => {
    localStorage.setItem('taxRate', JSON.stringify(taxRate));
  }, [taxRate]);

  useEffect(() => {
    localStorage.setItem('isTaxApplicable', JSON.stringify(isTaxApplicable));
  }, [isTaxApplicable]);

  useEffect(() => {
    localStorage.setItem('bankDetails', JSON.stringify(bankDetails));
  }, [bankDetails]);


  // Calculate Subtotal
  const subtotal = serviceItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  // Calculate Tax Amount based on isTaxApplicable
  const taxAmount = isTaxApplicable ? subtotal * taxRate : 0;

  // Calculate Total Amount
  const total = subtotal + taxAmount;

  // Function to add a new service item
  const addServiceItem = () => {
    setServiceItems([...serviceItems, { id: serviceItems.length + 1, description: '', quantity: 1, unitPrice: 0.00 }]);
  };

  // Function to update a service item
  const updateServiceItem = (id, field, value) => {
    setServiceItems(serviceItems.map(item =>
      item.id === id ? { ...item, [field]: field === 'description' ? value : parseFloat(value) || 0 } : item
    ));
  };

  // Function to remove a service item
  const removeServiceItem = (id) => {
    setServiceItems(serviceItems.filter(item => item.id !== id));
  };

  // Function to generate PDF
  const generatePdf = async () => {
    const input = document.getElementById('invoice-preview-section');
    if (!input) {
      console.error('Invoice preview section not found.');
      return;
    }

    // Add a temporary loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50';
    loadingIndicator.innerHTML = `
      <div class="bg-white p-6 rounded-lg shadow-xl text-center flex items-center">
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-lg font-semibold text-gray-800">Generating PDF...</span>
      </div>
    `;
    document.body.appendChild(loadingIndicator);

    try {
      const canvas = await html2canvas(input, { scale: 2 }); // Scale for better resolution
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4'); // 'p' for portrait, 'mm' for millimeters, 'a4' size
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`invoice-${invoiceDetails.invoiceNumber}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Display a user-friendly error message
      const errorBox = document.createElement('div');
      errorBox.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center';
      errorBox.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow-xl text-center">
          <p class="text-lg font-semibold mb-4">Failed to generate PDF.</p>
          <p class="text-sm text-gray-600">An error occurred while creating the PDF. Please try again.</p>
          <button class="mt-4 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md" onclick="this.parentNode.parentNode.remove()">Close</button>
        </div>
      `;
      document.body.appendChild(errorBox);
    } finally {
      // Remove loading indicator
      loadingIndicator.remove();
    }
  };


  // Input field styling
  const inputStyle = "p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full";
  const labelStyle = "block text-sm font-medium text-gray-700 mb-1";
  const sectionTitleStyle = "text-xl font-semibold text-indigo-700 mb-4 border-b pb-2";

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans antialiased flex flex-col items-center">
      <div className="w-full max-w-5xl bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-3xl font-bold text-center text-indigo-800 mb-8">Invoice Generator</h1>

        {/* Company Details Section */}
        <div className="mb-8 p-6 bg-indigo-50 rounded-lg shadow-sm">
          <h2 className={sectionTitleStyle}>Your Company Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelStyle}>Company Name</label>
              <input
                type="text"
                className={inputStyle}
                value={company.name}
                onChange={(e) => setCompany({ ...company, name: e.target.value })}
              />
            </div>
            <div>
              <label className={labelStyle}>Logo URL (Optional)</label>
              <input
                type="text"
                className={inputStyle}
                value={company.logoUrl}
                onChange={(e) => setCompany({ ...company, logoUrl: e.target.value })}
                placeholder="e.g., https://yourcompany.com/logo.png"
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelStyle}>Address</label>
              <textarea
                className={`${inputStyle} h-20`}
                value={company.address}
                onChange={(e) => setCompany({ ...company, address: e.target.value })}
              ></textarea>
            </div>
            <div>
              <label className={labelStyle}>Email</label>
              <input
                type="email"
                className={inputStyle}
                value={company.email}
                onChange={(e) => setCompany({ ...company, email: e.target.value })}
              />
            </div>
            <div>
              <label className={labelStyle}>Phone</label>
              <input
                type="tel"
                className={inputStyle}
                value={company.phone}
                onChange={(e) => setCompany({ ...company, phone: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Bank Details Section */}
        <div className="mb-8 p-6 bg-yellow-50 rounded-lg shadow-sm">
          <h2 className={sectionTitleStyle}>Your Bank Details (for Payee)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelStyle}>Bank Name</label>
              <input
                type="text"
                className={inputStyle}
                value={bankDetails.bankName}
                onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
              />
            </div>
            <div>
              <label className={labelStyle}>Account Name</label>
              <input
                type="text"
                className={inputStyle}
                value={bankDetails.accountName}
                onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
              />
            </div>
            <div>
              <label className={labelStyle}>Account Number</label>
              <input
                type="text"
                className={inputStyle}
                value={bankDetails.accountNumber}
                onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
              />
            </div>
            <div>
              <label className={labelStyle}>Sort Code</label>
              <input
                type="text"
                className={inputStyle}
                value={bankDetails.sortCode}
                onChange={(e) => setBankDetails({ ...bankDetails, sortCode: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Client Details Section */}
        <div className="mb-8 p-6 bg-blue-50 rounded-lg shadow-sm">
          <h2 className={sectionTitleStyle}>Client Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelStyle}>Client Name</label>
              <input
                type="text"
                className={inputStyle}
                value={client.name}
                onChange={(e) => setClient({ ...client, name: e.target.value })}
              />
            </div>
            <div>
              <label className={labelStyle}>Client Email</label>
              <input
                type="email"
                className={inputStyle}
                value={client.email}
                onChange={(e) => setClient({ ...client, email: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelStyle}>Client Address</label>
              <textarea
                className={`${inputStyle} h-20`}
                value={client.address}
                onChange={(e) => setClient({ ...client, address: e.target.value })}
              ></textarea>
            </div>
          </div>
        </div>

        {/* Invoice Details Section */}
        <div className="mb-8 p-6 bg-green-50 rounded-lg shadow-sm">
          <h2 className={sectionTitleStyle}>Invoice Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelStyle}>Invoice Number</label>
              <input
                type="text"
                className={inputStyle}
                value={invoiceDetails.invoiceNumber}
                onChange={(e) => setInvoiceDetails({ ...invoiceDetails, invoiceNumber: e.target.value })}
              />
            </div>
            <div>
              <label className={labelStyle}>Invoice Date</label>
              <input
                type="date"
                className={inputStyle}
                value={invoiceDetails.invoiceDate}
                onChange={(e) => setInvoiceDetails({ ...invoiceDetails, invoiceDate: e.target.value })}
              />
            </div>
            <div>
              <label className={labelStyle}>Due Date</label>
              <input
                type="date"
                className={inputStyle}
                value={invoiceDetails.dueDate}
                onChange={(e) => setInvoiceDetails({ ...invoiceDetails, dueDate: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Service Items Section */}
        <div className="mb-8 p-6 bg-purple-50 rounded-lg shadow-sm">
          <h2 className={sectionTitleStyle}>Service Items</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-md overflow-hidden">
              <thead>
                <tr className="bg-gray-200 text-gray-700 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">Description</th>
                  <th className="py-3 px-6 text-center">Qty</th>
                  <th className="py-3 px-6 text-right">Unit Price</th>
                  <th className="py-3 px-6 text-right">Amount</th>
                  <th className="py-3 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm font-light">
                {serviceItems.map(item => (
                  <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-100">
                    <td className="py-3 px-6 text-left whitespace-nowrap">
                      <input
                        type="text"
                        className="w-full p-2 border border-gray-200 rounded-md"
                        value={item.description}
                        onChange={(e) => updateServiceItem(item.id, 'description', e.target.value)}
                      />
                    </td>
                    <td className="py-3 px-6 text-center">
                      <input
                        type="number"
                        className="w-20 p-2 border border-gray-200 rounded-md text-center"
                        value={item.quantity}
                        onChange={(e) => updateServiceItem(item.id, 'quantity', e.target.value)}
                        min="1"
                      />
                    </td>
                    <td className="py-3 px-6 text-right">
                      <input
                        type="number"
                        className="w-28 p-2 border border-gray-200 rounded-md text-right"
                        value={item.unitPrice.toFixed(2)}
                        onChange={(e) => updateServiceItem(item.id, 'unitPrice', e.target.value)}
                        step="0.01"
                        min="0"
                      />
                    </td>
                    <td className="py-3 px-6 text-right font-medium">
                      £{(item.quantity * item.unitPrice).toFixed(2)}
                    </td>
                    <td className="py-3 px-6 text-center">
                      <button
                        onClick={() => removeServiceItem(item.id)}
                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={addServiceItem}
            className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md shadow-md transition duration-300 ease-in-out transform hover:scale-105 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Service Item
          </button>

          {/* Tax Rate Input and Toggle */}
          <div className="mt-6 flex justify-end items-center">
            <label className="text-gray-700 mr-2">Apply Tax:</label>
            <input
              type="checkbox"
              className="form-checkbox h-5 w-5 text-indigo-600 rounded"
              checked={isTaxApplicable}
              onChange={(e) => setIsTaxApplicable(e.target.checked)}
            />
            {isTaxApplicable && (
              <>
                <label className="text-gray-700 ml-4 mr-2">Tax Rate (%):</label>
                <input
                  type="number"
                  className="w-24 p-2 border border-gray-300 rounded-md text-right"
                  value={(taxRate * 100).toFixed(0)}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) / 100 || 0)}
                  min="0"
                  max="100"
                />
              </>
            )}
          </div>

          {/* Totals Summary */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg shadow-inner">
            <div className="flex justify-between items-center mb-2">
              <span className="text-lg font-medium text-gray-700">Subtotal:</span>
              <span className="text-lg font-bold text-gray-900">£{subtotal.toFixed(2)}</span>
            </div>
            {isTaxApplicable && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-medium text-gray-700">Tax ({taxRate * 100}%):</span>
                <span className="text-lg font-bold text-gray-900">£{taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-gray-300">
              <span className="text-xl font-semibold text-indigo-700">Total:</span>
              <span className="text-2xl font-extrabold text-indigo-800">£{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Invoice Preview Section */}
        <div id="invoice-preview-section" className="mb-8 p-6 bg-white border border-gray-200 rounded-lg shadow-md">
          <h2 className={sectionTitleStyle}>Invoice Preview</h2>
          <div className="p-6 border border-gray-300 rounded-lg bg-white shadow-inner">
            <div className="flex justify-between items-start mb-8">
              {/* Company Info */}
              <div>
                {company.logoUrl && (
                  <img
                    src={company.logoUrl}
                    alt="Company Logo"
                    className="h-16 mb-4 rounded-md"
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/150x50/E0E7FF/4338CA?text=Your+Logo'; }}
                  />
                )}
                <p className="text-2xl font-bold text-gray-800">{company.name}</p>
                <p className="text-sm text-gray-600">{company.address}</p>
                <p className="text-sm text-gray-600">{company.email}</p>
                <p className="text-sm text-gray-600">{company.phone}</p>
              </div>
              {/* Invoice Title & Number */}
              <div className="text-right">
                <h2 className="text-4xl font-extrabold text-indigo-700 mb-2">INVOICE</h2>
                <p className="text-lg font-semibold text-gray-700"># {invoiceDetails.invoiceNumber}</p>
              </div>
            </div>

            {/* Invoice Dates and Client Details */}
            <div className="flex justify-between mb-8 text-sm">
              <div>
                <p className="font-semibold text-gray-700">Bill To:</p>
                <p className="text-gray-800 font-medium">{client.name}</p>
                <p className="text-gray-600">{client.address}</p>
                <p className="text-gray-600">{client.email}</p>
              </div>
              <div className="text-right">
                <p><span className="font-semibold text-gray-700">Invoice Date:</span> {invoiceDetails.invoiceDate}</p>
                <p><span className="font-semibold text-gray-700">Due Date:</span> {invoiceDetails.dueDate}</p>
              </div>
            </div>

            {/* Service Items Table in Preview */}
            <div className="overflow-x-auto mb-8">
              <table className="min-w-full bg-white border border-gray-200 rounded-md">
                <thead>
                  <tr className="bg-indigo-600 text-white uppercase text-sm leading-normal">
                    <th className="py-3 px-6 text-left">Description</th>
                    <th className="py-3 px-6 text-center">Qty</th>
                    <th className="py-3 px-6 text-right">Unit Price</th>
                    <th className="py-3 px-6 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700 text-sm font-light">
                  {serviceItems.map(item => (
                    <tr key={item.id} className="border-b border-gray-200">
                      <td className="py-3 px-6 text-left">{item.description}</td>
                      <td className="py-3 px-6 text-center">{item.quantity}</td>
                      <td className="py-3 px-6 text-right">£{item.unitPrice.toFixed(2)}</td>
                      <td className="py-3 px-6 text-right font-medium">£{(item.quantity * item.unitPrice).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Summary in Preview */}
            <div className="flex justify-end mb-8">
              <div className="w-full md:w-1/2 lg:w-1/3 p-4 bg-gray-50 rounded-lg shadow-inner">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-medium text-gray-700">Subtotal:</span>
                  <span className="text-lg font-bold text-gray-900">£{subtotal.toFixed(2)}</span>
                </div>
                {isTaxApplicable && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-medium text-gray-700">Tax ({taxRate * 100}%):</span>
                    <span className="text-lg font-bold text-gray-900">£{taxAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                  <span className="text-xl font-semibold text-indigo-700">Total:</span>
                  <span className="text-2xl font-extrabold text-indigo-800">£{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Bank Details in Preview */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Bank Transfer Details:</h3>
              <p className="text-sm text-gray-600"><span className="font-medium">Bank Name:</span> {bankDetails.bankName}</p>
              <p className="text-sm text-gray-600"><span className="font-medium">Account Name:</span> {bankDetails.accountName}</p>
              <p className="text-sm text-gray-600"><span className="font-medium">Account Number:</span> {bankDetails.accountNumber}</p>
              <p className="text-sm text-gray-600"><span className="font-medium">Sort Code:</span> {bankDetails.sortCode}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center mt-8">
          <button
            onClick={generatePdf}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Generate PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
