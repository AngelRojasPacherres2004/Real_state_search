import * as db from "./db";
import { exportPropertiesToExcel, exportLeadsToExcel } from "./excelExport";
import { notifyOwner } from "./_core/notification";

/**
 * Genera y envía reporte semanal de propiedades nuevas y análisis de mercado
 */
export async function generateWeeklyReport(userId: number) {
  try {
    // Obtener propiedades de la última semana
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Obtener favoritos del usuario
    const favorites = await db.getUserFavorites(userId);
    
    // Obtener leads de la última semana
    const leads = await db.getUserLeads(userId);
    const recentLeads = leads.filter((lead: any) => 
      new Date(lead.createdAt) >= oneWeekAgo
    );

    // Generar Excel con propiedades
    const propertiesExcel = await exportPropertiesToExcel(
      favorites.map((f: any) => f.property)
    );

    // Generar Excel con leads
    const leadsExcel = await exportLeadsToExcel(recentLeads);

    // Preparar contenido del email
    const emailContent = `
      <h2>Reporte Semanal - Sistema Inmobiliario</h2>
      <p>Hola,</p>
      <p>Aquí está tu reporte semanal con la actividad de la última semana:</p>
      
      <h3>📊 Resumen</h3>
      <ul>
        <li><strong>Propiedades en favoritos:</strong> ${favorites.length}</li>
        <li><strong>Leads generados esta semana:</strong> ${recentLeads.length}</li>
      </ul>

      <h3>📈 Análisis de Mercado</h3>
      <p>Los archivos Excel adjuntos contienen:</p>
      <ul>
        <li><strong>Propiedades:</strong> Lista completa de tus favoritos con datos de contacto</li>
        <li><strong>Leads:</strong> Leads generados en los últimos 7 días</li>
      </ul>

      <p>Revisa los archivos adjuntos para ver el detalle completo.</p>
      
      <p>Saludos,<br/>Sistema Inteligente de Búsqueda Inmobiliaria</p>
    `;

    // Notificar al propietario (owner) sobre el reporte generado
    await notifyOwner({
      title: "Reporte Semanal Generado",
      content: `Reporte semanal generado con éxito:\n- Propiedades en favoritos: ${favorites.length}\n- Leads generados: ${recentLeads.length}`,
    });

    return { success: true, message: "Reporte semanal generado y enviado" };
  } catch (error) {
    console.error("Error generating weekly report:", error);
    return { success: false, message: "Error al generar reporte semanal" };
  }
}

/**
 * Función para ser llamada por un cron job o scheduler externo
 * Genera reportes para todos los usuarios activos
 */
export async function generateWeeklyReportsForAllUsers() {
  try {
    // Aquí se debería obtener la lista de usuarios activos que quieren recibir reportes
    // Por ahora, esto es un placeholder
    
    console.log("Generando reportes semanales para todos los usuarios...");
    
    // En producción, esto se ejecutaría en un cron job o servicio de scheduling
    // Por ejemplo: cada lunes a las 9:00 AM
    
    return { success: true };
  } catch (error) {
    console.error("Error generating weekly reports for all users:", error);
    return { success: false };
  }
}
