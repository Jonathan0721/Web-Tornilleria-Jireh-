import { NextResponse } from 'next/server'
import { getOrderById } from '@/app/actions/orders'
import { generateInvoicePDF } from '@/lib/invoice'

export async function GET(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const order = await getOrderById(params.orderId)
    
    if (!order) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      )
    }

    const invoiceData = {
      orderNumber: order.numero,
      customerName: order.clienteNombre,
      customerEmail: order.clienteEmail,
      customerPhone: order.clienteTelefono,
      customerNit: order.clienteNit || undefined,
      customerCompany: order.clienteEmpresa || undefined,
      customerAddress: order.clienteDireccion || undefined,
      items: order.items.map(item => ({
        name: item.nombre,
        quantity: item.cantidad,
        price: item.precioUnitario,
        total: item.total
      })),
      subtotal: order.subtotal,
      taxes: order.impuestos,
      total: order.total,
      date: order.createdAt
    }

    const pdf = generateInvoicePDF(invoiceData)
    const pdfBytes = pdf.output('arraybuffer')

    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=factura-${order.numero}.pdf`
      }
    })
  } catch (error) {
    console.error('Error generando factura:', error)
    return NextResponse.json(
      { error: 'Error al generar la factura' },
      { status: 500 }
    )
  }
}
