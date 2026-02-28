import { notifyOwner } from "./_core/notification";
import type { Property } from "../drizzle/schema";

interface EmailNotificationParams {
  userEmail: string;
  userName: string;
  properties: Property[];
  alertCriteria: {
    operationType?: string;
    districts?: string[];
    minPrice?: number;
    maxPrice?: number;
    minBedrooms?: number;
    maxBedrooms?: number;
  };
}

/**
 * Send email notification to user about new properties matching their alert criteria
 */
export async function sendPropertyAlertEmail(params: EmailNotificationParams): Promise<boolean> {
  const { userEmail, userName, properties, alertCriteria } = params;

  if (properties.length === 0) {
    return false;
  }

  // Format criteria for display
  const criteriaText = formatAlertCriteria(alertCriteria);

  // Format properties list
  const propertiesList = properties
    .slice(0, 5) // Limit to 5 properties in email
    .map((prop, index) => {
      return `${index + 1}. ${prop.title}
   📍 ${prop.district}
   💰 ${prop.currency} ${parseFloat(prop.price as any).toLocaleString()}
   🛏️ ${prop.bedrooms || '-'} dormitorios | 🚿 ${prop.bathrooms || '-'} baños | 📐 ${prop.area || '-'} m²
   🔗 Portal: ${prop.portal}
   ${prop.ownerPhone ? `📞 ${prop.ownerPhone}` : ''}
   ${prop.ownerEmail ? `📧 ${prop.ownerEmail}` : ''}`;
    })
    .join('\n\n');

  const totalText = properties.length > 5 
    ? `\n\n... y ${properties.length - 5} propiedades más.` 
    : '';

  // Create email content
  const emailContent = `Hola ${userName},

Se han encontrado ${properties.length} nueva(s) propiedad(es) que coinciden con tu alerta:

${criteriaText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${propertiesList}${totalText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ingresa a la plataforma para ver más detalles y contactar a los propietarios.

---
Sistema de Búsqueda Inmobiliaria
`;

  // Use notifyOwner to send notification
  // In a production environment, you would integrate with an email service like SendGrid, AWS SES, etc.
  try {
    await notifyOwner({
      title: `🏠 ${properties.length} Nueva(s) Propiedad(es) - Alerta para ${userName}`,
      content: emailContent,
    });

    return true;
  } catch (error) {
    console.error('Error sending email notification:', error);
    return false;
  }
}

/**
 * Format alert criteria for human-readable display
 */
function formatAlertCriteria(criteria: EmailNotificationParams['alertCriteria']): string {
  const parts: string[] = [];

  if (criteria.operationType) {
    parts.push(`Tipo: ${criteria.operationType === 'alquiler' ? 'Alquiler' : 'Venta'}`);
  }

  if (criteria.districts && criteria.districts.length > 0) {
    parts.push(`Distritos: ${criteria.districts.join(', ')}`);
  }

  if (criteria.minPrice || criteria.maxPrice) {
    const min = criteria.minPrice ? `$${criteria.minPrice.toLocaleString()}` : 'Sin mínimo';
    const max = criteria.maxPrice ? `$${criteria.maxPrice.toLocaleString()}` : 'Sin máximo';
    parts.push(`Precio: ${min} - ${max}`);
  }

  if (criteria.minBedrooms || criteria.maxBedrooms) {
    const min = criteria.minBedrooms || 'Sin mínimo';
    const max = criteria.maxBedrooms || 'Sin máximo';
    parts.push(`Dormitorios: ${min} - ${max}`);
  }

  return parts.join(' | ');
}

/**
 * Check alerts and send notifications for new properties
 * This function should be called periodically (e.g., via cron job or scheduled task)
 */
export async function checkAlertsAndNotify(): Promise<void> {
  const { getDb } = await import("./db");
  const { alerts, users, properties, alertNotifications } = await import("../drizzle/schema");
  const { eq, and, gte, lte, inArray, desc } = await import("drizzle-orm");

  const db = await getDb();
  if (!db) {
    console.error("Database not available for alert checking");
    return;
  }

  try {
    // Get all active alerts
    const activeAlerts = await db
      .select({
        alert: alerts,
        user: users,
      })
      .from(alerts)
      .innerJoin(users, eq(alerts.userId, users.id))
      .where(eq(alerts.isActive, true));

    console.log(`Checking ${activeAlerts.length} active alerts...`);

    for (const { alert, user } of activeAlerts) {
      // Build query conditions based on alert criteria
      const conditions: any[] = [];

      if (alert.operationType) {
        conditions.push(eq(properties.operationType, alert.operationType));
      }

      if (alert.districts) {
        const districtList = JSON.parse(alert.districts as string);
        if (districtList.length > 0) {
          conditions.push(inArray(properties.district, districtList));
        }
      }

      if (alert.minPrice) {
        conditions.push(gte(properties.price, alert.minPrice.toString()));
      }

      if (alert.maxPrice) {
        conditions.push(lte(properties.price, alert.maxPrice.toString()));
      }

      if (alert.minBedrooms) {
        conditions.push(gte(properties.bedrooms, alert.minBedrooms));
      }

      if (alert.maxBedrooms) {
        conditions.push(lte(properties.bedrooms, alert.maxBedrooms));
      }

      // Get properties created after last check
      const lastCheckDate = alert.lastChecked || new Date(Date.now() - 24 * 60 * 60 * 1000); // Default to 24h ago
      conditions.push(gte(properties.createdAt, lastCheckDate));

      // Query matching properties
      const matchingProperties = await db
        .select()
        .from(properties)
        .where(and(...conditions))
        .orderBy(desc(properties.createdAt))
        .limit(20);

      if (matchingProperties.length > 0) {
        console.log(`Found ${matchingProperties.length} new properties for alert ${alert.id}`);

        // Send email notification
        const emailSent = await sendPropertyAlertEmail({
          userEmail: user.email || '',
          userName: user.name || 'Usuario',
          properties: matchingProperties,
          alertCriteria: {
            operationType: alert.operationType || undefined,
            districts: alert.districts ? JSON.parse(alert.districts as string) : undefined,
            minPrice: alert.minPrice ? Number(alert.minPrice) : undefined,
            maxPrice: alert.maxPrice ? Number(alert.maxPrice) : undefined,
            minBedrooms: alert.minBedrooms || undefined,
            maxBedrooms: alert.maxBedrooms || undefined,
          },
        });

        if (emailSent) {
          // Record notifications sent
          for (const property of matchingProperties) {
            await db.insert(alertNotifications).values({
              alertId: alert.id,
              propertyId: property.id,
              sentAt: new Date(),
            });
          }
        }
      }

      // Update last checked timestamp
      await db
        .update(alerts)
        .set({ lastChecked: new Date() })
        .where(eq(alerts.id, alert.id));
    }

    console.log('Alert checking completed');
  } catch (error) {
    console.error('Error checking alerts:', error);
  }
}
