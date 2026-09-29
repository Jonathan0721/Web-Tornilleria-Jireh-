import { Resend } from 'resend'

// Agregar el fallback 're_dummy_key' evita que 'next build' falle durante la compilación
export const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_for_build')

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] || character)
}

export async function sendOrderConfirmationEmail(
  to: string,
  orderNumber: string,
  customerName: string,
  total: number,
  items: Array<{ name: string; quantity: number; price: number }>,
  needsConfirmation = false
) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY no configurada. Email no enviado.')
    return
  }

  try {
    const itemsList = items
      .map(item => `<li>${escapeHtml(item.name)} - Cantidad: ${item.quantity} - ${item.price > 0 ? `Q ${item.price.toFixed(2)} c/u` : 'Precio por confirmar'}</li>`)
      .join('')
    const totalLabel = needsConfirmation ? 'Total provisional (pendiente de confirmar)' : 'Total'

    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@tornilleria.com',
      to,
      subject: `Confirmación de Pedido #${orderNumber} - TORNILLOS JEHOVA JIREH`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Confirmación de Pedido</h1>
          <p>Hola ${escapeHtml(customerName)},</p>
          <p>Tu pedido #${escapeHtml(orderNumber)} ha sido recibido exitosamente.</p>
          <h2 style="color: #333;">Detalles del Pedido:</h2>
          <ul style="list-style: none; padding: 0;">
            ${itemsList}
          </ul>
          <p style="font-size: 18px; font-weight: bold;">${totalLabel}: Q ${total.toFixed(2)}</p>
          ${needsConfirmation ? '<p>Te contactaremos para confirmar el precio final y la disponibilidad antes de preparar tu pedido.</p>' : ''}
          <p>Gracias por tu compra. Te contactaremos pronto para coordinar el envío.</p>
          <p style="color: #666; font-size: 14px;">TORNILLOS JEHOVA JIREH</p>
        </div>
      `,
    })
    if (error) console.error('Resend rechazó el correo de confirmación:', error)
  } catch (error) {
    console.error('Error enviando email:', error)
  }
}

export async function sendNewOrderNotificationToAdmin(
  orderNumber: string,
  customerName: string,
  customerEmail: string,
  total: number,
  needsConfirmation = false
) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_TO_ADMIN) {
    console.warn('RESEND_API_KEY o EMAIL_TO_ADMIN no configuradas. Email no enviado.')
    return
  }

  try {
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@tornilleria.com',
      to: process.env.EMAIL_TO_ADMIN,
      subject: `Nuevo Pedido #${orderNumber} - TORNILLOS JEHOVA JIREH`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Nuevo Pedido Recibido</h1>
          <p><strong>Número de Pedido:</strong> ${escapeHtml(orderNumber)}</p>
          <p><strong>Cliente:</strong> ${escapeHtml(customerName)}</p>
          <p><strong>Email:</strong> ${escapeHtml(customerEmail)}</p>
          <p><strong>${needsConfirmation ? 'Total provisional' : 'Total'}:</strong> Q ${total.toFixed(2)}</p>
          ${needsConfirmation ? '<p><strong>Atención:</strong> confirmar precio y disponibilidad antes de preparar el pedido.</p>' : ''}
          <p>Revisa el panel de administración para más detalles.</p>
        </div>
      `,
    })
    if (error) console.error('Resend rechazó el aviso de nuevo pedido:', error)
  } catch (error) {
    console.error('Error enviando notificación al admin:', error)
  }
}
