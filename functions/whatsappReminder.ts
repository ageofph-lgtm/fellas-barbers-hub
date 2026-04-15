import { base44 } from '@base44/sdk';

const GREENAPI_INSTANCE_ID = '7107543645';
const GREENAPI_TOKEN = '0f67438bf4684f30b8f2a46cf25b78e0d10165610a014dab93';
const RED = '#C8102E';

/**
 * Lembrete WhatsApp 1h antes do corte
 * Busca agendamentos nos próximos 60-120 min e envia lembrete aos clientes
 * Usa Green API para WhatsApp Business
 */
export async function whatsappReminder(req: any) {
  try {
    const now = new Date();
    const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
    const inTwoHours = new Date(now.getTime() + 120 * 60 * 1000);

    // Formatar datas para filtro (YYYY-MM-DD)
    const todayStr = now.toISOString().split('T')[0];
    
    // Buscar agendamentos de hoje entre as próximas 1-2 horas
    const appointments = await base44.asServiceRole.entities.Appointment.filter({
      date: todayStr,
    });

    // Filtrar por hora (dentro da janela de 1-2 horas)
    const remindList = appointments.filter(appt => {
      if (!appt.start_time) return false;
      const [h, m] = appt.start_time.split(':').map(Number);
      const apptTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
      
      return apptTime.getTime() >= now.getTime() + 60*60*1000 &&
             apptTime.getTime() <= now.getTime() + 120*60*1000;
    });

    console.log(`[WhatsApp Reminder] Encontrados ${remindList.length} agendamentos para lembrete`);

    // Enviar lembretes
    const sent = [];
    const failed = [];

    for (const appt of remindList) {
      if (!appt.client_phone) {
        console.log(`[Skipped] ${appt.client_name}: sem telefone`);
        continue;
      }

      // Verificar se já foi enviado lembrete hoje
      const hasReminder = appt.reminder_sent_1h === true;
      if (hasReminder) {
        console.log(`[Skipped] ${appt.client_name}: já recebeu lembrete`);
        continue;
      }

      try {
        // Formatar mensagem
        const shopName = appt.barbershop_id ? `Fellas ${appt.barber_name || 'Barbers'}` : 'Fellas Barbers';
        const services = (appt.services || []).map((s: any) => s.name).join(', ');
        const time = appt.start_time || '??:??';
        
        const message = `👋 Olá ${appt.client_name}!\n\nLembrete: O seu corte está marcado para daqui a ~1 hora:\n\n🏪 ${shopName}\n⏰ ${time}\n✂️ ${services}\n\nSe não conseguir comparecer, avise-nos.\n\n💇 Fellas Barbers`;

        // Enviar via Green API
        const response = await fetch(
          `https://api.greenapi.com/waInstance${GREENAPI_INSTANCE_ID}/sendMessage/${GREENAPI_TOKEN}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chatId: appt.client_phone + '@c.us', // WhatsApp requer formato +5521999999999@c.us
              message: message,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Green API responded with ${response.status}`);
        }

        const result = await response.json();
        
        // Marcar como enviado
        await base44.asServiceRole.entities.Appointment.update(appt.id, {
          reminder_sent_1h: true,
          reminder_sent_at: new Date().toISOString(),
        });

        sent.push(appt.client_name);
        console.log(`[Sent] ${appt.client_name} → ${appt.client_phone}`);
      } catch (error) {
        console.error(`[Error] ${appt.client_name}:`, error);
        failed.push({ name: appt.client_name, error: String(error) });
      }
    }

    // Log final
    const summary = `
📱 WhatsApp Reminder — 1h antes
═══════════════════════════════
✅ Enviados: ${sent.length}
❌ Falhas: ${failed.length}
⏭️ Pulados (sem telefone/já enviado): ${remindList.length - sent.length - failed.length}

${sent.length > 0 ? '✅ Enviados para:\n' + sent.map(n => `  • ${n}`).join('\n') : ''}
${failed.length > 0 ? '\n❌ Falhas:\n' + failed.map(f => `  • ${f.name}: ${f.error}`).join('\n') : ''}
`;

    console.log(summary);
    
    return {
      success: true,
      sent: sent.length,
      failed: failed.length,
      skipped: remindList.length - sent.length - failed.length,
      summary,
    };
  } catch (error) {
    console.error('[WhatsApp Reminder] Fatal error:', error);
    return {
      success: false,
      error: String(error),
    };
  }
}
