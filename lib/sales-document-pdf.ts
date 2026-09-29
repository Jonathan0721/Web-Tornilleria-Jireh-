import { jsPDF } from 'jspdf'

export type SalesDocumentPdfData = {
  quoteNumber: string
  receiptNumber: string | null
  status: string
  subtotal: number
  taxes: number
  total: number
  notes: string | null
  createdAt: string
  customerName: string
  customerPhone: string
  customerNit: string
  customerEmail: string
  customerCompany: string
  customerAddress: string
  items: Array<{
    sku: string
    name: string
    quantity: number
    quantityDeducted: number
    unitPrice: number
    total: number
  }>
}

const money = (value: number) => `Q ${value.toFixed(2)}`

export function downloadSalesDocumentPdf(data: SalesDocumentPdfData) {
  const pdf = new jsPDF()
  const pageWidth = pdf.internal.pageSize.getWidth()
  const left = 14
  const right = pageWidth - 14
  const isReceipt = data.status === 'comprobante'
  const title = isReceipt ? 'COMPROBANTE INTERNO DE VENTA' : 'COTIZACION'
  const number = isReceipt ? data.receiptNumber || data.quoteNumber : data.quoteNumber
  let y = 18

  const drawTableHeader = () => {
    pdf.setFillColor(241, 245, 249)
    pdf.rect(left, y, right - left, 9, 'F')
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8)
    pdf.text('PRODUCTO / SKU', left + 2, y + 6)
    pdf.text('CANT.', 139, y + 6, { align: 'right' })
    pdf.text('PRECIO', 163, y + 6, { align: 'right' })
    pdf.text('TOTAL', right - 2, y + 6, { align: 'right' })
    y += 13
  }

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(16)
  pdf.text('Tornilleria Jireh', left, y)
  y += 9
  pdf.setFontSize(12)
  pdf.text(title, left, y)
  pdf.setFontSize(10)
  pdf.text(number, right, y, { align: 'right' })
  y += 7
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.text('DOCUMENTO INTERNO - NO ES FACTURA FISCAL FEL', left, y)
  y += 8
  pdf.text(`Fecha: ${new Date(data.createdAt).toLocaleDateString('es-GT')}`, left, y)
  y += 7
  pdf.setFont('helvetica', 'bold')
  pdf.text('Cliente', left, y)
  pdf.setFont('helvetica', 'normal')
  y += 5
  pdf.text(data.customerName, left, y)
  y += 5
  const customerDetails = [
    data.customerCompany,
    data.customerNit ? `NIT: ${data.customerNit}` : '',
    data.customerPhone ? `Telefono: ${data.customerPhone}` : '',
    data.customerEmail,
    data.customerAddress,
  ].filter(Boolean)
  for (const detail of customerDetails) {
    pdf.text(pdf.splitTextToSize(detail, right - left), left, y)
    y += pdf.splitTextToSize(detail, right - left).length * 4
  }
  y += 4
  drawTableHeader()

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  const hasPendingItems = data.items.some((item) => item.quantityDeducted < item.quantity)
  for (const item of data.items) {
    const nameLines = pdf.splitTextToSize(item.name, 76)
    const hasPending = isReceipt && item.quantityDeducted < item.quantity
    const rowHeight = Math.max(9, nameLines.length * 4 + (hasPending ? 10 : 5))
    if (y + rowHeight > 260) {
      pdf.addPage()
      y = 18
      drawTableHeader()
    }
    pdf.setFont('helvetica', 'bold')
    pdf.text(nameLines, left + 2, y + 3)
    pdf.setFont('helvetica', 'normal')
    pdf.text(item.sku, left + 2, y + 3 + nameLines.length * 4)
    if (isReceipt && item.quantityDeducted < item.quantity) {
      pdf.setFontSize(7)
      pdf.setTextColor(180, 83, 9)
      pdf.text(`Por encargo: ${item.quantity - item.quantityDeducted}`, left + 2, y + 7 + nameLines.length * 4)
      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(8)
    }
    pdf.text(String(item.quantity), 139, y + 5, { align: 'right' })
    pdf.text(money(item.unitPrice), 163, y + 5, { align: 'right' })
    pdf.text(money(item.total), right - 2, y + 5, { align: 'right' })
    y += rowHeight
    pdf.setDrawColor(226, 232, 240)
    pdf.line(left, y, right, y)
    y += 2
  }

  if (y > 247) {
    pdf.addPage()
    y = 18
  }
  y += 5
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.text(`Subtotal: ${money(data.subtotal)}`, right, y, { align: 'right' })
  y += 6
  pdf.text(`IVA (12%): ${money(data.taxes)}`, right, y, { align: 'right' })
  y += 7
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(11)
  pdf.text(`TOTAL: ${money(data.total)}`, right, y, { align: 'right' })
  if (data.notes) {
    y += 11
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(9)
    pdf.text('Notas:', left, y)
    y += 5
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.text(pdf.splitTextToSize(data.notes, right - left), left, y)
  }
  y += 12
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  const footer = isReceipt
    ? `Comprobante interno de venta. No sustituye una factura fiscal autorizada por SAT.${hasPendingItems ? ' Las cantidades por encargo se surtiran posteriormente.' : ''}`
    : 'Cotizacion interna no fiscal. Precio y disponibilidad sujetos a confirmacion al concretar la venta.'
  pdf.text(pdf.splitTextToSize(footer, right - left), left, Math.min(y, 278))
  pdf.save(`${number}.pdf`)
}
