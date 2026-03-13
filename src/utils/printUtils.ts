
export const printDocument = (doc: any, officeSettings: any, type: 'OS' | 'ORÇAMENTO') => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const itemsHtml = doc.items.map((item: any) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.type === 'service' ? 'Serviço' : 'Peça'}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.qty}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">R$ ${item.unitPrice.toFixed(2)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">R$ ${(item.qty * item.unitPrice).toFixed(2)}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${type} #${doc.id.substring(0, 8)}</title>
      <style>
        body { font-family: sans-serif; color: #333; line-height: 1.5; padding: 40px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
        .office-info h1 { margin: 0; color: #000; font-size: 24px; }
        .office-info p { margin: 5px 0; font-size: 14px; color: #666; }
        .doc-info { text-align: right; }
        .doc-info h2 { margin: 0; color: #eab308; font-size: 20px; }
        .doc-info p { margin: 5px 0; font-size: 14px; }
        .section { margin-bottom: 30px; }
        .section-title { font-weight: bold; text-transform: uppercase; font-size: 12px; color: #999; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .info-box p { margin: 5px 0; font-size: 14px; }
        .info-box span { font-weight: bold; color: #000; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #f9f9f9; padding: 10px; text-align: left; font-size: 12px; text-transform: uppercase; color: #666; border-bottom: 2px solid #eee; }
        .total-section { margin-top: 30px; text-align: right; }
        .total-row { display: flex; justify-content: flex-end; gap: 20px; align-items: center; }
        .total-label { font-size: 14px; color: #666; }
        .total-value { font-size: 24px; font-weight: bold; color: #000; }
        .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; text-align: center; }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 20px; text-align: right;">
        <button onclick="window.print()" style="padding: 10px 20px; background: #eab308; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">Imprimir Documento</button>
      </div>

      <div class="header">
        <div class="office-info">
          ${officeSettings.logo_url ? `<img src="${officeSettings.logo_url}" style="max-height: 60px; margin-bottom: 10px;" />` : ''}
          <h1>${officeSettings.name || 'Oficina Mecânica'}</h1>
          <p>CNPJ: ${officeSettings.cnpj || '---'}</p>
          <p>${officeSettings.address || '---'}</p>
          <p>Tel: ${officeSettings.phone || '---'}</p>
        </div>
        <div class="doc-info">
          <h2>${type}</h2>
          <p>Nº: <strong>${doc.id.substring(0, 8).toUpperCase()}</strong></p>
          <p>Data: ${doc.createdAt?.toDate ? new Date(doc.createdAt.toDate()).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}</p>
          <p>Status: ${doc.status.toUpperCase()}</p>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Informações do Cliente e Veículo</div>
        <div class="grid">
          <div class="info-box">
            <p>Cliente: <span>${doc.customerName}</span></p>
          </div>
          <div class="info-box">
            <p>Veículo: <span>${doc.make} ${doc.model}</span></p>
            <p>Placa: <span>${doc.vehiclePlate}</span></p>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Itens e Serviços</div>
        <table>
          <thead>
            <tr>
              <th>Descrição</th>
              <th style="text-align: center;">Tipo</th>
              <th style="text-align: right;">Qtd</th>
              <th style="text-align: right;">Unitário</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </div>

      <div class="total-section">
        <div class="total-row">
          <span class="total-label">VALOR TOTAL:</span>
          <span class="total-value">R$ ${doc.totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <div class="footer">
        <p>Documento gerado em ${new Date().toLocaleString('pt-BR')}</p>
        <p>Obrigado pela preferência!</p>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
