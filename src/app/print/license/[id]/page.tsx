'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MOCK_DB } from '@/lib/mockDb';

export default function PrintLicensePage() {
  const params = useParams();
  const id = params.id as string;
  const [app, setApp] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);

  // Generate dynamic dates
  const now = new Date();
  const oneYearLater = new Date();
  oneYearLater.setFullYear(now.getFullYear() + 1);

  const formatDate = (date: Date) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  const todayDate = formatDate(now);
  const expiryDate = formatDate(oneYearLater);

  useEffect(() => {
    Promise.all([
      fetch('/api/data?table=applications').then(r => r.ok ? r.json() : []),
      fetch('/api/data?table=settings').then(r => r.ok ? r.json() : {})
    ]).then(([appsData, settingsData]) => {
      const apps = Array.isArray(appsData) ? appsData : [];
      const s = typeof settingsData === 'object' && !Array.isArray(settingsData) ? settingsData : {};
      
      const defaults = [
        { id: '1', agency: 'Hargeisa Sky Travels', type: 'New', status: 'Under Review', statusColor: 'amber', date: todayDate },
        { id: '2', agency: 'Berbera Maritime Tours', type: 'Renewal', status: 'Approved by general_director', statusColor: 'green', date: todayDate },
      ];
      const found = [...apps, ...defaults].find(a => a.id === id);
      
      setApp(found);
      setSettings(s);

      if (found) {
        setTimeout(() => {
          window.print();
        }, 1000);
      }
    }).catch(err => {
      console.error('Error fetching data for certificate:', err);
    });
  }, [id, todayDate]);

  if (!app) return <div className="p-10 text-center">Loading Certificate...</div>;

  let rawId = app.agencyId || app.agency_id || app.id || '1';
  let numMatch = String(rawId).match(/\d+/);
  let seq = numMatch ? numMatch[0].padStart(3, '0') : String(rawId).substring(0, 3).toUpperCase();
  const licenseId = `${seq}-MOCAAD-DCA/${now.getFullYear()}`;
  const qrData = encodeURIComponent(
    `Ministry of Civil Aviation and\nAirport's Development\nTravel Agency Operating Certificate\nAgency: ${app.agency}\nLicense ID: ${licenseId}\nIssue Date: ${todayDate}\nExpiry Date: ${expiryDate}`
  );

  return (
    <div className="certificate-wrapper">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&display=swap');

        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #f1f5f9 !important;
          font-family: 'Montserrat', sans-serif;
        }

        @media print {
          @page {
            size: A4 landscape;
            margin: 0;
          }
          html, body {
            background: white !important;
          }
          .certificate-container {
            box-shadow: none !important;
            margin: 0 !important;
          }
        }

        .certificate-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 0;
          min-height: 100vh;
        }

        .certificate-container {
          width: 297mm;
          height: 210mm;
          padding: 5mm;
          box-sizing: border-box;
          background: white;
          position: relative;
        }

        .outer-border {
          border: 6px solid #1e40af;
          width: 100%;
          height: 100%;
          padding: 2mm;
          box-sizing: border-box;
        }

        .inner-border {
          border: 1px solid #1e40af;
          width: 100%;
          height: 100%;
          padding: 15mm 15mm 10mm 15mm;
          box-sizing: border-box;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .watermark {
          position: absolute;
          top: 55%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 150mm;
          opacity: 0.05;
          z-index: 0;
          pointer-events: none;
        }

        .content {
          position: relative;
          z-index: 1;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .logo {
          width: 55mm;
          margin-bottom: 1mm;
          margin-top: 0;
        }

        .ministry-name {
          font-size: 13pt;
          font-weight: 900;
          color: #000;
          margin-bottom: 5mm;
          text-transform: uppercase;
          line-height: 1.2;
          width: 100%;
        }

        .certificate-title {
          font-size: 22pt;
          font-weight: 900;
          color: #1e40af;
          margin-bottom: 6mm;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          line-height: 1.1;
        }

        .auth-text {
          font-size: 12.5pt;
          color: #334155;
          line-height: 1.5;
          max-width: 85%;
          margin-bottom: 7mm;
          font-weight: 500;
        }

        .company-name {
          font-size: 28pt;
          font-weight: 900;
          color: #0f172a;
          margin-bottom: 7mm;
          text-transform: uppercase;
          border-bottom: 3px solid #f1f5f9;
          display: inline-block;
          padding: 0 30px 4px 30px;
        }

        .suspension-text {
          font-size: 11pt;
          color: #64748b;
          line-height: 1.3;
          max-width: 80%;
          margin-bottom: auto;
          font-style: italic;
        }

        .footer {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: auto;
        }

        .date-box {
          text-align: left;
          min-width: 180px;
          padding-bottom: 5mm;
        }

        .date-label {
          font-size: 11pt;
          font-weight: 900;
          color: #1e293b;
          text-transform: uppercase;
          margin-bottom: 1mm;
        }

        .date-value {
          font-size: 11pt;
          font-weight: 400;
          color: #334155;
        }

        .signature-box {
          text-align: center;
          min-width: 300px;
          padding-bottom: 5mm;
        }

        .signature-line {
          width: 100%;
          border-bottom: 2px solid #1e40af;
          margin-bottom: 2mm;
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }

        .dg-name {
          font-size: 12pt;
          font-weight: 900;
          color: #0f172a;
          text-transform: uppercase;
        }

        .dg-title {
          font-size: 10pt;
          font-weight: 400;
          color: #1e40af;
          text-transform: uppercase;
        }

        .qr-code-section {
          position: absolute;
          top: 0;
          right: 0;
          width: 32mm;
          text-align: center;
        }

        .qr-image {
          width: 100%;
          height: auto;
          background: #fff;
          margin-bottom: 1mm;
          padding: 1mm;
          border: 1px solid #e2e8f0;
        }

        .ref-number {
          font-size: 5pt;
          color: #1e40af;
          font-weight: 900;
          text-transform: uppercase;
          white-space: nowrap;
          letter-spacing: -0.2px;
          line-height: 1;
          width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>

      <div className="certificate-container">
        <div className="outer-border">
          <div className="inner-border">
            <img src="/logo.png" className="watermark" alt="" />
            
            <div className="qr-code-section">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`} 
                className="qr-image" 
                alt="Verification QR" 
              />
              <p className="ref-number">{licenseId}</p>
            </div>

            <div className="content">
              <img src="/logo.png" className="logo" alt="Ministry Logo" />
              <h2 className="ministry-name">
                {settings?.certHeader ? (
                  <span style={{ whiteSpace: 'pre-line' }}>{settings.certHeader}</span>
                ) : (
                  <>Ministry of Civil Aviation and <br /> Airport's Development</>
                )}
              </h2>

              <h1 className="certificate-title">Travel Agency Operating Certificate</h1>

              <p className="auth-text">
                {settings?.certBody1 || settings?.certAuthText || "This certificate authorizes the holder to operate as a licensed Travel Agency, providing approved travel and tourism services in accordance with the laws and regulations of the Republic of Somaliland and applicable International aviation standards."}
              </p>

              <div className="company-wrapper">
                <h2 className="company-name">{app.agency}</h2>
              </div>

              <p className="suspension-text">
                {settings?.certBody2 || settings?.certSuspensionText || "This certificate is subject to periodic review and may be suspended or revoked in the event of noncompliance with the applicable laws and regulations."}
              </p>

              <div className="footer">
                <div className="date-box">
                  <p className="date-label">ISSUED DATE</p>
                  <p className="date-value">{todayDate}</p>
                </div>

                <div className="signature-box">
                  <p className="dg-name">{settings?.certSignatureName || settings?.dgName || "Abdirashid Abdi Jama"}</p>
                  <p className="dg-title">Approved by MOCAAD</p>
                  <p className="dg-title">{settings?.certSignatureTitle || settings?.dgTitle || "Director General"}</p>
                  <div className="signature-line mt-4"></div>
                </div>

                <div className="date-box text-right">
                  <p className="date-label">EXPIRY DATE</p>
                  <p className="date-value">{expiryDate}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
