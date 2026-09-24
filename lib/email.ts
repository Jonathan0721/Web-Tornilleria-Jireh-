import { Resend } from 'resend'

// Agregar el fallback 're_dummy_key' evita que 'next build' falle durante la compilación
export const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_for_build')

export async function sendOrderConfirmationEmail(
  to: string,
  orderNumber: string,
  customerName: string,
  total: number,
  items: Array<{ name: string; quantity: number; price: number }>
) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY no configurada. Email no enviado.')
    return
  }

  try {
    const itemsList = items
      .map(item => `<li>${item.name} - Cantidad: ${item.quantity} - $${item.price.toFixed(2)}</li>`)
      .join('')

    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@tornilleria.com',
      to,
      subject: `Confirmación de Pedido #${orderNumber} - Tornilleria Jehova Jireh`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Confirmación de Pedido</h1>
          <p>Hola ${customerName},</p>
          <p>Tu pedido #${orderNumber} ha sido recibido exitosamente.</p>
          <h2 style="color: #333;">Detalles del Pedido:</h2>
          <ul style="list-style: none; padding: 0;">
            ${itemsList}
          </ul>
          <p style="font-size: 18px; font-weight: bold;">Total: $${total.toFixed(2)}</p>
          <p>Gracias por tu compra. Te contactaremos pronto para coordinar el envío.</p>
          <p style="color: #666; font-size: 14px;">Tornilleria Jehova Jireh</p>
        </div>
      `,
    })
  } catch (error) {
    console.error('Error enviando email:', error)
  }
}

export async function sendNewOrderNotificationToAdmin(
  orderNumber: string,
  customerName: string,
  customerEmail: string,
  total: number
) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_TO_ADMIN) {
    console.warn('RESEND_API_KEY o EMAIL_TO_ADMIN no configuradas. Email no enviado.')
    return
  }

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@tornilleria.com',
      to: process.env.EMAIL_TO_ADMIN,
      subject: `Nuevo Pedido #${orderNumber} - Tornilleria Jehova Jireh`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Nuevo Pedido Recibido</h1>
          <p><strong>Número de Pedido:</strong> ${orderNumber}</p>
          <p><strong>Cliente:</strong> ${customerName}</p>
          <p><strong>Email:</strong> ${customerEmail}</p>
          <p><strong>Total:</strong> $${total.toFixed(2)}</p>
          <p>Revisa el panel de administración para más detalles.</p>
        </div>
      `,
    })
  } catch (error) {
    console.error('Error enviando notificación al admin:', error)
  }
}
