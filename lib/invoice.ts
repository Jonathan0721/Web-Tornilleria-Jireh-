import jsPDF from 'jspdf'

export interface InvoiceItem {
  name: string
  quantity: number
  price: number
  total: number
}

export interface InvoiceData {
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  customerNit?: string
  customerCompany?: string
  customerAddress?: string
  items: InvoiceItem[]
  subtotal: number
  taxes: number
  total: number
  date: Date
}

export function generateInvoicePDF(data: InvoiceData): jsPDF {
  const doc = new jsPDF()
  
  // Configuración
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  let y = margin

  // Header
  doc.setFontSize(20)
  doc.setTextColor(0, 0, 0)
  doc.text('Tornilleria Jehova Jireh', margin, y)
  y += 10
  
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text('Factura de Venta', margin, y)
  y += 15

  // Información del pedido
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text(`Número de Pedido: ${data.orderNumber}`, margin, y)
  y += 8
  doc.text(`Fecha: ${data.date.toLocaleDateString('es-GT')}`, margin, y)
  y += 15

  // Información del cliente
  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.text('Información del Cliente', margin, y)
  y += 10

  doc.setFontSize(10)
  doc.setTextColor(60, 60, 60)
  doc.text(`Nombre: ${data.customerName}`, margin, y)
  y += 7
  doc.text(`Email: ${data.customerEmail}`, margin, y)
  y += 7
  doc.text(`Teléfono: ${data.customerPhone}`, margin, y)
  y += 7
  
  if (data.customerNit) {
    doc.text(`NIT: ${data.customerNit}`, margin, y)
    y += 7
  }
  
  if (data.customerCompany) {
    doc.text(`Empresa: ${data.customerCompany}`, margin, y)
    y += 7
  }
  
  if (data.customerAddress) {
    doc.text(`Dirección: ${data.customerAddress}`, margin, y)
    y += 7
  }
  
  y += 15

  // Tabla de items
  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.text('Detalle de Productos', margin, y)
  y += 10

  // Header de tabla
  doc.setFillColor(240, 240, 240)
  doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F')
  
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.setFont(undefined, 'bold')
  doc.text('Producto', margin + 5, y + 6)
  doc.text('Cantidad', margin + 80, y + 6)
  doc.text('Precio Unit.', margin + 110, y + 6)
  doc.text('Total', margin + 145, y + 6)
  doc.setFont(undefined, 'normal')
  y += 8

  // Items
  data.items.forEach((item, index) => {
    if (y > 250) {
      doc.addPage()
      y = margin
    }
    
    const bgColor = index % 2 === 0 ? 255 : 250
    doc.setFillColor(bgColor, bgColor, bgColor)
    doc.rect(margin, y, pageWidth - 2 * margin, 7, 'F')
    
    doc.setFontSize(9)
    doc.setTextColor(60, 60, 60)
    doc.text(item.name.substring(0, 40), margin + 5, y + 5)
    doc.text(item.quantity.toString(), margin + 80, y + 5)
    doc.text(`$${item.price.toFixed(2)}`, margin + 110, y + 5)
    doc.text(`$${item.total.toFixed(2)}`, margin + 145, y + 5)
    y += 7
  })

  y += 15

  // Totales
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text(`Subtotal: $${data.subtotal.toFixed(2)}`, margin, y)
  y += 8
  doc.text(`IVA (12%): $${data.taxes.toFixed(2)}`, margin, y)
  y += 8
  doc.setFont(undefined, 'bold')
  doc.setFontSize(14)
  doc.text(`Total: $${data.total.toFixed(2)}`, margin, y)
  doc.setFont(undefined, 'normal')

  // Footer
  y = doc.internal.pageSize.getHeight() - 30
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text('Gracias por su compra', margin, y)
  y += 5
  doc.text('Tornilleria Jehova Jireh', margin, y)

  return doc
}
