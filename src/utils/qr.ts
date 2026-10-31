import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { Business } from '../types';

/**
 * Generate a high-resolution PNG data URL for a given booking URL
 */
export async function generateQrCodeDataUrl(url: string): Promise<string> {
  if (!url) return '';
  return await QRCode.toDataURL(url, {
    width: 600,
    margin: 2,
    color: {
      dark: '#0f172a', // slate-900
      light: '#ffffff',
    },
    errorCorrectionLevel: 'H',
  });
}

/**
 * Generate an SVG string for clean vector rendering
 */
export async function generateQrCodeSvg(url: string): Promise<string> {
  if (!url) return '';
  return await QRCode.toString(url, {
    type: 'svg',
    margin: 2,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'H',
  });
}

/**
 * Download QR Code as a PNG image file
 */
export function downloadQrCodePng(dataUrl: string, businessSlug: string) {
  if (!dataUrl) return;
  const link = document.createElement('a');
  link.download = `${businessSlug || 'business'}-booking-qr.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate and download a printable counter display PDF using jsPDF
 */
export async function downloadQrCodePdf(business: Business, bookingUrl: string, qrDataUrl: string) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Background subtle border / frame
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(1);
  doc.roundedRect(15, 15, pageWidth - 30, pageHeight - 30, 6, 6);

  // Top header badge
  doc.setFillColor(79, 70, 229); // indigo-600
  doc.roundedRect(pageWidth / 2 - 40, 25, 80, 10, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('EASY ONLINE BOOKING', pageWidth / 2, 31.5, { align: 'center' });

  // Business Name
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.text(business.name, pageWidth / 2, 52, { align: 'center' });

  // Category / Tagline
  doc.setTextColor(100, 116, 139); // slate-500
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.text(business.category || 'Professional Services', pageWidth / 2, 60, { align: 'center' });

  // Divider
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(40, 67, pageWidth - 40, 67);

  // Call to action
  doc.setTextColor(30, 41, 59); // slate-800
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Scan with your camera to book online', pageWidth / 2, 78, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139);
  doc.text('No app required • Choose your service & preferred time', pageWidth / 2, 85, { align: 'center' });

  // Insert QR Code image (centered, 105mm x 105mm)
  const qrSize = 100;
  const qrX = (pageWidth - qrSize) / 2;
  const qrY = 93;

  // White box behind QR code with soft border
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10, 4, 4, 'FD');

  doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

  // URL Box
  const urlBoxY = qrY + qrSize + 12;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(35, urlBoxY, pageWidth - 70, 14, 3, 3, 'F');

  doc.setTextColor(79, 70, 229);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(bookingUrl, pageWidth / 2, urlBoxY + 9, { align: 'center' });

  // Contact info & business details at the bottom
  let contactY = urlBoxY + 26;
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);

  if (business.address) {
    doc.text(`Address: ${business.address}`, pageWidth / 2, contactY, { align: 'center' });
    contactY += 7;
  }
  if (business.phone) {
    doc.text(`Tel: ${business.phone}`, pageWidth / 2, contactY, { align: 'center' });
    contactY += 7;
  }

  // Footer
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(9);
  doc.text('Powered by BizBook Online Booking Platform', pageWidth / 2, pageHeight - 22, { align: 'center' });

  doc.save(`${business.slug || 'business'}-display-sign.pdf`);
}

/**
 * Trigger print dialog with styled printable sheet
 */
export function printQrCodeSheet(business: Business, bookingUrl: string, qrDataUrl: string) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.print();
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print QR Code - ${business.name}</title>
        <style>
          @page { size: portrait; margin: 1.5cm; }
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            color: #0f172a;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 90vh;
            background: #fff;
          }
          .sign-card {
            border: 2px solid #e2e8f0;
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            max-width: 520px;
            width: 100%;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .badge {
            background: #4f46e5;
            color: #fff;
            padding: 6px 16px;
            border-radius: 9999px;
            font-size: 13px;
            font-weight: 700;
            display: inline-block;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          h1 { margin: 0 0 6px 0; font-size: 32px; font-weight: 800; color: #0f172a; }
          p.subtitle { margin: 0 0 24px 0; color: #64748b; font-size: 16px; }
          .cta { font-size: 20px; font-weight: 700; margin-bottom: 8px; color: #1e293b; }
          .subcta { font-size: 14px; color: #64748b; margin-bottom: 24px; }
          .qr-wrapper {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 20px;
            display: inline-block;
            margin-bottom: 24px;
          }
          img.qr { width: 280px; height: 280px; display: block; }
          .url-box {
            background: #f1f5f9;
            padding: 12px 20px;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 700;
            color: #4f46e5;
            word-break: break-all;
            margin-bottom: 20px;
          }
          .info { font-size: 13px; color: #475569; line-height: 1.6; }
          @media print {
            body { padding: 0; }
            .sign-card { border: none; box-shadow: none; padding: 20px 0; }
          }
        </style>
      </head>
      <body>
        <div class="sign-card">
          <div class="badge">Easy Online Booking</div>
          <h1>${business.name}</h1>
          <p class="subtitle">${business.category || 'Professional Services'}</p>
          <div class="cta">Scan with your phone to book</div>
          <div class="subcta">No app required • Instant appointment scheduling</div>
          <div class="qr-wrapper">
            <img class="qr" src="${qrDataUrl}" alt="Booking QR Code" />
          </div>
          <div class="url-box">${bookingUrl}</div>
          <div class="info">
            ${business.address ? `<div><strong>Location:</strong> ${business.address}</div>` : ''}
            ${business.phone ? `<div><strong>Phone:</strong> ${business.phone}</div>` : ''}
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
